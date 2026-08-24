import React from 'react';
import { MessageSquare, Check, AlertCircle } from 'lucide-react';
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
    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4 pb-20 md:pb-12">
      {students.map((student) => {
        const sub = submissions[student.id] || { status: 'pending' };
        const isSubmitted = sub.status === 'submitted';
        const isPending = sub.status === 'pending';
        const isResubmit = sub.status === 'resubmit';
        const isExcused = sub.status === 'excused';

        const formattedNumber = `NO. ${student.number.toString().padStart(2, '0')}`;
        const hasNote = Boolean(sub.note || student.note);

        return (
          <div
            key={student.id}
            id={`student-card-${student.number}`}
            onClick={() => onToggleStatus(student.id)}
            className={`min-h-[105px] sm:min-h-[120px] md:min-h-[130px] p-3 sm:p-4 rounded-2xl border-2 transition-all duration-150 select-none cursor-pointer flex flex-col justify-between relative shadow-xs active:scale-[0.97] touch-manipulation ${
              isSubmitted
                ? 'bg-[#52794C] border-[#43643E] text-white hover:bg-[#486B43]'
                : isResubmit
                  ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#92400E] hover:bg-[#FEF3C7]'
                  : isExcused
                    ? 'bg-[#F3F4F6] border-[#D1D5DB] text-[#6B7280] opacity-75'
                    : 'bg-white border-[#E6E1D5] text-[#2D2A26] hover:border-[#A3B18A] hover:bg-[#FAF9F5]'
            }`}
          >
            {/* Top Row: Student Number & Note Action Button */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md tracking-wider ${
                    isSubmitted
                      ? 'bg-black/20 text-white'
                      : isResubmit
                        ? 'bg-[#FDE68A] text-[#92400E]'
                        : 'bg-[#F2EDE4] text-[#7D7568]'
                  }`}
                >
                  {formattedNumber}
                </span>

                {student.groupNumber && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded ${
                      isSubmitted
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F2EDE4] text-[#8C8375]'
                    }`}
                  >
                    {student.groupNumber}모둠
                  </span>
                )}
              </div>

              {/* Enlarged Memo / Student Note Button with friendly touch area */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStudentDetail(student);
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl transition-all shrink-0 ${
                  isSubmitted
                    ? hasNote
                      ? 'bg-white text-[#52794C] shadow-xs'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    : hasNote
                      ? 'bg-[#BC6C25] text-white shadow-xs ring-2 ring-[#BC6C25]/30'
                      : 'bg-[#F2EDE4] text-[#7D7568] hover:text-[#2D2A26] hover:bg-[#E5DFD3]'
                }`}
                title="학생 특이사항 및 메모 입력"
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Center: Large High-Legibility Student Name */}
            <div className="py-1 sm:py-2">
              <div
                className={`text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight truncate ${
                  isSubmitted
                    ? 'text-white'
                    : isResubmit
                      ? 'text-[#92400E]'
                      : isExcused
                        ? 'text-[#6B7280] line-through'
                        : 'text-[#1F1E1C]'
                }`}
              >
                {student.name}
              </div>

              {/* Note preview if exists */}
              {hasNote && (
                <div
                  className={`mt-0.5 text-[10px] sm:text-[11px] font-medium truncate max-w-full flex items-center gap-1 ${
                    isSubmitted
                      ? 'text-white/90 bg-black/15 px-1.5 py-0.5 rounded'
                      : 'text-[#BC6C25] bg-[#FAF0E6] px-1.5 py-0.5 rounded'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  <span className="truncate">{sub.note || student.note}</span>
                </div>
              )}
            </div>

            {/* Bottom: Submission Status Badge & Large Check Icon */}
            <div className="flex items-center justify-between pt-1 border-t border-current/10">
              <span
                className={`text-[10px] sm:text-xs font-bold tracking-tight ${
                  isSubmitted
                    ? 'text-white'
                    : isResubmit
                      ? 'text-[#D97706]'
                      : isExcused
                        ? 'text-[#9CA3AF]'
                        : 'text-[#8C8375]'
                }`}
              >
                {isSubmitted
                  ? '완료'
                  : isResubmit
                    ? '보완'
                    : isExcused
                      ? '면제'
                      : '미제출'}
              </span>

              <div className="shrink-0">
                {isSubmitted ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-[#52794C] flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  </div>
                ) : isResubmit ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F59E0B] text-white flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                ) : (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[#D1CABF] flex items-center justify-center" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
