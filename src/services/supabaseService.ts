import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Student, Assignment, SubmissionStatus, SupabaseConfig, SubmissionMap, ClassRoom } from '../types';

let supabaseClient: SupabaseClient | null = null;
let currentConfigKey = '';

export const initSupabase = (config: SupabaseConfig): SupabaseClient | null => {
  if (!config.isEnabled || !config.url || !config.anonKey) {
    return null;
  }

  const key = `${config.url.trim()}:::${config.anonKey.trim()}`;
  if (supabaseClient && currentConfigKey === key) {
    return supabaseClient;
  }

  try {
    supabaseClient = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: { persistSession: false },
    });
    currentConfigKey = key;
    return supabaseClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
};

/**
 * Fetch all remote class data from Supabase:
 * 1. class_metadata (contains full students array & class info if configured)
 * 2. class_students / participants (if individual rows exist)
 * 3. class_submissions (submission map)
 * 4. class_assignments (if assignments exist)
 */
export const fetchSupabaseData = async (
  config: SupabaseConfig,
  classRoomId: string
): Promise<{
  students: Student[];
  assignments: Assignment[];
  submissionsMap: SubmissionMap;
  classRoom?: Partial<ClassRoom>;
}> => {
  const client = initSupabase(config);
  if (!client) {
    return { students: [], assignments: [], submissionsMap: {} };
  }

  let remoteStudents: Student[] = [];
  let remoteAssignments: Assignment[] = [];
  const submissionsMap: SubmissionMap = {};
  let remoteClassRoom: Partial<ClassRoom> | undefined = undefined;

  // 1. Try to fetch from class_metadata
  try {
    const { data: metaData, error: metaError } = await client
      .from('class_metadata')
      .select('*')
      .eq('class_id', classRoomId)
      .maybeSingle();

    if (!metaError && metaData) {
      if (metaData.students && Array.isArray(metaData.students) && metaData.students.length > 0) {
        remoteStudents = metaData.students;
      }
      if (metaData.assignments && Array.isArray(metaData.assignments) && metaData.assignments.length > 0) {
        remoteAssignments = metaData.assignments;
      }
      if (metaData.classroom_data) {
        remoteClassRoom = metaData.classroom_data;
      }
    }
  } catch (e) {
    // class_metadata table may not exist yet, proceed
  }

  // 2. Try to fetch from class_students or participants table if students still empty
  if (remoteStudents.length === 0) {
    try {
      const { data: studentsData, error: studentsError } = await client
        .from('class_students')
        .select('*')
        .eq('class_id', classRoomId)
        .order('number', { ascending: true });

      if (!studentsError && studentsData && studentsData.length > 0) {
        remoteStudents = studentsData.map((row: any) => ({
          id: row.id || row.student_id || `st-${row.number}`,
          number: Number(row.number) || 1,
          name: row.name || '',
          gender: row.gender === 'F' ? 'F' : 'M',
          groupNumber: row.group_number ? Number(row.group_number) : 1,
          note: row.note || '',
        }));
      }
    } catch (e) {
      // Table may not exist
    }
  }

  // 3. Try to fetch from class_submissions
  try {
    const { data: subsData, error: subsError } = await client
      .from('class_submissions')
      .select('*')
      .eq('class_id', classRoomId);

    if (!subsError && subsData) {
      subsData.forEach((row: any) => {
        if (!submissionsMap[row.assignment_id]) {
          submissionsMap[row.assignment_id] = {};
        }
        submissionsMap[row.assignment_id][row.student_id] = {
          status: row.status as SubmissionStatus,
          note: row.note || undefined,
          updatedAt: row.updated_at,
        };
      });
    }
  } catch (e) {
    console.error('Supabase submissions fetch error:', e);
  }

  return {
    students: remoteStudents,
    assignments: remoteAssignments,
    submissionsMap,
    classRoom: remoteClassRoom,
  };
};

/**
 * Upsert submission items for an assignment to Supabase
 */
export const upsertSubmissionsToSupabase = async (
  config: SupabaseConfig,
  classRoomId: string,
  assignmentId: string,
  items: { studentId: string; status: SubmissionStatus; note?: string; updatedAt: string }[]
): Promise<boolean> => {
  const client = initSupabase(config);
  if (!client) return false;

  try {
    const payload = items.map(item => ({
      class_id: classRoomId,
      assignment_id: assignmentId,
      student_id: item.studentId,
      status: item.status,
      note: item.note || null,
      updated_at: item.updatedAt,
    }));

    const { error } = await client
      .from('class_submissions')
      .upsert(payload, { onConflict: 'class_id,assignment_id,student_id' });

    if (error) {
      console.warn('Supabase upsert class_submissions warning/error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase upsert failed:', e);
    return false;
  }
};

/**
 * Sync Students Roster to Supabase (both class_metadata and class_students if possible)
 */
export const syncStudentsToSupabase = async (
  config: SupabaseConfig,
  classRoomId: string,
  students: Student[]
): Promise<boolean> => {
  const client = initSupabase(config);
  if (!client) return false;

  let success = false;

  // 1. Upsert into class_metadata
  try {
    const { error: metaError } = await client
      .from('class_metadata')
      .upsert({
        class_id: classRoomId,
        students: students,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'class_id' });

    if (!metaError) {
      success = true;
    }
  } catch (e) {
    // Ignore if table not created
  }

  // 2. Also upsert into class_students table if it exists
  try {
    const rows = students.map(st => ({
      id: st.id,
      class_id: classRoomId,
      student_id: st.id,
      number: st.number,
      name: st.name,
      gender: st.gender || 'M',
      group_number: st.groupNumber || 1,
      note: st.note || null,
      updated_at: new Date().toISOString(),
    }));

    const { error: stError } = await client
      .from('class_students')
      .upsert(rows, { onConflict: 'class_id,id' });

    if (!stError) {
      success = true;
    }
  } catch (e) {
    // Ignore if table not created
  }

  return success;
};

/**
 * Sync Assignments to Supabase
 */
export const syncAssignmentsToSupabase = async (
  config: SupabaseConfig,
  classRoomId: string,
  assignments: Assignment[]
): Promise<boolean> => {
  const client = initSupabase(config);
  if (!client) return false;

  try {
    const { error } = await client
      .from('class_metadata')
      .upsert({
        class_id: classRoomId,
        assignments: assignments,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'class_id' });

    return !error;
  } catch (e) {
    return false;
  }
};

/**
 * Sync Full Class Bundle to Supabase
 */
export const syncFullClassBundleToSupabase = async (
  config: SupabaseConfig,
  classRoom: ClassRoom,
  students: Student[],
  assignments: Assignment[],
  submissionsMap: SubmissionMap
): Promise<boolean> => {
  const client = initSupabase(config);
  if (!client) return false;

  let allSuccess = true;

  // 1. Sync metadata
  try {
    await client
      .from('class_metadata')
      .upsert({
        class_id: classRoom.id,
        classroom_data: classRoom,
        students: students,
        assignments: assignments,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'class_id' });
  } catch (e) {
    allSuccess = false;
  }

  // 2. Sync students
  await syncStudentsToSupabase(config, classRoom.id, students);

  // 3. Sync submissions
  const allSubRows: { class_id: string; assignment_id: string; student_id: string; status: string; note: string | null; updated_at: string }[] = [];
  Object.entries(submissionsMap).forEach(([asgId, studentMap]) => {
    Object.entries(studentMap).forEach(([studentId, item]) => {
      allSubRows.push({
        class_id: classRoom.id,
        assignment_id: asgId,
        student_id: studentId,
        status: item.status,
        note: item.note || null,
        updated_at: item.updatedAt || new Date().toISOString(),
      });
    });
  });

  if (allSubRows.length > 0) {
    try {
      await client
        .from('class_submissions')
        .upsert(allSubRows, { onConflict: 'class_id,assignment_id,student_id' });
    } catch (e) {
      allSuccess = false;
    }
  }

  return allSuccess;
};

/**
 * Realtime Subscription for class_submissions and class_metadata
 */
export const subscribeToSubmissions = (
  config: SupabaseConfig,
  classRoomId: string,
  onRemoteUpdate: (payload: {
    class_id: string;
    assignment_id: string;
    student_id: string;
    status: string;
    note: string | null;
    updated_at: string;
  }) => void,
  onRosterUpdate?: (newStudents: Student[]) => void
): RealtimeChannel | null => {
  const client = initSupabase(config);
  if (!client) return null;

  try {
    const channel = client
      .channel(`realtime-class-${classRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_submissions',
          filter: `class_id=eq.${classRoomId}`,
        },
        (payload: any) => {
          if (payload.new) {
            onRemoteUpdate(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_metadata',
          filter: `class_id=eq.${classRoomId}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.students && onRosterUpdate) {
            if (Array.isArray(payload.new.students) && payload.new.students.length > 0) {
              onRosterUpdate(payload.new.students);
            }
          }
        }
      )
      .subscribe();

    return channel;
  } catch (e) {
    console.error('Failed to subscribe to realtime channel:', e);
    return null;
  }
};
