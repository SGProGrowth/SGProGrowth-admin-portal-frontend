import type {
  ActivityItem,
  EntityDef,
  MessageItem,
  NavGroup,
  Quote,
} from './types';

/* Motivational / educational quotes shown across the panel */
export const quotes: Quote[] = [
  { text: 'Coaching before you learn, clarity before you certify.', author: 'SG Pro Growth' },
  { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
  { text: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
  { text: 'Train people well enough so they can leave, treat them well enough so they don\u2019t want to.', author: 'Richard Branson' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin' },
  { text: 'Learning never exhausts the mind.', author: 'Leonardo da Vinci' },
  { text: 'Right guidance turns potential into performance.', author: 'SG Pro Growth' },
];

const img = (id: string, crop?: string) =>
  `https://images.unsplash.com/photo-${id}?w=460&h=300&fit=crop${crop ? '&crop=' + crop : ''}`;

export const INSTRUCTORS = ['Mahesh MD', 'Shah Kanchi', 'Vartika Mehta', 'Kanchi Shah'];

export const COURSE_NAMES = [
  'Microsoft Excel Advanced Excel Formulas & Functions',
  'Power BI Masterclass - DAX, Excel And More',
  'Unconscious bias training',
  'Color therapy 1',
  'Demo Course',
  'IT Project Management',
  'BNI-Trainers and Coaches Power team',
];

/* Entity definitions — schema (fields) + seed data. Mirrors WP + WPLMS admin. */
export const entities: Record<string, EntityDef> = {
  courses: {
    key: 'courses',
    label: 'Courses', singular: 'Course', icon: 'book-open', group: 'learning', view: 'cards',
    fields: [
      { key: 'title', label: 'Course Title', type: 'text', required: true },
      { key: 'instructor', label: 'Instructor', type: 'select', options: INSTRUCTORS },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['published', 'pending', 'draft'] },
      { key: 'students', label: 'Students', type: 'number' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'completion', label: 'Completion %', type: 'number' },
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'reviews', label: 'Reviews', type: 'number' },
      { key: 'price', label: 'Price (\u20b9)', type: 'number' },
      { key: 'image', label: 'Image URL', type: 'text' },
    ],
    seed: [
      { id: 801, title: COURSE_NAMES[0], instructor: 'Shah Kanchi', category: 'Data Analysis', status: 'published', students: 57, duration: '57 hrs', completion: 100, rating: 5, reviews: 2, price: 0, image: img('1504384308090-c894fdcc538d') },
      { id: 802, title: COURSE_NAMES[1], instructor: 'Mahesh MD', category: 'Office Productivity', status: 'published', students: 2, duration: '2 hrs', completion: 0, rating: 0, reviews: 0, price: 0, image: img('1551288049-bebda4e38f71') },
      { id: 803, title: COURSE_NAMES[2], instructor: 'Kanchi Shah', category: 'Unconscious Bias', status: 'published', students: 21, duration: '21 hrs', completion: 0, rating: 0, reviews: 0, price: 0, image: img('1573497161161-c3e73707e25c') },
      { id: 804, title: COURSE_NAMES[3], instructor: 'Vartika Mehta', category: 'Color Therapy', status: 'published', students: 0, duration: '0 hrs', completion: 100, rating: 0, reviews: 0, price: 0, image: img('1526374965328-7f61d4dc18c5') },
      { id: 805, title: COURSE_NAMES[4], instructor: 'Kanchi Shah', category: 'Demo', status: 'draft', students: 0, duration: '0 hrs', completion: 0, rating: 0, reviews: 0, price: 0, image: img('1531482615713-2afd69097998') },
      { id: 822, title: COURSE_NAMES[5], instructor: 'Mahesh MD', category: 'Project Management', status: 'published', students: 3, duration: '3 hrs', completion: 15, rating: 0, reviews: 0, price: 108, image: img('1504384308090-c894fdcc538d', 'right') },
      { id: 830, title: COURSE_NAMES[6], instructor: 'Mahesh MD', category: 'Business Networking', status: 'pending', students: 4, duration: '4 hrs', completion: 50, rating: 0, reviews: 0, price: 0, image: img('1522202176988-66273c2fd55f') },
    ],
  },

  quizzes: {
    key: 'quizzes',
    label: 'Quizzes', singular: 'Quiz', icon: 'help-circle', group: 'learning',
    columns: ['title', 'course', 'questions', 'attempts', 'avgScore', 'passmark'],
    fields: [
      { key: 'title', label: 'Quiz Title', type: 'text', required: true },
      { key: 'course', label: 'Course', type: 'select', options: COURSE_NAMES },
      { key: 'questions', label: 'Questions', type: 'number' },
      { key: 'attempts', label: 'Attempts', type: 'number' },
      { key: 'avgScore', label: 'Avg Score %', type: 'number' },
      { key: 'passmark', label: 'Pass Mark %', type: 'number' },
    ],
    seed: [
      { id: 1, title: 'PM Fundamentals Quiz', course: COURSE_NAMES[5], questions: 15, attempts: 42, avgScore: 78, passmark: 60 },
      { id: 2, title: 'Excel Formulas Assessment', course: COURSE_NAMES[0], questions: 20, attempts: 31, avgScore: 85, passmark: 70 },
    ],
  },

  questions: {
    key: 'questions',
    label: 'Questions', singular: 'Question', icon: 'edit', group: 'learning',
    columns: ['text', 'quiz', 'type', 'points'],
    fields: [
      { key: 'text', label: 'Question', type: 'textarea', required: true },
      { key: 'quiz', label: 'Quiz', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: ['MCQ', 'True/False', 'Essay', 'Fill in the blank'] },
      { key: 'points', label: 'Points', type: 'number' },
    ],
    seed: [
      { id: 1, text: 'What is the critical path in project management?', quiz: 'PM Fundamentals Quiz', type: 'MCQ', points: 5 },
      { id: 2, text: 'Explain the difference between VLOOKUP and XLOOKUP.', quiz: 'Excel Formulas Assessment', type: 'Essay', points: 10 },
    ],
  },

  assignments: {
    key: 'assignments',
    label: 'Assignments', singular: 'Assignment', icon: 'clipboard', group: 'learning',
    columns: ['title', 'course', 'due', 'submissions', 'status'],
    fields: [
      { key: 'title', label: 'Assignment Title', type: 'text', required: true },
      { key: 'course', label: 'Course', type: 'select', options: COURSE_NAMES },
      { key: 'due', label: 'Due Date', type: 'date' },
      { key: 'submissions', label: 'Submissions', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'draft', 'closed'] },
    ],
    seed: [
      { id: 1, title: 'Create a Project Charter', course: COURSE_NAMES[5], due: '2026-03-15', submissions: 12, status: 'active' },
      { id: 2, title: 'Build a Dashboard', course: COURSE_NAMES[0], due: '2026-03-20', submissions: 28, status: 'active' },
    ],
  },

  students: {
    key: 'students',
    label: 'Students', singular: 'Student', icon: 'users', group: 'people',
    columns: ['name', 'email', 'courses', 'progress', 'joined'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'courses', label: 'Courses', type: 'number' },
      { key: 'progress', label: 'Progress %', type: 'number' },
      { key: 'joined', label: 'Joined', type: 'date' },
    ],
    seed: [
      { id: 1, name: 'Neha Sharma', email: 'neha.s@email.com', courses: 3, progress: 68, joined: '2025-08-12' },
      { id: 2, name: 'Riya Patel', email: 'riya.p@email.com', courses: 2, progress: 45, joined: '2025-09-03' },
      { id: 3, name: 'Ankit Verma', email: 'ankit.v@email.com', courses: 1, progress: 90, joined: '2025-10-21' },
      { id: 4, name: 'Kanchi S', email: 'kanchiss23@gmail.com', courses: 2, progress: 55, joined: '2025-11-05' },
    ],
  },

  instructors: {
    key: 'instructors',
    label: 'Instructors', singular: 'Instructor', icon: 'award', group: 'people',
    columns: ['name', 'email', 'role', 'courses', 'students', 'commission'],
    promote: { field: 'role', from: 'Instructor', to: 'Admin', label: 'Make Admin', revertLabel: 'Revoke Admin' },
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'role', label: 'Role', type: 'select', options: ['Instructor', 'Admin'] },
      { key: 'courses', label: 'Courses', type: 'number' },
      { key: 'students', label: 'Students', type: 'number' },
      { key: 'commission', label: 'Commission %', type: 'number' },
    ],
    seed: [
      { id: 1, name: 'Mahesh MD', email: 'maheshmd@sharvagroup.com', role: 'Admin', courses: 3, students: 9, commission: 70 },
      { id: 2, name: 'Shah Kanchi', email: 'shah.k@sharvagroup.com', role: 'Instructor', courses: 1, students: 57, commission: 65 },
      { id: 3, name: 'Vartika Mehta', email: 'vartika@sharvagroup.com', role: 'Instructor', courses: 1, students: 0, commission: 60 },
    ],
  },

  groups: {
    key: 'groups',
    label: 'Groups', singular: 'Group', icon: 'users', group: 'people',
    columns: ['name', 'members', 'privacy'],
    fields: [
      { key: 'name', label: 'Group Name', type: 'text', required: true },
      { key: 'members', label: 'Members', type: 'number' },
      { key: 'privacy', label: 'Privacy', type: 'select', options: ['Public', 'Private', 'Hidden'] },
    ],
    seed: [
      { id: 1, name: 'BNI Power Team', members: 4, privacy: 'Private' },
      { id: 2, name: 'Excel Learners', members: 31, privacy: 'Public' },
    ],
  },

  discussions: {
    key: 'discussions',
    label: 'Q&A Discussions', singular: 'Discussion', icon: 'message', group: 'people',
    columns: ['topic', 'course', 'author', 'replies', 'date'],
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', required: true },
      { key: 'course', label: 'Course', type: 'select', options: COURSE_NAMES },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'replies', label: 'Replies', type: 'number' },
      { key: 'date', label: 'Date', type: 'date' },
    ],
    seed: [
      { id: 1, topic: 'Best tools for Gantt charts?', course: COURSE_NAMES[5], author: 'Neha Sharma', replies: 4, date: '2026-02-28' },
      { id: 2, topic: 'Pivot table refresh issue', course: COURSE_NAMES[0], author: 'Riya Patel', replies: 2, date: '2026-03-01' },
    ],
  },

  certificates: {
    key: 'certificates',
    label: 'Certificate Templates', singular: 'Certificate', icon: 'badge', group: 'commerce', view: 'cards',
    columns: ['name', 'course', 'issued', 'orientation'],
    fields: [
      { key: 'name', label: 'Template Name', type: 'text', required: true },
      { key: 'course', label: 'Course', type: 'select', options: COURSE_NAMES },
      { key: 'issued', label: 'Issued', type: 'number' },
      { key: 'orientation', label: 'Orientation', type: 'select', options: ['Landscape', 'Portrait'] },
    ],
    seed: [
      { id: 1, name: 'Excel Mastery Certificate', course: COURSE_NAMES[0], issued: 2, orientation: 'Landscape' },
      { id: 2, name: 'PM Completion Certificate', course: COURSE_NAMES[5], issued: 0, orientation: 'Landscape' },
    ],
  },

  events: {
    key: 'events',
    label: 'Events', singular: 'Event', icon: 'calendar', group: 'content', view: 'cards',
    columns: ['title', 'host', 'date', 'type'],
    fields: [
      { key: 'title', label: 'Event Title', type: 'text', required: true },
      { key: 'host', label: 'Host', type: 'select', options: INSTRUCTORS },
      { key: 'date', label: 'Date & Time', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: ['Zoom Meeting', 'Webinar', 'Workshop', 'Coaching'] },
    ],
    seed: [
      { id: 1, title: 'Weekly Coaching Session', host: 'Mahesh MD', date: '2026-03-05 10:00 AM', type: 'Coaching' },
      { id: 2, title: 'Excel Q&A Live', host: 'Shah Kanchi', date: '2026-03-08 03:00 PM', type: 'Webinar' },
    ],
  },

};

export const nav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
      { id: 'activity', label: 'Activity', icon: 'activity' },
      { id: 'calendar', label: 'Calendar', icon: 'calendar' },
      { id: 'messages', label: 'Messages', icon: 'mail' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { id: 'digital-twin', label: 'Digital Twin', icon: 'cube', badge: '3D' },
      { id: 'assistant', label: 'AI Assistant', icon: 'bot', badge: 'AI' },
    ],
  },
  {
    title: 'Learning',
    items: [
      { id: 'courses', label: 'Courses', icon: 'book-open' },
    ],
  },
  {
    title: 'People',
    items: [
      { id: 'students', label: 'Students', icon: 'users' },
      { id: 'instructors', label: 'Instructors', icon: 'award' },
      { id: 'groups', label: 'Groups', icon: 'users' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { id: 'payments', label: 'Payments & Payouts', icon: 'credit-card' },
      { id: 'reports', label: 'Reports', icon: 'bar-chart' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: 'settings' },
      { id: 'profile', label: 'Profile', icon: 'user' },
    ],
  },
];

export const activities: ActivityItem[] = [
  { user: 'Neha Sharma', action: 'completed Unit 2 in IT Project Management', time: '2 hours ago' },
  { user: 'Riya Patel', action: 'submitted assignment in Excel Advanced', time: '5 hours ago' },
  { user: 'Ankit Verma', action: 'enrolled in Power BI Masterclass', time: '1 day ago' },
  { user: 'Shah Kanchi', action: 'published a new quiz in Excel Advanced', time: '1 day ago' },
  { user: 'Kanchi S', action: 'posted a question in Q&A Discussions', time: '2 days ago' },
];

export const messages: MessageItem[] = [
  { from: 'Kanchi Shah', preview: 'Great progress on your assignment!', time: '10:30 AM', unread: true },
  { from: 'Course Support', preview: 'Your quiz results are ready', time: 'Yesterday', unread: true },
  { from: 'Neha Sharma', preview: 'Thank you for the feedback', time: '2 days ago', unread: false },
];
