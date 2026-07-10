(function() {
  'use strict';

  // Dashboard Configuration
  const Config = {
    apiUrl: '/wp-json/wplms/v2',
    animationDuration: 300,
    debounceDelay: 300
  };

  // State Management
  const State = {
    currentTab: 'published',
    currentSort: 'date',
    currentOrder: 'asc',
    searchTerm: '',
    courses: [],
    filteredCourses: []
  };

  // DOM Elements Cache
  const DOM = {
    // Tabs
    tabPublished: null,
    tabPending: null,
    tabDrafts: null,
    
    // Search & Filter
    searchInput: null,
    sortDropdown: null,
    sortButtons: null,
    
    // Sidebar
    sidebarMenu: null,
    hideButton: null,
    
    // Main Content
    courseContainer: null,
    
    // Modals
    modals: {}
  };

  /**
   * Initialize Dashboard
   */
  function init() {
    cacheDOM();
    bindEvents();
    loadCourses();
    initializeTooltips();
  }

  /**
   * Cache DOM Elements
   */
  function cacheDOM() {
    // Tab buttons
    DOM.tabPublished = document.querySelector('.vibebp_form_field .active');
    DOM.tabPending = document.querySelector('[class*="link"]');
    DOM.tabDrafts = document.querySelectorAll('[class*="link"]')[1];
    
    // Search & Filter
    DOM.searchInput = document.querySelector('input[type="text"]');
    DOM.sortDropdown = document.querySelector('select');
    DOM.sortButtons = document.querySelectorAll('.vicon-angle-up, .vicon-angle-down');
    
    // Sidebar
    DOM.sidebarMenu = document.querySelector('.vibebp_left_sidebar');
    DOM.hideButton = document.querySelector('.start_block span');
    
    // Course Container
    DOM.courseContainer = document.querySelector('.course_instructor_blocks');
    
    // Modals
    DOM.modals.course = document.querySelector('.pum');
  }

  /**
   * Bind Event Listeners
   */
  function bindEvents() {
    // Tab Navigation
    if (DOM.tabPublished) {
      DOM.tabPublished.addEventListener('click', (e) => handleTabChange(e, 'published'));
    }
    if (DOM.tabPending) {
      DOM.tabPending.addEventListener('click', (e) => handleTabChange(e, 'pending'));
    }
    if (DOM.tabDrafts) {
      DOM.tabDrafts.addEventListener('click', (e) => handleTabChange(e, 'drafts'));
    }

    // Search Input with Debounce
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener('input', debounce(handleSearch, Config.debounceDelay));
    }

    // Sort Dropdown
    if (DOM.sortDropdown) {
      DOM.sortDropdown.addEventListener('change', handleSort);
    }

    // Sort Buttons (Ascending/Descending)
    if (DOM.sortButtons.length > 0) {
      DOM.sortButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => handleSortOrder(index === 0 ? 'asc' : 'desc'));
      });
    }

    // Sidebar Toggle
    if (DOM.hideButton) {
      DOM.hideButton.addEventListener('click', handleSidebarToggle);
    }

    // Course Actions
    document.addEventListener('click', handleCourseAction);

    // Window Events
    window.addEventListener('resize', debounce(handleResize, 300));
  }

  /**
   * Handle Tab Changes
   */
  function handleTabChange(event, tabName) {
    event.preventDefault();
    
    State.currentTab = tabName;
    
    // Update active tab styling
    document.querySelectorAll('.vibebp_form_field .active, .vibebp_form_field .link').forEach(tab => {
      tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter and display courses
    filterAndDisplayCourses();
    
    // Analytics
    trackEvent('tab_changed', { tab: tabName });
  }

  /**
   * Handle Search Input
   */
  function handleSearch(event) {
    State.searchTerm = event.target.value.toLowerCase().trim();
    filterAndDisplayCourses();
    trackEvent('course_search', { search_term: State.searchTerm });
  }

  /**
   * Handle Sort Selection
   */
  function handleSort(event) {
    State.currentSort = event.target.value;
    filterAndDisplayCourses();
    trackEvent('sort_changed', { sort: State.currentSort });
  }

  /**
   * Handle Sort Order (Ascending/Descending)
   */
  function handleSortOrder(order) {
    State.currentOrder = order;
    DOM.sortButtons.forEach(btn => btn.classList.remove('active'));
    
    if (order === 'asc') {
      DOM.sortButtons[0].classList.add('active');
    } else {
      DOM.sortButtons[1].classList.add('active');
    }
    
    filterAndDisplayCourses();
    trackEvent('sort_order_changed', { order: order });
  }

  /**
   * Handle Sidebar Toggle
   */
  function handleSidebarToggle(event) {
    event.preventDefault();
    DOM.sidebarMenu?.classList.toggle('hidden');
    
    const isHidden = DOM.sidebarMenu?.classList.contains('hidden');
    localStorage.setItem('dashboard_sidebar_hidden', isHidden);
  }

  /**
   * Handle Course Actions (Edit, Delete, etc.)
   */
  function handleCourseAction(event) {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    const courseId = actionBtn.closest('.course_instructor_block')?.dataset.courseId;

    switch (action) {
      case 'edit':
        editCourse(courseId);
        break;
      case 'delete':
        deleteCourse(courseId);
        break;
      case 'offline':
        toggleOffline(courseId);
        break;
      case 'more':
        showCourseMenu(courseId, event);
        break;
    }
  }

  /**
   * Edit Course
   */
  function editCourse(courseId) {
    if (!courseId) return;
    
    const course = State.courses.find(c => c.id === courseId);
    if (course) {
      window.location.href = `/wp-admin/post.php?post=${courseId}&action=edit`;
    }
  }

  /**
   * Delete Course
   */
  function deleteCourse(courseId) {
    if (!courseId) return;
    
    const confirmed = confirm('Are you sure you want to delete this course? This action cannot be undone.');
    if (!confirmed) return;

    fetch(`${Config.apiUrl}/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        'X-WP-Nonce': window.wplms_course_data?.security || ''
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to delete course');
      
      // Remove from DOM
      document.querySelector(`[data-course-id="${courseId}"]`)?.remove();
      
      // Remove from state
      State.courses = State.courses.filter(c => c.id !== courseId);
      
      // Show notification
      showNotification('Course deleted successfully', 'success');
      trackEvent('course_deleted', { course_id: courseId });
    })
    .catch(error => {
      console.error('Error:', error);
      showNotification('Failed to delete course', 'error');
    });
  }

  /**
   * Toggle Course Offline Status
   */
  function toggleOffline(courseId) {
    if (!courseId) return;

    const course = State.courses.find(c => c.id === courseId);
    if (!course) return;

    const newOfflineStatus = !course.offline;

    fetch(`${Config.apiUrl}/courses/${courseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': window.wplms_course_data?.security || ''
      },
      body: JSON.stringify({ offline: newOfflineStatus })
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to update course');
      
      course.offline = newOfflineStatus;
      showNotification(
        newOfflineStatus ? 'Course enabled for offline' : 'Course disabled for offline',
        'success'
      );
      trackEvent('course_offline_toggled', { course_id: courseId, offline: newOfflineStatus });
    })
    .catch(error => {
      console.error('Error:', error);
      showNotification('Failed to update course offline status', 'error');
    });
  }

  /**
   * Filter and Display Courses
   */
  function filterAndDisplayCourses() {
    let filtered = State.courses.filter(course => {
      // Filter by tab (status)
      if (course.status !== State.currentTab) return false;
      
      // Filter by search term
      if (State.searchTerm) {
        const searchableText = `${course.title} ${course.instructor}`.toLowerCase();
        if (!searchableText.includes(State.searchTerm)) return false;
      }
      
      return true;
    });

    // Sort courses
    filtered = sortCourses(filtered, State.currentSort, State.currentOrder);
    
    State.filteredCourses = filtered;
    renderCourses(filtered);
  }

  /**
   * Sort Courses
   */
  function sortCourses(courses, sortBy, order) {
    const sorted = [...courses];

    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => new Date(b.created) - new Date(a.created));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'comment_count':
        sorted.sort((a, b) => b.rating_count - a.rating_count);
        break;
    }

    // Apply order
    if (order === 'asc') {
      sorted.reverse();
    }

    return sorted;
  }

  /**
   * Render Courses
   */
  function renderCourses(courses) {
    if (!DOM.courseContainer) return;

    DOM.courseContainer.innerHTML = '';

    if (courses.length === 0) {
      DOM.courseContainer.innerHTML = '<div class="no-courses-message">No courses found</div>';
      return;
    }

    courses.forEach(course => {
      const courseCard = createCourseCard(course);
      DOM.courseContainer.appendChild(courseCard);
    });

    // Add animations
    animateElements('.course_instructor_block');
  }

  /**
   * Create Course Card Element
   */
  function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course_instructor_block';
    card.dataset.courseId = course.id;

    card.innerHTML = `
      <div>
        <div class="course_featured_image">
          <img 
            src="${course.image || 'https://demos.wplms.io/wp-content/themes/wplms/assets/images/avatar.jpg'}" 
            alt="${course.title}"
            width="460"
            height="300"
            loading="lazy"
          >
          <div class="course_actions">
            <span></span>
            <div>
              <span class="vicon vicon-more rotate90" data-action="more"></span>
            </div>
          </div>
        </div>
        <div class="course_block_content_wrapper">
          <div class="course_title_wrapper">
            <div class="course_title">
              <h3>${course.title}</h3>
              <a class="offline" title="Enable offline" data-action="offline">
                <span class="offlineicon vicon vicon-save-alt"></span>
              </a>
            </div>
            <div class="course_instructor">
              <img src="${course.instructor_avatar || 'https://demos.wplms.io/wp-content/themes/wplms/assets/images/avatar.jpg'}" alt="${course.instructor}">
              <span>${course.instructor}</span>
            </div>
            ${course.categories ? `<div class="course_categories"><span>${course.categories}</span></div>` : ''}
          </div>
        </div>
      </div>
      <div class="course_meta">
        ${course.students ? `<span><span class="vicon vicon-user"></span> ${course.students}</span>` : ''}
        ${course.duration ? `<span><span class="vicon vicon-alarm-clock"></span> ${course.duration}</span>` : ''}
        ${course.completion !== undefined ? `<span><span class="vicon vicon-view-grid"></span> ${course.completion}</span>` : ''}
        ${course.rating !== undefined ? `<span><span class="vicon vicon-star"></span> ${course.rating}</span>` : ''}
      </div>
    `;

    return card;
  }

  /**
   * Load Courses from API
   */
  function loadCourses() {
    // Simulate loading courses - replace with actual API call
    fetch(`${Config.apiUrl}/courses?per_page=100`)
      .then(response => response.json())
      .then(data => {
        State.courses = data;
        filterAndDisplayCourses();
      })
      .catch(error => {
        console.error('Error loading courses:', error);
        showNotification('Failed to load courses', 'error');
        // Load demo data
        loadDemoCourses();
      });
  }

  /**
   * Load Demo Courses (Fallback)
   */
  function loadDemoCourses() {
    State.courses = [
      {
        id: 1,
        title: 'Microsoft Excel Advanced Excel Formulas & Functions',
        instructor: 'Shah Kanchi',
        image: 'https://sharvaconsulting.com/wp-content/uploads/2025/07/download-5.png',
        status: 'published',
        students: 57,
        duration: 57,
        completion: 100,
        rating: '5 (2)'
      },
      {
        id: 2,
        title: 'Power BI Masterclass - DAX, Excel And More',
        instructor: 'maheshmd@sharvagroup.com',
        image: 'https://sharvaconsulting.com/wp-content/uploads/2025/07/download-6.png',
        categories: 'Office Productivity',
        status: 'published',
        students: 2,
        duration: 2,
        rating: '0 (0)'
      }
    ];
    filterAndDisplayCourses();
  }

  /**
   * Initialize Tooltips
   */
  function initializeTooltips() {
    const tooltips = document.querySelectorAll('[title]');
    tooltips.forEach(el => {
      if (el.title) {
        el.addEventListener('mouseenter', function() {
          const tooltip = document.createElement('div');
          tooltip.className = 'tooltip-popup';
          tooltip.textContent = this.title;
          document.body.appendChild(tooltip);

          const rect = this.getBoundingClientRect();
          tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
          tooltip.style.left = (rect.left + (rect.width - tooltip.offsetWidth) / 2) + 'px';
        });

        el.addEventListener('mouseleave', function() {
          const tooltip = document.querySelector('.tooltip-popup');
          tooltip?.remove();
        });
      }
    });
  }

  /**
   * Show Notification
   */
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 4px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      z-index: 10000;
      animation: slideIn 0.3s ease-in-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Animate Elements
   */
  function animateElements(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
      el.style.animation = `fadeInUp 0.3s ease-in-out ${index * 50}ms forwards`;
      el.style.opacity = '0';
    });
  }

  /**
   * Handle Window Resize
   */
  function handleResize() {
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle('is-mobile', isMobile);
  }

  /**
   * Utility: Debounce Function
   */
  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Track Events (Analytics)
   */
  function trackEvent(eventName, eventData = {}) {
    if (window.gtag) {
      gtag('event', eventName, eventData);
    }
  }

  /**
   * Show Course Menu
   */
  function showCourseMenu(courseId, event) {
    event.preventDefault();
    const course = State.courses.find(c => c.id === courseId);
    if (!course) return;

    const menu = document.createElement('div');
    menu.className = 'course-action-menu';
    menu.innerHTML = `
      <button data-action="edit" data-course-id="${courseId}">Edit</button>
      <button data-action="delete" data-course-id="${courseId}">Delete</button>
      <button data-action="offline" data-course-id="${courseId}">Toggle Offline</button>
    `;

    document.body.appendChild(menu);

    // Position menu
    const rect = event.target.getBoundingClientRect();
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.left = (rect.left - menu.offsetWidth + 50) + 'px';

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== event.target) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 0);
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for testing
  window.DashboardApp = {
    State,
    Config,
    filterAndDisplayCourses,
    loadCourses
  };

})();