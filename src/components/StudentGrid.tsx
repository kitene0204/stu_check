import React from 'react';
import { MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { Student, SubmissionStatus } from '../types';

interface StudentGridProps {
  students: Student[];
  submissions: Record<string, { status: SubmissionStatus; note?: string }>;
  onToggleStatus: (studentId: string) => void;
  onOpenStudentDetail: (student: Student) => void;
}

export const StudentGrid: React.FC<StudentGridProps> = ({
  students,
  submissions,
  onToggleStatus,
  onOpenStudentDetail,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pb-8">
      {students.map((student) => {
        const sub = submissions[student.id] || { status: 'pending' };
        const isSubmitted = sub.status === 'submitted';
        const isPending = sub.status === 'pending';
        const isResubmit = sub.status === 'resubmit';
        const isExcused = sub.status === 'excused';

        const formattedNumber = student.number.toString().padStart(2, '0');

        // Natural Tones card styles matching the design HTML
        let cardStyle = 'bg-[#F9F8F5] border-[#EEECE6] text-[#3D3A35]';
        let numberStyle = 'text-[#B0AA9E]';
        let nameStyle = 'text-[#3D3A35] font-semibold';

        if (isSubmitted) {
          cardStyle = 'bg-[#F9F8F5] border-[#EEECE6] text-[#3D3A35] hover:bg-[#F2EDE4]/60';
          numberStyle = 'text-[#B0AA9E]';
          nameStyle = 'font-semibold text-[#3D3A35]';
        } else if (isPending) {
          // Highlight unsubmitted card in warm terracotta
          cardStyle = 'bg-[#FAF3F0] border-[#F2E4DF] border-l-4 border-l-[#BC6C25] shadow-xs hover:bg-[#F7ECE7]';
          numberStyle = 'text-[#D2A190]';
          nameStyle = 'font-semibold text-[#8C4A1A]';
        } else if (isResubmit) {
          // Re-submit needed
          cardStyle = 'bg-[#FEF8EC] border-[#F3E2B8] border-l-4 border-l-[#D97706] shadow-xs hover:bg-[#FDF3DE]';
          numberStyle = 'text-[#D97706]';
          nameStyle = 'font-semibold text-[#B45309]';
        } else if (isExcused) {
          cardStyle = 'bg-[#F5F5F3] border-[#E5E5E0] opacity-60';
          numberStyle = 'text-[#A89F91]';
          nameStyle = 'font-medium text-[#736B5E] line-through';
        }

        return (
          <div
            key={student.id}
            id={`student-card-${student.number}`}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all select-none group relative ${cardStyle}`}
          >
            {/* Left: Student Number & Name */}
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1 py-1"
              onClick={() => onToggleStatus(student.id)}
            >
              <span className={`text-xs font-bold ${numberStyle}`}>
                {formattedNumber}
              </span>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm ${nameStyle}`}>
                    {student.name}
                  </span>
                  {student.groupNumber && (
                    <span className="text-[10px] text-[#A89F91] font-normal px-1 bg-black/5 rounded">
                      {student.groupNumber}모둠
                    </span>
                  )}
                </div>

                {/* Optional Status Note */}
                {(sub.note || student.note) && (
                  <span className="text-[11px] text-[#BC6C25] truncate max-w-[130px] font-medium">
                    {sub.note || student.note}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Note Trigger & Checkbox */}
            <div className="flex items-center gap-2 pl-2">
              {/* Note Icon / Edit */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStudentDetail(student);
                }}
                className={`p-1 rounded-md transition-colors ${
                  sub.note || student.note
                    ? 'text-[#BC6C25] hover:bg-[#BC6C25]/10'
                    : 'text-[#DCD5C8] opacity-0 group-hover:opacity-100 hover:text-[#5D574F] hover:bg-black/5'
                }`}
                title="학생 특이사항 및 메모 입력"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>

              {/* Status Checkbox */}
              <input
                type="checkbox"
                checked={isSubmitted}
                onChange={() => onToggleStatus(student.id)}
                className="w-5 h-5 rounded border-[#DCD5C8] accent-[#A3B18A] cursor-pointer"
                title={isSubmitted ? '제출 완료' : '미제출 (클릭 시 제출 완료)'}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
