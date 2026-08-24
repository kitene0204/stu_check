import React from 'react';
import { MessageSquare, Check, X, AlertCircle, MinusCircle } from 'lucide-react';
import { Student, SubmissionStatus } from '../types';

interface StudentListProps {
  students: Student[];
  submissions: Record<string, { status: SubmissionStatus; note?: string }>;
  onChangeStatus: (studentId: string, status: SubmissionStatus) => void;
  onOpenStudentDetail: (student: Student) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  submissions,
  onChangeStatus,
  onOpenStudentDetail,
}) => {
  return (
    <div className="bg-[#F9F8F5] rounded-2xl border border-[#EEECE6] overflow-hidden shadow-xs mb-8">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#5D574F]">
          <thead className="bg-[#F2EDE4] text-[#A89F91] uppercase text-[11px] font-bold tracking-wider border-b border-[#DCD5C8]">
            <tr>
              <th className="py-3 px-4 w-16 text-center">번호</th>
              <th className="py-3 px-4 w-28">이름</th>
              <th className="py-3 px-4 w-20 text-center">모둠</th>
              <th className="py-3 px-4 w-40 text-center">제출 상태</th>
              <th className="py-3 px-4">선생님 메모 / 사유</th>
              <th className="py-3 px-4 w-24 text-right">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEECE6]">
            {students.map((student) => {
              const sub = submissions[student.id] || { status: 'pending' };
              const isSubmitted = sub.status === 'submitted';
              const isPending = sub.status === 'pending';
              const isResubmit = sub.status === 'resubmit';

              return (
                <tr 
                  key={student.id} 
                  className={`hover:bg-white/80 transition-colors ${
                    isPending ? 'bg-[#FAF3F0]/40' : isResubmit ? 'bg-[#FEF8EC]/40' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center font-bold text-[#A89F91]">
                    {student.number.toString().padStart(2, '0')}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#3D3A35]">
                    {student.name}
                    {student.gender && (
                      <span className="ml-1 text-[10px] text-[#A89F91]">
                        ({student.gender === 'M' ? '남' : '여'})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 bg-black/5 rounded text-[11px]">
                      {student.groupNumber ? `${student.groupNumber}모둠` : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={sub.status}
                      onChange={(e) => onChangeStatus(student.id, e.target.value as SubmissionStatus)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold focus:outline-none transition-colors ${
                        isSubmitted
                          ? 'bg-[#F0F5EC] border-[#D5E2CD] text-[#2D4A22]'
                          : isPending
                            ? 'bg-[#FAF3F0] border-[#F2E4DF] text-[#8C4A1A]'
                            : isResubmit
                              ? 'bg-[#FEF8EC] border-[#F3E2B8] text-[#B45309]'
                              : 'bg-gray-100 border-gray-200 text-gray-500'
                      }`}
                    >
                      <option value="pending">❌ 미제출</option>
                      <option value="submitted">✅ 제출 완료</option>
                      <option value="resubmit">⚠️ 보완 필요</option>
                      <option value="excused">➖ 면제</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-[#5D574F]">
                    {sub.note ? (
                      <span className="text-[#BC6C25] font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {sub.note}
                      </span>
                    ) : (
                      <span className="text-[#A89F91] italic">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenStudentDetail(student)}
                      className="p-1.5 hover:bg-[#EAE5D8] rounded-lg text-[#5D574F] hover:text-[#3D3A35] transition-colors"
                      title="메모 수정"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
