import { Student, Assignment, ClassRoom } from '../types';

export const INITIAL_CLASS: ClassRoom = {
  id: 'class-6-1-2026',
  schoolName: '전주삼천초등학교',
  grade: 6,
  classNumber: 1,
  academicYear: 2026,
  teacherName: '김선생님',
};

export const INITIAL_STUDENTS: Student[] = [
  { id: 'st-01', number: 1, name: '이창민', gender: 'M', groupNumber: 1, note: '' },
  { id: 'st-02', number: 2, name: '강경욱', gender: 'M', groupNumber: 1, note: '' },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-test',
    classId: 'class-6-1-2026',
    title: 'Test',
    category: '과제',
    dueDate: '2026-08-26',
    description: '',
    createdAt: '2026-08-26T00:00:00Z',
  },
];

// Initial submission states mapped by assignmentId -> Record<studentId, StudentSubmission>
export const INITIAL_SUBMISSION_MAP: Record<string, Record<string, { status: 'pending' | 'submitted' | 'resubmit' | 'excused'; note?: string }>> = {
  'asg-test': {
    'st-01': { status: 'pending' },
    'st-02': { status: 'pending' },
  }
};
