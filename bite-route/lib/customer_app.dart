import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api.dart';
import 'commerce_service.dart';
import 'domain.dart';

const lime = Color(0xFFC7F464);
const purple = Color(0xFF3C146B);
const cream = Color(0xFFFFF7E8);
const ink = Color(0xFF20162B);

final apiProvider = Provider<BiteRouteApi>((ref) => BiteRouteApi());
final commerceProvider = Provider<CommerceSession>(
  (ref) => CommerceSession(ref.read(apiProvider)),
);
final storeProvider = StateNotifierProvider<StoreController, StoreState>(
  (ref) => StoreController(
    ref.read(apiProvider),
    ref.read(commerceProvider),
  ),
);

class StoreState {
  const StoreState({
    this.loading = true,
    this.home = const {},
    this.menu = const [],
    this.cart = const [],
    this.stopId,
    this.tab = 0,
    this.demo = false,
    this.message,
    this.signedIn = false,
  });

  final bool loading;
  final bool demo;
  final bool signedIn;
  final Map<String, dynamic> home;
  final List<dynamic> menu;
  final List<CartLine> cart;
  final String? stopId;
  final int tab;
  final String? message;

  StoreState copyWith({
    bool? loading,
    bool? demo,
    bool? signedIn,
    Map<String, dynamic>? home,
    List<dynamic>? menu,
    List<CartLine>? cart,
    String? stopId,
    int? tab,
    String? message,
  }) {
    return StoreState(
      loading: loading ?? this.loading,
      demo: demo ?? this.demo,
      signedIn: signedIn ?? this.signedIn,
      home: home ?? this.home,
      menu: menu ?? this.menu,
      cart: cart ?? this.cart,
      stopId: stopId ?? this.stopId,
      tab: tab ?? this.tab,
      message: message,
    );
  }
}

class StoreController extends StateNotifier<StoreState> {
  StoreController(this.api, this.commerce) : super(const StoreState()) {
    initialize();
  }

  final BiteRouteApi api;
  final CommerceSession commerce;
  Timer? _refreshTimer;

  Future<void> initialize() async {
    await commerce.initialize();
    state = state.copyWith(signedIn: commerce.signedIn);
    await load();
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => load(silent: true),
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> load({bool silent = false}) async {
    if (!silent) {
      state = state.copyWith(loading: true, message: null);
    }
    try {
      double? lat;
      double? lng;
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        final position = await Geolocator.getCurrentPosition();
        lat = position.latitude;
        lng = position.longitude;
      }
      final home = await api.home(lat: lat, lng: lng);
      final stops = List<dynamic>.from(
        home['upcomingStops'] as List? ?? const [],
      );
      final currentStop = home['currentStop'];
      String? selected = state.stopId;
      if (selected == null && currentStop is Map) {
        selected = currentStop['id']?.toString();
      }
      if (selected == null && stops.isNotEmpty && stops.first is Map) {
        selected = (stops.first as Map)['id']?.toString();
      }
      final menu = selected == null ? <dynamic>[] : await api.menu(selected);
      state = state.copyWith(
        loading: false,
        home: home,
        stopId: selected,
        menu: menu,
        demo: false,
        signedIn: commerce.signedIn,
      );
    } catch (_) {
      state = state.copyWith(
        loading: false,
        home: demoHome,
        stopId: demoStopId,
        menu: demoMenu,
        demo: true,
        message: 'Offline portfolio demo',
      );
    }
  }

  Future<void> requestLocation() async {
    final permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always) {
      await load();
    }
  }

  void selectTab(int value) {
    state = state.copyWith(tab: value);
  }

  Future<void> selectStop(String id) async {
    state = state.copyWith(stopId: id, loading: true);
    try {
      state = state.copyWith(
        menu: await api.menu(id),
        loading: false,
      );
    } catch (_) {
      state = state.copyWith(
        menu: demoMenu,
        loading: false,
        demo: true,
      );
    }
  }

  void addToCart(
    Map<String, dynamic> item,
    List<ModifierChoice> modifiers,
    int quantity,
  ) {
    final line = CartLine(
      itemId: item['id'].toString(),
      name: item['name'].toString(),
      basePriceCents: (item['priceCents'] as num).toInt(),
      quantity: quantity,
      modifiers: modifiers,
    );
    state = state.copyWith(cart: [...state.cart, line]);
  }

  void removeFromCart(int index) {
    final next = [...state.cart]..removeAt(index);
    state = state.copyWith(cart: next);
  }

  void changeQuantity(int index, int delta) {
    final old = state.cart[index];
    final quantity = (old.quantity + delta).clamp(1, 20).toInt();
    final next = [...state.cart];
    next[index] = CartLine(
      itemId: old.itemId,
      name: old.name,
      basePriceCents: old.basePriceCents,
      quantity: quantity,
      modifiers: old.modifiers,
    );
    state = state.copyWith(cart: next);
  }

  void clearCart() {
    state = state.copyWith(cart: const []);
  }

  Future<void> authenticate(Future<void> Function() action) async {
    await action();
    await commerce.refreshAuthToken();
    await commerce.registerPush();
    state = state.copyWith(signedIn: commerce.signedIn);
  }

  Future<void> signOut() async {
    if (commerce.firebaseReady) {
      await commerce.auth.signOut();
    }
    api.bearerToken = null;
    state = state.copyWith(signedIn: false);
  }
}

class BiteRouteCustomerApp extends ConsumerWidget {
  const BiteRouteCustomerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(storeProvider);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Bite Route',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: cream,
        colorScheme: ColorScheme.fromSeed(
          seedColor: purple,
          primary: purple,
          secondary: lime,
          surface: Colors.white,
        ),
        textTheme: const TextTheme(
          bodyMedium: TextStyle(fontSize: 16, color: ink),
          headlineMedium: TextStyle(fontWeight: FontWeight.w900, color: ink),
          titleLarge: TextStyle(fontWeight: FontWeight.w900, color: ink),
        ),
      ),
      home: Scaffold(
        appBar: AppBar(
          backgroundColor: cream,
          title: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'BITE ROUTE',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  color: purple,
                ),
              ),
              Text(
                'Good food. Find the next stop.',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
            ],
          ),
          actions: [
            IconButton(
              tooltip: 'Account',
              onPressed: () => showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                builder: (_) => const AccountSheet(),
              ),
              icon: Icon(
                state.signedIn ? Icons.person : Icons.person_outline,
              ),
            ),
          ],
        ),
        body: state.loading
            ? const Center(child: CircularProgressIndicator())
            : IndexedStack(
                index: state.tab,
                children: const [
                  FindScreen(),
                  MenuScreen(),
                  CartScreen(),
                  OrdersScreen(),
                  RewardsScreen(),
                ],
              ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: state.tab,
          onDestinationSelected: ref.read(storeProvider.notifier).selectTab,
          destinations: const [
            NavigationDestination(icon: Icon(Icons.route), label: 'Find'),
            NavigationDestination(
              icon: Icon(Icons.restaurant_menu),
              label: 'Menu',
            ),
            NavigationDestination(
              icon: Icon(Icons.shopping_bag_outlined),
              label: 'Cart',
            ),
            NavigationDestination(
              icon: Icon(Icons.receipt_long),
              label: 'Orders',
            ),
            NavigationDestination(icon: Icon(Icons.stars), label: 'Rewards'),
          ],
        ),
      ),
    );
  }
}

class FindScreen extends ConsumerWidget {
  const FindScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(storeProvider);
    final rawCurrent = state.home['currentStop'];
    final current = rawCurrent is Map
        ? Map<String, dynamic>.from(rawCurrent)
        : null;
    final upcoming = (state.home['upcomingStops'] as List? ?? const [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList();

    return RefreshIndicator(
      onRefresh: () => ref.read(storeProvider.notifier).load(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 110),
        children: [
          if (state.demo)
            const Notice(
              'Seeded offline demo · live Neon activates when the API URL is configured',
            ),
          HeroCard(current: current, home: state.home),
          if (state.home['distanceMiles'] == null)
            TextButton.icon(
              onPressed: ref.read(storeProvider.notifier).requestLocation,
              icon: const Icon(Icons.my_location),
              label: const Text('Use my location for distance'),
            ),
          const Heading('Upcoming route'),
          ...upcoming.map(
            (stop) => Card(
              child: ListTile(
                title: Text(
                  stop['name'].toString(),
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                subtitle: Text(
                  '${stop['venue'] ?? ''}\n${stop['address'] ?? ''}',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => ref
                    .read(storeProvider.notifier)
                    .selectStop(stop['id'].toString()),
              ),
            ),
          ),
          const Heading('The Bite Route'),
          const Feature(
            icon: Icons.public,
            title: 'Global street food',
            body:
                'Korean BBQ tacos, jerk bowls, birria fries, bao, elote and bright drinks rotate by stop.',
          ),
          const Feature(
            icon: Icons.schedule,
            title: 'Capacity-aware pickup',
            body:
                'ASAP and scheduled pickup estimates respond to the live kitchen queue.',
          ),
        ],
      ),
    );
  }
}

class HeroCard extends StatelessWidget {
  const HeroCard({super.key, required this.current, required this.home});

  final Map<String, dynamic>? current;
  final Map<String, dynamic> home;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: purple,
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'FIND THE TRUCK',
            style: TextStyle(
              color: lime,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 7),
          Text(
            current?['name']?.toString() ?? 'Next stop',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 29,
              fontWeight: FontWeight.w900,
            ),
          ),
          Text(
            current?['address']?.toString() ?? 'Tampa Bay',
            style: const TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 13),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Pill(
                current?['acceptingOrders'] == true
                    ? 'ORDERING OPEN'
                    : 'NEXT STOP',
                accent: true,
              ),
              Pill('${home['estimatedPickupMin'] ?? 20} min pickup'),
              if (home['distanceMiles'] != null)
                Pill('${home['distanceMiles']} mi'),
            ],
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: lime,
              foregroundColor: purple,
            ),
            onPressed: current == null ? null : () => openMaps(current!),
            icon: const Icon(Icons.directions),
            label: const Text('Get Directions'),
          ),
        ],
      ),
    );
  }
}

class MenuScreen extends ConsumerWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(storeProvider);
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 110),
      children: [
        const Text(
          'Street food worth chasing.',
          style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 8),
        const Text('Availability can change by stop and sell out in real time.'),
        const SizedBox(height: 14),
        ...state.menu.whereType<Map>().map((raw) {
          final item = Map<String, dynamic>.from(raw);
          return MenuCard(
            item: item,
            onAdd: () => showModalBottomSheet<void>(
              context: context,
              isScrollControlled: true,
              builder: (_) => CustomizeSheet(item: item),
            ),
          );
        }),
      ],
    );
  }
}

class MenuCard extends ConsumerWidget {
  const MenuCard({super.key, required this.item, required this.onAdd});

  final Map<String, dynamic> item;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = item['status']?.toString() ?? 'available';
    final signedIn = ref.watch(storeProvider).signedIn;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    item['name'].toString(),
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 19,
                    ),
                  ),
                ),
                Text(
                  money((item['priceCents'] as num).toInt()),
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
              ],
            ),
            Text(item['description']?.toString() ?? ''),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              children: [
                if (item['vegetarian'] == true)
                  const Chip(label: Text('Vegetarian')),
                if (item['vegan'] == true) const Chip(label: Text('Vegan')),
                if (item['glutenFree'] == true) const Chip(label: Text('GF')),
                if (item['spicy'] == true) const Chip(label: Text('Spicy')),
                Chip(label: Text(status.replaceAll('_', ' ').toUpperCase())),
              ],
            ),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: status == 'sold_out' ? null : onAdd,
                    child: Text(
                      status == 'sold_out' ? 'Sold Out' : 'Customize & Add',
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Favorite',
                  onPressed: signedIn
                      ? () async {
                          try {
                            await ref
                                .read(apiProvider)
                                .favorite(itemId: item['id'].toString());
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Saved to favorites')),
                              );
                            }
                          } catch (_) {}
                        }
                      : null,
                  icon: const Icon(Icons.favorite_border),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class CustomizeSheet extends ConsumerStatefulWidget {
  const CustomizeSheet({super.key, required this.item});

  final Map<String, dynamic> item;

  @override
  ConsumerState<CustomizeSheet> createState() => _CustomizeSheetState();
}

class _CustomizeSheetState extends ConsumerState<CustomizeSheet> {
  final Map<String, ModifierChoice> selected = {};
  int quantity = 1;

  @override
  Widget build(BuildContext context) {
    final groups = (widget.item['modifierGroups'] as List? ?? const [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList();

    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        20,
        20,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.item['name'].toString(),
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
            ),
            ...groups.map(_modifierGroup),
            const SizedBox(height: 14),
            Row(
              children: [
                const Text(
                  'Quantity',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
                const Spacer(),
                IconButton(
                  onPressed: quantity > 1
                      ? () => setState(() => quantity--)
                      : null,
                  icon: const Icon(Icons.remove_circle_outline),
                ),
                Text('$quantity'),
                IconButton(
                  onPressed: quantity < 20
                      ? () => setState(() => quantity++)
                      : null,
                  icon: const Icon(Icons.add_circle_outline),
                ),
              ],
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
              onPressed: _add,
              child: const Text('Add to Cart'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _modifierGroup(Map<String, dynamic> group) {
    final options = (group['options'] as List? ?? const [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList();
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${group['name']}${group['required'] == true ? ' · required' : ''}',
            style: const TextStyle(fontWeight: FontWeight.w900),
          ),
          ...options.map((option) {
            final id = option['id'].toString();
            final checked = selected.containsKey(id);
            final delta = (option['priceDeltaCents'] as num).toInt();
            return CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(
                '${option['name']}${delta > 0 ? ' +${money(delta)}' : ''}',
              ),
              value: checked,
              onChanged: (value) {
                setState(() {
                  final max = (group['maxSelect'] as num?)?.toInt() ?? 1;
                  if (value == true) {
                    if (max == 1) {
                      for (final other in options) {
                        selected.remove(other['id'].toString());
                      }
                    }
                    selected[id] = ModifierChoice(
                      id,
                      option['name'].toString(),
                      delta,
                    );
                  } else {
                    selected.remove(id);
                  }
                });
              },
            );
          }),
        ],
      ),
    );
  }

  void _add() {
    final groups = (widget.item['modifierGroups'] as List? ?? const [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList();
    for (final group in groups) {
      if (group['required'] == true) {
        final optionIds = (group['options'] as List? ?? const [])
            .whereType<Map>()
            .map((option) => option['id'].toString())
            .toSet();
        if (!selected.keys.any(optionIds.contains)) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Choose ${group['name']}')),
          );
          return;
        }
      }
    }
    ref.read(storeProvider.notifier).addToCart(
          widget.item,
          selected.values.toList(),
          quantity,
        );
    Navigator.pop(context);
  }
}

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(storeProvider);
    final pricing = priceCart(
      lines: state.cart,
      tipCents: state.cart.isEmpty ? 0 : 300,
    );
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 110),
      children: [
        const Text(
          'Your route order',
          style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900),
        ),
        if (state.cart.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 24),
            child: Text('Your cart is empty. Pick a stop and grab something good.'),
          ),
        ...state.cart.asMap().entries.map(
          (entry) => Card(
            child: ListTile(
              title: Text(
                entry.value.name,
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
              subtitle: Text(
                '${money(entry.value.lineTotalCents)} · ${entry.value.modifiers.map((m) => m.name).join(', ')}',
              ),
              trailing: SizedBox(
                width: 126,
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => ref
                          .read(storeProvider.notifier)
                          .changeQuantity(entry.key, -1),
                      icon: const Icon(Icons.remove),
                    ),
                    Text('${entry.value.quantity}'),
                    IconButton(
                      onPressed: () => ref
                          .read(storeProvider.notifier)
                          .changeQuantity(entry.key, 1),
                      icon: const Icon(Icons.add),
                    ),
                  ],
                ),
              ),
              onLongPress: () => ref
                  .read(storeProvider.notifier)
                  .removeFromCart(entry.key),
            ),
          ),
        ),
        if (state.cart.isNotEmpty) ...[
          const SizedBox(height: 12),
          PriceRow('Subtotal', pricing.subtotalCents),
          PriceRow('Estimated tax', pricing.taxCents),
          PriceRow('Tip', pricing.tipCents),
          const Divider(),
          PriceRow('Estimated total', pricing.totalCents, strong: true),
          const SizedBox(height: 14),
          FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
            onPressed: () => showModalBottomSheet<void>(
              context: context,
              isScrollControlled: true,
              builder: (_) => const CheckoutSheet(),
            ),
            child: const Text('Checkout'),
          ),
          TextButton(
            onPressed: state.cart.isEmpty
                ? null
                : ref.read(storeProvider.notifier).clearCart,
            child: const Text('Clear cart'),
          ),
        ],
      ],
    );
  }
}

class CheckoutSheet extends ConsumerStatefulWidget {
  const CheckoutSheet({super.key});

  @override
  ConsumerState<CheckoutSheet> createState() => _CheckoutSheetState();
}

class _CheckoutSheetState extends ConsumerState<CheckoutSheet> {
  final name = TextEditingController(text: 'Maya Rivera');
  final email = TextEditingController(text: 'maya@example.com');
  final phone = TextEditingController(text: '7275550101');
  final promo = TextEditingController();
  bool scheduled = false;
  bool saving = false;
  DateTime? pickup;
  int tip = 300;
  int redeem = 0;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(storeProvider);
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        20,
        20,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Pickup checkout',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
            ),
            Text(
              state.signedIn
                  ? 'Signed-in checkout · rewards available'
                  : 'Guest checkout · phone/email keeps this order on this device',
            ),
            const SizedBox(height: 12),
            TextField(
              controller: name,
              decoration: const InputDecoration(labelText: 'Name'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: email,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: phone,
              decoration: const InputDecoration(labelText: 'Phone'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: promo,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Promo code (try ROUTE10)',
              ),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Schedule pickup'),
              subtitle: Text(
                pickup == null
                    ? 'Use next available capacity-aware time'
                    : formatPickup(pickup!.toIso8601String()),
              ),
              value: scheduled,
              onChanged: (value) async {
                setState(() => scheduled = value);
                if (value) {
                  final now = DateTime.now();
                  final chosen = await showTimePicker(
                    context: context,
                    initialTime: TimeOfDay.fromDateTime(
                      now.add(const Duration(minutes: 45)),
                    ),
                  );
                  if (!mounted || chosen == null) return;
                  setState(() {
                    pickup = DateTime(
                      now.year,
                      now.month,
                      now.day,
                      chosen.hour,
                      chosen.minute,
                    );
                  });
                }
              },
            ),
            const Text('Tip', style: TextStyle(fontWeight: FontWeight.w900)),
            Wrap(
              spacing: 8,
              children: [0, 300, 500, 800]
                  .map(
                    (cents) => ChoiceChip(
                      label: Text(cents == 0 ? 'No tip' : money(cents)),
                      selected: tip == cents,
                      onSelected: (_) => setState(() => tip = cents),
                    ),
                  )
                  .toList(),
            ),
            if (state.signedIn) ...[
              const SizedBox(height: 10),
              TextField(
                keyboardType: TextInputType.number,
                onChanged: (value) => redeem = int.tryParse(value) ?? 0,
                decoration: const InputDecoration(
                  labelText: 'Redeem Bite Points (100 = \$1.00)',
                ),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
              onPressed: saving ? null : _placeOrder,
              child: Text(saving ? 'Placing…' : 'Place Sandbox Order'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _placeOrder() async {
    final state = ref.read(storeProvider);
    setState(() => saving = true);
    final payload = <String, dynamic>{
      'stopId': state.stopId ?? demoStopId,
      'customerName': name.text,
      'guestEmail': email.text,
      'guestPhone': phone.text,
      'pickupMode': scheduled ? 'scheduled' : 'asap',
      if (scheduled && pickup != null) 'pickupAt': pickup!.toIso8601String(),
      if (promo.text.trim().isNotEmpty) 'promoCode': promo.text.trim(),
      'tipCents': tip,
      'loyaltyPointsRedeemed': redeem,
      'items': state.cart
          .map(
            (line) => {
              'menuItemId': line.itemId,
              'quantity': line.quantity,
              'modifierOptionIds': line.modifiers.map((m) => m.id).toList(),
            },
          )
          .toList(),
    };
    try {
      if (!state.demo) {
        await ref.read(commerceProvider).placeOrder(payload);
      }
      ref.read(storeProvider.notifier).clearCart();
      ref.read(storeProvider.notifier).selectTab(3);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Order placed · watch Orders for updates')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$error')),
      );
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }
}

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  Timer? timer;

  @override
  void initState() {
    super.initState();
    timer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(storeProvider);
    final future = state.demo
        ? Future<List<dynamic>>.value(demoOrders)
        : ref.read(commerceProvider).orderHistory();
    return FutureBuilder<List<dynamic>>(
      future: future,
      builder: (context, snapshot) {
        final orderRows = snapshot.data ?? demoOrders;
        return ListView(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 110),
          children: [
            const Text(
              'Order tracking',
              style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 10),
            ...orderRows.whereType<Map>().map((raw) {
              final order = Map<String, dynamic>.from(raw);
              final status = order['status']?.toString() ?? 'received';
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '#${shortId(order['id'].toString())}',
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                      Text(
                        status.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: purple,
                        ),
                      ),
                      Text(
                        'Pickup ${order['pickupLabel'] ?? formatPickup(order['pickupAt'])} · ${money(((order['totalCents'] ?? 0) as num).toInt())}',
                      ),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: orderProgress(status),
                        backgroundColor: Colors.black12,
                        color: lime,
                      ),
                      const SizedBox(height: 10),
                      TextButton.icon(
                        onPressed: () {
                          ref.read(storeProvider.notifier).selectTab(1);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Reorder checks the current stop menu so sold-out items cannot be repurchased.',
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.replay),
                        label: const Text('Reorder'),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        );
      },
    );
  }
}

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(storeProvider);
    final future = state.demo || !state.signedIn
        ? Future<Map<String, dynamic>>.value(
            const {'points': 82, 'lifetimePoints': 240},
          )
        : ref.read(apiProvider).loyalty();
    return FutureBuilder<Map<String, dynamic>>(
      future: future,
      builder: (context, snapshot) {
        final rewards = snapshot.data ?? const {'points': 0, 'lifetimePoints': 0};
        return ListView(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 110),
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: lime,
                borderRadius: BorderRadius.circular(28),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'BITE POINTS',
                    style: TextStyle(fontWeight: FontWeight.w900, color: purple),
                  ),
                  Text(
                    '${rewards['points']}',
                    style: const TextStyle(
                      fontSize: 50,
                      fontWeight: FontWeight.w900,
                      color: purple,
                    ),
                  ),
                  const Text(
                    '1 point per \$1 spent · 100 points = \$1 off',
                    style: TextStyle(color: purple),
                  ),
                ],
              ),
            ),
            const Heading('Rewards'),
            const Feature(
              icon: Icons.redeem,
              title: 'Redeem at checkout',
              body: 'Signed-in customers can apply points to a future order.',
            ),
            const Feature(
              icon: Icons.favorite,
              title: 'Favorites',
              body: 'Save menu items and favorite stops for faster return visits.',
            ),
            const Feature(
              icon: Icons.notifications_active,
              title: 'Route alerts',
              body:
                  'Push infrastructure supports order status, favorite-stop and reward announcements.',
            ),
          ],
        );
      },
    );
  }
}

class AccountSheet extends ConsumerStatefulWidget {
  const AccountSheet({super.key});

  @override
  ConsumerState<AccountSheet> createState() => _AccountSheetState();
}

class _AccountSheetState extends ConsumerState<AccountSheet> {
  final email = TextEditingController();
  final password = TextEditingController();
  bool busy = false;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(storeProvider);
    final commerce = ref.read(commerceProvider);
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        20,
        20,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              state.signedIn
                  ? 'Your Bite Route account'
                  : 'Sign in or keep checking out as guest',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
            ),
            if (!commerce.firebaseReady)
              const Notice(
                'Firebase credentials are not configured in this build. Guest checkout remains available.',
              ),
            if (state.signedIn) ...[
              Text(commerce.auth.currentUser?.email ?? 'Signed in'),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () async {
                  await ref.read(storeProvider.notifier).signOut();
                  if (context.mounted) Navigator.pop(context);
                },
                child: const Text('Sign Out'),
              ),
            ] else if (commerce.firebaseReady) ...[
              TextField(
                controller: email,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: password,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: busy
                          ? null
                          : () => _run(
                                () => commerce.auth.signInWithEmail(
                                  email.text,
                                  password.text,
                                ),
                              ),
                      child: const Text('Sign In'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: busy
                          ? null
                          : () => _run(
                                () => commerce.auth.createAccount(
                                  email.text,
                                  password.text,
                                ),
                              ),
                      child: const Text('Create'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: busy
                    ? null
                    : () => _run(commerce.auth.signInWithGoogle),
                icon: const Icon(Icons.login),
                label: const Text('Continue with Google'),
              ),
              OutlinedButton.icon(
                onPressed: busy
                    ? null
                    : () => _run(commerce.auth.signInWithApple),
                icon: const Icon(Icons.apple),
                label: const Text('Continue with Apple'),
              ),
            ],
            const SizedBox(height: 10),
            const Text(
              'Guest checkout is always available and is tied to this device plus the phone/email you enter.',
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _run(Future<dynamic> Function() action) async {
    setState(() => busy = true);
    try {
      await ref.read(storeProvider.notifier).authenticate(() async {
        await action();
      });
      if (mounted) Navigator.pop(context);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$error')),
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}

class Notice extends StatelessWidget {
  const Notice(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.shade100,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700)),
    );
  }
}

class Pill extends StatelessWidget {
  const Pill(this.text, {super.key, this.accent = false});
  final String text;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: accent ? lime : Colors.white12,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: accent ? purple : Colors.white,
          fontWeight: FontWeight.w900,
          fontSize: 12,
        ),
      ),
    );
  }
}

class Heading extends StatelessWidget {
  const Heading(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 10),
      child: Text(
        text,
        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
      ),
    );
  }
}

class Feature extends StatelessWidget {
  const Feature({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
  });
  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: lime,
              foregroundColor: purple,
              child: Icon(icon),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 17,
                    ),
                  ),
                  Text(body),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PriceRow extends StatelessWidget {
  const PriceRow(this.label, this.cents, {super.key, this.strong = false});
  final String label;
  final int cents;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: strong ? FontWeight.w900 : FontWeight.w500,
            ),
          ),
          Text(
            money(cents),
            style: TextStyle(
              fontWeight: strong ? FontWeight.w900 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

Future<void> openMaps(Map<String, dynamic> stop) {
  final query = Uri.encodeComponent(stop['address'].toString());
  return launchUrl(
    Uri.parse('https://www.google.com/maps/search/?api=1&query=$query'),
    mode: LaunchMode.externalApplication,
  );
}

String money(int cents) => '\$${(cents / 100).toStringAsFixed(2)}';
String shortId(String id) => id.length >= 8
    ? id.substring(0, 8).toUpperCase()
    : id.toUpperCase();
String formatPickup(dynamic value) {
  if (value == null) return 'soon';
  final date = DateTime.tryParse(value.toString());
  if (date == null) return value.toString();
  final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
  final minute = date.minute.toString().padLeft(2, '0');
  final period = date.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $period';
}

double orderProgress(String status) {
  switch (status) {
    case 'received':
      return .25;
    case 'preparing':
      return .55;
    case 'ready':
      return .85;
    case 'completed':
      return 1;
    default:
      return .1;
  }
}

const demoStopId = '70000000-0000-4000-8000-000000000001';
const demoHome = <String, dynamic>{
  'currentStop': {
    'id': demoStopId,
    'name': 'Central Avenue Night Stop',
    'venue': 'Grand Central District',
    'address': '2500 Central Ave, St. Petersburg, FL',
    'acceptingOrders': true,
  },
  'estimatedPickupMin': 20,
  'distanceMiles': 2.4,
  'upcomingStops': [
    {
      'id': demoStopId,
      'name': 'Central Avenue Night Stop',
      'venue': 'Grand Central District',
      'address': '2500 Central Ave, St. Petersburg, FL',
    },
    {
      'id': '70000000-0000-4000-8000-000000000002',
      'name': 'Water Street Lunch',
      'venue': 'Water Street Tampa',
      'address': '615 Channelside Dr, Tampa, FL',
    },
  ],
};

const demoMenu = <Map<String, dynamic>>[
  {
    'id': '50000000-0000-4000-8000-000000000001',
    'name': 'Korean BBQ Street Tacos',
    'description': 'Gochujang beef, sesame slaw, scallion and lime crema.',
    'priceCents': 1350,
    'status': 'available',
    'spicy': true,
    'modifierGroups': [
      {
        'name': 'Spice Level',
        'required': true,
        'maxSelect': 1,
        'options': [
          {
            'id': '61000000-0000-4000-8000-000000000001',
            'name': 'Mild',
            'priceDeltaCents': 0,
          },
          {
            'id': '61000000-0000-4000-8000-000000000002',
            'name': 'Hot',
            'priceDeltaCents': 0,
          },
        ],
      },
    ],
  },
  {
    'id': '50000000-0000-4000-8000-000000000002',
    'name': 'Jerk Chicken Bowl',
    'description': 'Jerk chicken, coconut rice, pineapple pico and charred cabbage.',
    'priceCents': 1450,
    'status': 'available',
    'glutenFree': true,
    'spicy': true,
    'modifierGroups': [],
  },
  {
    'id': '50000000-0000-4000-8000-000000000003',
    'name': 'Birria Loaded Fries',
    'description': 'Birria beef, Oaxaca cheese, onion, cilantro and consommé drizzle.',
    'priceCents': 1500,
    'status': 'limited',
    'spicy': true,
    'modifierGroups': [],
  },
  {
    'id': '50000000-0000-4000-8000-000000000004',
    'name': 'Crispy Mushroom Bao',
    'description': 'Crispy mushrooms, cucumber, chili crisp and sesame.',
    'priceCents': 1200,
    'status': 'available',
    'vegetarian': true,
    'vegan': true,
    'modifierGroups': [],
  },
];

const demoOrders = <Map<String, dynamic>>[
  {
    'id': '90000000-0000-4000-8000-000000000001',
    'status': 'preparing',
    'pickupLabel': '8:15 PM',
    'totalCents': 2226,
  },
];
