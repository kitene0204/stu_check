export type SubmissionStatus = 'pending' | 'submitted' | 'resubmit' | 'excused';

export interface Student {
  id: string;
  number: number;
  name: string;
  gender?: 'M' | 'F';
  groupNumber?: number; // 모둠 (1~10)
  groupName?: string; // 소속 그룹/반 명칭 (예: "1반", "2반", "1모둠", "A그룹")
  note?: string;
}

export type AssignmentCategory = 
  | '과제' 
  | '가정통신문' 
  | '준비물' 
  | '수행평가' 
  | '우유/급식' 
  | '기타';

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  category: AssignmentCategory;
  dueDate: string; // YYYY-MM-DD or formatted
  description?: string;
  targetCount?: number;
  isArchived?: boolean;
  createdAt: string;
  targetType?: 'all' | 'custom' | 'group';
  targetGroupName?: string; // 대상 그룹/반 명칭 (예: "1반", "2반", "1모둠")
  targetStudentIds?: string[];
}

export interface SubmissionItem {
  status: SubmissionStatus;
  submittedAt?: string;
  updatedAt?: string;
  note?: string;
}

export type SubmissionMap = Record<string, Record<string, SubmissionItem>>;

export interface ClassRoom {
  id: string;
  schoolName: string;
  grade: number;
  classNumber: number;
  academicYear: number;
  teacherName?: string;
  customTitle?: string;
  customSubtitle?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isEnabled: boolean;
  lastSyncedAt?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetUrl?: string;
  webhookUrl?: string;
  sheetName?: string;
  autoSyncEnabled: boolean;
  lastExportedAt?: string;
}

export type ViewMode = 'grid' | 'list' | 'groups';
export type FilterMode = 'all' | 'pending' | 'submitted' | 'resubmit';
