import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'api.dart';
import 'auth_service.dart';

class CommerceSession {
  CommerceSession(this.api, {BiteRouteAuthService? auth}) : auth = auth ?? BiteRouteAuthService();
  final BiteRouteApi api;
  final BiteRouteAuthService auth;
  String? _guestKey;
  bool firebaseReady = false;
  bool stripeReady = false;

  String? get guestKey => _guestKey;
  bool get signedIn => auth.currentUser != null;

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _guestKey = prefs.getString('bite_route_guest_key');
    if (_guestKey == null) {
      _guestKey = const Uuid().v4();
      await prefs.setString('bite_route_guest_key', _guestKey!);
    }

    try {
      await Firebase.initializeApp();
      firebaseReady = true;
      await refreshAuthToken();
      await registerPush();
    } catch (_) {
      firebaseReady = false;
    }

    const stripeKey = String.fromEnvironment('STRIPE_PUBLISHABLE_KEY');
    if (stripeKey.isNotEmpty) {
      Stripe.publishableKey = stripeKey;
      await Stripe.instance.applySettings();
      stripeReady = true;
    }
  }

  Future<void> refreshAuthToken() async {
    api.bearerToken = await auth.apiToken();
  }

  Future<void> registerPush() async {
    if (!firebaseReady) return;
    final messaging = FirebaseMessaging.instance;
    final permission = await messaging.requestPermission(alert: true, badge: true, sound: true);
    if (permission.authorizationStatus == AuthorizationStatus.denied) return;
    final token = await messaging.getToken();
    if (token == null) return;
    await refreshAuthToken();
    await api.registerPushToken(token: token, platform: Platform.isIOS ? 'ios' : 'android', guestKey: signedIn ? null : _guestKey);
  }

  Future<List<dynamic>> orderHistory() async {
    await refreshAuthToken();
    return api.orders(guestKey: signedIn ? null : _guestKey);
  }

  Future<Map<String, dynamic>> placeOrder(Map<String, dynamic> input) async {
    await refreshAuthToken();
    final payload = Map<String, dynamic>.from(input);
    if (!signedIn) payload['guestKey'] = _guestKey;
    final result = await api.createOrder(payload);
    final payment = Map<String, dynamic>.from(result['payment'] as Map? ?? const {});
    final clientSecret = payment['clientSecret']?.toString();
    final order = Map<String, dynamic>.from(result['order'] as Map);

    if (stripeReady && clientSecret != null && clientSecret.isNotEmpty) {
      await Stripe.instance.initPaymentSheet(paymentSheetParameters: SetupPaymentSheetParameters(
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Bite Route',
        style: ThemeMode.system,
        applePay: const PaymentSheetApplePay(merchantCountryCode: 'US'),
        googlePay: const PaymentSheetGooglePay(merchantCountryCode: 'US', testEnv: true),
      ));
      await Stripe.instance.presentPaymentSheet();
      await api.confirmPayment(order['id'].toString(), guestKey: signedIn ? null : _guestKey);
    }
    return result;
  }
}
