import type { DataMap, EntityRecord } from '../types.js';

function has(q: string, ...keys: string[]) {
  return keys.some((k) => q.includes(k));
}

/** Keyword fallback when no LLM API key is configured. */
export function localAssistantAnswer(query: string, entities: DataMap): string {
  const q = query.toLowerCase().trim();
  const courses = entities.courses ?? [];
  const students = entities.students ?? [];
  const instructors = entities.instructors ?? [];
  const quizzes = entities.quizzes ?? [];
  const assignments = entities.assignments ?? [];

  const enrolled = courses.reduce((s, c) => s + Number(c.students || 0), 0);

  if (!q) return 'Ask me anything about your courses, students, or performance.';

  if (has(q, 'hello', 'hi ', 'hey', 'namaste') || q === 'hi')
    return `Hello! 👋 I'm your SG Pro Growth assistant. I can summarise students, course performance, instructors and more.`;

  if (has(q, 'help', 'what can you', 'capabilit'))
    return [
      'I can answer questions like:',
      '• "How many students are enrolled?"',
      '• "Which is the top course?"',
      '• "Average completion rate?"',
      '• "Which students are at risk?"',
      '',
      'Add LLM_API_KEY on the server for open-ended answers and write actions.',
    ].join('\n');

  if (has(q, 'enroll', 'how many student', 'student count', 'total student', 'learners'))
    return `There are ${enrolled} enrolments across all courses, with ${students.length} student profiles.`;

  if (has(q, 'top course', 'best course', 'popular', 'most student', 'highest')) {
    const top = [...courses].sort((a, b) => Number(b.students) - Number(a.students))[0];
    return top
      ? `The most popular course is "${top.title}" with ${top.students} students.`
      : 'No courses found.';
  }

  if (has(q, 'completion', 'progress', 'finish')) {
    const withStudents = courses.filter((c) => Number(c.students) > 0);
    const avg = Math.round(
      withStudents.reduce((s, c) => s + Number(c.completion || 0), 0) / (withStudents.length || 1),
    );
    return `Average course completion is ${avg}%.`;
  }

  if (has(q, 'instructor', 'teacher', 'faculty')) {
    const top = [...instructors].sort((a, b) => Number(b.students) - Number(a.students))[0];
    return `There are ${instructors.length} instructors. Top performer: ${top?.name ?? 'N/A'}.`;
  }

  if (has(q, 'at risk', 'risk', 'struggl', 'weak', 'low progress')) {
    const risky = students.filter((s) => Number(s.progress) < 55);
    if (risky.length === 0) return 'No students are currently below 55% progress.';
    return `${risky.length} at-risk student(s): ${risky.map((s) => `${s.name} (${s.progress}%)`).join(', ')}.`;
  }

  if (has(q, 'summary', 'overview', 'how are we', 'report', 'status'))
    return `📊 ${courses.length} courses, ${enrolled} enrolments, ${instructors.length} instructors, ${quizzes.length} quizzes, ${assignments.length} assignments.`;

  return 'Try asking about students, courses, completion rates, or at-risk learners. Set LLM_API_KEY for full AI capabilities.';
}

export function listForLocal(entities: DataMap, entity: string): EntityRecord[] {
  return entities[entity] ?? [];
}
