export type OrderStatus = 'received'|'preparing'|'ready'|'completed'|'cancelled'|'refunded';

export function priceOrder(input:{subtotalCents:number;promoPercent?:number;promoFixedCents?:number;loyaltyPointsRedeemed?:number;tipCents?:number;taxRate?:number}){
  const promo = Math.min(input.subtotalCents, Math.round(input.subtotalCents*(input.promoPercent??0)/100)+(input.promoFixedCents??0));
  const afterPromo = input.subtotalCents-promo;
  const loyalty = Math.min(afterPromo,input.loyaltyPointsRedeemed??0);
  const taxable = afterPromo-loyalty;
  const tax = Math.round(taxable*(input.taxRate??0.07));
  const tip = input.tipCents??0;
  return {subtotalCents:input.subtotalCents,discountCents:promo,loyaltyDiscountCents:loyalty,taxCents:tax,tipCents:tip,totalCents:taxable+tax+tip};
}
export function pointsEarned(subtotalCents:number){return Math.floor(subtotalCents/100);}
export function canTransition(from:OrderStatus,to:OrderStatus){
  const map:Record<OrderStatus,OrderStatus[]>={received:['preparing','cancelled'],preparing:['ready','cancelled'],ready:['completed'],completed:['refunded'],cancelled:[],refunded:[]};
  return map[from].includes(to);
}
export function estimatePickupMinutes(openOrders:number,capacityPer15:number,override?:number|null){return override??((Math.ceil(openOrders/Math.max(1,capacityPer15))+1)*15);}
