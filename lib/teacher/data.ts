/**
 * Teacher & Class Management Data Layer
 * Supports Phase 6: Teacher Flow (Classes, Students, Progress, Assessments, Submissions, Analytics).
 */

export interface StudentProgressItem {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  completionRate: number; // percentage 0-100
  tasksPending: number;
  studyMinutes7d: number;
  weakArea: string;
  status: "on_track" | "needs_attention" | "at_risk";
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TeacherAssessment {
  id: string;
  title: string;
  subject: string;
  classCode: string;
  totalMarks: number;
  dueDate: string;
  questions: AssessmentQuestion[];
  submissionCount: number;
  totalStudents: number;
  status: "published" | "draft" | "closed";
}

export interface StudentSubmission {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
  status: "graded" | "pending_review";
  feedback?: string;
}

export const SAMPLE_TEACHER_CLASSES = [
  { id: "cls-cs201", code: "CS201", name: "Data Structures & Algorithms", semester: "Sem 4", studentsCount: 42 },
  { id: "cls-ma102", code: "MA102", name: "Engineering Mathematics II", semester: "Sem 2", studentsCount: 58 },
];

export const SAMPLE_STUDENTS: StudentProgressItem[] = [
  {
    id: "std-01",
    name: "Aarav Sharma",
    email: "aarav@university.edu",
    rollNo: "CS23-014",
    completionRate: 88,
    tasksPending: 1,
    studyMinutes7d: 340,
    weakArea: "Graph Traversal",
    status: "on_track",
  },
  {
    id: "std-02",
    name: "Diya Patel",
    email: "diya@university.edu",
    rollNo: "CS23-022",
    completionRate: 94,
    tasksPending: 0,
    studyMinutes7d: 410,
    weakArea: "Dynamic Programming",
    status: "on_track",
  },
  {
    id: "std-03",
    name: "Rohan Verma",
    email: "rohan@university.edu",
    rollNo: "CS23-045",
    completionRate: 42,
    tasksPending: 4,
    studyMinutes7d: 60,
    weakArea: "Binary Search Trees",
    status: "at_risk",
  },
  {
    id: "std-04",
    name: "Ananya Iyer",
    email: "ananya@university.edu",
    rollNo: "CS23-059",
    completionRate: 65,
    tasksPending: 2,
    studyMinutes7d: 150,
    weakArea: "Calculus Limits",
    status: "needs_attention",
  },
  {
    id: "std-05",
    name: "Kabir Singh",
    email: "kabir@university.edu",
    rollNo: "CS23-071",
    completionRate: 35,
    tasksPending: 5,
    studyMinutes7d: 45,
    weakArea: "Linear Algebra & Matrices",
    status: "at_risk",
  },
];

export const SAMPLE_ASSESSMENTS: TeacherAssessment[] = [
  {
    id: "asm-01",
    title: "Mid-Term Quiz: Trees & Balanced Search Structures",
    subject: "Data Structures & Algorithms",
    classCode: "CS201",
    totalMarks: 20,
    dueDate: "2026-09-30",
    submissionCount: 38,
    totalStudents: 42,
    status: "published",
    questions: [
      {
        id: "q1",
        question: "What is the worst-case time complexity for searching an element in an unbalanced Binary Search Tree?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctIndex: 2,
        explanation: "When a BST is completely unbalanced (skewed), it degenerates into a linked list of length n.",
      },
      {
        id: "q2",
        question: "Which tree traversal visits the root node between the left and right subtrees?",
        options: ["Pre-order", "In-order", "Post-order", "Level-order"],
        correctIndex: 1,
        explanation: "In-order traversal visits left subtree, then root, then right subtree.",
      },
    ],
  },
  {
    id: "asm-02",
    title: "Assignment: Differential Calculus Applications",
    subject: "Engineering Mathematics II",
    classCode: "MA102",
    totalMarks: 30,
    dueDate: "2026-10-05",
    submissionCount: 45,
    totalStudents: 58,
    status: "published",
    questions: [
      {
        id: "q1",
        question: "If f(x) = x³ - 3x² + 4, what are the critical points?",
        options: ["x = 0 and x = 2", "x = 1 and x = -1", "x = 3 and x = 0", "x = 2 and x = 4"],
        correctIndex: 0,
        explanation: "f'(x) = 3x² - 6x = 3x(x - 2) = 0, giving critical points x = 0 and x = 2.",
      },
    ],
  },
];

export const SAMPLE_SUBMISSIONS: StudentSubmission[] = [
  {
    id: "sub-01",
    assessmentId: "asm-01",
    assessmentTitle: "Mid-Term Quiz: Trees & Balanced Search Structures",
    studentName: "Aarav Sharma",
    studentEmail: "aarav@university.edu",
    score: 18,
    totalMarks: 20,
    submittedAt: "2026-09-18T14:30:00Z",
    status: "graded",
    feedback: "Excellent understanding of tree balance and traversal algorithms.",
  },
  {
    id: "sub-02",
    assessmentId: "asm-01",
    assessmentTitle: "Mid-Term Quiz: Trees & Balanced Search Structures",
    studentName: "Diya Patel",
    studentEmail: "diya@university.edu",
    score: 20,
    totalMarks: 20,
    submittedAt: "2026-09-18T16:15:00Z",
    status: "graded",
    feedback: "Perfect score. Clear problem analysis.",
  },
  {
    id: "sub-03",
    assessmentId: "asm-01",
    assessmentTitle: "Mid-Term Quiz: Trees & Balanced Search Structures",
    studentName: "Rohan Verma",
    studentEmail: "rohan@university.edu",
    score: 10,
    totalMarks: 20,
    submittedAt: "2026-09-19T11:00:00Z",
    status: "graded",
    feedback: "Review skewed BST edge cases and re-attempt practice quiz in AIESES learning hub.",
  },
  {
    id: "sub-04",
    assessmentId: "asm-02",
    assessmentTitle: "Assignment: Differential Calculus Applications",
    studentName: "Ananya Iyer",
    studentEmail: "ananya@university.edu",
    score: 25,
    totalMarks: 30,
    submittedAt: "2026-09-20T09:45:00Z",
    status: "graded",
    feedback: "Good work on derivative derivation; double check boundary conditions.",
  },
];
