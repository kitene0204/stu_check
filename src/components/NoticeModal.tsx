import React, { useState } from 'react';
import { X, Copy, Check, MessageSquareShare, Send, Sparkles } from 'lucide-react';
import { Assignment, Student, SubmissionStatus } from '../types';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | undefined;
  students: Student[];
  submissions: Record<string, { status: SubmissionStatus; note?: string }>;
  onShowToast: (msg: string) => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  onClose,
  assignment,
  students,
  submissions,
  onShowToast,
}) => {
  const [templateType, setTemplateType] = useState<'standard' | 'sms' | 'gentle' | 'parent'>('standard');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !assignment) return null;

  // Filter missing or resubmit students
  const missingStudents = students.filter(st => {
    const sub = submissions[st.id]?.status || 'pending';
    return sub === 'pending' || sub === 'resubmit';
  });

  const missingListText = missingStudents.length > 0
    ? missingStudents.map(st => `${st.number}번 ${st.name}`).join(', ')
    : '없음 (전원 제출 완료! 🎉)';

  let generatedMessage = '';

  if (templateType === 'standard') {
    generatedMessage = `[${assignment.title} 미제출자 안내]\n\n총 ${missingStudents.length}명의 학생이 아직 제출하지 않았습니다.\n\n📌 미제출 학생:\n${missingListText}\n\n* 마감일: ${assignment.dueDate || '오늘 중'}\n* 내일 아침 등교 후 교탁으로 꼭 제출할 수 있도록 지도 부탁드립니다. 감사합니다.`;
  } else if (templateType === 'sms') {
    generatedMessage = `[학급알림] ${assignment.title} 미제출자: ${missingListText} (총 ${missingStudents.length}명). 내일 아침 제출바랍니다.`;
  } else if (templateType === 'gentle') {
    generatedMessage = `[🌱 ${assignment.title} 제출 확인]\n\n열심히 공부하는 우리 반 친구들! 아직 제출하지 않은 친구들은 잊지 말고 챙겨오세요.\n\n✨ 챙겨올 친구들 (${missingStudents.length}명):\n${missingListText}\n\n도움이 필요한 부분은 선생님께 언제든 질문하세요!`;
  } else if (templateType === 'parent') {
    generatedMessage = `[학부모님께 드리는 안내]\n\n안녕하십니까. 담임교사입니다.\n[${assignment.title}] 제출 현황을 확인하여 안내드립니다.\n\n현재 미제출 학생 (${missingStudents.length}명): ${missingListText}\n\n가정에서 자녀의 가방과 알림장을 한 번 더 점검해주시면 감사하겠습니다.`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    onShowToast('📋 알림장 문구가 클립보드에 복사되었습니다.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2 text-[#3D3A35]">
            <MessageSquareShare className="w-5 h-5 text-[#BC6C25]" />
            <h3 className="font-bold text-base">미제출자 알림장 문구 생성</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5D574F] hover:bg-[#DCD5C8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Missing Summary */}
          <div className="flex items-center justify-between p-3 bg-[#FAF3F0] rounded-xl border border-[#F2E4DF]">
            <span className="text-xs font-semibold text-[#8C4A1A]">
              미제출 인원: <strong className="text-sm">{missingStudents.length}명</strong> / 전체 {students.length}명
            </span>
            <span className="text-[11px] text-[#A89F91]">
              과제: {assignment.title}
            </span>
          </div>

          {/* Template Selectors */}
          <div>
            <label className="text-xs font-bold text-[#5D574F] mb-1.5 block">
              알림 양식 템플릿 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { key: 'standard', label: '기본 알림장' },
                { key: 'sms', label: '단문 문자 (SMS)' },
                { key: 'gentle', label: '따뜻한 안내' },
                { key: 'parent', label: '학부모용 정중체' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTemplateType(t.key as any)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    templateType === t.key
                      ? 'bg-[#3D3A35] text-white shadow-xs'
                      : 'bg-[#F2EDE4] text-[#5D574F] hover:bg-[#EAE5D8]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formatted Text Preview Area */}
          <div>
            <label className="text-xs font-bold text-[#5D574F] mb-1.5 block">
              생성된 알림 문구 (클릭 시 자동 복사 준비)
            </label>
            <textarea
              readOnly
              value={generatedMessage}
              rows={8}
              className="w-full p-3.5 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#A3B18A]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-[#F2EDE4] border-t border-[#DCD5C8] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-[#5D574F] hover:bg-[#EAE5D8] border border-[#DCD5C8] rounded-xl text-xs font-semibold transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사 완료!' : '문구 클립보드 복사'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
