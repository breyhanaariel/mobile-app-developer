'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAuth, appleSignIn, dashboardSignOut, emailSignIn, firebaseConfigured, googleSignIn } from './firebase';

type Summary = { ordersToday:number; grossSalesCents:number; averageOrderValueCents:number; openOrders:number; popularItems?:Array<{name:string;quantity:number}> };
type Order = { id:string; customerName:string; status:string; totalCents:number; pickupAt:string; paymentStatus:string };
type Stop = { id:string; name:string; address:string; acceptingOrders:boolean; waitTimeOverrideMin:number|null; capacityPer15Min?:number };
type MenuItem = { id:string; name:string; status:string; priceCents:number; imageUrl?:string|null };

const API = process.env.NEXT_PUBLIC_BITE_ROUTE_API_URL ?? 'http://localhost:3100';
const DEMO_TOKEN = 'demo-owner-token';

export default function Dashboard(){
  const [summary,setSummary]=useState<Summary>({ordersToday:0,grossSalesCents:0,averageOrderValueCents:0,openOrders:0});
  const [orders,setOrders]=useState<Order[]>([]);
  const [stops,setStops]=useState<Stop[]>([]);
  const [menu,setMenu]=useState<MenuItem[]>([]);
  const [live,setLive]=useState(false);
  const [token,setToken]=useState(DEMO_TOKEN);
  const [identity,setIdentity]=useState('Portfolio owner demo');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [promoCode,setPromoCode]=useState('ROUTE15');
  const [promoValue,setPromoValue]=useState(15);
  const request=useCallback(async<T,>(path:string,init:RequestInit={}):Promise<T>=>{
    const headers=new Headers(init.headers);headers.set('accept','application/json');headers.set('content-type','application/json');headers.set('authorization',`Bearer ${token}`);
    const response=await fetch(`${API}${path}`,{...init,headers});if(!response.ok){const p=await response.json().catch(()=>({}));throw new Error(p.error??`API ${response.status}`);}return response.json();
  },[token]);

  const load=useCallback(async()=>{
    try{
      const [s,o,st,m]=await Promise.all([
        request<Summary>('/v1/admin/summary'),request<Order[]>('/v1/admin/orders'),
        fetch(`${API}/v1/stops`).then(r=>r.json()) as Promise<Stop[]>,
        fetch(`${API}/v1/menu?stopId=70000000-0000-4000-8000-000000000001`).then(r=>r.json()) as Promise<MenuItem[]>
      ]);
      setSummary(s);setOrders(o);setStops(st);setMenu(m);setLive(true);
    }catch{
      setLive(false);setSummary({ordersToday:3,grossSalesCents:5880,averageOrderValueCents:1960,openOrders:3,popularItems:[{name:'Korean BBQ Street Tacos',quantity:1},{name:'Jerk Chicken Bowl',quantity:1}]});setOrders(demoOrders);setStops(demoStops);setMenu(demoMenu);
    }
  },[request]);

  useEffect(()=>{void load();const id=setInterval(()=>void load(),10000);return()=>clearInterval(id);},[load]);
  useEffect(()=>adminAuth?.onAuthStateChanged(async user=>{if(user){setToken(await user.getIdToken());setIdentity(user.email??'Authenticated staff');}else if(firebaseConfigured){setToken(DEMO_TOKEN);setIdentity('Portfolio owner demo');}}),[]);

  const move=async(order:Order,status:string)=>{if(!live){setOrders(c=>c.map(o=>o.id===order.id?{...o,status}:o));return;}await request(`/v1/admin/orders/${order.id}/status`,{method:'PATCH',body:JSON.stringify({status})});await load();};
  const toggleStop=async(stop:Stop)=>{if(!live){setStops(c=>c.map(s=>s.id===stop.id?{...s,acceptingOrders:!s.acceptingOrders}:s));return;}await request(`/v1/admin/stops/${stop.id}`,{method:'PATCH',body:JSON.stringify({acceptingOrders:!stop.acceptingOrders})});await load();};
  const setWait=async(stop:Stop,value:number|null)=>{if(!live)return;await request(`/v1/admin/stops/${stop.id}`,{method:'PATCH',body:JSON.stringify({waitTimeOverrideMin:value})});await load();};
  const setMenuStatus=async(item:MenuItem,status:string)=>{if(!live){setMenu(c=>c.map(m=>m.id===item.id?{...m,status}:m));return;}await request(`/v1/admin/menu/${item.id}`,{method:'PATCH',body:JSON.stringify({status})});await load();};
  const createPromo=async()=>{if(!live)return alert('Connect the API to create persisted promos.');try{await request('/v1/admin/promos',{method:'POST',body:JSON.stringify({code:promoCode,description:`${promoValue}% dashboard promotion`,discountType:'percent',discountValue:promoValue})});alert(`${promoCode.toUpperCase()} created`);}catch(e){alert(String(e));}};
  const login=async(provider:'email'|'google'|'apple')=>{try{const user=provider==='email'?await emailSignIn(email,password):provider==='google'?await googleSignIn():await appleSignIn();setToken(await user.getIdToken());setIdentity(user.email??'Authenticated staff');await load();}catch(e){alert(String(e));}};

  const top=useMemo(()=>orders.slice(0,12),[orders]);
  return <main>
    <header><div><div className="brand">BITE ROUTE</div><h1>Truck Control</h1><p>Owner + Staff operations · {identity}</p></div><div className="flex items-center gap-2"><span className={`badge ${live?'live':'demo'}`}>{live?'LIVE API':'DEMO FALLBACK'}</span>{firebaseConfigured&&adminAuth?.currentUser&&<button onClick={async()=>{await dashboardSignOut();setToken(DEMO_TOKEN);setIdentity('Portfolio owner demo');}}>Sign out</button>}</div></header>

    {firebaseConfigured&&!adminAuth?.currentUser&&<section className="authBox mb-4"><strong>Staff sign-in</strong><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/><input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password"/><button onClick={()=>void login('email')}>Email</button><button onClick={()=>void login('google')}>Google</button><button onClick={()=>void login('apple')}>Apple</button><span className="muted">Server roles still decide Owner vs Staff access.</span></section>}

    <section className="stats"><Stat label="Orders today" value={`${summary.ordersToday}`}/><Stat label="Open orders" value={`${summary.openOrders}`}/><Stat label="Gross sandbox sales" value={money(summary.grossSalesCents)}/><Stat label="Average order" value={money(summary.averageOrderValueCents)}/></section>
    <section className="grid">
      <div className="panel wide"><div className="panelHead"><div><div className="eyebrow">LIVE ORDER QUEUE</div><h2>Kitchen & pickup</h2></div><button onClick={()=>void load()}>Refresh</button></div><div className="orders">{top.map(order=><article key={order.id} className="order"><div><strong>{order.customerName}</strong><small>#{order.id.slice(0,8).toUpperCase()} · {money(order.totalCents)} · {order.paymentStatus}</small></div><span className={`status ${order.status}`}>{order.status}</span><div className="actions">{order.status==='received'&&<button onClick={()=>void move(order,'preparing')}>Start</button>}{order.status==='preparing'&&<button onClick={()=>void move(order,'ready')}>Ready</button>}{order.status==='ready'&&<button onClick={()=>void move(order,'completed')}>Picked up</button>}</div></article>)}</div></div>

      <div className="panel"><div className="eyebrow">FIND THE TRUCK</div><h2>Stops & ordering</h2>{stops.slice(0,5).map(stop=><article className="stop" key={stop.id}><div><strong>{stop.name}</strong><small>{stop.address}</small><div className="mt-2 flex gap-2"><button onClick={()=>void setWait(stop,20)}>20 min</button><button onClick={()=>void setWait(stop,null)}>Auto wait</button></div></div><button className={stop.acceptingOrders?'pause':'resume'} onClick={()=>void toggleStop(stop)}>{stop.acceptingOrders?'Pause':'Resume'}</button></article>)}</div>

      <div className="panel"><div className="eyebrow">MENU CONTROL</div><h2>Availability</h2><div className="space-y-2">{menu.slice(0,7).map(item=><div key={item.id} className="rounded-xl border border-[#eadfcf] p-3"><div className="flex items-center justify-between gap-3"><div><strong>{item.name}</strong><small className="block text-[#72677c]">{money(item.priceCents)} · {item.status}</small></div><select className="rounded-lg border p-2" value={item.status} onChange={e=>void setMenuStatus(item,e.target.value)}><option value="available">Available</option><option value="limited">Limited</option><option value="sold_out">Sold out</option></select></div></div>)}</div><p className="mt-3 text-sm">Cloudinary signed media uploads are protected by the API; image URLs are stored on menu items after upload.</p></div>

      <div className="panel"><div className="eyebrow">PROMOS & LOYALTY</div><h2>Owner controls</h2><div className="space-y-2"><input className="w-full rounded-xl border p-3" value={promoCode} onChange={e=>setPromoCode(e.target.value.toUpperCase())}/><input className="w-full rounded-xl border p-3" type="number" min={1} max={90} value={promoValue} onChange={e=>setPromoValue(Number(e.target.value))}/><button onClick={()=>void createPromo()}>Create % promo</button></div><p>Rewards default to 1 point per $1 and redeem at 100 points = $1. The API validates the customer balance at checkout.</p></div>

      <div className="panel"><div className="eyebrow">ANALYTICS</div><h2>Operational signals</h2><p>These are calculations from seeded or real order rows, never claimed as real client results.</p><div className="quick">{summary.popularItems?.map(item=><span key={item.name}>{item.name} · {item.quantity}</span>)}</div><div className="chart"><div style={{height:'66%'}}/><div style={{height:'88%'}}/><div style={{height:'52%'}}/><div style={{height:'100%'}}/><div style={{height:'74%'}}/></div></div>
    </section>
  </main>;
}

function Stat({label,value}:{label:string;value:string}){return <div className="stat"><span>{label}</span><strong>{value}</strong></div>}
function money(cents:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100)}

const demoOrders:Order[]=[
  {id:'90000000-0000-4000-8000-000000000001',customerName:'Maya Rivera',status:'preparing',totalCents:2226,pickupAt:new Date().toISOString(),paymentStatus:'paid'},
  {id:'90000000-0000-4000-8000-000000000002',customerName:'Jordan Lee',status:'received',totalCents:2370,pickupAt:new Date().toISOString(),paymentStatus:'paid'},
  {id:'90000000-0000-4000-8000-000000000003',customerName:'Avery Brooks',status:'ready',totalCents:1284,pickupAt:new Date().toISOString(),paymentStatus:'paid'}
];
const demoStops:Stop[]=[
  {id:'70000000-0000-4000-8000-000000000001',name:'Central Avenue Night Stop',address:'2500 Central Ave, St. Petersburg',acceptingOrders:true,waitTimeOverrideMin:null,capacityPer15Min:8},
  {id:'70000000-0000-4000-8000-000000000002',name:'Water Street Lunch',address:'615 Channelside Dr, Tampa',acceptingOrders:true,waitTimeOverrideMin:null,capacityPer15Min:10}
];
const demoMenu:MenuItem[]=[
  {id:'50000000-0000-4000-8000-000000000001',name:'Korean BBQ Street Tacos',status:'available',priceCents:1350},
  {id:'50000000-0000-4000-8000-000000000002',name:'Jerk Chicken Bowl',status:'available',priceCents:1450},
  {id:'50000000-0000-4000-8000-000000000003',name:'Birria Loaded Fries',status:'limited',priceCents:1500}
];
