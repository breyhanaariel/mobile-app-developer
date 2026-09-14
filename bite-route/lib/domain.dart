enum OrderStatus { received, preparing, ready, completed, cancelled, refunded }

enum PickupMode { asap, scheduled }

class ModifierChoice {
  final String id;
  final String name;
  final int priceDeltaCents;
  const ModifierChoice(this.id, this.name, this.priceDeltaCents);
}

class CartLine {
  final String itemId;
  final String name;
  final int basePriceCents;
  final int quantity;
  final List<ModifierChoice> modifiers;

  const CartLine({required this.itemId, required this.name, required this.basePriceCents, required this.quantity, this.modifiers = const []});

  int get unitPriceCents => basePriceCents + modifiers.fold(0, (sum, item) => sum + item.priceDeltaCents);
  int get lineTotalCents => unitPriceCents * quantity;
}

class PricingSummary {
  final int subtotalCents;
  final int discountCents;
  final int taxCents;
  final int tipCents;
  final int loyaltyDiscountCents;
  final int totalCents;
  const PricingSummary({required this.subtotalCents, required this.discountCents, required this.taxCents, required this.tipCents, required this.loyaltyDiscountCents, required this.totalCents});
}

PricingSummary priceCart({
  required List<CartLine> lines,
  int promoPercent = 0,
  int promoFixedCents = 0,
  int loyaltyPointsRedeemed = 0,
  int tipCents = 0,
  double taxRate = 0.07,
}) {
  final subtotal = lines.fold<int>(0, (sum, line) => sum + line.lineTotalCents);
  final percentDiscount = (subtotal * promoPercent / 100).round();
  final promoDiscount = percentDiscount + promoFixedCents;
  final cappedPromo = promoDiscount.clamp(0, subtotal);
  final afterPromo = subtotal - cappedPromo;
  final loyaltyDiscount = loyaltyPointsRedeemed.clamp(0, afterPromo);
  final taxable = afterPromo - loyaltyDiscount;
  final tax = (taxable * taxRate).round();
  final total = taxable + tax + tipCents;
  return PricingSummary(
    subtotalCents: subtotal,
    discountCents: cappedPromo,
    taxCents: tax,
    tipCents: tipCents,
    loyaltyDiscountCents: loyaltyDiscount,
    totalCents: total,
  );
}

int pointsEarnedForOrder(int paidSubtotalCents) => paidSubtotalCents ~/ 100;

bool canTransitionOrder(OrderStatus from, OrderStatus to) {
  const allowed = <OrderStatus, Set<OrderStatus>>{
    OrderStatus.received: {OrderStatus.preparing, OrderStatus.cancelled},
    OrderStatus.preparing: {OrderStatus.ready, OrderStatus.cancelled},
    OrderStatus.ready: {OrderStatus.completed},
    OrderStatus.completed: {OrderStatus.refunded},
    OrderStatus.cancelled: {},
    OrderStatus.refunded: {},
  };
  return allowed[from]!.contains(to);
}

DateTime nextPickupSlot({required DateTime now, required int openOrders, required int capacityPer15Minutes, int? overrideWaitMinutes}) {
  final wait = overrideWaitMinutes ?? (((openOrders / capacityPer15Minutes).ceil() + 1) * 15);
  final target = now.add(Duration(minutes: wait));
  final minute = target.minute;
  final rounded = ((minute + 14) ~/ 15) * 15;
  if (rounded == 60) return DateTime(target.year, target.month, target.day, target.hour + 1);
  return DateTime(target.year, target.month, target.day, target.hour, rounded);
}
