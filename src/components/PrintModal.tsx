import React, { useRef } from 'react';
import { X, Printer, Download, Check } from 'lucide-react';
import { Assignment, Student, ClassRoom, SubmissionStatus } from '../types';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  classRoom: ClassRoom;
  assignment: Assignment | undefined;
  students: Student[];
  submissions: Record<string, { status: SubmissionStatus; note?: string }>;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  classRoom,
  assignment,
  students,
  submissions,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !assignment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200 no-print">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2 text-[#3D3A35]">
            <Printer className="w-5 h-5 text-[#3D3A35]" />
            <h3 className="font-bold text-base">A4 인쇄용 제출물 체크리스트 서식</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5D574F] hover:bg-[#DCD5C8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Paper Area Preview */}
        <div className="p-6 overflow-y-auto flex-1 bg-neutral-100/50 flex justify-center">
          <div 
            ref={printRef}
            className="bg-white border border-gray-300 p-8 rounded-lg w-full max-w-2xl text-black shadow-sm"
            style={{ minHeight: '600px' }}
          >
            {/* Header of paper */}
            <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-end">
              <div>
                <h1 className="text-xl font-bold font-serif-kr">
                  {classRoom.schoolName} {classRoom.grade}학년 {classRoom.classNumber}반 제출물 점검표
                </h1>
                <p className="text-xs text-gray-600 mt-1">
                  항목: <strong>{assignment.title}</strong> ({assignment.category}) | 마감일: {assignment.dueDate || '-'}
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                인쇄일: {new Date().toLocaleDateString('ko-KR')}
              </div>
            </div>

            {/* Table 2-column layout for A4 compact view */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column (first half) */}
              <table className="w-full text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 border-b border-black text-center font-bold">
                    <th className="border border-black py-1.5 w-10">번호</th>
                    <th className="border border-black py-1.5 w-20">이름</th>
                    <th className="border border-black py-1.5 w-14">상태</th>
                    <th className="border border-black py-1.5">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, Math.ceil(students.length / 2)).map((st) => {
                    const sub = submissions[st.id] || { status: 'pending' };
                    return (
                      <tr key={st.id} className="text-center h-8">
                        <td className="border border-black font-bold">{st.number}</td>
                        <td className="border border-black font-medium">{st.name}</td>
                        <td className="border border-black font-bold">
                          {sub.status === 'submitted' ? 'O' : sub.status === 'resubmit' ? '△' : ''}
                        </td>
                        <td className="border border-black text-left px-1.5 text-[10px]">
                          {sub.note || st.note || ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Right Column (second half) */}
              <table className="w-full text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 border-b border-black text-center font-bold">
                    <th className="border border-black py-1.5 w-10">번호</th>
                    <th className="border border-black py-1.5 w-20">이름</th>
                    <th className="border border-black py-1.5 w-14">상태</th>
                    <th className="border border-black py-1.5">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(Math.ceil(students.length / 2)).map((st) => {
                    const sub = submissions[st.id] || { status: 'pending' };
                    return (
                      <tr key={st.id} className="text-center h-8">
                        <td className="border border-black font-bold">{st.number}</td>
                        <td className="border border-black font-medium">{st.name}</td>
                        <td className="border border-black font-bold">
                          {sub.status === 'submitted' ? 'O' : sub.status === 'resubmit' ? '△' : ''}
                        </td>
                        <td className="border border-black text-left px-1.5 text-[10px]">
                          {sub.note || st.note || ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Signature / Memo box */}
            <div className="mt-6 pt-3 border-t border-gray-400 flex justify-between text-xs text-gray-600">
              <span>* 제출: O / 미제출: 빈칸 / 보완: △</span>
              <span>담임 교사 확인: ____________ (인)</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-3.5 bg-[#F2EDE4] border-t border-[#DCD5C8] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-[#5D574F] hover:bg-[#EAE5D8] border border-[#DCD5C8] rounded-xl text-xs font-semibold"
          >
            닫기
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#3D3A35] text-white hover:bg-[#2C2925] rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>A4 인쇄 / PDF 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};
