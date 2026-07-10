import type { EntityRecord } from '../types';

type ListFn = (entity: string) => EntityRecord[];

/**
 * A lightweight, fully-local "AI agent". It interprets the admin's question via
 * keyword intent matching and answers using live numbers from the data store.
 */
export function answer(query: string, list: ListFn): string {
  const q = query.toLowerCase().trim();
  const courses = list('courses');
  const students = list('students');
  const instructors = list('instructors');
  const quizzes = list('quizzes');
  const assignments = list('assignments');

  const enrolled = courses.reduce((s, c) => s + Number(c.students || 0), 0);
  const has = (...keys: string[]) => keys.some((k) => q.includes(k));

  if (!q) return 'Ask me anything about your courses, students, or performance.';

  if (has('hello', 'hi ', 'hey', 'namaste') || q === 'hi')
    return `Hello! 👋 I'm your SG Pro Growth assistant. I can summarise students, course performance, instructors and more. Try "Which course is most popular?" or "Average completion rate?"`;

  if (has('help', 'what can you', 'capabilit'))
    return [
      'I can answer questions like:',
      '• "How many students are enrolled?"',
      '• "Which is the top course?"',
      '• "Average completion rate?"',
      '• "Show instructor performance"',
      '• "How are quizzes / assignments doing?"',
      '• "Which students are at risk?"',
    ].join('\n');

  if (has('revenue', 'sales', 'earning', 'income', 'money', 'order')) {
    return 'Commerce and orders are not tracked in this portal. I can help with course enrolments, completion rates, quizzes, assignments, and student progress instead.';
  }

  if (has('enroll', 'how many student', 'student count', 'total student', 'learners')) {
    return `There are ${enrolled} enrolments across all courses, with ${students.length} active member profiles tracked in the system.`;
  }

  if (has('top course', 'best course', 'popular', 'most student', 'highest')) {
    const top = [...courses].sort((a, b) => Number(b.students) - Number(a.students))[0];
    return `The most popular course is "${top?.title}" with ${top?.students} students (instructor: ${top?.instructor}, rating ${top?.rating}/5).`;
  }

  if (has('completion', 'progress', 'finish')) {
    const withStudents = courses.filter((c) => Number(c.students) > 0);
    const avg = Math.round(
      withStudents.reduce((s, c) => s + Number(c.completion || 0), 0) / (withStudents.length || 1),
    );
    return `Average course completion is ${avg}% across active courses. ${
      avg < 50 ? 'That is low — consider nudges, reminders, or shorter modules.' : 'That is healthy engagement.'
    }`;
  }

  if (has('instructor', 'teacher', 'faculty')) {
    const top = [...instructors].sort((a, b) => Number(b.students) - Number(a.students))[0];
    const lines = instructors
      .map((i) => `• ${i.name}: ${i.courses} courses, ${i.students} students (${i.commission}% commission)`)
      .join('\n');
    return `There are ${instructors.length} instructors. Top performer: ${top?.name} with ${top?.students} students.\n${lines}`;
  }

  if (has('quiz', 'assessment', 'score')) {
    const avg = Math.round(quizzes.reduce((s, x) => s + Number(x.avgScore || 0), 0) / (quizzes.length || 1));
    return `There are ${quizzes.length} quizzes with an average score of ${avg}%. ${
      avg >= 75 ? 'Students are performing well.' : 'Some students may need extra support.'
    }`;
  }

  if (has('assignment', 'submission', 'homework')) {
    const subs = assignments.reduce((s, a) => s + Number(a.submissions || 0), 0);
    return `There are ${assignments.length} assignments with ${subs} total submissions. ${assignments
      .map((a) => `"${a.title}" (${a.submissions} subs)`)
      .join(', ')}.`;
  }

  if (has('at risk', 'risk', 'struggl', 'weak', 'low progress')) {
    const risky = students.filter((s) => Number(s.progress) < 55);
    if (risky.length === 0) return 'Good news — no students are currently below 55% progress. 🎉';
    return `${risky.length} student(s) are at risk (progress < 55%): ${risky
      .map((s) => `${s.name} (${s.progress}%)`)
      .join(', ')}. Tip: open the Digital Twin to model interventions.`;
  }

  if (has('predict', 'grade', 'digital twin', 'twin', 'forecast')) {
    return 'Head to the Course Digital Twin to simulate grades. Increasing self-study to ~15 hrs/week and attendance above 80% typically lifts predicted grades by 12–18 points.';
  }

  if (has('map', 'active', 'online', 'where')) {
    return 'Open the Live User Map to see active students and instructors in real time across cities. Markers pulse green when a user is currently online.';
  }

  if (has('course', 'how many course')) {
    const published = courses.filter((c) => c.status === 'published').length;
    return `You have ${courses.length} courses (${published} published). Total enrolments: ${enrolled}.`;
  }

  if (has('summary', 'overview', 'how are we', 'report', 'status')) {
    return `📊 Snapshot: ${courses.length} courses, ${enrolled} enrolments, ${instructors.length} instructors, ${quizzes.length} quizzes, ${assignments.length} assignments. Ask me to drill into any of these.`;
  }

  return `I can help with students, course performance, instructors, quizzes, assignments, at-risk learners, predictions and the live map. Type "help" to see examples.`;
}

export const SUGGESTIONS = [
  'Give me an overview',
  'Which course is most popular?',
  'Average completion rate?',
  'Which students are at risk?',
  'Show instructor performance',
  'How are quizzes doing?',
];
