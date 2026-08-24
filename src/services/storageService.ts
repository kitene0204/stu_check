import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Student, Assignment, ClassRoom, SupabaseConfig, GoogleSheetsConfig, SubmissionMap, SubmissionItem } from '../types';
import { INITIAL_CLASS, INITIAL_STUDENTS, INITIAL_ASSIGNMENTS, INITIAL_SUBMISSION_MAP } from '../data/initialData';

const STORAGE_KEYS = {
  CLASS: 'class_tracker_classroom',
  STUDENTS: 'class_tracker_students',
  ASSIGNMENTS: 'class_tracker_assignments',
  SUBMISSIONS: 'class_tracker_submissions',
  SUPABASE_CONFIG: 'class_tracker_supabase_config',
  SHEETS_CONFIG: 'class_tracker_sheets_config',
};

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (config?: SupabaseConfig): SupabaseClient | null => {
  if (config && config.url && config.anonKey) {
    try {
      supabaseClient = createClient(config.url, config.anonKey);
      return supabaseClient;
    } catch (e) {
      console.error('Supabase initialization failed', e);
      return null;
    }
  }
  return supabaseClient;
};

export const loadClassRoom = (): ClassRoom => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CLASS);
    return data ? JSON.parse(data) : INITIAL_CLASS;
  } catch {
    return INITIAL_CLASS;
  }
};

export const saveClassRoom = (classRoom: ClassRoom): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CLASS, JSON.stringify(classRoom));
  } catch (e) {
    console.error(e);
  }
};

export const loadStudents = (): Student[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return data ? JSON.parse(data) : INITIAL_STUDENTS;
  } catch {
    return INITIAL_STUDENTS;
  }
};

export const saveStudents = (students: Student[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error(e);
  }
};

export const loadAssignments = (): Assignment[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    return data ? JSON.parse(data) : INITIAL_ASSIGNMENTS;
  } catch {
    return INITIAL_ASSIGNMENTS;
  }
};

export const saveAssignments = (assignments: Assignment[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  } catch (e) {
    console.error(e);
  }
};

export const loadSubmissions = (): SubmissionMap => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return data ? JSON.parse(data) : (INITIAL_SUBMISSION_MAP as SubmissionMap);
  } catch {
    return INITIAL_SUBMISSION_MAP as SubmissionMap;
  }
};

export const saveSubmissions = (submissions: SubmissionMap): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  } catch (e) {
    console.error(e);
  }
};

export const loadSupabaseConfig = (): SupabaseConfig => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.url && parsed.anonKey) return parsed;
    }
    
    // Check Vite Environment Variables (e.g. from Vercel deployment)
    const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
    const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

    if (envUrl && envKey) {
      return {
        url: envUrl,
        anonKey: envKey,
        isEnabled: true,
      };
    }

    return { url: '', anonKey: '', isEnabled: false };
  } catch {
    return { url: '', anonKey: '', isEnabled: false };
  }
};

export const saveSupabaseConfig = (config: SupabaseConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
};

export const loadSheetsConfig = (): GoogleSheetsConfig => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);
    return data ? JSON.parse(data) : { autoSyncEnabled: true };
  } catch {
    return { autoSyncEnabled: true };
  }
};

export const saveSheetsConfig = (config: GoogleSheetsConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
};

/**
 * Parses raw copied table text (from Excel, Google Sheets, or plain tab/comma-separated text)
 * Expected columns: 번호, 이름, 성별(선택), 모둠(선택), 비고(선택)
 */
export const parseStudentRosterText = (rawText: string): Student[] => {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const students: Student[] = [];

  let currentAutoNumber = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip header row if it contains '번호' or '이름'
    if (i === 0 && (line.includes('번호') || line.includes('이름') || line.includes('성명'))) {
      continue;
    }

    // Split by tab, comma, or multiple spaces
    const parts = line.includes('\t') 
      ? line.split('\t').map(s => s.trim()) 
      : line.includes(',') 
        ? line.split(',').map(s => s.trim())
        : line.split(/\s{2,}|\s+/).map(s => s.trim());

    if (parts.length === 0) continue;

    let num = parseInt(parts[0], 10);
    let name = '';
    let gender: 'M' | 'F' | undefined = undefined;
    let groupNumber: number | undefined = undefined;
    let note = '';

    if (!isNaN(num) && parts.length >= 2) {
      name = parts[1];
      if (parts[2]) {
        if (parts[2] === '남' || parts[2] === 'M' || parts[2] === '남학생') gender = 'M';
        else if (parts[2] === '여' || parts[2] === 'F' || parts[2] === '여학생') gender = 'F';
      }
      if (parts[3] && !isNaN(parseInt(parts[3], 10))) {
        groupNumber = parseInt(parts[3], 10);
      }
      if (parts[4]) note = parts[4];
    } else {
      // Just name per line
      num = currentAutoNumber;
      name = parts[0];
      if (parts[1]) {
        if (parts[1] === '남' || parts[1] === '여') gender = parts[1] === '남' ? 'M' : 'F';
        else note = parts[1];
      }
    }

    if (name) {
      students.push({
        id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        number: num || currentAutoNumber,
        name: name.replace(/[0-9]/g, '').trim() || name,
        gender,
        groupNumber: groupNumber || Math.ceil(num / 4) || 1,
        note,
      });
      currentAutoNumber = (num || currentAutoNumber) + 1;
    }
  }

  // Sort by student number ascending
  return students.sort((a, b) => a.number - b.number);
};

/**
 * Formats assignment submissions as TSV / CSV for easy copying into Google Sheets
 */
export const formatGoogleSheetData = (
  assignment: Assignment,
  students: Student[],
  submissions: Record<string, SubmissionItem>
): string => {
  const header = ['번호', '이름', '모둠', `${assignment.title} (제출상태)`, '제출일시', '비고'];
  const rows = students.map(st => {
    const sub = submissions[st.id] || { status: 'pending' };
    const statusKorean = 
      sub.status === 'submitted' ? '제출 완료 (O)' :
      sub.status === 'pending' ? '미제출 (X)' :
      sub.status === 'resubmit' ? '보완요청 (△)' : '면제 (-)';

    return [
      st.number,
      st.name,
      st.groupNumber ? `${st.groupNumber}모둠` : '-',
      statusKorean,
      sub.status === 'submitted' ? (assignment.dueDate || '확인완료') : '-',
      sub.note || st.note || ''
    ];
  });

  return [header.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
};
