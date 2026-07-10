/**
 * SG Pro Growth — Admin Portal data layer
 * Mirrors every content type / feature from the original WordPress + WPLMS admin
 * (sharvaconsulting.com staging) and adds schema metadata so the UI can drive
 * full CRUD for each entity.
 */
window.SGProData = (function () {
  /* ---------------------------------------------------------------------- */
  /* Motivational / educational quotes shown across the panel                */
  /* ---------------------------------------------------------------------- */
  const quotes = [
    { text: 'Coaching before you learn, clarity before you certify.', author: 'SG Pro Growth' },
    { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
    { text: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
    { text: 'Train people well enough so they can leave, treat them well enough so they don\u2019t want to.', author: 'Richard Branson' },
    { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
    { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin' },
    { text: 'Learning never exhausts the mind.', author: 'Leonardo da Vinci' },
    { text: 'Right guidance turns potential into performance.', author: 'SG Pro Growth' }
  ];

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                 */
  /* ---------------------------------------------------------------------- */
  const img = (id, crop) =>
    `https://images.unsplash.com/photo-${id}?w=460&h=300&fit=crop${crop ? '&crop=' + crop : ''}`;

  const INSTRUCTORS = ['Mahesh MD', 'Shah Kanchi', 'Vartika Mehta', 'Kanchi Shah'];
  const COURSE_NAMES = [
    'Microsoft Excel Advanced Excel Formulas & Functions',
    'Power BI Masterclass - DAX, Excel And More',
    'Unconscious bias training',
    'Color therapy 1',
    'Demo Course',
    'IT Project Management',
    'BNI-Trainers and Coaches Power team'
  ];

  /* ---------------------------------------------------------------------- */
  /* Entity definitions — schema (fields) + seed data                        */
  /* Field types: text | textarea | number | select | date | currency       */
  /* ---------------------------------------------------------------------- */
  const entities = {
    courses: {
      label: 'Courses', singular: 'Course', icon: 'book-open', group: 'learning',
      view: 'cards',
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
        { key: 'price', label: 'Price (₹)', type: 'number' },
        { key: 'image', label: 'Image URL', type: 'text' }
      ],
      seed: [
        { id: 801, title: COURSE_NAMES[0], instructor: 'Shah Kanchi', category: 'Data Analysis', status: 'published', students: 57, duration: '57 hrs', completion: 100, rating: 5, reviews: 2, price: 0, image: img('1504384308090-c894fdcc538d') },
        { id: 802, title: COURSE_NAMES[1], instructor: 'Mahesh MD', category: 'Office Productivity', status: 'published', students: 2, duration: '2 hrs', completion: 0, rating: 0, reviews: 0, price: 0, image: img('1551288049-bebda4e38f71') },
        { id: 803, title: COURSE_NAMES[2], instructor: 'Kanchi Shah', category: 'Unconscious Bias', status: 'published', students: 21, duration: '21 hrs', completion: 0, rating: 0, reviews: 0, price: 0, image: img('1573497161161-c3e73707e25c') },
        { id: 804, title: COURSE_NAMES[3], instructor: 'Vartika Mehta', category: 'Color Therapy', status: 'published', students: 0, duration: '0 hrs', completion: 100, rating: 0, reviews: 0, price: 0, image: img('1526374965328-7f61d4dc18c5') },
        { id: 805, title: COURSE_NAMES[4], instructor: 'Kanchi Shah', category: 'Demo', status: 'draft', students: 0, duration: '0 hrs', completion: 0, rating: 0, reviews: 0, price: 0, image: img('1531482615713-2afd69097998') },
        { id: 822, title: COURSE_NAMES[5], instructor: 'Mahesh MD', category: 'Project Management', status: 'published', students: 3, duration: '3 hrs', completion: 15, rating: 0, reviews: 0, price: 108, image: img('1504384308090-c894fdcc538d', 'right') },
        { id: 830, title: COURSE_NAMES[6], instructor: 'Mahesh MD', category: 'Business Networking', status: 'pending', students: 4, duration: '4 hrs', completion: 50, rating: 0, reviews: 0, price: 0, image: img('1522202176988-66273c2fd55f') }
      ]
    },

    units: {
      label: 'Units', singular: 'Unit', icon: 'list', group: 'learning',
      fields: [
        { key: 'title', label: 'Unit Title', type: 'text', required: true },
        { key: 'course', label: 'Course', type: 'select', options: COURSE_NAMES },
        { key: 'type', label: 'Type', type: 'select', options: ['video', 'text', 'audio', 'document'] },
        { key: 'duration', label: 'Duration', type: 'text' },
        { key: 'order', label: 'Order', type: 'number' }
      ],
      columns: ['title', 'course', 'type', 'duration', 'order'],
      seed: [
        { id: 1, title: 'Introduction to PM', course: COURSE_NAMES[5], type: 'video', duration: '45 min', order: 1 },
        { id: 2, title: 'Agile Methodologies', course: COURSE_NAMES[5], type: 'text', duration: '30 min', order: 2 },
        { id: 3, title: 'VLOOKUP & INDEX-MATCH', course: COURSE_NAMES[0], type: 'video', duration: '1 hr', order: 1 },
        { id: 4, title: 'Pivot Tables Deep Dive', course: COURSE_NAMES[0], type: 'video', duration: '50 min', order: 2 }
      ]
    },

    quizzes: {
      label: 'Quizzes', singular: 'Quiz', icon: 'help-circle', group: 'learning',
      fields: [
        { key: 'title', label: 'Quiz Title', type: 'text', required: true },
        { key: 'course', label: 'Course', type: 'select', options: COURSE_NAMES },
        { key: 'questions', label: 'Questions', type: 'number' },
        { key: 'attempts', label: 'Attempts', type: 'number' },
        { key: 'avgScore', label: 'Avg Score %', type: 'number' },
        { key: 'passmark', label: 'Pass Mark %', type: 'number' }
      ],
      columns: ['title', 'course', 'questions', 'attempts', 'avgScore', 'passmark'],
      seed: [
        { id: 1, title: 'PM Fundamentals Quiz', course: COURSE_NAMES[5], questions: 15, attempts: 42, avgScore: 78, passmark: 60 },
        { id: 2, title: 'Excel Formulas Assessment', course: COURSE_NAMES[0], questions: 20, attempts: 31, avgScore: 85, passmark: 70 }
      ]
    },

    questions: {
      label: 'Questions', singular: 'Question', icon: 'edit', group: 'learning',
      fields: [
        { key: 'text', label: 'Question', type: 'textarea', required: true },
        { key: 'quiz', label: 'Quiz', type: 'text' },
        { key: 'type', label: 'Type', type: 'select', options: ['MCQ', 'True/False', 'Essay', 'Fill in the blank'] },
        { key: 'points', label: 'Points', type: 'number' }
      ],
      columns: ['text', 'quiz', 'type', 'points'],
      seed: [
        { id: 1, text: 'What is the critical path in project management?', quiz: 'PM Fundamentals Quiz', type: 'MCQ', points: 5 },
        { id: 2, text: 'Explain the difference between VLOOKUP and XLOOKUP.', quiz: 'Excel Formulas Assessment', type: 'Essay', points: 10 }
      ]
    },

    assignments: {
      label: 'Assignments', singular: 'Assignment', icon: 'clipboard', group: 'learning',
      fields: [
        { key: 'title', label: 'Assignment Title', type: 'text', required: true },
        { key: 'course', label: 'Course', type: 'select', options: COURSE_NAMES },
        { key: 'due', label: 'Due Date', type: 'date' },
        { key: 'submissions', label: 'Submissions', type: 'number' },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'draft', 'closed'] }
      ],
      columns: ['title', 'course', 'due', 'submissions', 'status'],
      seed: [
        { id: 1, title: 'Create a Project Charter', course: COURSE_NAMES[5], due: '2026-03-15', submissions: 12, status: 'active' },
        { id: 2, title: 'Build a Dashboard', course: COURSE_NAMES[0], due: '2026-03-20', submissions: 28, status: 'active' }
      ]
    },

    h5p: {
      label: 'H5P Content', singular: 'H5P Item', icon: 'layers', group: 'learning',
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'type', label: 'Content Type', type: 'select', options: ['Interactive Video', 'Course Presentation', 'Quiz (Question Set)', 'Drag and Drop', 'Flashcards'] },
        { key: 'course', label: 'Used In', type: 'select', options: COURSE_NAMES },
        { key: 'views', label: 'Views', type: 'number' }
      ],
      columns: ['title', 'type', 'course', 'views'],
      seed: [
        { id: 1, title: 'PM Terminology Flashcards', type: 'Flashcards', course: COURSE_NAMES[5], views: 88 },
        { id: 2, title: 'Excel Interactive Walkthrough', type: 'Interactive Video', course: COURSE_NAMES[0], views: 156 }
      ]
    },

    students: {
      label: 'Students', singular: 'Student', icon: 'users', group: 'people',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'text', required: true },
        { key: 'courses', label: 'Courses', type: 'number' },
        { key: 'progress', label: 'Progress %', type: 'number' },
        { key: 'joined', label: 'Joined', type: 'date' }
      ],
      columns: ['name', 'email', 'courses', 'progress', 'joined'],
      seed: [
        { id: 1, name: 'Neha Sharma', email: 'neha.s@email.com', courses: 3, progress: 68, joined: '2025-08-12' },
        { id: 2, name: 'Riya Patel', email: 'riya.p@email.com', courses: 2, progress: 45, joined: '2025-09-03' },
        { id: 3, name: 'Ankit Verma', email: 'ankit.v@email.com', courses: 1, progress: 90, joined: '2025-10-21' },
        { id: 4, name: 'Kanchi S', email: 'kanchiss23@gmail.com', courses: 2, progress: 55, joined: '2025-11-05' }
      ]
    },

    instructors: {
      label: 'Instructors', singular: 'Instructor', icon: 'award', group: 'people',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'courses', label: 'Courses', type: 'number' },
        { key: 'students', label: 'Students', type: 'number' },
        { key: 'commission', label: 'Commission %', type: 'number' }
      ],
      columns: ['name', 'email', 'courses', 'students', 'commission'],
      seed: [
        { id: 1, name: 'Mahesh MD', email: 'maheshmd@sharvagroup.com', courses: 3, students: 9, commission: 70 },
        { id: 2, name: 'Shah Kanchi', email: 'shah.k@sharvagroup.com', courses: 1, students: 57, commission: 65 },
        { id: 3, name: 'Vartika Mehta', email: 'vartika@sharvagroup.com', courses: 1, students: 0, commission: 60 }
      ]
    },

    users: {
      label: 'Users', singular: 'User', icon: 'user', group: 'people',
      fields: [
        { key: 'name', label: 'Display Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'text', required: true },
        { key: 'role', label: 'Role', type: 'select', options: ['Administrator', 'Instructor', 'Student', 'Subscriber'] },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'suspended'] }
      ],
      columns: ['name', 'email', 'role', 'status'],
      seed: [
        { id: 1, name: 'Mahesh MD', email: 'maheshmd@sharvagroup.com', role: 'Administrator', status: 'active' },
        { id: 2, name: 'Neha Sharma', email: 'neha.s@email.com', role: 'Student', status: 'active' },
        { id: 3, name: 'Shah Kanchi', email: 'shah.k@sharvagroup.com', role: 'Instructor', status: 'active' }
      ]
    },

    groups: {
      label: 'Groups', singular: 'Group', icon: 'users', group: 'people',
      fields: [
        { key: 'name', label: 'Group Name', type: 'text', required: true },
        { key: 'members', label: 'Members', type: 'number' },
        { key: 'privacy', label: 'Privacy', type: 'select', options: ['Public', 'Private', 'Hidden'] }
      ],
      columns: ['name', 'members', 'privacy'],
      seed: [
        { id: 1, name: 'BNI Power Team', members: 4, privacy: 'Private' },
        { id: 2, name: 'Excel Learners', members: 31, privacy: 'Public' }
      ]
    },

    discussions: {
      label: 'Q&A Discussions', singular: 'Discussion', icon: 'message', group: 'people',
      fields: [
        { key: 'topic', label: 'Topic', type: 'text', required: true },
        { key: 'course', label: 'Course', type: 'select', options: COURSE_NAMES },
        { key: 'author', label: 'Author', type: 'text' },
        { key: 'replies', label: 'Replies', type: 'number' },
        { key: 'date', label: 'Date', type: 'date' }
      ],
      columns: ['topic', 'course', 'author', 'replies', 'date'],
      seed: [
        { id: 1, topic: 'Best tools for Gantt charts?', course: COURSE_NAMES[5], author: 'Neha Sharma', replies: 4, date: '2026-02-28' },
        { id: 2, topic: 'Pivot table refresh issue', course: COURSE_NAMES[0], author: 'Riya Patel', replies: 2, date: '2026-03-01' }
      ]
    },

    products: {
      label: 'Products', singular: 'Product', icon: 'tag', group: 'commerce',
      fields: [
        { key: 'name', label: 'Product Name', type: 'text', required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Course', 'Bundle', 'Membership', 'Coaching'] },
        { key: 'price', label: 'Price (₹)', type: 'number' },
        { key: 'stock', label: 'Stock', type: 'select', options: ['In stock', 'Out of stock'] }
      ],
      columns: ['name', 'type', 'price', 'stock'],
      seed: [
        { id: 1, name: 'IT Project Management', type: 'Course', price: 108, stock: 'In stock' },
        { id: 2, name: 'Career Coaching Bundle', type: 'Bundle', price: 4999, stock: 'In stock' }
      ]
    },

    orders: {
      label: 'Orders', singular: 'Order', icon: 'shopping', group: 'commerce',
      fields: [
        { key: 'customer', label: 'Customer', type: 'text', required: true },
        { key: 'product', label: 'Product', type: 'text' },
        { key: 'total', label: 'Total (₹)', type: 'number' },
        { key: 'status', label: 'Status', type: 'select', options: ['completed', 'processing', 'pending', 'refunded'] },
        { key: 'date', label: 'Date', type: 'date' }
      ],
      columns: ['customer', 'product', 'total', 'status', 'date'],
      seed: [
        { id: 1051, customer: 'Neha Sharma', product: 'IT Project Management', total: 108, status: 'completed', date: '2026-02-10' },
        { id: 1052, customer: 'Ankit Verma', product: 'Career Coaching Bundle', total: 4999, status: 'processing', date: '2026-03-01' }
      ]
    },

    certificates: {
      label: 'Certificate Templates', singular: 'Certificate', icon: 'badge', group: 'commerce',
      fields: [
        { key: 'name', label: 'Template Name', type: 'text', required: true },
        { key: 'course', label: 'Course', type: 'select', options: COURSE_NAMES },
        { key: 'issued', label: 'Issued', type: 'number' },
        { key: 'orientation', label: 'Orientation', type: 'select', options: ['Landscape', 'Portrait'] }
      ],
      columns: ['name', 'course', 'issued', 'orientation'],
      seed: [
        { id: 1, name: 'Excel Mastery Certificate', course: COURSE_NAMES[0], issued: 2, orientation: 'Landscape' },
        { id: 2, name: 'PM Completion Certificate', course: COURSE_NAMES[5], issued: 0, orientation: 'Landscape' }
      ]
    },

    news: {
      label: 'News & Posts', singular: 'Post', icon: 'file', group: 'content',
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'author', label: 'Author', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: ['published', 'draft', 'pending'] },
        { key: 'date', label: 'Date', type: 'date' }
      ],
      columns: ['title', 'author', 'status', 'date'],
      seed: [
        { id: 1, title: 'Why Online Courses Alone Don\u2019t Work', author: 'Mahesh MD', status: 'published', date: '2026-01-15' },
        { id: 2, title: 'How SGProGrowth Changes Everything', author: 'Mahesh MD', status: 'published', date: '2026-02-01' }
      ]
    },

    testimonials: {
      label: 'Testimonials', singular: 'Testimonial', icon: 'quote', group: 'content',
      fields: [
        { key: 'author', label: 'Author', type: 'text', required: true },
        { key: 'role', label: 'Role', type: 'text' },
        { key: 'text', label: 'Testimonial', type: 'textarea' },
        { key: 'status', label: 'Status', type: 'select', options: ['published', 'draft'] }
      ],
      columns: ['author', 'role', 'status'],
      seed: [
        { id: 1, author: 'Neha', role: 'Software Engineer', text: 'Personalised roadmap made me confident to interview and deliver on projects.', status: 'published' },
        { id: 2, author: 'Riya', role: 'Data Analyst', text: 'The mentoring kept me motivated and focused.', status: 'published' },
        { id: 3, author: 'Ankit', role: 'Cloud Engineer', text: 'SG ProGrowth coaching helped me find the right AWS certification.', status: 'published' }
      ]
    },

    events: {
      label: 'Events', singular: 'Event', icon: 'calendar', group: 'content',
      fields: [
        { key: 'title', label: 'Event Title', type: 'text', required: true },
        { key: 'host', label: 'Host', type: 'select', options: INSTRUCTORS },
        { key: 'date', label: 'Date & Time', type: 'text' },
        { key: 'type', label: 'Type', type: 'select', options: ['Zoom Meeting', 'Webinar', 'Workshop', 'Coaching'] }
      ],
      columns: ['title', 'host', 'date', 'type'],
      seed: [
        { id: 1, title: 'Weekly Coaching Session', host: 'Mahesh MD', date: '2026-03-05 10:00 AM', type: 'Coaching' },
        { id: 2, title: 'Excel Q&A Live', host: 'Shah Kanchi', date: '2026-03-08 03:00 PM', type: 'Webinar' }
      ]
    },

    forms: {
      label: 'Forms', singular: 'Form', icon: 'clipboard', group: 'content',
      fields: [
        { key: 'name', label: 'Form Name', type: 'text', required: true },
        { key: 'entries', label: 'Entries', type: 'number' },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }
      ],
      columns: ['name', 'entries', 'status'],
      seed: [
        { id: 1, name: 'Contact Us', entries: 24, status: 'active' },
        { id: 2, name: 'Course Enquiry', entries: 51, status: 'active' }
      ]
    },

    media: {
      label: 'Media Library', singular: 'Media', icon: 'image', group: 'content',
      fields: [
        { key: 'name', label: 'File Name', type: 'text', required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Image', 'Video', 'PDF', 'Audio'] },
        { key: 'size', label: 'Size', type: 'text' },
        { key: 'uploaded', label: 'Uploaded', type: 'date' }
      ],
      columns: ['name', 'type', 'size', 'uploaded'],
      seed: [
        { id: 1, name: 'excel-thumbnail.png', type: 'Image', size: '240 KB', uploaded: '2025-07-10' },
        { id: 2, name: 'pm-intro.mp4', type: 'Video', size: '48 MB', uploaded: '2025-08-02' }
      ]
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Navigation — grouped to mirror the original admin menus + new modules   */
  /* ---------------------------------------------------------------------- */
  const nav = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
        { id: 'activity', label: 'Activity', icon: 'activity' },
        { id: 'calendar', label: 'Calendar', icon: 'calendar' },
        { id: 'messages', label: 'Messages', icon: 'mail', badge: '2' }
      ]
    },
    {
      title: 'Learning',
      items: [
        { id: 'courses', label: 'Courses', icon: 'book-open' },
        { id: 'units', label: 'Units', icon: 'list' },
        { id: 'quizzes', label: 'Quizzes', icon: 'help-circle' },
        { id: 'questions', label: 'Questions', icon: 'edit' },
        { id: 'assignments', label: 'Assignments', icon: 'clipboard' },
        { id: 'h5p', label: 'H5P Content', icon: 'layers' }
      ]
    },
    {
      title: 'People',
      items: [
        { id: 'students', label: 'Students', icon: 'users' },
        { id: 'instructors', label: 'Instructors', icon: 'award' },
        { id: 'users', label: 'Users', icon: 'user' },
        { id: 'groups', label: 'Groups', icon: 'users' },
        { id: 'discussions', label: 'Q&A Discussions', icon: 'message' }
      ]
    },
    {
      title: 'Commerce',
      items: [
        { id: 'products', label: 'Products', icon: 'tag' },
        { id: 'orders', label: 'Orders', icon: 'shopping' },
        { id: 'certificates', label: 'Certificates', icon: 'badge' }
      ]
    },
    {
      title: 'Content',
      items: [
        { id: 'news', label: 'News & Posts', icon: 'file' },
        { id: 'testimonials', label: 'Testimonials', icon: 'quote' },
        { id: 'events', label: 'Events', icon: 'calendar' },
        { id: 'forms', label: 'Forms', icon: 'clipboard' },
        { id: 'media', label: 'Media', icon: 'image' }
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { id: 'ai-assistant', label: 'AI Assistant', icon: 'cpu', badge: 'New' },
        { id: 'digital-twin', label: 'Digital Twin', icon: 'twin', badge: 'New' },
        { id: 'insights', label: 'Smart Insights', icon: 'trending', badge: 'New' },
        { id: 'automation', label: 'Automation', icon: 'zap', badge: 'New' }
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'reports', label: 'Reports', icon: 'bar-chart' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
        { id: 'profile', label: 'Profile', icon: 'user' }
      ]
    }
  ];

  /* Activity / messages feeds */
  const activities = [
    { user: 'Neha Sharma', action: 'completed Unit 2 in IT Project Management', time: '2 hours ago' },
    { user: 'Riya Patel', action: 'submitted assignment in Excel Advanced', time: '5 hours ago' },
    { user: 'Ankit Verma', action: 'enrolled in Power BI Masterclass', time: '1 day ago' },
    { user: 'System', action: 'New order #1052 received (₹4,999)', time: '1 day ago' },
    { user: 'Kanchi S', action: 'posted a question in Q&A Discussions', time: '2 days ago' }
  ];

  const messages = [
    { from: 'Kanchi Shah', preview: 'Great progress on your assignment!', time: '10:30 AM', unread: true },
    { from: 'Course Support', preview: 'Your quiz results are ready', time: 'Yesterday', unread: true },
    { from: 'Neha Sharma', preview: 'Thank you for the feedback', time: '2 days ago', unread: false }
  ];

  return { quotes, entities, nav, activities, messages, instructors: INSTRUCTORS, courseNames: COURSE_NAMES };
})();
