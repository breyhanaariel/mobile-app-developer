import 'dart:convert';
import 'package:http/http.dart' as http;

class BiteRouteApi {
  BiteRouteApi({String? baseUrl}) : baseUrl = baseUrl ?? const String.fromEnvironment('BITE_ROUTE_API_URL', defaultValue: 'http://10.0.2.2:3100');
  final String baseUrl;
  String? bearerToken;

  Map<String, String> get _headers => {
    'accept': 'application/json',
    'content-type': 'application/json',
    if (bearerToken != null) 'authorization': 'Bearer $bearerToken',
  };

  Future<dynamic> _request(String path, {String method = 'GET', Object? body}) async {
    final uri = Uri.parse('$baseUrl$path');
    late http.Response response;
    switch (method) {
      case 'POST':
        response = await http.post(uri, headers: _headers, body: jsonEncode(body));
        break;
      case 'PATCH':
        response = await http.patch(uri, headers: _headers, body: jsonEncode(body));
        break;
      default:
        response = await http.get(uri, headers: _headers);
    }
    final payload = response.body.isEmpty ? null : jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(payload is Map && payload['error'] != null ? payload['error'] : 'Request failed ${response.statusCode}');
    }
    return payload;
  }

  Future<Map<String, dynamic>> home({double? lat, double? lng}) async {
    final query = lat != null && lng != null ? '?lat=$lat&lng=$lng' : '';
    return Map<String, dynamic>.from(await _request('/v1/home$query'));
  }

  Future<List<dynamic>> menu(String stopId) async => List<dynamic>.from(await _request('/v1/menu?stopId=${Uri.encodeQueryComponent(stopId)}'));
  Future<List<dynamic>> stops() async => List<dynamic>.from(await _request('/v1/stops'));
  Future<List<dynamic>> orders({String? guestKey}) async => List<dynamic>.from(await _request('/v1/orders${guestKey == null ? '' : '?guestKey=${Uri.encodeQueryComponent(guestKey)}'}'));
  Future<Map<String, dynamic>> quote(Map<String, dynamic> input) async => Map<String, dynamic>.from(await _request('/v1/orders/quote', method: 'POST', body: input));
  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> input) async => Map<String, dynamic>.from(await _request('/v1/orders', method: 'POST', body: input));
  Future<Map<String, dynamic>> confirmPayment(String orderId, {String? guestKey}) async => Map<String, dynamic>.from(await _request('/v1/orders/$orderId/confirm-payment', method: 'POST', body: {'guestKey': guestKey}));
  Future<Map<String, dynamic>> loyalty() async => Map<String, dynamic>.from(await _request('/v1/loyalty'));
  Future<void> favorite({String? itemId, String? stopId}) async => _request('/v1/favorites', method: 'POST', body: {'menuItemId': itemId, 'stopId': stopId});
  Future<void> registerPushToken({required String token, required String platform, String? guestKey}) async => _request('/v1/push-tokens', method: 'POST', body: {'token': token, 'platform': platform, 'guestKey': guestKey});
  Future<List<dynamic>> notifications({String? guestKey}) async => List<dynamic>.from(await _request('/v1/notifications${guestKey == null ? '' : '?guestKey=${Uri.encodeQueryComponent(guestKey)}'}'));
}
