import 'package:flutter_test/flutter_test.dart';
import 'package:bite_route/domain.dart';

void main() {
  test('modifier pricing and cart totals stay in integer cents', () {
    const line = CartLine(itemId: 'taco', name: 'Tacos', basePriceCents: 1350, quantity: 2, modifiers: [ModifierChoice('extra', 'Extra Beef', 300)]);
    expect(line.unitPriceCents, 1650);
    expect(line.lineTotalCents, 3300);
    final total = priceCart(lines: const [line], promoPercent: 10, loyaltyPointsRedeemed: 100, tipCents: 300, taxRate: .07);
    expect(total.subtotalCents, 3300);
    expect(total.discountCents, 330);
    expect(total.loyaltyDiscountCents, 100);
    expect(total.taxCents, 201);
    expect(total.totalCents, 3371);
  });

  test('loyalty earns one point per paid dollar', () => expect(pointsEarnedForOrder(1499), 14));

  test('order transitions protect kitchen workflow', () {
    expect(canTransitionOrder(OrderStatus.received, OrderStatus.preparing), isTrue);
    expect(canTransitionOrder(OrderStatus.received, OrderStatus.ready), isFalse);
    expect(canTransitionOrder(OrderStatus.ready, OrderStatus.completed), isTrue);
  });

  test('pickup slot grows with kitchen capacity', () {
    final now = DateTime(2026, 9, 13, 18, 1);
    expect(nextPickupSlot(now: now, openOrders: 0, capacityPer15Minutes: 8), DateTime(2026, 9, 13, 18, 30));
    expect(nextPickupSlot(now: now, openOrders: 9, capacityPer15Minutes: 8), DateTime(2026, 9, 13, 19, 0));
  });
}
