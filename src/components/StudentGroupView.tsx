import React from 'react';
import { Users, CheckCircle2, AlertCircle, MessageSquare, Check } from 'lucide-react';
import { Student, SubmissionStatus } from '../types';

interface StudentGroupViewProps {
  students: Student[];
  submissions: Record<string, { status: SubmissionStatus; note?: string }>;
  onToggleStatus: (studentId: string) => void;
  onOpenStudentDetail: (student: Student) => void;
}

export const StudentGroupView: React.FC<StudentGroupViewProps> = ({
  students,
  submissions,
  onToggleStatus,
  onOpenStudentDetail,
}) => {
  // Group students by groupNumber
  const groups: Record<number, Student[]> = {};

  students.forEach((student) => {
    const g = student.groupNumber || 1;
    if (!groups[g]) groups[g] = [];
    groups[g].push(student);
  });

  const groupKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
      {groupKeys.map((groupNum) => {
        const groupStudents = groups[groupNum];
        const submittedInGroup = groupStudents.filter(
          st => (submissions[st.id]?.status === 'submitted')
        ).length;
        const isGroupAllDone = submittedInGroup === groupStudents.length && groupStudents.length > 0;

        return (
          <div
            key={groupNum}
            className="bg-[#F9F8F5] rounded-2xl border border-[#EEECE6] p-4 flex flex-col justify-between shadow-xs"
          >
            <div>
              {/* Group Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EEECE6]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#52794C] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {groupNum}
                  </div>
                  <h3 className="font-bold text-sm text-[#3D3A35]">
                    {groupNum}모둠 ({groupStudents.length}명)
                  </h3>
                </div>

                <span 
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    isGroupAllDone 
                      ? 'bg-[#E8F3E5] text-[#2D6A4F] border border-[#CDE4C8]' 
                      : 'bg-[#FAF3F0] text-[#8C4A1A] border border-[#F2E4DF]'
                  }`}
                >
                  {isGroupAllDone ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#52794C]" />
                      <span>전원 완료</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-[#BC6C25]" />
                      <span>{submittedInGroup}/{groupStudents.length}명</span>
                    </>
                  )}
                </span>
              </div>

              {/* Student Rows in Group */}
              <div className="space-y-2">
                {groupStudents.map((st) => {
                  const sub = submissions[st.id] || { status: 'pending' };
                  const isSubmitted = sub.status === 'submitted';
                  const isPending = sub.status === 'pending';
                  const isResubmit = sub.status === 'resubmit';

                  return (
                    <div
                      key={st.id}
                      onClick={() => onToggleStatus(st.id)}
                      className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] select-none ${
                        isSubmitted
                          ? 'bg-[#52794C] border-[#43643E] text-white shadow-xs'
                          : isResubmit
                            ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#92400E]'
                            : 'bg-white border-[#E6E1D5] hover:border-[#A3B18A] text-[#2D2A26]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            isSubmitted
                              ? 'bg-black/20 text-white'
                              : 'bg-[#F2EDE4] text-[#7D7568]'
                          }`}
                        >
                          {st.number.toString().padStart(2, '0')}
                        </span>
                        <div className="flex flex-col">
                          <span
                            className={`text-base font-bold tracking-tight ${
                              isSubmitted
                                ? 'text-white'
                                : isResubmit
                                  ? 'text-[#92400E]'
                                  : 'text-[#2D2A26]'
                            }`}
                          >
                            {st.name}
                          </span>
                          {sub.note && (
                            <span
                              className={`text-[11px] truncate max-w-[140px] font-medium ${
                                isSubmitted
                                  ? 'text-white/90'
                                  : 'text-[#BC6C25]'
                              }`}
                            >
                              {sub.note}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Note trigger */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStudentDetail(st);
                          }}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                            isSubmitted
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-[#F2EDE4] text-[#7D7568] hover:bg-[#E5DFD3] hover:text-[#2D2A26]'
                          }`}
                          title="학생 메모 입력"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Status Checkbox Icon */}
                        {isSubmitted ? (
                          <div className="w-6 h-6 rounded-full bg-white text-[#52794C] flex items-center justify-center">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-[#D1CABF]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
