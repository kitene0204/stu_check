import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Student, Assignment, SubmissionStatus, SupabaseConfig, SubmissionMap } from '../types';

let supabaseClient: SupabaseClient | null = null;
let currentConfigKey = '';

export const initSupabase = (config: SupabaseConfig): SupabaseClient | null => {
  if (!config.isEnabled || !config.url || !config.anonKey) {
    return null;
  }

  const key = `${config.url}:::${config.anonKey}`;
  if (supabaseClient && currentConfigKey === key) {
    return supabaseClient;
  }

  try {
    supabaseClient = createClient(config.url, config.anonKey);
    currentConfigKey = key;
    return supabaseClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
};

export const fetchSupabaseData = async (
  config: SupabaseConfig,
  classRoomId: string
): Promise<{
  students: Student[];
  assignments: Assignment[];
  submissionsMap: SubmissionMap;
}> => {
  const client = initSupabase(config);
  if (!client) {
    return { students: [], assignments: [], submissionsMap: {} };
  }

  try {
    // Fetch submissions
    const { data: subsData, error: subsError } = await client
      .from('class_submissions')
      .select('*')
      .eq('class_id', classRoomId);

    const submissionsMap: SubmissionMap = {};

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

    return {
      students: [],
      assignments: [],
      submissionsMap,
    };
  } catch (e) {
    console.error('Error fetching Supabase data:', e);
    return { students: [], assignments: [], submissionsMap: {} };
  }
};

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
      console.error('Supabase upsert error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase upsert failed:', e);
    return false;
  }
};

export const syncStudentsToSupabase = async (
  _config: SupabaseConfig,
  _classRoomId: string,
  _students: Student[]
): Promise<void> => {
  // Optional extension point if student table exists
};

export const syncAssignmentsToSupabase = async (
  _config: SupabaseConfig,
  _classRoomId: string,
  _assignments: Assignment[]
): Promise<void> => {
  // Optional extension point if assignments table exists
};

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
  }) => void
): RealtimeChannel | null => {
  const client = initSupabase(config);
  if (!client) return null;

  try {
    const channel = client
      .channel(`realtime-submissions-${classRoomId}`)
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
      .subscribe();

    return channel;
  } catch (e) {
    console.error('Failed to subscribe to realtime channel:', e);
    return null;
  }
};
