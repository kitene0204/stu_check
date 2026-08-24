import React from 'react';
import { Users, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
      {groupKeys.map((groupNum) => {
        const groupStudents = groups[groupNum];
        const submittedInGroup = groupStudents.filter(
          st => (submissions[st.id]?.status === 'submitted')
        ).length;
        const isGroupAllDone = submittedInGroup === groupStudents.length;

        return (
          <div
            key={groupNum}
            className="bg-[#F9F8F5] rounded-2xl border border-[#EEECE6] p-4 flex flex-col justify-between shadow-xs"
          >
            <div>
              {/* Group Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EEECE6]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#A3B18A]/20 text-[#2D4A22] flex items-center justify-center text-xs font-bold">
                    {groupNum}
                  </div>
                  <h3 className="font-bold text-sm text-[#3D3A35]">
                    {groupNum}모둠 ({groupStudents.length}명)
                  </h3>
                </div>

                <span 
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isGroupAllDone 
                      ? 'bg-[#F0F5EC] text-[#2D4A22] border border-[#D5E2CD]' 
                      : 'bg-[#FAF3F0] text-[#8C4A1A] border border-[#F2E4DF]'
                  }`}
                >
                  {isGroupAllDone ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#A3B18A]" />
                      <span>모두 완료</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-[#BC6C25]" />
                      <span>{submittedInGroup}/{groupStudents.length} 완료</span>
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

                  return (
                    <div
                      key={st.id}
                      onClick={() => onToggleStatus(st.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSubmitted
                          ? 'bg-white border-[#EEECE6] hover:bg-[#F2EDE4]/50'
                          : 'bg-[#FAF3F0] border-[#F2E4DF] border-l-4 border-l-[#BC6C25]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-[#A89F91]">
                          {st.number.toString().padStart(2, '0')}
                        </span>
                        <span className={`text-xs font-semibold ${isPending ? 'text-[#8C4A1A]' : 'text-[#3D3A35]'}`}>
                          {st.name}
                        </span>
                        {sub.note && (
                          <span className="text-[10px] text-[#BC6C25] max-w-[90px] truncate">
                            ({sub.note})
                          </span>
                        )}
                      </div>

                      <input
                        type="checkbox"
                        checked={isSubmitted}
                        onChange={() => onToggleStatus(st.id)}
                        className="w-4 h-4 rounded border-[#DCD5C8] accent-[#A3B18A] cursor-pointer"
                      />
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
