import React, { useState, useEffect, useRef } from 'react';
import { X, Pencil, BookOpen, FileText, Package, Award, Calendar, Trash2, Check } from 'lucide-react';
import { Assignment, AssignmentCategory } from '../types';

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onUpdateAssignment: (updated: Assignment) => void;
  onDeleteAssignment?: (id: string, title: string) => void;
  onShowToast: (msg: string) => void;
}

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onShowToast,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AssignmentCategory>('과제');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (assignment && isOpen) {
      setTitle(assignment.title || '');
      setCategory(assignment.category || '과제');
      setDueDate(assignment.dueDate || '');
      setDescription(assignment.description || '');

      // Automatically focus and select the title input so user can instantly retype
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [assignment, isOpen]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      onShowToast('⚠️ 과제 또는 제출물 제목을 입력해 주세요.');
      return;
    }

    const updatedAsg: Assignment = {
      ...assignment,
      title: trimmedTitle,
      category,
      dueDate,
      description: description.trim(),
    };

    onUpdateAssignment(updatedAsg);
    onShowToast(`✨ 과제 이름이 '${trimmedTitle}'(으)로 변경되었습니다.`);
    onClose();
  };

  const handleDelete = () => {
    if (!onDeleteAssignment) return;
    if (window.confirm(`'${assignment.title}' 과제를 정말 삭제하시겠습니까?\n(체크된 제출 기록도 함께 삭제됩니다)`)) {
      onDeleteAssignment(assignment.id, assignment.title);
      onClose();
    }
  };

  const handleSetQuickDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    setDueDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2 text-[#3D3A35]">
            <div className="p-1.5 bg-[#FAF3EB] text-[#8C4A1A] rounded-lg">
              <Pencil className="w-4 h-4 text-[#BC6C25]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#3D3A35]">과제 정보 및 이름 수정</h3>
              <p className="text-[11px] text-[#7D7568]">설정된 과제 제목, 분류, 마감일 등을 변경할 수 있습니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5D574F] hover:bg-[#DCD5C8] transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#5D574F]">
                과제 / 제출물 이름 <span className="text-[#BC6C25]">*</span>
              </label>
              <span className="text-[10px] text-[#A89F91]">Enter를 누르면 즉시 저장됩니다</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 수학익힘책 24~27쪽, 1차 학부모 상담신청서"
              className="w-full px-3.5 py-2.5 bg-white border border-[#DCD5C8] rounded-xl text-sm font-semibold text-[#3D3A35] focus:outline-none focus:ring-2 focus:ring-[#BC6C25]/40 focus:border-[#BC6C25]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#5D574F] block mb-1">분류 카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssignmentCategory)}
                className="w-full px-3 py-2.5 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
              >
                <option value="과제">📝 과제 (숙제)</option>
                <option value="가정통신문">📄 가정통신문 / 동의서</option>
                <option value="준비물">🎒 준비물</option>
                <option value="수행평가">📊 수행평가</option>
                <option value="우유/급식">🥛 우유/급식/설문</option>
                <option value="기타">📌 기타 수합물</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#5D574F]">제출 마감일</label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(0)}
                    className="text-[#BC6C25] hover:underline"
                  >
                    오늘
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(1)}
                    className="text-[#BC6C25] hover:underline"
                  >
                    내일
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(7)}
                    className="text-[#BC6C25] hover:underline"
                  >
                    1주뒤
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#5D574F] block mb-1">상세 안내 / 메모 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="학생들에게 안내할 제출 분량, 주의사항 또는 준비 요령"
              rows={2}
              className="w-full p-3 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#EEECE6]">
            {onDeleteAssignment ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-[#C53030] hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="과제 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>과제 삭제</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white text-[#5D574F] hover:bg-[#EAE5D8] border border-[#DCD5C8] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#BC6C25] hover:bg-[#A3591B] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>수정 저장</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
