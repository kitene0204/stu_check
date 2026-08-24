import React, { useState } from 'react';
import { X, Plus, BookOpen, FileText, Package, Award, Sparkles } from 'lucide-react';
import { Assignment, AssignmentCategory } from '../types';

interface NewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onAddAssignment: (asg: Assignment) => void;
  onShowToast: (msg: string) => void;
}

export const NewAssignmentModal: React.FC<NewAssignmentModalProps> = ({
  isOpen,
  onClose,
  classId,
  onAddAssignment,
  onShowToast,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AssignmentCategory>('과제');
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('⚠️ 과제 또는 제출물 제목을 입력해 주세요.');
      return;
    }

    const newAsg: Assignment = {
      id: `asg-${Date.now()}`,
      classId,
      title: title.trim(),
      category,
      dueDate,
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddAssignment(newAsg);
    onShowToast(`✨ 새 제출물 항목 '${newAsg.title}'이(가) 등록되었습니다.`);
    setTitle('');
    setDescription('');
    onClose();
  };

  const presetTemplates = [
    { title: '수학익힘책 검사', cat: '과제' as AssignmentCategory },
    { title: '체험학습 참가동의서 및 희망원', cat: '가정통신문' as AssignmentCategory },
    { title: '주말 독서 감상문 / 일기', cat: '과제' as AssignmentCategory },
    { title: '미술 수채화 도구 및 준비물', cat: '준비물' as AssignmentCategory },
    { title: '단원평가 / 수행평가지 회신', cat: '수행평가' as AssignmentCategory },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2 text-[#3D3A35]">
            <Plus className="w-5 h-5 text-[#A3B18A]" />
            <h3 className="font-bold text-base">새 과제 및 제출물 등록</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5D574F] hover:bg-[#DCD5C8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="text-[11px] font-bold text-[#A89F91] uppercase tracking-wider block mb-1.5">
              자주 쓰는 초등 추천 항목 (클릭 시 자동 입력)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presetTemplates.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTitle(p.title);
                    setCategory(p.cat);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-[#F2EDE4] border border-[#DCD5C8] rounded-lg text-[11px] text-[#5D574F] transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#5D574F] block mb-1">
              제출물 항목명 <span className="text-[#BC6C25]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 수학익힘책 24~27쪽, 1차 학부모 상담신청서"
              className="w-full px-3.5 py-2.5 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#5D574F] block mb-1">분류 카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssignmentCategory)}
                className="w-full px-3 py-2.5 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
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
              <label className="text-xs font-bold text-[#5D574F] block mb-1">제출 마감일</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#5D574F] block mb-1">상세 안내 / 메모 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="학생들에게 안내할 제출 분량, 주의사항 또는 준비 요령"
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
              className="px-5 py-2 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              제출물 생성하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
