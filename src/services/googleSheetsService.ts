import { Assignment, Student, SubmissionItem, GoogleSheetsConfig, ClassRoom } from '../types';

/**
 * Triggers automated webhook dispatch to Google Apps Script
 */
export const syncToGoogleSheetsWebhook = async (
  config: GoogleSheetsConfig,
  classRoom: ClassRoom,
  assignment: Assignment,
  students: Student[],
  submissions: Record<string, SubmissionItem>
): Promise<boolean> => {
  if (!config.webhookUrl) return false;

  try {
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
        sub.status === 'submitted' ? (assignment.dueDate || new Date().toLocaleDateString('ko-KR')) : '-',
        sub.note || st.note || ''
      ];
    });

    await fetch(config.webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        className: `${classRoom.schoolName} ${classRoom.grade}학년 ${classRoom.classNumber}반`,
        assignmentTitle: assignment.title,
        assignmentCategory: assignment.category,
        dueDate: assignment.dueDate || '',
        updatedAt: new Date().toISOString(),
        rows,
      })
    });

    return true;
  } catch (err) {
    console.error('Google Sheets webhook sync error:', err);
    return false;
  }
};
