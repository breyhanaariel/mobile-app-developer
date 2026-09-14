import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createHash } from 'node:crypto';
import { getMessaging } from 'firebase-admin/messaging';
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import Stripe from 'stripe';
import { z } from 'zod';
import { canManageBusiness, canManageOrders, ensureFirebaseAdmin, principalFromAuthorization } from './auth.js';
import { db, databaseEnabled } from './db.js';
import { canTransition, estimatePickupMinutes, pointsEarned, priceOrder, type OrderStatus } from './domain.js';
import {
  favorites, loyaltyAccounts, menuCategories, menuItems, modifierGroups, modifierOptions,
  notifications, orderItemModifiers, orderItems, orders, promoCodes, pushTokens,
  staffMembers, stopMenuItems, truckStops, users,
} from './schema.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

function requireDb() { if (!db) throw new Error('DATABASE_URL is not configured'); return db; }
async function principal(req:any){ return principalFromAuthorization(req.headers.authorization); }
async function requireAuth(req:any,reply:any){ const p=await principal(req); if(!p){reply.code(401).send({error:'authentication_required'});return null;} return p; }
async function requireStaff(req:any,reply:any){ const p=await requireAuth(req,reply); if(!p)return null; if(!canManageOrders(p.role)){reply.code(403).send({error:'staff_required'});return null;} return p; }

const itemInput = z.object({ menuItemId:z.string().uuid(), quantity:z.number().int().min(1).max(20), modifierOptionIds:z.array(z.string().uuid()).default([]), notes:z.string().max(300).optional() });
const orderInput = z.object({ stopId:z.string().uuid(), customerName:z.string().min(2).max(100), guestEmail:z.string().email().optional(), guestPhone:z.string().min(7).max(30).optional(), guestKey:z.string().min(8).max(100).optional(), pickupMode:z.enum(['asap','scheduled']), pickupAt:z.coerce.date().optional(), promoCode:z.string().max(30).optional(), loyaltyPointsRedeemed:z.number().int().min(0).default(0), tipCents:z.number().int().min(0).max(100000).default(0), items:z.array(itemInput).min(1).max(30) });

async function itemDetails(ids:string[]) {
  const database=requireDb();
  const rows=await database.select().from(menuItems).where(inArray(menuItems.id,ids));
  const groups=await database.select().from(modifierGroups).where(inArray(modifierGroups.menuItemId,ids));
  const groupIds=groups.map(g=>g.id);
  const options=groupIds.length?await database.select().from(modifierOptions).where(inArray(modifierOptions.groupId,groupIds)):[];
  return {rows,groups,options};
}

async function calculateQuote(input:z.infer<typeof orderInput>, userId?:string) {
  const database=requireDb();
  const [stop]=await database.select().from(truckStops).where(eq(truckStops.id,input.stopId)).limit(1);
  if(!stop) throw new Error('stop_not_found');
  if(!stop.acceptingOrders) throw new Error('ordering_paused');
  const now=new Date();
  if(stop.orderingOpensAt && now<stop.orderingOpensAt) throw new Error('ordering_not_open');
  if(stop.orderingClosesAt && now>stop.orderingClosesAt) throw new Error('ordering_closed');
  const ids=[...new Set(input.items.map(i=>i.menuItemId))];
  const {rows,groups,options}=await itemDetails(ids);
  const overrides=await database.select().from(stopMenuItems).where(and(eq(stopMenuItems.stopId,stop.id),inArray(stopMenuItems.menuItemId,ids)));
  let subtotal=0;
  const lines=[] as Array<{input:z.infer<typeof itemInput>;item:(typeof rows)[number];mods:(typeof options)}>;
  for(const line of input.items){
    const item=rows.find(r=>r.id===line.menuItemId);
    const override=overrides.find(o=>o.menuItemId===line.menuItemId);
    if(!item||!item.active||item.status==='sold_out'||override?.available===false) throw new Error('menu_item_unavailable');
    const itemGroups=groups.filter(g=>g.menuItemId===item.id);
    const selected=options.filter(o=>line.modifierOptionIds.includes(o.id)&&o.available);
    for(const g of itemGroups){ const count=selected.filter(o=>o.groupId===g.id).length; if(g.required&&count<g.minSelect)throw new Error(`modifier_required:${g.name}`); if(count>g.maxSelect)throw new Error(`modifier_limit:${g.name}`); }
    if(selected.length!==line.modifierOptionIds.length) throw new Error('invalid_modifier');
    const unit=item.priceCents+selected.reduce((s,m)=>s+m.priceDeltaCents,0);
    subtotal+=unit*line.quantity;
    lines.push({input:line,item,mods:selected});
  }
  let promoPercent=0,promoFixedCents=0,normalizedPromo:string|undefined;
  if(input.promoCode){
    const code=input.promoCode.toUpperCase();
    const [promo]=await database.select().from(promoCodes).where(eq(promoCodes.code,code)).limit(1);
    if(!promo||!promo.active||(promo.startsAt&&now<promo.startsAt)||(promo.endsAt&&now>promo.endsAt)||(promo.maxUses!=null&&promo.useCount>=promo.maxUses)) throw new Error('promo_invalid');
    normalizedPromo=promo.code;
    if(promo.discountType==='percent') promoPercent=promo.discountValue; else promoFixedCents=promo.discountValue;
  }
  const redeem=input.loyaltyPointsRedeemed;
  if(redeem>0){
    if(!userId) throw new Error('sign_in_to_redeem');
    const [loyalty]=await database.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId,userId)).limit(1);
    if(!loyalty||loyalty.points<redeem) throw new Error('insufficient_points');
  }
  const pricing=priceOrder({subtotalCents:subtotal,promoPercent,promoFixedCents,loyaltyPointsRedeemed:redeem,tipCents:input.tipCents});
  const [{count}]=await database.select({count:sql<number>`count(*)`}).from(orders).where(and(eq(orders.stopId,stop.id),inArray(orders.status,['received','preparing'])));
  const waitMin=estimatePickupMinutes(Number(count??0),stop.capacityPer15Min,stop.waitTimeOverrideMin);
  const pickupAt=input.pickupMode==='scheduled'&&input.pickupAt?input.pickupAt:new Date(Date.now()+waitMin*60000);
  if(pickupAt<now) throw new Error('pickup_time_in_past');
  if(pickupAt>stop.endsAt) throw new Error('pickup_after_stop_closes');
  return {stop,lines,pricing,pickupAt,estimatedPickupMin:waitMin,promoCode:normalizedPromo};
}

async function sendOrderNotification(order:{id:string;userId:string|null;guestKey:string|null;status:string}) {
  const database=requireDb();
  const copy:Record<string,{title:string;body:string}>={
    received:{title:'Order received',body:'Bite Route has your order.'},
    preparing:{title:'We’re cooking',body:'Your Bite Route order is being prepared.'},
    ready:{title:'Ready for pickup',body:'Your food is ready. Head to the truck!'},
    completed:{title:'Route complete',body:'Thanks for stopping by. Your rewards are updated.'},
    cancelled:{title:'Order cancelled',body:'Your Bite Route order was cancelled.'},
    refunded:{title:'Order refunded',body:'Your refund status has been updated.'},
  };
  const message=copy[order.status]; if(!message)return;
  await database.insert(notifications).values({userId:order.userId??undefined,guestKey:order.guestKey??undefined,title:message.title,body:message.body,type:`order_${order.status}`});
  const where=order.userId&&order.guestKey?or(eq(pushTokens.userId,order.userId),eq(pushTokens.guestKey,order.guestKey)):order.userId?eq(pushTokens.userId,order.userId):order.guestKey?eq(pushTokens.guestKey,order.guestKey):undefined;
  if(!where)return;
  const rows=await database.select().from(pushTokens).where(where);
  if(!rows.length)return;
  try{
    const firebase=await ensureFirebaseAdmin(); if(!firebase)return;
    await getMessaging(firebase).sendEachForMulticast({tokens:rows.map(r=>r.token),notification:message,data:{orderId:order.id,status:order.status}});
  }catch(error){app.log.warn({error},'FCM delivery skipped');}
}

app.get('/health',async()=>({ok:true,service:'bite-route-api',database:databaseEnabled,firebase:Boolean(process.env.FIREBASE_PROJECT_ID),stripe:Boolean(process.env.STRIPE_SECRET_KEY),cloudinary:Boolean(process.env.CLOUDINARY_CLOUD_NAME)}));

app.get('/v1/home',async(req)=>{
  const q=z.object({lat:z.coerce.number().optional(),lng:z.coerce.number().optional()}).parse(req.query);
  const database=requireDb(); const now=new Date();
  const stops=await database.select().from(truckStops).where(sql`${truckStops.endsAt} > ${now}`).orderBy(asc(truckStops.startsAt)).limit(8);
  const active=stops.find(s=>s.startsAt<=now&&s.endsAt>=now)??stops[0]??null;
  let estimatedPickupMin=20;
  if(active){const [{count}]=await database.select({count:sql<number>`count(*)`}).from(orders).where(and(eq(orders.stopId,active.id),inArray(orders.status,['received','preparing'])));estimatedPickupMin=estimatePickupMinutes(Number(count??0),active.capacityPer15Min,active.waitTimeOverrideMin);}
  const distanceMiles=active&&q.lat!=null&&q.lng!=null?haversine(q.lat,q.lng,Number(active.latitude),Number(active.longitude)):null;
  return {currentStop:active,upcomingStops:stops,estimatedPickupMin,distanceMiles:distanceMiles==null?null:Number(distanceMiles.toFixed(1))};
});

app.get('/v1/stops',async()=>requireDb().select().from(truckStops).orderBy(asc(truckStops.startsAt)));

app.get('/v1/menu',async(req)=>{
  const {stopId}=z.object({stopId:z.string().uuid()}).parse(req.query); const database=requireDb();
  const cats=await database.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder));
  const items=await database.select().from(menuItems).where(eq(menuItems.active,true));
  const groups=await database.select().from(modifierGroups); const options=await database.select().from(modifierOptions);
  const overrides=await database.select().from(stopMenuItems).where(eq(stopMenuItems.stopId,stopId));
  return items.map(i=>({...i,status:overrides.find(o=>o.menuItemId===i.id)?.available===false?'sold_out':i.status,category:cats.find(c=>c.id===i.categoryId)?.name??'Menu',modifierGroups:groups.filter(g=>g.menuItemId===i.id).map(g=>({...g,options:options.filter(o=>o.groupId===g.id)})),stopId}));
});

app.post('/v1/orders/quote',async(req,reply)=>{const parsed=orderInput.safeParse(req.body);if(!parsed.success)return reply.code(400).send({error:parsed.error.flatten()});const p=await principal(req);try{const q=await calculateQuote(parsed.data,p?.userId);return {pricing:q.pricing,pickupAt:q.pickupAt,estimatedPickupMin:q.estimatedPickupMin};}catch(e){return reply.code(409).send({error:e instanceof Error?e.message:'quote_failed'});}});

app.post('/v1/orders',async(req,reply)=>{
  const parsed=orderInput.safeParse(req.body);if(!parsed.success)return reply.code(400).send({error:parsed.error.flatten()});
  const p=await principal(req); if(!p&&((!parsed.data.guestEmail&&!parsed.data.guestPhone)||!parsed.data.guestKey))return reply.code(400).send({error:'guest_contact_and_key_required'});
  try{
    const q=await calculateQuote(parsed.data,p?.userId);const database=requireDb();
    const points=p?pointsEarned(q.pricing.subtotalCents-q.pricing.discountCents-q.pricing.loyaltyDiscountCents):0;
    let paymentIntentId:string|undefined,clientSecret:string|null|undefined;
    if(process.env.STRIPE_SECRET_KEY){const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);const intent=await stripe.paymentIntents.create({amount:q.pricing.totalCents,currency:'usd',automatic_payment_methods:{enabled:true},metadata:{stopId:parsed.data.stopId,customerName:parsed.data.customerName}});paymentIntentId=intent.id;clientSecret=intent.client_secret;}
    const [order]=await database.insert(orders).values({userId:p?.userId,guestEmail:parsed.data.guestEmail,guestPhone:parsed.data.guestPhone,guestKey:p?undefined:parsed.data.guestKey,stopId:parsed.data.stopId,status:'received',pickupMode:parsed.data.pickupMode,pickupAt:q.pickupAt,subtotalCents:q.pricing.subtotalCents,discountCents:q.pricing.discountCents+q.pricing.loyaltyDiscountCents,taxCents:q.pricing.taxCents,tipCents:q.pricing.tipCents,totalCents:q.pricing.totalCents,promoCode:q.promoCode,stripePaymentIntentId:paymentIntentId,paymentStatus:paymentIntentId?'pending':'authorized',loyaltyPointsEarned:points,loyaltyPointsRedeemed:parsed.data.loyaltyPointsRedeemed,customerName:parsed.data.customerName}).returning();
    for(const line of q.lines){const unit=line.item.priceCents+line.mods.reduce((s,m)=>s+m.priceDeltaCents,0);const [oi]=await database.insert(orderItems).values({orderId:order.id,menuItemId:line.item.id,itemName:line.item.name,quantity:line.input.quantity,unitPriceCents:unit,lineTotalCents:unit*line.input.quantity,notes:line.input.notes}).returning();if(line.mods.length)await database.insert(orderItemModifiers).values(line.mods.map(m=>({orderItemId:oi.id,modifierOptionId:m.id,name:m.name,priceDeltaCents:m.priceDeltaCents})));}
    if(p&&parsed.data.loyaltyPointsRedeemed>0){const [acct]=await database.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId,p.userId)).limit(1);if(acct)await database.update(loyaltyAccounts).set({points:acct.points-parsed.data.loyaltyPointsRedeemed,updatedAt:new Date()}).where(eq(loyaltyAccounts.userId,p.userId));}
    if(q.promoCode)await database.update(promoCodes).set({useCount:sql`${promoCodes.useCount}+1`}).where(eq(promoCodes.code,q.promoCode));
    await sendOrderNotification(order);
    return reply.code(201).send({order,payment:{provider:paymentIntentId?'stripe':'demo',paymentIntentId,clientSecret},estimatedPickupMin:q.estimatedPickupMin});
  }catch(e){return reply.code(409).send({error:e instanceof Error?e.message:'order_failed'});}
});

app.post('/v1/orders/:id/confirm-payment',async(req,reply)=>{
  const id=z.string().uuid().parse((req.params as any).id); const database=requireDb(); const p=await principal(req); const guestKey=z.object({guestKey:z.string().optional()}).parse(req.body??{}).guestKey;
  const [order]=await database.select().from(orders).where(eq(orders.id,id)).limit(1); if(!order)return reply.code(404).send({error:'order_not_found'});
  if(order.userId?order.userId!==p?.userId:order.guestKey!==guestKey)return reply.code(403).send({error:'order_access_denied'});
  if(!order.stripePaymentIntentId||!process.env.STRIPE_SECRET_KEY){await database.update(orders).set({paymentStatus:'authorized'}).where(eq(orders.id,id));return {status:'authorized'};}
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY); const intent=await stripe.paymentIntents.retrieve(order.stripePaymentIntentId); const status=intent.status==='succeeded'?'paid':intent.status==='canceled'?'failed':'pending'; await database.update(orders).set({paymentStatus:status}).where(eq(orders.id,id)); return {status};
});

app.get('/v1/orders',async(req,reply)=>{const p=await principal(req);const guest=z.object({guestKey:z.string().optional()}).parse(req.query);if(!p&&!guest.guestKey)return reply.code(401).send({error:'authentication_or_guest_key_required'});const database=requireDb();return p?database.select().from(orders).where(eq(orders.userId,p.userId)).orderBy(desc(orders.createdAt)):database.select().from(orders).where(eq(orders.guestKey,guest.guestKey!)).orderBy(desc(orders.createdAt));});

app.post('/v1/push-tokens',async(req,reply)=>{const p=await principal(req);const body=z.object({token:z.string().min(20),platform:z.enum(['android','ios']),guestKey:z.string().min(8).optional()}).parse(req.body);if(!p&&!body.guestKey)return reply.code(400).send({error:'user_or_guest_key_required'});await requireDb().insert(pushTokens).values({userId:p?.userId,guestKey:p?undefined:body.guestKey,token:body.token,platform:body.platform}).onConflictDoUpdate({target:pushTokens.token,set:{userId:p?.userId,guestKey:p?undefined:body.guestKey,platform:body.platform}});return {ok:true};});
app.get('/v1/notifications',async(req,reply)=>{const p=await principal(req);const q=z.object({guestKey:z.string().optional()}).parse(req.query);if(!p&&!q.guestKey)return reply.code(401).send({error:'authentication_or_guest_key_required'});return p?requireDb().select().from(notifications).where(eq(notifications.userId,p.userId)).orderBy(desc(notifications.createdAt)):requireDb().select().from(notifications).where(eq(notifications.guestKey,q.guestKey!)).orderBy(desc(notifications.createdAt));});

app.get('/v1/loyalty',async(req,reply)=>{const p=await requireAuth(req,reply);if(!p)return;const [a]=await requireDb().select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId,p.userId)).limit(1);return a??{userId:p.userId,points:0,lifetimePoints:0};});
app.get('/v1/loyalty/config',async()=>({pointsPerDollar:1,redemption:{pointsPerCent:1,minPoints:100}}));
app.post('/v1/favorites',async(req,reply)=>{const p=await requireAuth(req,reply);if(!p)return;const b=z.object({menuItemId:z.string().uuid().optional(),stopId:z.string().uuid().optional()}).refine(x=>x.menuItemId||x.stopId).parse(req.body);await requireDb().insert(favorites).values({userId:p.userId,menuItemId:b.menuItemId,stopId:b.stopId});return reply.code(201).send({ok:true});});

app.get('/v1/admin/summary',async(req,reply)=>{const p=await requireStaff(req,reply);if(!p)return;const database=requireDb();const today=new Date();today.setHours(0,0,0,0);const todays=await database.select().from(orders).where(sql`${orders.createdAt} >= ${today}`);const gross=todays.reduce((s,o)=>s+o.totalCents,0);const popular=await database.select({name:orderItems.itemName,quantity:sql<number>`sum(${orderItems.quantity})`}).from(orderItems).groupBy(orderItems.itemName).orderBy(desc(sql`sum(${orderItems.quantity})`)).limit(5);return {ordersToday:todays.length,grossSalesCents:gross,averageOrderValueCents:todays.length?Math.round(gross/todays.length):0,openOrders:todays.filter(o=>['received','preparing','ready'].includes(o.status)).length,popularItems:popular};});
app.get('/v1/admin/orders',async(req,reply)=>{const p=await requireStaff(req,reply);if(!p)return;return requireDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(100);});
app.patch('/v1/admin/orders/:id/status',async(req,reply)=>{const p=await requireStaff(req,reply);if(!p)return;const id=z.string().uuid().parse((req.params as any).id);const {status}=z.object({status:z.enum(['received','preparing','ready','completed','cancelled','refunded'])}).parse(req.body);const database=requireDb();const [order]=await database.select().from(orders).where(eq(orders.id,id)).limit(1);if(!order)return reply.code(404).send({error:'order_not_found'});if(!canTransition(order.status as OrderStatus,status))return reply.code(409).send({error:'invalid_status_transition'});await database.update(orders).set({status,updatedAt:new Date()}).where(eq(orders.id,id));if(status==='completed'&&order.userId&&order.loyaltyPointsEarned>0){const [acct]=await database.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId,order.userId)).limit(1);if(acct)await database.update(loyaltyAccounts).set({points:acct.points+order.loyaltyPointsEarned,lifetimePoints:acct.lifetimePoints+order.loyaltyPointsEarned,updatedAt:new Date()}).where(eq(loyaltyAccounts.userId,order.userId));else await database.insert(loyaltyAccounts).values({userId:order.userId,points:order.loyaltyPointsEarned,lifetimePoints:order.loyaltyPointsEarned});}await sendOrderNotification({...order,status});return {ok:true,status};});
app.patch('/v1/admin/menu/:id',async(req,reply)=>{const p=await requireStaff(req,reply);if(!p)return;const id=z.string().uuid().parse((req.params as any).id);const body=z.object({status:z.enum(['available','limited','sold_out']).optional(),priceCents:z.number().int().min(0).optional(),active:z.boolean().optional(),imageUrl:z.string().url().optional()}).parse(req.body);await requireDb().update(menuItems).set(body).where(eq(menuItems.id,id));return {ok:true};});
app.patch('/v1/admin/stops/:id',async(req,reply)=>{const p=await requireStaff(req,reply);if(!p)return;const id=z.string().uuid().parse((req.params as any).id);const body=z.object({acceptingOrders:z.boolean().optional(),waitTimeOverrideMin:z.number().int().min(5).max(180).nullable().optional(),capacityPer15Min:z.number().int().min(1).max(100).optional()}).parse(req.body);await requireDb().update(truckStops).set(body).where(eq(truckStops.id,id));return {ok:true};});
app.post('/v1/admin/promos',async(req,reply)=>{const p=await requireAuth(req,reply);if(!p)return;if(!canManageBusiness(p.role))return reply.code(403).send({error:'owner_required'});const body=z.object({code:z.string().min(3).max(30),description:z.string().min(3).max(200),discountType:z.enum(['percent','fixed']),discountValue:z.number().int().positive(),startsAt:z.coerce.date().optional(),endsAt:z.coerce.date().optional(),maxUses:z.number().int().positive().optional()}).parse(req.body);const [promo]=await requireDb().insert(promoCodes).values({...body,code:body.code.toUpperCase()}).returning();return reply.code(201).send(promo);});
app.get('/v1/admin/staff',async(req,reply)=>{const p=await requireAuth(req,reply);if(!p)return;if(!canManageBusiness(p.role))return reply.code(403).send({error:'owner_required'});return requireDb().select({id:staffMembers.id,role:staffMembers.role,active:staffMembers.active,name:users.displayName,email:users.email}).from(staffMembers).innerJoin(users,eq(staffMembers.userId,users.id));});
app.post('/v1/admin/media/sign',async(req,reply)=>{const p=await requireStaff(req,reply);if(!p)return;const cloud=process.env.CLOUDINARY_CLOUD_NAME,key=process.env.CLOUDINARY_API_KEY,secret=process.env.CLOUDINARY_API_SECRET;if(!cloud||!key||!secret)return reply.code(503).send({error:'cloudinary_credentials_missing'});const timestamp=Math.floor(Date.now()/1000);const folder='bite-route/menu';const signature=createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest('hex');return {cloudName:cloud,apiKey:key,timestamp,folder,signature};});

function haversine(lat1:number,lon1:number,lat2:number,lon2:number){const r=3958.8;const dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(a));}
const port=Number(process.env.PORT??3100);
if(process.env.VERCEL!=='1')await app.listen({port,host:'0.0.0.0'});
export default app;
