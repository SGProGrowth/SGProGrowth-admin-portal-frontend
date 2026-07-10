(function () {
  'use strict';

  const ICONS = {
    book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
    users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    file: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    clipboard: '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    'book-open': '<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    edit: '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    message: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    'bar-chart': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'
  };

  const BADGE_COLORS = [
    ['#dcfce7', '#15803d'], ['#ede9fe', '#5b21b6'], ['#dbeafe', '#1e40af'],
    ['#fce7f3', '#9d174d'], ['#ffedd5', '#9a3412'], ['#ccfbf1', '#0f766e']
  ];

  const state = {
    section: 'manage-courses',
    role: 'instructor',
    courseTab: 'published',
    courseFilter: 'all',
    search: '',
    sort: 'recent'
  };

  const user = JSON.parse(localStorage.getItem('sgpro_user') || '{}');

  if (!user.loggedIn) {
    window.location.href = '../login.html';
    return;
  }

  state.role = user.role || 'instructor';

  const SECTION_META = {
    courses: { title: 'Courses', subtitle: 'Browse all available courses', action: null },
    activity: { title: 'Activity', subtitle: 'Recent platform activity', action: null },
    profile: { title: 'Profile', subtitle: 'Manage your account settings', action: null },
    calendar: { title: 'Calendar', subtitle: 'Upcoming events and deadlines', action: null },
    zoom: { title: 'Zoom Meetings', subtitle: 'Scheduled live sessions', action: 'Schedule Meeting' },
    groups: { title: 'Groups', subtitle: 'Learning communities', action: 'Create Group' },
    messages: { title: 'Messages', subtitle: 'Your inbox', action: 'Compose' },
    enrolled: { title: 'Enrolled Courses', subtitle: 'Courses you are taking', action: null },
    achievements: { title: 'Achievements', subtitle: 'Your learning milestones', action: null },
    'my-quizzes': { title: 'My Quizzes', subtitle: 'Quiz history and pending attempts', action: null },
    notes: { title: 'Notes & Reviews', subtitle: 'Your course notes and reviews', action: 'Add Note' },
    'my-assignments': { title: 'My Assignments', subtitle: 'Assignments due and submitted', action: null },
    'manage-courses': { title: 'Manage Courses', subtitle: 'Create and manage your courses', action: 'Create New Course' },
    'manage-units': { title: 'Manage Units', subtitle: 'Course units and lessons', action: 'Add Unit' },
    'manage-quizzes': { title: 'Manage Quizzes', subtitle: 'Quiz configuration', action: 'Create Quiz' },
    'manage-assignments': { title: 'Manage Assignments', subtitle: 'Assignment management', action: 'Create Assignment' },
    'manage-students': { title: 'Manage Students', subtitle: 'Enrolled students overview', action: 'Invite Student' },
    'manage-questions': { title: 'Manage Questions', subtitle: 'Quiz question bank', action: 'Add Question' },
    discussions: { title: 'Q&A Discussions', subtitle: 'Course discussions and Q&A', action: null },
    reports: { title: 'Manage Reports', subtitle: 'Analytics and performance reports', action: 'Export Report' }
  };

  function svg(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICONS[name] || ICONS.book}</svg>`;
  }

  function initials(name) {
    return (name || '?').split(/[@\s]+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = `toast toast-${type || 'info'}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function badgeColor(i) {
    const [bg, fg] = BADGE_COLORS[i % BADGE_COLORS.length];
    return `background:${bg};color:${fg}`;
  }

  function renderNav() {
    const d = window.SGProData;
    const sections = [
      { title: 'Platform', items: d.nav.platform },
      { title: 'Student', items: d.nav.student, role: 'student' },
      { title: 'Instructor Controls', items: d.nav.instructor, role: 'instructor' }
    ];

    return sections.map(sec => {
      const items = sec.items.filter(item => !sec.role || sec.role === state.role);
      if (!items.length) return '';
      return `
        <div class="nav-section-title">${sec.title}</div>
        ${items.map(item => `
          <button class="nav-item${state.section === item.id ? ' active' : ''}" data-section="${item.id}">
            ${svg(item.icon)}
            ${item.label}
            ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
          </button>
        `).join('')}
      `;
    }).join('');
  }

  function courseStats() {
    const courses = window.SGProData.courses;
    const totalStudents = courses.reduce((s, c) => s + c.students, 0);
    const avgCompletion = Math.round(courses.reduce((s, c) => s + c.completion, 0) / courses.length);
    const rated = courses.filter(c => c.rating > 0);
    const avgRating = rated.length ? (rated.reduce((s, c) => s + c.rating, 0) / rated.length).toFixed(1) : '—';
    return { total: courses.length, students: totalStudents, avgRating, avgCompletion };
  }

  function filterCourses() {
    let list = [...window.SGProData.courses];
    const tabStatus = state.courseTab === 'drafts' ? 'draft' : state.courseTab;
    if (['published', 'pending', 'draft'].includes(tabStatus)) {
      list = list.filter(c => c.status === tabStatus);
    }
    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter(c => `${c.title} ${c.instructor} ${c.category}`.toLowerCase().includes(q));
    }
    if (state.sort === 'alphabetical') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (state.sort === 'popular') list.sort((a, b) => b.students - a.students);
    return list;
  }

  function renderCourseGrid(courses, editable) {
    if (!courses.length) {
      return `<div class="empty-state"><p>No courses found matching your filters.</p></div>`;
    }
    return `<div class="course-grid">${courses.map((c, i) => `
      <div class="course-card" data-id="${c.id}">
        <div class="card-thumb"><img src="${c.image}" alt="${c.title}" loading="lazy"></div>
        <div class="card-body">
          <div class="card-title">${c.title}</div>
          <div class="card-instructor">
            <span class="avatar-sm">${initials(c.instructor)}</span>
            ${c.instructor}
          </div>
          <span class="badge" style="${badgeColor(i)}">${c.category}</span>
          <div class="card-meta">
            <span>👥 ${c.students} Students</span>
            <span>⏱ ${c.duration}</span>
            ${c.completion ? `<span>📊 ${c.completion}%</span>` : ''}
            <span>⭐ ${c.rating} (${c.reviews})</span>
          </div>
          ${editable ? `<div class="card-actions">
            <button class="btn-edit" data-action="edit" data-id="${c.id}">Edit</button>
            <button class="btn-view" data-action="view" data-id="${c.id}">View</button>
          </div>` : `<div class="card-actions">
            <button class="btn-edit" data-action="continue" data-id="${c.id}">Continue</button>
          </div>`}
        </div>
      </div>
    `).join('')}</div>`;
  }

  function renderManageCourses() {
    const stats = courseStats();
    const courses = filterCourses();
    const published = window.SGProData.courses.filter(c => c.status === 'published').length;
    return `
      <div class="stats-row">
        <div class="stat-card"><div class="stat-icon" style="background:#ede9fe">📖</div><div><div class="stat-value">${stats.total}</div><div class="stat-label">Total Courses</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#dbeafe">👥</div><div><div class="stat-value">${stats.students}</div><div class="stat-label">Total Students</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#fef9c3">⭐</div><div><div class="stat-value">${stats.avgRating}</div><div class="stat-label">Avg Rating</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#dcfce7">🔄</div><div><div class="stat-value">${stats.avgCompletion}%</div><div class="stat-label">Completion Rate</div></div></div>
      </div>
      <div class="toolbar">
        <div class="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="course-search" placeholder="Search courses..." value="${state.search}">
        </div>
        <div class="filter-group">
          <button class="filter-btn${state.courseFilter === 'all' ? ' active' : ''}" data-filter="all">All</button>
          <button class="filter-btn${state.courseFilter === 'published' ? ' active' : ''}" data-filter="published">Published</button>
          <button class="filter-btn${state.courseFilter === 'pending' ? ' active' : ''}" data-filter="pending">Pending</button>
          <button class="filter-btn${state.courseFilter === 'drafts' ? ' active' : ''}" data-filter="drafts">Drafts</button>
        </div>
        <select class="sort-select" id="course-sort">
          <option value="recent"${state.sort === 'recent' ? ' selected' : ''}>Recent</option>
          <option value="alphabetical"${state.sort === 'alphabetical' ? ' selected' : ''}>Alphabetical</option>
          <option value="popular"${state.sort === 'popular' ? ' selected' : ''}>Popular</option>
        </select>
      </div>
      <div class="tabs">
        <button class="tab${state.courseTab === 'published' ? ' active' : ''}" data-tab="published">Published (${published})</button>
        <button class="tab" data-tab="pending">Pending (0)</button>
        <button class="tab" data-tab="drafts">Drafts (0)</button>
      </div>
      ${renderCourseGrid(courses, true)}
    `;
  }

  function renderTable(headers, rows) {
    return `<div class="data-table-wrap"><table class="data-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }

  function renderEnrolled() {
    const rows = window.SGProData.enrolledCourses.map(c => `
      <tr>
        <td><strong>${c.title}</strong></td>
        <td>${c.instructor}</td>
        <td><div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${c.progress}%"></div></div><small>${c.progress}% complete</small></div></td>
        <td><button class="btn-secondary" data-action="continue" data-id="${c.id}">Continue</button></td>
      </tr>
    `);
    return renderTable(['Course', 'Instructor', 'Progress', 'Action'], rows);
  }

  function renderStudents() {
    const rows = window.SGProData.students.map(s => `
      <tr>
        <td><strong>${s.name}</strong><br><small style="color:var(--muted)">${s.email}</small></td>
        <td>${s.courses}</td>
        <td><div class="progress-bar" style="width:80px;display:inline-block;vertical-align:middle"><div class="progress-fill" style="width:${s.progress}%"></div></div> ${s.progress}%</td>
        <td>${s.joined}</td>
        <td><button class="btn-secondary" data-action="view-student" data-id="${s.id}">View</button></td>
      </tr>
    `);
    return renderTable(['Student', 'Courses', 'Progress', 'Joined', 'Action'], rows);
  }

  function renderUnits() {
    const rows = window.SGProData.units.map(u => `
      <tr><td>${u.course}</td><td><strong>${u.title}</strong></td><td>${u.type}</td><td>${u.duration}</td><td>${u.order}</td>
      <td><button class="btn-secondary" data-action="edit-unit" data-id="${u.id}">Edit</button></td></tr>
    `);
    return renderTable(['Course', 'Unit', 'Type', 'Duration', 'Order', 'Action'], rows);
  }

  function renderQuizzes() {
    const rows = window.SGProData.quizzes.map(q => `
      <tr><td>${q.course}</td><td><strong>${q.title}</strong></td><td>${q.questions}</td><td>${q.attempts}</td><td>${q.avgScore}%</td>
      <td><button class="btn-secondary" data-action="edit-quiz" data-id="${q.id}">Edit</button></td></tr>
    `);
    return renderTable(['Course', 'Quiz', 'Questions', 'Attempts', 'Avg Score', 'Action'], rows);
  }

  function renderAssignments() {
    const rows = window.SGProData.assignments.map(a => `
      <tr><td>${a.course}</td><td><strong>${a.title}</strong></td><td>${a.due}</td><td>${a.submissions}</td>
      <td><span class="status-pill status-${a.status}">${a.status}</span></td>
      <td><button class="btn-secondary" data-action="edit-assignment" data-id="${a.id}">Edit</button></td></tr>
    `);
    return renderTable(['Course', 'Assignment', 'Due Date', 'Submissions', 'Status', 'Action'], rows);
  }

  function renderQuestions() {
    const rows = window.SGProData.questions.map(q => `
      <tr><td>${q.quiz}</td><td>${q.text}</td><td>${q.type}</td><td>${q.points} pts</td>
      <td><button class="btn-secondary" data-action="edit-question" data-id="${q.id}">Edit</button></td></tr>
    `);
    return renderTable(['Quiz', 'Question', 'Type', 'Points', 'Action'], rows);
  }

  function renderDiscussions() {
    const rows = window.SGProData.discussions.map(d => `
      <tr><td>${d.course}</td><td><strong>${d.topic}</strong></td><td>${d.author}</td><td>${d.replies}</td><td>${d.date}</td>
      <td><button class="btn-secondary">Reply</button></td></tr>
    `);
    return renderTable(['Course', 'Topic', 'Author', 'Replies', 'Date', 'Action'], rows);
  }

  function renderReports() {
    return `<div class="reports-grid">${window.SGProData.reports.map(r => `
      <div class="report-card">
        <div class="label">${r.label}</div>
        <div class="value">${r.value}</div>
        <div class="trend">${r.trend}</div>
      </div>
    `).join('')}</div>`;
  }

  function renderListCards(items, mapFn) {
    return `<div class="card-list">${items.map(mapFn).join('')}</div>`;
  }

  function renderActivity() {
    return renderListCards(window.SGProData.activities, a => `
      <div class="list-card">
        <div class="list-card-icon">📌</div>
        <div class="list-card-body"><h3>${a.user}</h3><p>${a.action}</p></div>
        <div class="list-card-meta">${a.time}</div>
      </div>
    `);
  }

  function renderMessages() {
    return renderListCards(window.SGProData.messages, m => `
      <div class="list-card" style="${m.unread ? 'border-left:3px solid var(--accent)' : ''}">
        <div class="list-card-icon">${m.unread ? '💬' : '✉️'}</div>
        <div class="list-card-body"><h3>${m.from}</h3><p>${m.preview}</p></div>
        <div class="list-card-meta">${m.time}</div>
      </div>
    `);
  }

  function renderMeetings() {
    return renderListCards(window.SGProData.meetings, m => `
      <div class="list-card">
        <div class="list-card-icon">🎥</div>
        <div class="list-card-body"><h3>${m.title}</h3><p>Host: ${m.host} · ${m.date}</p></div>
        <button class="btn-primary">Join</button>
      </div>
    `);
  }

  function renderAchievements() {
    return renderListCards(window.SGProData.achievements, a => `
      <div class="list-card">
        <div class="list-card-icon">${a.icon}</div>
        <div class="list-card-body"><h3>${a.title}</h3><p>Earned on ${a.date}</p></div>
      </div>
    `);
  }

  function renderMyQuizzes() {
    const rows = window.SGProData.myQuizzes.map(q => `
      <tr><td><strong>${q.title}</strong></td><td>${q.course}</td><td>${q.score !== null ? q.score + '%' : '—'}</td>
      <td><span class="status-pill status-${q.status === 'passed' ? 'passed' : 'pending'}">${q.status}</span></td>
      <td>${q.date || '—'}</td>
      <td>${q.status === 'pending' ? '<button class="btn-primary">Start</button>' : '<button class="btn-secondary">Review</button>'}</td></tr>
    `);
    return renderTable(['Quiz', 'Course', 'Score', 'Status', 'Date', 'Action'], rows);
  }

  function renderNotes() {
    return renderListCards(window.SGProData.notes, n => `
      <div class="list-card">
        <div class="list-card-body"><h3>${n.course}</h3><p>${n.text}</p></div>
        <div class="list-card-meta">${n.date}</div>
      </div>
    `);
  }

  function renderMyAssignments() {
    const rows = window.SGProData.myAssignments.map(a => `
      <tr><td><strong>${a.title}</strong></td><td>${a.course}</td><td>${a.due}</td>
      <td><span class="status-pill status-${a.status === 'in-progress' ? 'in-progress' : 'not-started'}">${a.status.replace('-', ' ')}</span></td>
      <td><button class="btn-primary">Submit</button></td></tr>
    `);
    return renderTable(['Assignment', 'Course', 'Due', 'Status', 'Action'], rows);
  }

  function renderProfile() {
    const name = user.name || user.email || 'User';
    return `
      <div class="profile-grid">
        <div class="profile-card">
          <div class="profile-avatar-lg">${initials(name)}</div>
          <h3>${name}</h3>
          <p style="color:var(--muted);font-size:13px;margin-top:4px">${state.role === 'instructor' ? 'Instructor' : 'Student'}</p>
        </div>
        <div class="profile-card profile-form">
          <div class="form-group"><label>Display Name</label><input type="text" value="${name}"></div>
          <div class="form-group"><label>Email</label><input type="email" value="${user.email || ''}"></div>
          <div class="form-group"><label>Bio</label><input type="text" placeholder="Tell us about yourself"></div>
          <button class="btn-primary" id="save-profile">Save Changes</button>
        </div>
      </div>
    `;
  }

  function renderCalendar() {
    const events = [
      ...window.SGProData.meetings.map(m => ({ title: m.title, date: m.date, type: 'Meeting' })),
      ...window.SGProData.assignments.map(a => ({ title: a.title, date: a.due, type: 'Assignment Due' }))
    ];
    return renderListCards(events, e => `
      <div class="list-card">
        <div class="list-card-icon">📅</div>
        <div class="list-card-body"><h3>${e.title}</h3><p>${e.type}</p></div>
        <div class="list-card-meta">${e.date}</div>
      </div>
    `);
  }

  function renderCoursesBrowse() {
    return renderCourseGrid(window.SGProData.courses, false);
  }

  function renderGroups() {
    return `<div class="empty-state"><p>No groups yet. Create a learning group to collaborate with peers.</p><button class="btn-primary" style="margin-top:16px">Create Group</button></div>`;
  }

  function renderContent() {
    const map = {
      'manage-courses': renderManageCourses,
      courses: renderCoursesBrowse,
      enrolled: renderEnrolled,
      'manage-students': renderStudents,
      'manage-units': renderUnits,
      'manage-quizzes': renderQuizzes,
      'manage-assignments': renderAssignments,
      'manage-questions': renderQuestions,
      discussions: renderDiscussions,
      reports: renderReports,
      activity: renderActivity,
      messages: renderMessages,
      zoom: renderMeetings,
      achievements: renderAchievements,
      'my-quizzes': renderMyQuizzes,
      notes: renderNotes,
      'my-assignments': renderMyAssignments,
      profile: renderProfile,
      calendar: renderCalendar,
      groups: renderGroups
    };
    const fn = map[state.section];
    return fn ? fn() : `<div class="empty-state"><p>Section coming soon.</p></div>`;
  }

  function render() {
    const meta = SECTION_META[state.section] || { title: 'Dashboard', subtitle: '', action: null };
    const name = user.name || user.email || 'User';

    document.getElementById('sidebar-nav').innerHTML = renderNav();
    document.getElementById('page-title').textContent = meta.title;
    document.getElementById('page-subtitle').textContent = meta.subtitle;
    document.getElementById('user-name').textContent = name;
    document.getElementById('user-role-label').textContent = state.role === 'instructor' ? 'Instructor' : 'Student';
    document.getElementById('user-avatar').textContent = initials(name);

    const actionBtn = document.getElementById('header-action');
    if (meta.action) {
      actionBtn.textContent = meta.action;
      actionBtn.style.display = '';
    } else {
      actionBtn.style.display = 'none';
    }

    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.role === state.role);
    });

    document.getElementById('content').innerHTML = renderContent();
    bindContentEvents();
  }

  function bindContentEvents() {
    const search = document.getElementById('course-search');
    if (search) {
      search.addEventListener('input', e => { state.search = e.target.value; render(); });
    }

    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.courseFilter = btn.dataset.filter;
        state.courseTab = btn.dataset.filter === 'all' ? 'published' : btn.dataset.filter === 'drafts' ? 'draft' : btn.dataset.filter;
        render();
      });
    });

    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => { state.courseTab = btn.dataset.tab; render(); });
    });

    const sort = document.getElementById('course-sort');
    if (sort) sort.addEventListener('change', e => { state.sort = e.target.value; render(); });

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'edit') toast(`Opening editor for course #${id}`, 'info');
        else if (action === 'view' || action === 'continue') toast(`Opening course #${id}`, 'info');
        else toast(`${action.replace(/-/g, ' ')} — feature connected to WPLMS API`, 'info');
      });
    });

    document.getElementById('save-profile')?.addEventListener('click', () => toast('Profile saved successfully', 'success'));
  }

  function bindGlobalEvents() {
    document.getElementById('sidebar-nav').addEventListener('click', e => {
      const item = e.target.closest('[data-section]');
      if (!item) return;
      state.section = item.dataset.section;
      render();
    });

    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.role = btn.dataset.role;
        user.role = state.role;
        localStorage.setItem('sgpro_user', JSON.stringify(user));
        if (state.role === 'student' && state.section.startsWith('manage-')) state.section = 'enrolled';
        if (state.role === 'instructor' && ['enrolled', 'achievements', 'my-quizzes', 'notes', 'my-assignments'].includes(state.section)) state.section = 'manage-courses';
        render();
      });
    });

    document.getElementById('header-action')?.addEventListener('click', () => {
      toast(`${SECTION_META[state.section]?.action || 'Action'} — ready for WPLMS integration`, 'info');
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
      localStorage.removeItem('sgpro_user');
      localStorage.removeItem('loggedIn');
      window.location.href = '../login.html';
    });

    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('open');
    });
  }

  bindGlobalEvents();
  render();
})();
