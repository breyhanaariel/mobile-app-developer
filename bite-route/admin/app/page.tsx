'use client';

import { useEffect, useMemo, useState } from 'react';

type Summary = { ordersToday:number; grossSalesCents:number; averageOrderValueCents:number; openOrders:number };
type Order = { id:string; customerName:string; status:string; totalCents:number; pickupAt:string; paymentStatus:string };

type Stop = { id:string; name:string; address:string; acceptingOrders:boolean; waitTimeOverrideMin:number|null };

const API = process.env.NEXT_PUBLIC_BITE_ROUTE_API_URL ?? 'http://localhost:3100';
const DEMO_TOKEN = 'demo-owner-token';

async function api<T>(path:string, init:RequestInit={}):Promise<T>{
  const headers = new Headers(init.headers);
  headers.set('accept','application/json');
  headers.set('content-type','application/json');
  headers.set('authorization',`Bearer ${DEMO_TOKEN}`);
  const response = await fetch(`${API}${path}`,{...init,headers});
  if(!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export default function Dashboard(){
  const [summary,setSummary]=useState<Summary>({ordersToday:0,grossSalesCents:0,averageOrderValueCents:0,openOrders:0});
  const [orders,setOrders]=useState<Order[]>([]);
  const [stops,setStops]=useState<Stop[]>([]);
  const [live,setLive]=useState(false);
  const load=async()=>{
    try{
      const [s,o,st]=await Promise.all([api<Summary>('/v1/admin/summary'),api<Order[]>('/v1/admin/orders'),fetch(`${API}/v1/stops`).then(r=>r.json()) as Promise<Stop[]>]);
      setSummary(s);setOrders(o);setStops(st);setLive(true);
    }catch{
      setLive(false);
      setSummary({ordersToday:18,grossSalesCents:28740,averageOrderValueCents:1597,openOrders:5});
      setOrders(demoOrders);
      setStops(demoStops);
    }
  };
  useEffect(()=>{load();const id=setInterval(load,10000);return()=>clearInterval(id);},[]);
  const top=useMemo(()=>orders.slice(0,12),[orders]);
  const move=async(order:Order,status:string)=>{
    if(!live){setOrders(current=>current.map(o=>o.id===order.id?{...o,status}:o));return;}
    await api(`/v1/admin/orders/${order.id}/status`,{method:'PATCH',body:JSON.stringify({status})});await load();
  };
  const toggleStop=async(stop:Stop)=>{
    if(!live){setStops(current=>current.map(s=>s.id===stop.id?{...s,acceptingOrders:!s.acceptingOrders}:s));return;}
    await api(`/v1/admin/stops/${stop.id}`,{method:'PATCH',body:JSON.stringify({acceptingOrders:!stop.acceptingOrders})});await load();
  };
  return <main>
    <header><div><div className="brand">BITE ROUTE</div><h1>Truck Control</h1><p>Owner + Staff dashboard</p></div><span className={`badge ${live?'live':'demo'}`}>{live?'LIVE API':'DEMO FALLBACK'}</span></header>
    <section className="stats"><Stat label="Orders today" value={`${summary.ordersToday}`}/><Stat label="Open orders" value={`${summary.openOrders}`}/><Stat label="Gross sandbox sales" value={money(summary.grossSalesCents)}/><Stat label="Average order" value={money(summary.averageOrderValueCents)}/></section>
    <section className="grid">
      <div className="panel wide"><div className="panelHead"><div><div className="eyebrow">LIVE ORDER QUEUE</div><h2>Kitchen & pickup</h2></div><button onClick={load}>Refresh</button></div>
        <div className="orders">{top.map(order=><article key={order.id} className="order"><div><strong>{order.customerName}</strong><small>#{order.id.slice(0,8).toUpperCase()} · {money(order.totalCents)}</small></div><span className={`status ${order.status}`}>{order.status}</span><div className="actions">{order.status==='received'&&<button onClick={()=>move(order,'preparing')}>Start</button>}{order.status==='preparing'&&<button onClick={()=>move(order,'ready')}>Ready</button>}{order.status==='ready'&&<button onClick={()=>move(order,'completed')}>Picked up</button>}</div></article>)}</div>
      </div>
      <div className="panel"><div className="eyebrow">FIND THE TRUCK</div><h2>Stops & ordering</h2>{stops.slice(0,5).map(stop=><article className="stop" key={stop.id}><div><strong>{stop.name}</strong><small>{stop.address}</small></div><button className={stop.acceptingOrders?'pause':'resume'} onClick={()=>toggleStop(stop)}>{stop.acceptingOrders?'Pause':'Resume'}</button></article>)}</div>
      <div className="panel"><div className="eyebrow">MENU CONTROL</div><h2>Fast operations</h2><p>Staff can toggle sold-out/limited states, adjust stop availability, and update wait times. Owner-only business settings remain protected server-side.</p><div className="quick"><span>Sold-out toggles</span><span>Wait-time override</span><span>Promos</span><span>Loyalty configuration</span><span>Menu photos via Cloudinary</span></div></div>
      <div className="panel"><div className="eyebrow">ANALYTICS</div><h2>Operational signals</h2><p>Dashboard analytics are calculated from seeded or real order records—never presented as real-world client results.</p><div className="chart"><div style={{height:'66%'}}/><div style={{height:'88%'}}/><div style={{height:'52%'}}/><div style={{height:'100%'}}/><div style={{height:'74%'}}/></div></div>
    </section>
  </main>
}

function Stat({label,value}:{label:string;value:string}){return <div className="stat"><span>{label}</span><strong>{value}</strong></div>}
function money(cents:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100)}

const demoOrders:Order[]=[
  {id:'90000000-0000-4000-8000-000000000001',customerName:'Maya Rivera',status:'preparing',totalCents:1847,pickupAt:new Date().toISOString(),paymentStatus:'paid'},
  {id:'90000000-0000-4000-8000-000000000002',customerName:'Jordan Lee',status:'received',totalCents:2362,pickupAt:new Date().toISOString(),paymentStatus:'paid'},
  {id:'90000000-0000-4000-8000-000000000003',customerName:'Avery Brooks',status:'ready',totalCents:1299,pickupAt:new Date().toISOString(),paymentStatus:'paid'}
];
const demoStops:Stop[]=[
  {id:'1',name:'Central Avenue Night Stop',address:'2500 Central Ave, St. Petersburg',acceptingOrders:true,waitTimeOverrideMin:null},
  {id:'2',name:'Water Street Lunch',address:'615 Channelside Dr, Tampa',acceptingOrders:true,waitTimeOverrideMin:null},
  {id:'3',name:'St. Pete Pier Sunset',address:'600 2nd Ave NE, St. Petersburg',acceptingOrders:true,waitTimeOverrideMin:null}
];
