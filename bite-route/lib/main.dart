import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api.dart';
import 'domain.dart';

const lime = Color(0xFFC7F464);
const purple = Color(0xFF3C146B);
const cream = Color(0xFFFFF7E8);
const ink = Color(0xFF20162B);

final apiProvider = Provider((ref) => BiteRouteApi());
final appStateProvider = StateNotifierProvider<AppStateController, AppState>((ref) => AppStateController(ref.read(apiProvider)));

void main() => runApp(const ProviderScope(child: BiteRouteApp()));

class BiteRouteApp extends ConsumerWidget {
  const BiteRouteApp({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Bite Route',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: cream,
        colorScheme: ColorScheme.fromSeed(seedColor: purple, brightness: Brightness.light, primary: purple, secondary: lime, surface: Colors.white),
        textTheme: const TextTheme(bodyMedium: TextStyle(fontSize: 16, color: ink), titleLarge: TextStyle(fontWeight: FontWeight.w900, color: ink), headlineMedium: TextStyle(fontWeight: FontWeight.w900, color: ink)),
        inputDecorationTheme: InputDecorationTheme(filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none)),
      ),
      home: const Shell(),
    );
  }
}

class AppState {
  const AppState({this.loading = true, this.home = const {}, this.menu = const [], this.cart = const [], this.stopId, this.error, this.tab = 0, this.demoMode = false});
  final bool loading;
  final Map<String, dynamic> home;
  final List<dynamic> menu;
  final List<CartLine> cart;
  final String? stopId;
  final String? error;
  final int tab;
  final bool demoMode;
  AppState copyWith({bool? loading, Map<String,dynamic>? home, List<dynamic>? menu, List<CartLine>? cart, String? stopId, String? error, int? tab, bool? demoMode}) => AppState(loading: loading ?? this.loading, home: home ?? this.home, menu: menu ?? this.menu, cart: cart ?? this.cart, stopId: stopId ?? this.stopId, error: error, tab: tab ?? this.tab, demoMode: demoMode ?? this.demoMode);
}

class AppStateController extends StateNotifier<AppState> {
  AppStateController(this.api) : super(const AppState()) { refresh(); }
  final BiteRouteApi api;

  Future<void> refresh() async {
    state = state.copyWith(loading: true, error: null);
    try {
      double? lat; double? lng;
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
        final p = await Geolocator.getCurrentPosition(); lat = p.latitude; lng = p.longitude;
      }
      final home = await api.home(lat: lat, lng: lng);
      final selected = state.stopId ?? home['currentStop']?['id']?.toString() ?? (home['upcomingStops'] as List?)?.firstOrNull?['id']?.toString();
      final menu = selected == null ? <dynamic>[] : await api.menu(selected);
      state = state.copyWith(loading: false, home: home, stopId: selected, menu: menu, demoMode: false);
    } catch (_) {
      state = state.copyWith(loading: false, home: demoHome, menu: demoMenu, stopId: 'demo-stop', demoMode: true, error: 'Offline portfolio demo');
    }
  }

  Future<void> selectStop(String id) async {
    state = state.copyWith(stopId: id, loading: true);
    try { state = state.copyWith(menu: await api.menu(id), loading: false); }
    catch (_) { state = state.copyWith(menu: demoMenu, loading: false, demoMode: true); }
  }

  void setTab(int tab) => state = state.copyWith(tab: tab);
  void addToCart(Map item) {
    final line = CartLine(itemId: item['id'].toString(), name: item['name'].toString(), basePriceCents: item['priceCents'] as int, quantity: 1);
    state = state.copyWith(cart: [...state.cart, line]);
  }
  void removeAt(int index) { final next = [...state.cart]..removeAt(index); state = state.copyWith(cart: next); }
  void clearCart() => state = state.copyWith(cart: const []);
}

class Shell extends ConsumerWidget {
  const Shell({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appStateProvider);
    final screens = [const HomeScreen(), const MenuScreen(), const CartScreen(), const OrdersScreen(), const RewardsScreen()];
    return Scaffold(
      appBar: AppBar(backgroundColor: cream, elevation: 0, title: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('BITE ROUTE', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 2, color: purple)), Text('Good food. Find the next stop.', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700))])),
      body: state.loading ? const Center(child: CircularProgressIndicator()) : screens[state.tab],
      bottomNavigationBar: NavigationBar(selectedIndex: state.tab, onDestinationSelected: ref.read(appStateProvider.notifier).setTab, destinations: const [NavigationDestination(icon: Icon(Icons.route), label: 'Find'), NavigationDestination(icon: Icon(Icons.restaurant_menu), label: 'Menu'), NavigationDestination(icon: Icon(Icons.shopping_bag_outlined), label: 'Cart'), NavigationDestination(icon: Icon(Icons.receipt_long), label: 'Orders'), NavigationDestination(icon: Icon(Icons.stars), label: 'Rewards')]),
    );
  }
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(appStateProvider);
    final current = s.home['currentStop'] as Map<String,dynamic>?;
    final upcoming = List<Map<String,dynamic>>.from((s.home['upcomingStops'] as List? ?? const []).map((e) => Map<String,dynamic>.from(e)));
    return RefreshIndicator(onRefresh: ref.read(appStateProvider.notifier).refresh, child: ListView(padding: const EdgeInsets.fromLTRB(18,12,18,110), children: [
      if (s.demoMode) const Notice('Offline seeded demo · connect the API for live Neon data'),
      Container(padding: const EdgeInsets.all(22), decoration: BoxDecoration(color: purple, borderRadius: BorderRadius.circular(28)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('FIND THE TRUCK', style: TextStyle(color: lime, fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.2)), const SizedBox(height: 8), Text(current?['name']?.toString() ?? 'Next stop loading', style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)), const SizedBox(height: 8), Text(current?['address']?.toString() ?? 'St. Petersburg / Tampa Bay', style: const TextStyle(color: Colors.white70, fontSize: 16)), const SizedBox(height: 14), Wrap(spacing: 8, runSpacing: 8, children: [Pill(text: current?['acceptingOrders'] == true ? 'OPEN · ORDERING ON' : 'NEXT STOP', accent: true), Pill(text: '${s.home['estimatedPickupMin'] ?? 20} min pickup'), if (s.home['distanceMiles'] != null) Pill(text: '${s.home['distanceMiles']} mi away')]), const SizedBox(height: 14), FilledButton.icon(style: FilledButton.styleFrom(backgroundColor: lime, foregroundColor: purple), onPressed: current == null ? null : () => _maps(current), icon: const Icon(Icons.directions), label: const Text('Get Directions'))])),
      const SectionTitle('Upcoming stops'),
      ...upcoming.map((stop) => Card(child: ListTile(contentPadding: const EdgeInsets.all(8), title: Text(stop['name'].toString(), style: const TextStyle(fontWeight: FontWeight.w900)), subtitle: Text('${stop['venue'] ?? ''}\n${stop['address']}'), trailing: const Icon(Icons.chevron_right), onTap: () => ref.read(appStateProvider.notifier).selectStop(stop['id'].toString())))),
      const SectionTitle('What makes Bite Route different'),
      const FeatureCard(icon: Icons.public, title: 'Global street food', body: 'Korean BBQ tacos, jerk bowls, birria fries, bao, elote and bright drinks rotate by stop.'),
      const FeatureCard(icon: Icons.schedule, title: 'Capacity-aware pickup', body: 'ASAP and scheduled pickup times adjust to current order volume and crew capacity.'),
    ]));
  }

  static Future<void> _maps(Map stop) async {
    final query = Uri.encodeComponent(stop['address'].toString());
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class MenuScreen extends ConsumerWidget {
  const MenuScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(appStateProvider);
    return ListView(padding: const EdgeInsets.fromLTRB(18,12,18,110), children: [const Text('Street food worth chasing.', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900)), const SizedBox(height: 6), const Text('Availability can change by stop and sell out in real time.'), const SizedBox(height: 16), ...s.menu.map((raw) { final item = Map<String,dynamic>.from(raw as Map); final status = item['status']?.toString() ?? 'available'; return Card(margin: const EdgeInsets.only(bottom: 12), child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Row(children: [Expanded(child: Text(item['name'].toString(), style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900))), Text('\$${((item['priceCents'] as int)/100).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900))]), const SizedBox(height: 6), Text(item['description']?.toString() ?? ''), const SizedBox(height: 10), Wrap(spacing: 6, children: [if (item['vegetarian'] == true) const Chip(label: Text('Vegetarian')), if (item['vegan'] == true) const Chip(label: Text('Vegan')), if (item['glutenFree'] == true) const Chip(label: Text('GF')), if (item['spicy'] == true) const Chip(label: Text('Spicy')), Chip(label: Text(status.replaceAll('_',' ').toUpperCase()))]), const SizedBox(height: 10), SizedBox(width: double.infinity, child: FilledButton(onPressed: status == 'sold_out' ? null : () { ref.read(appStateProvider.notifier).addToCart(item); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${item['name']} added'))); }, child: Text(status == 'sold_out' ? 'Sold Out' : 'Customize & Add'))) ]))); }))]);
  }
}

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(appStateProvider);
    final pricing = priceCart(lines: s.cart, tipCents: s.cart.isEmpty ? 0 : 300);
    return ListView(padding: const EdgeInsets.fromLTRB(18,12,18,110), children: [const Text('Your route order', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900)), if (s.cart.isEmpty) const Padding(padding: EdgeInsets.only(top: 30), child: Text('Your cart is empty. Pick a stop and grab something good.')), ...s.cart.asMap().entries.map((entry) => Card(child: ListTile(title: Text(entry.value.name, style: const TextStyle(fontWeight: FontWeight.w900)), subtitle: Text('\$${(entry.value.lineTotalCents/100).toStringAsFixed(2)}'), trailing: IconButton(onPressed: () => ref.read(appStateProvider.notifier).removeAt(entry.key), icon: const Icon(Icons.close))))), if (s.cart.isNotEmpty) ...[const SizedBox(height: 12), PriceRow('Subtotal', pricing.subtotalCents), PriceRow('Estimated tax', pricing.taxCents), PriceRow('Tip', pricing.tipCents), const Divider(), PriceRow('Estimated total', pricing.totalCents, strong: true), const SizedBox(height: 14), FilledButton(style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)), onPressed: () => showModalBottomSheet(context: context, isScrollControlled: true, builder: (_) => const CheckoutSheet()), child: const Text('Checkout'))]]);
  }
}

class CheckoutSheet extends ConsumerStatefulWidget { const CheckoutSheet({super.key}); @override ConsumerState<CheckoutSheet> createState() => _CheckoutSheetState(); }
class _CheckoutSheetState extends ConsumerState<CheckoutSheet> {
  final name = TextEditingController(text: 'Maya Rivera'); final email = TextEditingController(text: 'maya@example.com'); final phone = TextEditingController(text: '7275550101'); bool saving = false;
  @override Widget build(BuildContext context) { final state = ref.watch(appStateProvider); return Padding(padding: EdgeInsets.fromLTRB(20,20,20,MediaQuery.of(context).viewInsets.bottom+24), child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Pickup checkout', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900)), const SizedBox(height: 8), const Text('Guest checkout is supported. Create an account later and keep your order history.'), const SizedBox(height: 16), TextField(controller: name, decoration: const InputDecoration(labelText: 'Name')), const SizedBox(height: 10), TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')), const SizedBox(height: 10), TextField(controller: phone, decoration: const InputDecoration(labelText: 'Phone')), const SizedBox(height: 14), const Text('Pickup: ASAP · next capacity-aware slot'), const Text('Payment: Stripe sandbox / Apple Pay / Google Pay integration boundary'), const SizedBox(height: 16), FilledButton(onPressed: saving ? null : () async { setState(()=>saving=true); final pricing = priceCart(lines: state.cart, tipCents: 300); final payload = {'stopId':state.stopId,'customerName':name.text,'guestEmail':email.text,'guestPhone':phone.text,'pickupMode':'asap','tipCents':300,'loyaltyPointsRedeemed':0,'items':state.cart.map((l)=>{'menuItemId':l.itemId,'quantity':l.quantity,'modifierOptionIds':l.modifiers.map((m)=>m.id).toList()}).toList()}; try { if (!state.demoMode) await ref.read(apiProvider).createOrder(payload); ref.read(appStateProvider.notifier).clearCart(); if (mounted) { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order placed · ${(pricing.totalCents/100).toStringAsFixed(2)}'))); ref.read(appStateProvider.notifier).setTab(3); } } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'))); } finally { if (mounted) setState(()=>saving=false); } }, child: Text(saving ? 'Placing…' : 'Place Sandbox Order'))]))); }
}

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});
  @override Widget build(BuildContext context, WidgetRef ref) { final s=ref.watch(appStateProvider); return FutureBuilder<List<dynamic>>(future:s.demoMode?Future.value(demoOrders):ref.read(apiProvider).orders(), builder:(context,snapshot){final orders=snapshot.data??demoOrders;return ListView(padding:const EdgeInsets.fromLTRB(18,12,18,110),children:[const Text('Order tracking',style:TextStyle(fontSize:30,fontWeight:FontWeight.w900)),const SizedBox(height:12),...orders.map((raw){final o=Map<String,dynamic>.from(raw as Map);return Card(child:Padding(padding:const EdgeInsets.all(16),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text('#${o['id'].toString().substring(0,8).toUpperCase()}',style:const TextStyle(fontWeight:FontWeight.w900)),Text(o['status'].toString().toUpperCase(),style:const TextStyle(fontSize:20,fontWeight:FontWeight.w900,color:purple)),Text('Pickup ${o['pickupLabel']??'soon'}'),const SizedBox(height:8),LinearProgressIndicator(value:_progress(o['status'].toString()),backgroundColor:Colors.black12,color:lime)])));})]);}); }
  double _progress(String s)=>switch(s){'received'=>.25,'preparing'=>.5,'ready'=>.8,'completed'=>1,_=>.1};
}

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});
  @override Widget build(BuildContext context, WidgetRef ref) { final s=ref.watch(appStateProvider); return FutureBuilder<Map<String,dynamic>>(future:s.demoMode?Future.value({'points':82,'lifetimePoints':240}):ref.read(apiProvider).loyalty(),builder:(context,snapshot){final r=snapshot.data??{'points':82,'lifetimePoints':240};return ListView(padding:const EdgeInsets.fromLTRB(18,12,18,110),children:[Container(padding:const EdgeInsets.all(24),decoration:BoxDecoration(color:lime,borderRadius:BorderRadius.circular(28)),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[const Text('BITE POINTS',style:TextStyle(fontWeight:FontWeight.w900,color:purple)),Text('${r['points']}',style:const TextStyle(fontSize:50,fontWeight:FontWeight.w900,color:purple)),const Text('1 point per $1 spent. Redeem points during checkout.',style:TextStyle(color:purple))])),const SectionTitle('Rewards'),const FeatureCard(icon:Icons.local_fire_department,title:'100 points',body:'$1.00 off your next order.'),const FeatureCard(icon:Icons.replay,title:'Reorder favorites',body:'Signed-in customers can favorite items and quickly reorder past meals.'),const FeatureCard(icon:Icons.notifications_active,title:'Favorite-stop alerts',body:'Get notified when Bite Route is heading back to a stop you love.')]);}); }
}

class Notice extends StatelessWidget { const Notice(this.text,{super.key}); final String text; @override Widget build(BuildContext context)=>Container(margin:const EdgeInsets.only(bottom:12),padding:const EdgeInsets.all(12),decoration:BoxDecoration(color:Colors.amber.shade100,borderRadius:BorderRadius.circular(14)),child:Text(text,style:const TextStyle(fontWeight:FontWeight.w700))); }
class Pill extends StatelessWidget { const Pill({super.key,required this.text,this.accent=false}); final String text; final bool accent; @override Widget build(BuildContext context)=>Container(padding:const EdgeInsets.symmetric(horizontal:10,vertical:7),decoration:BoxDecoration(color:accent?lime:Colors.white12,borderRadius:BorderRadius.circular(999)),child:Text(text,style:TextStyle(color:accent?purple:Colors.white,fontWeight:FontWeight.w900,fontSize:12))); }
class SectionTitle extends StatelessWidget { const SectionTitle(this.text,{super.key}); final String text; @override Widget build(BuildContext context)=>Padding(padding:const EdgeInsets.only(top:22,bottom:10),child:Text(text,style:const TextStyle(fontSize:20,fontWeight:FontWeight.w900))); }
class FeatureCard extends StatelessWidget { const FeatureCard({super.key,required this.icon,required this.title,required this.body}); final IconData icon; final String title,body; @override Widget build(BuildContext context)=>Card(margin:const EdgeInsets.only(bottom:10),child:Padding(padding:const EdgeInsets.all(16),child:Row(crossAxisAlignment:CrossAxisAlignment.start,children:[CircleAvatar(backgroundColor:lime,foregroundColor:purple,child:Icon(icon)),const SizedBox(width:12),Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text(title,style:const TextStyle(fontWeight:FontWeight.w900,fontSize:17)),Text(body)]))]))); }
class PriceRow extends StatelessWidget { const PriceRow(this.label,this.cents,{super.key,this.strong=false}); final String label; final int cents; final bool strong; @override Widget build(BuildContext context)=>Padding(padding:const EdgeInsets.symmetric(vertical:5),child:Row(mainAxisAlignment:MainAxisAlignment.spaceBetween,children:[Text(label,style:TextStyle(fontWeight:strong?FontWeight.w900:FontWeight.w500)),Text('\$${(cents/100).toStringAsFixed(2)}',style:TextStyle(fontWeight:strong?FontWeight.w900:FontWeight.w500))])); }

const demoHome = <String,dynamic>{'currentStop':{'id':'demo-stop','name':'Central Avenue Night Stop','venue':'Grand Central District','address':'2500 Central Ave, St. Petersburg, FL','acceptingOrders':true},'estimatedPickupMin':20,'distanceMiles':2.4,'upcomingStops':[{'id':'demo-stop','name':'Central Avenue Night Stop','venue':'Grand Central District','address':'2500 Central Ave, St. Petersburg, FL'},{'id':'demo-stop-2','name':'Water Street Lunch','venue':'Water Street Tampa','address':'615 Channelside Dr, Tampa, FL'}]};
const demoMenu = <Map<String,dynamic>>[{'id':'1','name':'Korean BBQ Street Tacos','description':'Gochujang beef, sesame slaw, scallion and lime crema.','priceCents':1350,'status':'available','spicy':true},{'id':'2','name':'Jerk Chicken Bowl','description':'Jerk chicken, coconut rice, pineapple pico and charred cabbage.','priceCents':1450,'status':'available','glutenFree':true,'spicy':true},{'id':'3','name':'Birria Loaded Fries','description':'Birria beef, Oaxaca cheese, onion, cilantro and consommé drizzle.','priceCents':1500,'status':'limited','spicy':true},{'id':'4','name':'Crispy Mushroom Bao','description':'Crispy mushrooms, cucumber, chili crisp and sesame.','priceCents':1200,'status':'available','vegetarian':true,'vegan':true},{'id':'5','name':'Elote Street Cup','description':'Roasted corn, cotija, lime crema, tajín and cilantro.','priceCents':650,'status':'available','vegetarian':true,'glutenFree':true}];
const demoOrders = <Map<String,dynamic>>[{'id':'90000000-0000-4000-8000-000000000001','status':'preparing','pickupLabel':'8:15 PM'}];

extension FirstOrNull<T> on List<T> { T? get firstOrNull => isEmpty ? null : first; }
