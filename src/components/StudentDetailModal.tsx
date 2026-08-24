import React, { useState } from 'react';
import { X, MessageSquare, Check, Save } from 'lucide-react';
import { Student, SubmissionStatus } from '../types';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  currentStatus: SubmissionStatus;
  currentNote: string;
  onSave: (studentId: string, status: SubmissionStatus, note: string) => void;
  onShowToast: (msg: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  currentStatus,
  currentNote,
  onSave,
  onShowToast,
}) => {
  if (!isOpen || !student) return null;

  const [status, setStatus] = useState<SubmissionStatus>(currentStatus);
  const [note, setNote] = useState<string>(currentNote || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(student.id, status, note.trim());
    onShowToast(`✏️ ${student.number}번 ${student.name} 학생의 메모가 저장되었습니다.`);
    onClose();
  };

  const quickNotes = [
    '집에 두고 옴',
    '내일 아침 제출 약속',
    '학부모 서명 누락',
    '보완 후 재제출',
    '결석 / 병결',
    '면제 처리',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2 text-[#3D3A35]">
            <MessageSquare className="w-5 h-5 text-[#A3B18A]" />
            <h3 className="font-bold text-base">
              {student.number}번 {student.name} 학생 메모 및 상태
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5D574F] hover:bg-[#DCD5C8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#5D574F] block mb-1.5">
              제출 상태 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  status === 'pending'
                    ? 'bg-[#FAF3F0] text-[#8C4A1A] border-[#BC6C25] shadow-xs'
                    : 'bg-white text-[#5D574F] border-[#DCD5C8]'
                }`}
              >
                ❌ 미제출
              </button>

              <button
                type="button"
                onClick={() => setStatus('submitted')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  status === 'submitted'
                    ? 'bg-[#F0F5EC] text-[#2D4A22] border-[#A3B18A] shadow-xs'
                    : 'bg-white text-[#5D574F] border-[#DCD5C8]'
                }`}
              >
                ✅ 제출 완료
              </button>

              <button
                type="button"
                onClick={() => setStatus('resubmit')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  status === 'resubmit'
                    ? 'bg-[#FEF8EC] text-[#B45309] border-[#D97706] shadow-xs'
                    : 'bg-white text-[#5D574F] border-[#DCD5C8]'
                }`}
              >
                ⚠️ 보완 필요
              </button>

              <button
                type="button"
                onClick={() => setStatus('excused')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  status === 'excused'
                    ? 'bg-gray-100 text-gray-800 border-gray-400 shadow-xs'
                    : 'bg-white text-[#5D574F] border-[#DCD5C8]'
                }`}
              >
                ➖ 면제
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#5D574F] block mb-1.5">
              자주 쓰는 빠른 메모 (클릭 시 입력)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickNotes.map((qn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNote(qn)}
                  className="px-2.5 py-1 bg-white hover:bg-[#F2EDE4] border border-[#DCD5C8] rounded-lg text-[11px] text-[#5D574F] transition-colors"
                >
                  {qn}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#5D574F] block mb-1">
              선생님 메모 / 사유
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 25쪽 3번 문제 다시 풀어서 가져오기로 함"
              rows={3}
              className="w-full p-3 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-[#5D574F] hover:bg-[#EAE5D8] border border-[#DCD5C8] rounded-xl text-xs font-semibold"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
