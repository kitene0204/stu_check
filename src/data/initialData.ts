import { Student, Assignment, ClassRoom } from '../types';

export const INITIAL_CLASS: ClassRoom = {
  id: 'class-3-2-2026',
  schoolName: '전주삼천초등학교',
  grade: 6,
  classNumber: 1,
  academicYear: 2026,
  teacherName: '김선생님',
};

export const INITIAL_STUDENTS: Student[] = [
  { id: 'st-1790391905404-ux76x-0', number: 1, name: '강윤찬', gender: 'M', groupNumber: 1, note: '' },
  { id: 'st-1790391905404-kqkje-1', number: 2, name: '강주연', gender: 'F', groupNumber: 1, note: '' },
  { id: 'st-1790391905404-wenoe-2', number: 3, name: '김민지', gender: 'F', groupNumber: 1, note: '' },
  { id: 'st-1790391905404-0qs1p-3', number: 4, name: '김진후', gender: 'M', groupNumber: 1, note: '' },
  { id: 'st-1790391905404-q0bac-4', number: 5, name: '김현지', gender: 'F', groupNumber: 2, note: '' },
  { id: 'st-1790391905404-hbeck-5', number: 6, name: '박채현', gender: 'F', groupNumber: 2, note: '' },
  { id: 'st-1790391905404-a69at-6', number: 7, name: '성서아', gender: 'F', groupNumber: 2, note: '' },
  { id: 'st-1790391905404-5gtay-7', number: 8, name: '송다정', gender: 'F', groupNumber: 2, note: '' },
  { id: 'st-1790391905404-cc7iu-8', number: 9, name: '엄호준', gender: 'M', groupNumber: 3, note: '' },
  { id: 'st-1790391905404-capsv-9', number: 10, name: '윤시우', gender: 'M', groupNumber: 3, note: '' },
  { id: 'st-1790391905404-g45r3-10', number: 11, name: '이솔빛나', gender: 'F', groupNumber: 3, note: '' },
  { id: 'st-1790391905404-e5bx9-11', number: 12, name: '이정', gender: 'M', groupNumber: 3, note: '' },
  { id: 'st-1790391905404-en1ue-12', number: 13, name: '전성후', gender: 'M', groupNumber: 4, note: '' },
  { id: 'st-1790391905404-zccdt-13', number: 14, name: '정혜원', gender: 'F', groupNumber: 4, note: '' },
  { id: 'st-1790391905404-ichxu-14', number: 15, name: '최예은', gender: 'F', groupNumber: 4, note: '' },
  { id: 'st-1790391905404-l94pt-15', number: 16, name: '한태은', gender: 'M', groupNumber: 4, note: '' },
  { id: 'st-1790391905404-zni8g-16', number: 17, name: '허은서', gender: 'F', groupNumber: 5, note: '' },
  { id: 'st-1790391905404-e0kq3-17', number: 18, name: '황혜리', gender: 'F', groupNumber: 5, note: '' },
  { id: 'st-1790391905404-2xv3t-18', number: 19, name: '김세은', gender: 'F', groupNumber: 5, note: '' },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-1790391882745',
    classId: 'class-3-2-2026',
    title: '중학교 입학원서 - 주민등록등본',
    dueDate: '2026-09-30',
    category: '과제',
    createdAt: '2026-09-26T03:04:42.745Z',
    description: '',
  },
  {
    id: 'asg-1790392364465',
    classId: 'class-3-2-2026',
    title: '가족관계 증명서',
    dueDate: '2026-09-26',
    category: '과제',
    createdAt: '2026-09-26T03:12:44.465Z',
    targetType: 'custom',
    description: '',
    targetStudentIds: [
      'st-1790391905404-ux76x-0',
      'st-1790391905404-hbeck-5',
      'st-1790391905404-a69at-6',
      'st-1790391905404-5gtay-7',
      'st-1790391905404-cc7iu-8',
      'st-1790391905404-capsv-9',
      'st-1790391905404-e5bx9-11',
      'st-1790391905404-zccdt-13',
    ],
  },
  {
    id: 'asg-1790392859801',
    classId: 'class-3-2-2026',
    title: '미등재 사유서',
    dueDate: '2026-09-26',
    category: '과제',
    createdAt: '2026-09-26T03:20:59.801Z',
    targetType: 'custom',
    description: '',
    targetStudentIds: [
      'st-1790391905404-ux76x-0',
      'st-1790391905404-hbeck-5',
      'st-1790391905404-a69at-6',
      'st-1790391905404-5gtay-7',
      'st-1790391905404-zccdt-13',
    ],
  },
];

export const INITIAL_SUBMISSION_MAP: Record<string, Record<string, { status: 'pending' | 'submitted' | 'resubmit' | 'excused'; note?: string }>> = {};
