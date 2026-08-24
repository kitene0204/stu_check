import React from 'react';
import { 
  CheckSquare, 
  MessageSquareShare, 
  FileSpreadsheet, 
  LayoutGrid, 
  List, 
  Users2, 
  Calendar,
  Filter,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Assignment, ViewMode, FilterMode } from '../types';

interface AssignmentHeaderProps {
  assignment: Assignment | undefined;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  filterMode: FilterMode;
  onChangeFilterMode: (mode: FilterMode) => void;
  onCheckAll: () => void;
  onOpenNoticeModal: () => void;
  onOpenSheetsModal: () => void;
  onDeleteAssignment?: (id: string, title: string) => void;
  totalStudents: number;
  submittedCount: number;
  missingCount: number;
  resubmitCount: number;
}

export const AssignmentHeader: React.FC<AssignmentHeaderProps> = ({
  assignment,
  viewMode,
  onChangeViewMode,
  filterMode,
  onChangeFilterMode,
  onCheckAll,
  onOpenNoticeModal,
  onOpenSheetsModal,
  onDeleteAssignment,
  totalStudents,
  submittedCount,
  missingCount,
  resubmitCount,
}) => {
  if (!assignment) {
    return (
      <div className="mb-6 p-6 bg-[#F9F8F5] rounded-2xl border border-[#EEECE6] text-center text-[#A89F91]">
        선택된 과제가 없습니다. 좌측에서 항목을 선택하거나 새로 추가해 주세요.
      </div>
    );
  }

  const isAllComplete = totalStudents > 0 && submittedCount === totalStudents;

  return (
    <div className="mb-6 space-y-4">
      {/* Main Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#FAF3F0] text-[#8C4A1A] border border-[#F2E4DF] rounded-md text-xs font-semibold">
              {assignment.category}
            </span>
            <span className="text-xs text-[#A89F91] flex items-center gap-1 font-sans">
              <Calendar className="w-3.5 h-3.5" />
              마감: {assignment.dueDate || '미정'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-serif-kr font-bold text-[#3D3A35] tracking-tight">
              {assignment.title}
            </h2>
            {onDeleteAssignment && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`'${assignment.title}' 과제를 정말 삭제하시겠습니까?`)) {
                    onDeleteAssignment(assignment.id, assignment.title);
                  }
                }}
                className="p-1.5 text-[#C4BCAD] hover:text-[#C53030] hover:bg-red-50 rounded-xl transition-colors"
                title="이 과제 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {assignment.description && (
            <p className="text-xs text-[#5D574F] mt-1 max-w-2xl leading-relaxed">
              {assignment.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Check All Button */}
          <button
            onClick={onCheckAll}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-semibold transition-all shadow-xs"
            title="모든 학생 제출 완료 처리"
          >
            <CheckSquare className="w-4 h-4" />
            <span>일괄 체크</span>
          </button>

          {/* Copy Missing Notice Button */}
          <button
            onClick={onOpenNoticeModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF3F0] hover:bg-[#F2E4DF] text-[#8C4A1A] border border-[#F2E4DF] rounded-xl text-xs font-semibold transition-all shadow-xs"
            title="미제출 학생 명단 알림 문구 복사 (하이클래스/클래스팅/문자)"
          >
            <MessageSquareShare className="w-4 h-4 text-[#BC6C25]" />
            <span>미제출 알림 복사</span>
          </button>

          {/* Sheets Export / Sync */}
          <button
            onClick={onOpenSheetsModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F9F8F5] text-[#5D574F] border border-[#DCD5C8] rounded-xl text-xs font-medium transition-all shadow-xs"
            title="구글 시트로 내보내기 및 데이터 연동"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2D6A4F]" />
            <span>시트 열기</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filter Chips & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EEECE6]">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => onChangeFilterMode('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-[#3D3A35] text-white shadow-xs'
                : 'bg-[#F9F8F5] text-[#5D574F] border border-[#EEECE6] hover:bg-[#F2EDE4]'
            }`}
          >
            전체 ({totalStudents})
          </button>

          <button
            onClick={() => onChangeFilterMode('pending')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              filterMode === 'pending'
                ? 'bg-[#BC6C25] text-white shadow-xs'
                : 'bg-[#FAF3F0] text-[#8C4A1A] border border-[#F2E4DF] hover:bg-[#F2E4DF]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#BC6C25] inline-block" />
            미제출 ({missingCount})
          </button>

          <button
            onClick={() => onChangeFilterMode('submitted')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              filterMode === 'submitted'
                ? 'bg-[#A3B18A] text-white shadow-xs'
                : 'bg-[#F0F5EC] text-[#2D4A22] border border-[#D5E2CD] hover:bg-[#E5EEDD]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A3B18A] inline-block" />
            제출 완료 ({submittedCount})
          </button>

          {resubmitCount > 0 && (
            <button
              onClick={() => onChangeFilterMode('resubmit')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                filterMode === 'resubmit'
                  ? 'bg-[#D97706] text-white shadow-xs'
                  : 'bg-[#FEF8EC] text-[#B45309] border border-[#F3E2B8] hover:bg-[#FDEBBF]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] inline-block" />
              보완 필요 ({resubmitCount})
            </button>
          )}
        </div>

        {/* View Mode Toggle (Grid / List / Groups) */}
        <div className="flex items-center bg-[#F2EDE4] p-1 rounded-xl border border-[#DCD5C8] self-end sm:self-auto">
          <button
            onClick={() => onChangeViewMode('grid')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-[#3D3A35] shadow-xs'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
            title="격자 번호판 뷰 (원클릭 체크)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>번호판</span>
          </button>

          <button
            onClick={() => onChangeViewMode('list')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[#3D3A35] shadow-xs'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
            title="목록형 상세 뷰"
          >
            <List className="w-3.5 h-3.5" />
            <span>목록형</span>
          </button>

          <button
            onClick={() => onChangeViewMode('groups')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'groups'
                ? 'bg-white text-[#3D3A35] shadow-xs'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
            title="모둠별 검사 뷰"
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>모둠별</span>
          </button>
        </div>
      </div>
    </div>
  );
};
