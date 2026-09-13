export type Role = 'organizer' | 'co-organizer' | 'family-member' | 'guest';
export type RsvpStatus = 'yes' | 'no' | 'maybe' | 'pending';

export type Person = { id: string; name: string; ageGroup?: 'adult' | 'child'; accountUserId?: string; attending?: boolean | null };
export type Household = { id: string; name: string; managerName: string; members: Person[]; rsvp: RsvpStatus };
export type ScheduleItem = { id: string; day: string; time: string; title: string; location: string; notes?: string; optionalRsvp?: boolean };
export type Poll = { id: string; question: string; mode: 'single' | 'multiple'; options: { id: string; label: string; votes: number }[]; closesAt?: string };
export type ExpenseShare = { id: string; userId: string; label: string; amount: number; settled: boolean };
export type Expense = { id: string; title: string; payer: string; amount: number; splitMode: 'equal' | 'selected' | 'custom'; participants: string[]; settled: boolean; shares?: ExpenseShare[] };
export type Task = { id: string; title: string; assignee: string; due: string; complete: boolean };
export type ChatMessage = { id: string; sender: string; text: string; time: string };
export type Photo = { id: string; title: string; uploader: string; placeholder: string; uri?: string };
export type Event = {
  id: string;
  title: string;
  type: string;
  dates: string;
  location: string;
  description: string;
  role: Role;
  households: Household[];
  schedule: ScheduleItem[];
  polls: Poll[];
  expenses: Expense[];
  tasks: Task[];
  chat: ChatMessage[];
  photos: Photo[];
};
