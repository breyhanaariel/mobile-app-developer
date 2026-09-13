const sections=['Today','Calendar','Appointments','Clients','Services','Portfolio','Availability','Waitlist','Analytics','Settings'];
const nav=document.getElementById('nav');const content=document.getElementById('content');const title=document.getElementById('pageTitle');
const appointments=[
 {time:'9:00 AM',name:'Travel + setup',detail:'Seminole → Largo',status:'Route'},
 {time:'9:30 AM',name:'Avery Johnson',detail:'Gel-X • Long Almond • Detailed',status:'Confirmed'},
 {time:'12:15 PM',name:'Cleanup + travel',detail:'Largo → Clearwater',status:'Route'},
 {time:'1:00 PM',name:'Nia Carter',detail:'Structured Manicure • Chrome',status:'Confirmed'},
 {time:'3:30 PM',name:'Travel + setup',detail:'Clearwater → St. Petersburg',status:'Route'},
 {time:'4:15 PM',name:'Jordan Lee',detail:'Acrylic Fill • Freestyle',status:'Confirmed'}
];
const clients=['Avery Johnson','Nia Carter','Jordan Lee','Morgan Reed'];
function today(){return `<div class="grid">
 <div class="card metric"><span>Appointments</span><strong>3</strong><span class="muted">today</span></div>
 <div class="card metric"><span>Booked hours</span><strong>6.5</strong><span class="muted">demo data</span></div>
 <div class="card metric"><span>Deposits</span><strong>$86.25</strong><span class="muted">demo data</span></div>
 <div class="card metric"><span>Waitlist</span><strong>4</strong><span class="muted">active requests</span></div>
 <div class="card wide"><h2>Mobile workday</h2><div class="timeline">${appointments.map(a=>`<div class="stop"><strong>${a.time}</strong><div><b>${a.name}</b><div class="muted">${a.detail}</div></div><span class="pill">${a.status}</span></div>`).join('')}</div></div>
 <div class="card wide"><h2>Next actions</h2><div class="list"><div class="row"><span>Review Avery's inspiration image</span><button>Open</button></div><div class="row"><span>Waitlist match: Friday 2:30 PM</span><button>Notify</button></div><div class="row"><span>Mark completed appointments</span><button>Review</button></div></div></div>
 </div>`}
function generic(section){const map={
 Calendar:'Day / week / month scheduling, travel blocks, vacation, and manual blocked time.',
 Appointments:'Confirmed, pending-payment, completed, cancelled, rescheduled, and no-show appointments.',
 Clients:'Profiles, saved addresses, preferences, appointment history, and client-provided sensitivity notes.',
 Services:'Configure service prices, durations, lengths, art levels, removals, repairs, and active status.',
 Portfolio:'Publish nail sets with service, shape, length, art level, categories, and Book This Set metadata.',
 Availability:'Weekly hours, setup/cleanup buffers, service zones, travel rates, vacation, and personal blocks.',
 Waitlist:'Match openings by service duration, requested dates, address zone, and travel feasibility.',
 Analytics:'Demo analytics only: appointments, booked hours, deposits, popular services, and repeat-client rate.',
 Settings:'Business info, private base location, deposit percentage, cancellation window, reminder timing, and notifications.'};
 let rows='';if(section==='Clients') rows=clients.map(x=>`<div class="row"><span>${x}</span><button>View</button></div>`).join('');
 return `<div class="grid"><div class="card wide"><h2>${section}</h2><p>${map[section]}</p>${rows?`<div class="list">${rows}</div>`:''}</div><div class="card"><h3>Portfolio demo</h3><p class="muted">This dashboard uses seeded fictional data until Firebase is connected.</p></div></div>`}
function render(section){title.textContent=section;content.innerHTML=section==='Today'?today():generic(section);[...nav.children].forEach(b=>b.classList.toggle('active',b.dataset.section===section))}
sections.forEach(s=>{const b=document.createElement('button');b.className='nav-btn';b.dataset.section=s;b.textContent=s;b.onclick=()=>render(s);nav.appendChild(b)});
document.getElementById('blockBtn').onclick=()=>alert('Demo: production will save blocked time to Firestore and recalculate availability.');
render('Today');
