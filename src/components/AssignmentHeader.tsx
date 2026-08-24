import React from 'react';
import { 
  CheckSquare, 
  MessageSquareShare, 
  FileSpreadsheet, 
  LayoutGrid, 
  List, 
  Users2, 
  Calendar,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Assignment, ViewMode, FilterMode } from '../types';

interface AssignmentHeaderProps {
  assignment: Assignment;
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
  return (
    <div className="mb-4 space-y-3 shrink-0">
      {/* Top Main Row: Title & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#EEECE6]">
        <div>
          {/* Category & Date Metadata Badges */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#EAE5D8] text-[#5D574F]">
              {assignment.category}
            </span>
            {assignment.dueDate && (
              <span className="text-[11px] text-[#A89F91] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{assignment.dueDate} 마감</span>
              </span>
            )}
            <span className="text-[11px] font-medium text-[#A3B18A] flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" />
              <span>실시간 동기화</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-serif-kr font-bold text-[#3D3A35] tracking-tight truncate">
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
                className="p-1.5 text-[#C4BCAD] hover:text-[#C53030] hover:bg-red-50 rounded-xl transition-colors shrink-0"
                title="이 과제 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {assignment.description && (
            <p className="text-xs text-[#5D574F] mt-1 max-w-2xl leading-relaxed line-clamp-2 sm:line-clamp-none">
              {assignment.description}
            </p>
          )}
        </div>

        {/* Action Buttons (Full width on mobile with smooth touch targets) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 lg:pb-0">
          {/* Quick Check All Button */}
          <button
            onClick={onCheckAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[#A3B18A] text-white hover:bg-[#92A179] active:scale-95 rounded-xl text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer whitespace-nowrap"
            title="모든 학생 제출 완료 처리"
          >
            <CheckSquare className="w-4 h-4" />
            <span>일괄 체크</span>
          </button>

          {/* Copy Missing Notice Button */}
          <button
            onClick={onOpenNoticeModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FAF3F0] hover:bg-[#F2E4DF] text-[#8C4A1A] border border-[#F2E4DF] active:scale-95 rounded-xl text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer whitespace-nowrap"
            title="미제출 학생 명단 알림 문구 복사"
          >
            <MessageSquareShare className="w-4 h-4 text-[#BC6C25]" />
            <span>미제출 알림</span>
          </button>

          {/* Sheets Export / Sync */}
          <button
            onClick={onOpenSheetsModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F9F8F5] text-[#5D574F] border border-[#DCD5C8] active:scale-95 rounded-xl text-xs font-medium transition-all shadow-xs shrink-0 cursor-pointer whitespace-nowrap"
            title="구글 시트로 내보내기 및 데이터 연동"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2D6A4F]" />
            <span>시트 열기</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filter Chips & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        {/* Status Filter Chips (Horizontal Scroll on Small Screen) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => onChangeFilterMode('all')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-[#3D3A35] text-white shadow-xs'
                : 'bg-[#F9F8F5] text-[#5D574F] border border-[#EEECE6] hover:bg-[#F2EDE4]'
            }`}
          >
            전체 ({totalStudents})
          </button>

          <button
            onClick={() => onChangeFilterMode('pending')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap ${
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
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap ${
              filterMode === 'submitted'
                ? 'bg-[#52794C] text-white shadow-xs'
                : 'bg-[#F0F5EC] text-[#2D4A22] border border-[#D5E2CD] hover:bg-[#E5EEDD]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#52794C] inline-block" />
            제출 완료 ({submittedCount})
          </button>

          {resubmitCount > 0 && (
            <button
              onClick={() => onChangeFilterMode('resubmit')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap ${
                filterMode === 'resubmit'
                  ? 'bg-[#D97706] text-white shadow-xs'
                  : 'bg-[#FEF8EC] text-[#B45309] border border-[#F3E2B8] hover:bg-[#FDEBBF]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] inline-block" />
              보완 ({resubmitCount})
            </button>
          )}
        </div>

        {/* View Mode Toggle (Grid / List / Groups) */}
        <div className="flex items-center bg-[#F2EDE4] p-1 rounded-xl border border-[#DCD5C8] self-stretch sm:self-auto justify-between sm:justify-start">
          <button
            onClick={() => onChangeViewMode('grid')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-[#3D3A35] shadow-xs font-bold'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
            title="격자 번호판 뷰"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>번호판</span>
          </button>

          <button
            onClick={() => onChangeViewMode('list')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[#3D3A35] shadow-xs font-bold'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
            title="목록형 상세 뷰"
          >
            <List className="w-3.5 h-3.5" />
            <span>목록형</span>
          </button>

          <button
            onClick={() => onChangeViewMode('groups')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'groups'
                ? 'bg-white text-[#3D3A35] shadow-xs font-bold'
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
