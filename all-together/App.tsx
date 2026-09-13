import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { carterReunion } from './src/data/seed';
import type { Event, Household, RsvpStatus } from './src/types';
import { DemoAuthGateway, type AuthSession } from './src/auth/auth';
import { AllTogetherApiClient, DEFAULT_API_URL } from './src/api/client';
import { nextPollSelection } from './src/domain/polls';

type RootTab = 'Home' | 'Events' | 'Create' | 'Notifications' | 'Profile';
type EventTab = 'Overview' | 'Schedule' | 'People' | 'Polls' | 'Expenses' | 'Photos' | 'Chat';
type SessionGetter = () => Promise<AuthSession | null>;

const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const colors = { cream: '#FFF7E8', paper: '#FFFCF5', terracotta: '#B85F43', gold: '#D8A72E', ink: '#2E2925', muted: '#776F68', line: '#E8DAC6', green: '#4D7259', red: '#9D3D35' };

export default function App() {
  if (clerkKey) {
    return <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}><ClerkEntry /></ClerkProvider>;
  }
  return <DemoEntry />;
}

function ClerkEntry() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth({ treatPendingAsSignedOut: false });
  const { user } = useUser();
  const { startHostedAuth } = useHostedAuth();

  if (!isLoaded) return <Loading />;
  if (!isSignedIn || !user) {
    return <SignInScreen onSignIn={() => startHostedAuth({ mode: 'sign-in' })} onSignUp={() => startHostedAuth({ mode: 'sign-up' })} />;
  }

  const getSession: SessionGetter = async () => {
    const token = await getToken();
    if (!token) return null;
    return {
      accessToken: token,
      expiresAt: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
      user: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? '',
        displayName: user.fullName ?? user.firstName ?? 'Family Member',
        providers: ['email'],
      },
    };
  };

  return <AllTogetherApp getSession={getSession} displayName={user.fullName ?? user.firstName ?? 'Family Member'} authMode="Clerk · Email + Google + Apple" onSignOut={() => signOut()} />;
}

function DemoEntry() {
  const [gateway] = useState(() => new DemoAuthGateway());
  const [ready, setReady] = useState(false);
  useEffect(() => { gateway.signInWithGoogle().finally(() => setReady(true)); }, [gateway]);
  if (!ready) return <Loading />;
  return <AllTogetherApp getSession={() => gateway.currentSession()} displayName="Jordan Carter" authMode="Demo session · Clerk credentials pending" onSignOut={() => gateway.signOut()} />;
}

function Loading() {
  return <SafeAreaProvider><SafeAreaView style={styles.center}><ActivityIndicator size="large" /><Text style={styles.body}>Loading AllTogether…</Text></SafeAreaView></SafeAreaProvider>;
}

function SignInScreen({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  return <SafeAreaProvider><SafeAreaView style={styles.safe}><View style={styles.authScreen}>
    <Text style={styles.brand}>ALLTOGETHER</Text><Text style={styles.hero}>Family plans, all in one place.</Text>
    <Text style={styles.body}>Sign in to RSVP, vote, chat, share photos, track expenses, and coordinate family events.</Text>
    <Pressable accessibilityRole="button" style={styles.primary} onPress={onSignIn}><Text style={styles.primaryText}>Sign In</Text></Pressable>
    <Pressable accessibilityRole="button" style={styles.secondary} onPress={onSignUp}><Text style={styles.secondaryText}>Create Account</Text></Pressable>
  </View></SafeAreaView></SafeAreaProvider>;
}

function AllTogetherApp({ getSession, displayName, authMode, onSignOut }: { getSession: SessionGetter; displayName: string; authMode: string; onSignOut: () => Promise<void> | void }) {
  const [rootTab, setRootTab] = useState<RootTab>('Home');
  const [eventTab, setEventTab] = useState<EventTab>('Overview');
  const [event, setEvent] = useState<Event>(carterReunion);
  const [live, setLive] = useState(false);
  const [syncNote, setSyncNote] = useState('Seeded demo data');
  const api = useMemo(() => new AllTogetherApiClient(DEFAULT_API_URL, getSession), [getSession]);

  const syncEvent = useCallback(async () => {
    try {
      const bundle = await api.event<any>(EVENT_ID);
      setEvent(current => mapBundle(bundle, current));
      setLive(true);
      setSyncNote('Neon-backed API connected');
    } catch {
      setLive(false);
      setSyncNote('Offline demo fallback');
    }
  }, [api]);

  useEffect(() => {
    syncEvent();
    const timer = setInterval(syncEvent, 12000);
    return () => clearInterval(timer);
  }, [syncEvent]);

  const updateHousehold = async (id: string, rsvp: RsvpStatus) => {
    setEvent(current => ({ ...current, households: current.households.map(h => h.id === id ? { ...h, rsvp } : h) }));
    if (live) {
      try { await api.householdRsvp(id, rsvp); await syncEvent(); }
      catch { Alert.alert('Could not save RSVP', 'Your local preview was updated, but the server did not accept the change.'); }
    }
  };

  const openEvent = () => { setRootTab('Events'); setEventTab('Overview'); };

  return <SafeAreaProvider><SafeAreaView style={styles.safe}><StatusBar style="dark" />
    <View style={styles.app}>
      <Header title={rootTab === 'Events' ? event.title : rootTab} live={live} />
      {rootTab === 'Home' && <Home event={event} onOpen={openEvent} syncNote={syncNote} />}
      {rootTab === 'Events' && <EventScreen event={event} tab={eventTab} setTab={setEventTab} updateHousehold={updateHousehold} api={api} live={live} syncEvent={syncEvent} />}
      {rootTab === 'Create' && <CreateEvent api={api} live={live} onCreated={() => setRootTab('Events')} />}
      {rootTab === 'Notifications' && <Notifications event={event} api={api} live={live} />}
      {rootTab === 'Profile' && <Profile displayName={displayName} authMode={authMode} live={live} onSignOut={onSignOut} />}
      <RootNav selected={rootTab} onSelect={setRootTab} />
    </View>
  </SafeAreaView></SafeAreaProvider>;
}

function Header({ title, live }: { title: string; live: boolean }) {
  return <View style={styles.header}><View><Text style={styles.brand}>ALLTOGETHER</Text><Text numberOfLines={1} style={styles.headerTitle}>{title}</Text></View><View style={[styles.status, live ? styles.statusLive : styles.statusDemo]}><Text style={styles.statusText}>{live ? 'LIVE' : 'DEMO'}</Text></View></View>;
}

function RootNav({ selected, onSelect }: { selected: RootTab; onSelect: (t: RootTab) => void }) {
  const tabs: RootTab[] = ['Home','Events','Create','Notifications','Profile'];
  return <View style={styles.rootNav}>{tabs.map(t => <Pressable accessibilityRole="button" key={t} style={styles.navItem} onPress={() => onSelect(t)}><Text style={[styles.navText, selected === t && styles.navSelected]}>{t}</Text></Pressable>)}</View>;
}

function Home({ event, onOpen, syncNote }: { event: Event; onOpen: () => void; syncNote: string }) {
  const pendingHousehold = event.households.find(h => h.rsvp === 'pending' || h.rsvp === 'maybe');
  const openTasks = event.tasks.filter(t => !t.complete).length;
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>Family plans, all in one place.</Text><Text style={styles.hero}>What needs your attention?</Text>
    <Text style={styles.note}>{syncNote}</Text>
    <View style={styles.attentionRow}><MiniStat value={pendingHousehold ? '1' : '0'} label="RSVP" /><MiniStat value={String(event.polls.length)} label="Polls" /><MiniStat value={String(openTasks)} label="Tasks" /></View>
    <Text style={styles.section}>Upcoming event</Text>
    <Pressable accessibilityRole="button" style={styles.eventCard} onPress={onOpen}><Text style={styles.eventType}>{event.type}</Text><Text style={[styles.cardTitle,{color:'white'}]}>{event.title}</Text><Text style={styles.eventBody}>{event.dates}</Text><Text style={styles.eventBody}>{event.location}</Text><View style={styles.chip}><Text style={styles.chipText}>{roleLabel(event.role)}</Text></View></Pressable>
    {pendingHousehold && <Card title="Household RSVP needs attention"><Text style={styles.body}>{pendingHousehold.name} is still marked {pendingHousehold.rsvp}.</Text></Card>}
    <Card title="Next up"><Text style={styles.body}>{event.schedule[0]?.day} · {event.schedule[0]?.time}</Text><Text style={styles.cardTitle}>{event.schedule[0]?.title}</Text></Card>
  </ScrollView>;
}

function EventScreen({ event, tab, setTab, updateHousehold, api, live, syncEvent }: { event: Event; tab: EventTab; setTab: (t: EventTab) => void; updateHousehold: (id: string, s: RsvpStatus) => void; api: AllTogetherApiClient; live: boolean; syncEvent: () => Promise<void> }) {
  const tabs: EventTab[] = ['Overview','Schedule','People','Polls','Expenses','Photos','Chat'];
  return <View style={{flex:1}}><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventTabs} contentContainerStyle={styles.eventTabsContent}>{tabs.map(t => <Pressable accessibilityRole="button" key={t} onPress={() => setTab(t)} style={[styles.eventTab, tab === t && styles.eventTabActive]}><Text style={[styles.eventTabText, tab === t && styles.eventTabTextActive]}>{t}</Text></Pressable>)}</ScrollView>
    {tab === 'Overview' && <Overview event={event} />}
    {tab === 'Schedule' && <Schedule event={event} />}
    {tab === 'People' && <People event={event} updateHousehold={updateHousehold} />}
    {tab === 'Polls' && <Polls event={event} api={api} live={live} syncEvent={syncEvent} />}
    {tab === 'Expenses' && <Expenses event={event} />}
    {tab === 'Photos' && <Photos event={event} />}
    {tab === 'Chat' && <Chat event={event} api={api} live={live} syncEvent={syncEvent} />}
  </View>;
}

function Overview({ event }: { event: Event }) {
  const openMap = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`);
  return <ScrollView contentContainerStyle={styles.content}><Text style={styles.hero}>{event.title}</Text><Text style={styles.body}>{event.description}</Text>
    <Card title="Event details"><Text style={styles.body}>{event.dates}</Text><Text style={styles.body}>{event.location}</Text><View style={styles.mapPreview}><Text style={styles.mapPin}>⌖</Text><Text style={styles.body}>Optional map preview · {event.location}</Text></View><Pressable accessibilityRole="link" onPress={openMap}><Text style={styles.link}>Open in Google Maps</Text></Pressable></Card>
    <Card title="Household RSVP"><Text style={styles.bigStat}>{event.households.filter(h => h.rsvp === 'yes').length}/{event.households.length}</Text><Text style={styles.body}>households confirmed</Text></Card>
    <Card title="Organizer checklist">{event.tasks.map(t => <Text key={t.id} style={styles.body}>{t.complete ? '✓' : '○'} {t.title} — {t.assignee}</Text>)}</Card>
  </ScrollView>;
}

function Schedule({ event }: { event: Event }) {
  return <ScrollView contentContainerStyle={styles.content}>{event.schedule.map(s => <Card key={s.id} title={`${s.day} · ${s.time}`}><Text style={styles.cardTitle}>{s.title}</Text><Text style={styles.body}>{s.location}</Text>{s.notes && <Text style={styles.note}>{s.notes}</Text>}{s.optionalRsvp && <View style={styles.chip}><Text style={styles.chipText}>Activity RSVP available</Text></View>}</Card>)}</ScrollView>;
}

function People({ event, updateHousehold }: { event: Event; updateHousehold: (id: string, s: RsvpStatus) => void }) {
  return <ScrollView contentContainerStyle={styles.content}><Text style={styles.hero}>Household RSVP</Text><Text style={styles.body}>One adult can manage attendance for everyone in their household, including children and guests without accounts.</Text>{event.households.map(h => <HouseholdCard key={h.id} household={h} onRsvp={(s) => updateHousehold(h.id,s)} />)}</ScrollView>;
}

function HouseholdCard({ household, onRsvp }: { household: Household; onRsvp: (s: RsvpStatus) => void }) {
  return <Card title={household.name}><Text style={styles.body}>Managed by {household.managerName}</Text>{household.members.map(m => <Text key={m.id} style={styles.body}>• {m.name}{m.accountUserId ? ' · account' : ''}</Text>)}<View style={styles.buttonRow}>{(['yes','maybe','no'] as RsvpStatus[]).map(s => <Pressable accessibilityRole="button" key={s} onPress={() => onRsvp(s)} style={[styles.smallButton, household.rsvp === s && styles.smallButtonActive]}><Text style={household.rsvp === s ? styles.smallButtonTextActive : styles.smallButtonText}>{s.toUpperCase()}</Text></Pressable>)}</View></Card>;
}

function Polls({ event, api, live, syncEvent }: { event: Event; api: AllTogetherApiClient; live: boolean; syncEvent: () => Promise<void> }) {
  const [selections, setSelections] = useState<Record<string,string[]>>({});
  const vote = async (pollId: string, mode: 'single'|'multiple', optionId: string) => {
    const selected = nextPollSelection(mode, selections[pollId] ?? [], optionId);
    setSelections(current => ({ ...current, [pollId]: selected }));
    if (live) { try { await api.vote(pollId, selected); await syncEvent(); } catch { Alert.alert('Vote not saved'); } }
  };
  return <ScrollView contentContainerStyle={styles.content}>{event.polls.map(p => <Card key={p.id} title={p.question}><Text style={styles.note}>{p.mode === 'single' ? 'Choose one' : 'Choose all that apply'}{p.closesAt ? ` · closes ${p.closesAt}` : ''}</Text>{p.options.map(o => { const selected = (selections[p.id] ?? []).includes(o.id); return <Pressable accessibilityRole="button" key={o.id} style={[styles.pollRow, selected && styles.pollSelected]} onPress={() => vote(p.id,p.mode,o.id)}><Text style={styles.body}>{selected ? '✓ ' : '○ '}{o.label}</Text><Text style={styles.body}>{o.votes}</Text></Pressable>; })}</Card>)}</ScrollView>;
}

function Expenses({ event }: { event: Event }) {
  const outstanding = useMemo(() => event.expenses.filter(e => !e.settled).reduce((sum,e) => sum + e.amount,0), [event]);
  return <ScrollView contentContainerStyle={styles.content}><Card title="Track, split, settle"><Text style={styles.bigStat}>${outstanding.toFixed(2)}</Text><Text style={styles.body}>currently unsettled. AllTogether records who paid, equal/selected/custom shares, and settlement status. It never moves money.</Text></Card>{event.expenses.map(e => <Card key={e.id} title={e.title}><Text style={styles.cardTitle}>${e.amount.toFixed(2)}</Text><Text style={styles.body}>Paid by {e.payer}</Text><Text style={styles.body}>Split: {e.splitMode} · {e.participants.join(', ')}</Text><Text style={[styles.body,{color:e.settled?colors.green:colors.terracotta,fontWeight:'800'}]}>{e.settled?'Settled':'Unsettled'}</Text></Card>)}</ScrollView>;
}

function Photos({ event }: { event: Event }) {
  const [pickedUri,setPickedUri] = useState<string | null>(null);
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    if (!result.canceled) setPickedUri(result.assets[0]?.uri ?? null);
  };
  return <ScrollView contentContainerStyle={styles.content}><Text style={styles.body}>Shared event album · organizers can moderate uploads. Cloudinary signing activates when credentials are added.</Text><Pressable accessibilityRole="button" style={styles.primary} onPress={pick}><Text style={styles.primaryText}>Add Photo</Text></Pressable>{pickedUri && <Image source={{uri:pickedUri}} style={styles.pickedPhoto} />}<View style={styles.photoGrid}>{event.photos.map(p => <View key={p.id} style={styles.photo}><Text style={styles.photoMark}>◎</Text><Text style={styles.cardTitle}>{p.title}</Text><Text style={styles.note}>{p.placeholder}</Text><Text style={styles.note}>by {p.uploader}</Text></View>)}</View></ScrollView>;
}

function Chat({ event, api, live, syncEvent }: { event: Event; api: AllTogetherApiClient; live: boolean; syncEvent: () => Promise<void> }) {
  const [text,setText] = useState('');
  const send = async () => {
    const trimmed = text.trim(); if (!trimmed) return; setText('');
    if (live) { try { await api.postMessage(event.id, trimmed); await syncEvent(); } catch { Alert.alert('Message not sent'); } }
  };
  return <View style={{flex:1}}><ScrollView contentContainerStyle={styles.content}>{event.chat.map(m => <View key={m.id} style={styles.message}><Text style={styles.messageSender}>{m.sender} · {m.time}</Text><Text style={styles.body}>{m.text}</Text></View>)}</ScrollView><View style={styles.composer}><TextInput value={text} onChangeText={setText} placeholder="Message the family…" style={styles.input} accessibilityLabel="Family chat message"/><Pressable accessibilityRole="button" style={styles.send} onPress={send}><Text style={styles.sendText}>Send</Text></Pressable></View></View>;
}

function CreateEvent({ api, live, onCreated }: { api: AllTogetherApiClient; live: boolean; onCreated: () => void }) {
  const [title,setTitle] = useState(''); const [location,setLocation] = useState(''); const [type,setType] = useState('Family Reunion'); const [saving,setSaving] = useState(false);
  const create = async () => {
    if (!title.trim() || !location.trim()) return Alert.alert('Add an event name and location');
    if (!live) return Alert.alert('Live API required','Event creation is demonstrated in the UI, but persistence activates after the API URL is configured.');
    setSaving(true);
    try {
      await api.createEvent({ title: title.trim(), type, locationName: location.trim(), startsAt: '2027-08-01T10:00:00-04:00', endsAt: '2027-08-01T18:00:00-04:00' });
      Alert.alert('Private event created','An organizer membership and invite code were created automatically.'); onCreated();
    } catch (error) { Alert.alert('Could not create event', error instanceof Error ? error.message : 'Unknown error'); }
    finally { setSaving(false); }
  };
  const categories = ['Family Reunion','Birthday','Holiday','Vacation','Graduation','Celebration','Custom'];
  return <ScrollView contentContainerStyle={styles.content}><Text style={styles.hero}>Create an event</Text><Text style={styles.body}>Private by default. Invite family by link, code, email, or your phone’s share sheet.</Text><TextInput style={styles.field} value={title} onChangeText={setTitle} placeholder="Event name"/><TextInput style={styles.field} value={location} onChangeText={setLocation} placeholder="Location"/><Text style={styles.section}>Event type</Text><View style={styles.wrap}>{categories.map(c => <Pressable key={c} style={[styles.listPill,type===c&&styles.listPillActive]} onPress={() => setType(c)}><Text style={[styles.body,type===c&&{color:'white'}]}>{c}</Text></Pressable>)}</View><Pressable accessibilityRole="button" disabled={saving} style={styles.primary} onPress={create}><Text style={styles.primaryText}>{saving?'Creating…':'Create Private Event'}</Text></Pressable></ScrollView>;
}

function Notifications({ event, api, live }: { event: Event; api: AllTogetherApiClient; live: boolean }) {
  const [remote,setRemote] = useState<Array<{id:string;title:string;body:string}>>([]);
  useEffect(() => { if (live) api.notifications<{notifications:Array<{id:string;title:string;body:string}>}>().then(r=>setRemote(r.notifications)).catch(()=>{}); }, [api,live]);
  return <ScrollView contentContainerStyle={styles.content}>{remote.length ? remote.map(n => <Card key={n.id} title={n.title}><Text style={styles.body}>{n.body}</Text></Card>) : <><Card title="RSVP reminder"><Text style={styles.body}>A household hasn’t finalized attendance.</Text></Card><Card title="Poll closing"><Text style={styles.body}>{event.polls[0]?.question}</Text></Card><Card title="Task due"><Text style={styles.body}>{event.tasks.find(t=>!t.complete)?.title}</Text></Card><Card title="Upcoming activity"><Text style={styles.body}>{event.schedule[0]?.title} · {event.schedule[0]?.time}</Text></Card></>}</ScrollView>;
}

function Profile({ displayName, authMode, live, onSignOut }: { displayName: string; authMode: string; live: boolean; onSignOut: () => Promise<void> | void }) {
  return <ScrollView contentContainerStyle={styles.content}><Text style={styles.hero}>{displayName}</Text><Card title="Family groups"><Text style={styles.body}>Carter Family · Co-organizer</Text><Text style={styles.body}>Multiple family groups are supported by the database model.</Text></Card><Card title="Accessibility"><Text style={styles.body}>Large touch targets, simple navigation, high contrast, scalable readable text, and minimal nesting are explicit product requirements.</Text></Card><Card title="Authentication"><Text style={styles.body}>{authMode}</Text><Text style={styles.note}>Guest invite previews are public. RSVP, voting, chat, photos, tasks and expenses require authentication.</Text></Card><Card title="Connectivity"><Text style={[styles.body,{color:live?colors.green:colors.terracotta,fontWeight:'800'}]}>{live?'Neon API connected':'Seeded offline demo'}</Text></Card><Pressable accessibilityRole="button" style={styles.secondary} onPress={() => onSignOut()}><Text style={styles.secondaryText}>Sign Out</Text></Pressable></ScrollView>;
}

function Card({ title, children }: { title: string; children: ReactNode }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>; }
function MiniStat({ value, label }: { value: string; label: string }) { return <View style={styles.miniStat}><Text style={styles.bigStat}>{value}</Text><Text style={styles.note}>{label}</Text></View>; }
function roleLabel(role: Event['role']) { return role.split('-').map(w => w[0]?.toUpperCase()+w.slice(1)).join(' '); }

function mapBundle(bundle: any, fallback: Event): Event {
  const e = bundle?.event;
  if (!e) return fallback;
  const date = (value: string) => new Date(value);
  const fmtDay = (value: string) => date(value).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
  const fmtTime = (value: string) => date(value).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
  return {
    ...fallback,
    id: e.id,
    title: e.title,
    type: e.type,
    dates: `${date(e.startsAt).toLocaleDateString()} – ${date(e.endsAt).toLocaleDateString()}`,
    location: e.locationName,
    description: e.description,
    role: bundle.membership?.role ?? fallback.role,
    households: (bundle.households ?? []).map((h: any) => ({ id:h.id, name:h.name, managerName: fallback.households.find(x=>x.name===h.name)?.managerName ?? 'Household manager', rsvp:h.rsvp, members:(h.people ?? []).map((p:any)=>({id:p.id,name:p.name,ageGroup:p.ageGroup,accountUserId:p.linkedUserId ?? undefined})) })),
    schedule: (bundle.schedule ?? []).map((s:any)=>({id:s.id,day:fmtDay(s.startsAt),time:fmtTime(s.startsAt),title:s.title,location:s.locationName,notes:s.notes ?? undefined,optionalRsvp:s.optionalRsvp})),
    polls: (bundle.polls ?? []).map((p:any)=>({id:p.id,question:p.question,mode:p.mode,closesAt:p.closesAt?date(p.closesAt).toLocaleDateString():undefined,options:(p.options??[]).map((o:any)=>({id:o.id,label:o.label,votes:o.votes??0}))})),
    expenses: (bundle.expenses ?? []).map((x:any)=>({id:x.id,title:x.title,payer:fallback.expenses.find(y=>y.title===x.title)?.payer ?? 'Family member',amount:Number(x.amount),splitMode:x.splitMode,participants:fallback.expenses.find(y=>y.title===x.title)?.participants ?? (x.shares??[]).map((_:any,i:number)=>`Member ${i+1}`),settled:x.settled})),
    tasks: (bundle.tasks ?? []).map((t:any)=>({id:t.id,title:t.title,assignee:fallback.tasks.find(x=>x.title===t.title)?.assignee ?? 'Family member',due:t.dueAt?date(t.dueAt).toLocaleDateString():'No due date',complete:t.complete})),
    chat: (bundle.chat ?? []).map((m:any)=>({id:m.id,sender:m.senderName ?? 'Family member',text:m.body,time:fmtTime(m.createdAt)})),
    photos: fallback.photos,
  };
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.cream}, center:{flex:1,backgroundColor:colors.cream,alignItems:'center',justifyContent:'center',gap:14,padding:24}, authScreen:{flex:1,backgroundColor:colors.cream,justifyContent:'center',padding:28,gap:18}, app:{flex:1,backgroundColor:colors.cream}, header:{minHeight:72,paddingHorizontal:20,paddingTop:8,paddingBottom:12,borderBottomWidth:1,borderColor:colors.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}, brand:{fontWeight:'900',letterSpacing:2,color:colors.terracotta,fontSize:12}, headerTitle:{fontSize:21,fontWeight:'800',color:colors.ink,marginTop:2,maxWidth:280}, status:{borderRadius:999,paddingHorizontal:9,paddingVertical:5},statusLive:{backgroundColor:'#DDEBDF'},statusDemo:{backgroundColor:'#F7E2C2'},statusText:{fontSize:10,fontWeight:'900',color:colors.ink}, content:{padding:20,gap:14,paddingBottom:110}, hero:{fontSize:30,lineHeight:36,fontWeight:'900',color:colors.ink}, eyebrow:{fontSize:15,fontWeight:'800',color:colors.terracotta}, section:{fontSize:19,fontWeight:'800',color:colors.ink,marginTop:6}, body:{fontSize:16,lineHeight:23,color:colors.ink}, eventBody:{fontSize:16,lineHeight:23,color:'white'}, note:{fontSize:14,lineHeight:20,color:colors.muted}, card:{backgroundColor:colors.paper,borderRadius:20,padding:18,gap:8,borderWidth:1,borderColor:colors.line}, eventCard:{backgroundColor:colors.terracotta,borderRadius:24,padding:20,gap:7,minHeight:170}, eventType:{fontSize:13,fontWeight:'800',color:'#FFE8DC',textTransform:'uppercase'}, cardTitle:{fontSize:18,fontWeight:'800',color:colors.ink}, chip:{alignSelf:'flex-start',backgroundColor:'#FFF1D0',paddingHorizontal:10,paddingVertical:5,borderRadius:999,marginTop:6},chipText:{fontWeight:'800',color:'#624700'},attentionRow:{flexDirection:'row',gap:10},miniStat:{flex:1,backgroundColor:colors.paper,borderRadius:18,padding:14,borderWidth:1,borderColor:colors.line,minHeight:86},bigStat:{fontSize:27,fontWeight:'900',color:colors.terracotta},rootNav:{position:'absolute',left:0,right:0,bottom:0,flexDirection:'row',backgroundColor:colors.paper,borderTopWidth:1,borderColor:colors.line,paddingVertical:8},navItem:{flex:1,alignItems:'center',justifyContent:'center',minHeight:52},navText:{fontSize:12,color:colors.muted,fontWeight:'700'},navSelected:{color:colors.terracotta},eventTabs:{maxHeight:58,backgroundColor:colors.cream,paddingVertical:8},eventTabsContent:{gap:8,paddingHorizontal:16},eventTab:{paddingHorizontal:14,paddingVertical:10,borderRadius:999,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line,minHeight:44},eventTabActive:{backgroundColor:colors.terracotta,borderColor:colors.terracotta},eventTabText:{fontWeight:'700',color:colors.ink},eventTabTextActive:{color:'white'},link:{fontSize:16,fontWeight:'800',color:colors.terracotta,paddingVertical:8},mapPreview:{minHeight:92,borderRadius:16,backgroundColor:'#F3E8D7',padding:16,justifyContent:'center',alignItems:'center',gap:4},mapPin:{fontSize:28,color:colors.terracotta},buttonRow:{flexDirection:'row',gap:8,marginTop:8,flexWrap:'wrap'},smallButton:{paddingHorizontal:15,paddingVertical:11,borderRadius:12,borderWidth:1,borderColor:colors.line,minHeight:46,justifyContent:'center'},smallButtonActive:{backgroundColor:colors.terracotta,borderColor:colors.terracotta},smallButtonText:{fontWeight:'800',color:colors.ink},smallButtonTextActive:{fontWeight:'800',color:'white'},pollRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,paddingHorizontal:8,borderRadius:12,minHeight:48},pollSelected:{backgroundColor:'#FFF1D0'},photoGrid:{gap:12},photo:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line,borderRadius:18,padding:16,minHeight:130},photoMark:{fontSize:32,color:colors.gold},pickedPhoto:{width:'100%',height:220,borderRadius:18},message:{alignSelf:'stretch',backgroundColor:colors.paper,borderRadius:18,padding:14,borderWidth:1,borderColor:colors.line,gap:4},messageSender:{fontSize:13,fontWeight:'800',color:colors.terracotta},composer:{flexDirection:'row',gap:8,padding:12,borderTopWidth:1,borderColor:colors.line,backgroundColor:colors.paper},input:{flex:1,borderWidth:1,borderColor:colors.line,borderRadius:14,paddingHorizontal:14,minHeight:50,fontSize:16,backgroundColor:'white'},send:{backgroundColor:colors.terracotta,borderRadius:14,paddingHorizontal:18,alignItems:'center',justifyContent:'center',minHeight:50},sendText:{color:'white',fontWeight:'900'},field:{backgroundColor:'white',borderWidth:1,borderColor:colors.line,borderRadius:14,minHeight:52,paddingHorizontal:15,fontSize:16},listPill:{paddingHorizontal:14,paddingVertical:10,borderWidth:1,borderColor:colors.line,borderRadius:999,backgroundColor:colors.paper},listPillActive:{backgroundColor:colors.terracotta,borderColor:colors.terracotta},wrap:{flexDirection:'row',flexWrap:'wrap',gap:8},primary:{backgroundColor:colors.terracotta,borderRadius:15,minHeight:54,alignItems:'center',justifyContent:'center',paddingHorizontal:18},primaryText:{color:'white',fontSize:16,fontWeight:'900'},secondary:{borderWidth:1,borderColor:colors.terracotta,borderRadius:15,minHeight:54,alignItems:'center',justifyContent:'center',paddingHorizontal:18},secondaryText:{color:colors.terracotta,fontSize:16,fontWeight:'900'}
});
