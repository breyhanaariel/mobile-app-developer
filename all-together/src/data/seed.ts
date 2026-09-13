import type { Event } from '../types';

export const carterReunion: Event = {
  id: 'carter-reunion-2027',
  title: 'The Carter Family Reunion 2027',
  type: 'Family Reunion',
  dates: 'July 16–18, 2027',
  location: 'St. Petersburg, Florida',
  description: 'Three days of family time, food, games, photos, and memories by the bay.',
  role: 'organizer',
  households: [
    { id: 'h1', name: 'Brianna’s Household', managerName: 'Brianna Carter', rsvp: 'yes', members: [
      { id: 'p1', name: 'Brianna Carter', ageGroup: 'adult', accountUserId: 'u1' },
      { id: 'p2', name: 'Ava Carter', ageGroup: 'child' },
    ]},
    { id: 'h2', name: 'Aunt Denise’s Household', managerName: 'Denise Carter', rsvp: 'maybe', members: [
      { id: 'p3', name: 'Denise Carter', ageGroup: 'adult', accountUserId: 'u2' },
      { id: 'p4', name: 'Marcus Carter', ageGroup: 'adult' },
      { id: 'p5', name: 'Jaylen Carter', ageGroup: 'child' },
    ]},
    { id: 'h3', name: 'Grandma Evelyn’s Household', managerName: 'Evelyn Carter', rsvp: 'yes', members: [
      { id: 'p6', name: 'Evelyn Carter', ageGroup: 'adult', accountUserId: 'u3' },
    ]},
  ],
  schedule: [
    { id: 's1', day: 'Friday', time: '5:30 PM', title: 'Welcome Cookout', location: 'Vinoy Park', notes: 'Wear reunion shirts if you have them.' },
    { id: 's2', day: 'Saturday', time: '10:00 AM', title: 'Family Games + Kids Zone', location: 'North Shore Park', optionalRsvp: true },
    { id: 's3', day: 'Saturday', time: '6:30 PM', title: 'Family Dinner', location: 'Sunken Gardens Event Hall' },
    { id: 's4', day: 'Sunday', time: '11:00 AM', title: 'Farewell Brunch', location: 'Downtown St. Pete' },
  ],
  polls: [
    { id: 'poll1', question: 'Which reunion shirt color should we order?', mode: 'single', options: [
      { id: 'o1', label: 'Terracotta', votes: 12 },
      { id: 'o2', label: 'Golden Yellow', votes: 8 },
      { id: 'o3', label: 'Cream', votes: 4 },
    ], closesAt: 'May 15, 2027' },
    { id: 'poll2', question: 'Which activities should be included Saturday?', mode: 'multiple', options: [
      { id: 'o4', label: 'Family trivia', votes: 18 },
      { id: 'o5', label: 'Relay races', votes: 13 },
      { id: 'o6', label: 'Photo booth', votes: 21 },
    ]},
  ],
  expenses: [
    { id: 'e1', title: 'Park pavilion deposit', payer: 'Brianna Carter', amount: 180, splitMode: 'equal', participants: ['Brianna', 'Denise', 'Marcus', 'Evelyn'], settled: false },
    { id: 'e2', title: 'Welcome cookout groceries', payer: 'Denise Carter', amount: 246.37, splitMode: 'selected', participants: ['Brianna', 'Denise', 'Marcus'], settled: false },
    { id: 'e3', title: 'Photo booth', payer: 'Marcus Carter', amount: 325, splitMode: 'custom', participants: ['Brianna', 'Denise', 'Marcus', 'Evelyn'], settled: true },
  ],
  tasks: [
    { id: 't1', title: 'Confirm pavilion reservation', assignee: 'Brianna Carter', due: 'Apr 20', complete: true },
    { id: 't2', title: 'Collect shirt sizes', assignee: 'Denise Carter', due: 'May 10', complete: false },
    { id: 't3', title: 'Create family trivia questions', assignee: 'Marcus Carter', due: 'Jun 15', complete: false },
  ],
  chat: [
    { id: 'c1', sender: 'Denise', text: 'I added the grocery estimate for Friday night.', time: '9:14 AM' },
    { id: 'c2', sender: 'Evelyn', text: 'Please make sure we save time for the big family photo!', time: '10:02 AM' },
    { id: 'c3', sender: 'Brianna', text: 'Absolutely. I added it to Saturday before dinner.', time: '10:17 AM' },
  ],
  photos: [
    { id: 'ph1', title: 'Carter Reunion 2025', uploader: 'Denise', placeholder: 'Family picnic memory' },
    { id: 'ph2', title: 'Grandma Evelyn + grandkids', uploader: 'Brianna', placeholder: 'Family portrait memory' },
    { id: 'ph3', title: 'Cousins table', uploader: 'Marcus', placeholder: 'Dinner memory' },
  ],
};
