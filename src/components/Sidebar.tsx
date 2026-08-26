import React, { useState } from 'react';
import { 
  Plus, 
  BookOpen, 
  FileText, 
  Package, 
  Award, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  Users
} from 'lucide-react';
import { Assignment, AssignmentCategory, Student, SubmissionMap } from '../types';

interface SidebarProps {
  assignments: Assignment[];
  activeAssignmentId: string | null;
  onSelectAssignment: (id: string) => void;
  onOpenNewAssignmentModal: () => void;
  onDeleteAssignment: (id: string, title: string) => void;
  onOpenRosterModal?: () => void;
  students: Student[];
  submissionsMap: SubmissionMap;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  assignments,
  activeAssignmentId,
  onSelectAssignment,
  onOpenNewAssignmentModal,
  onDeleteAssignment,
  onOpenRosterModal,
  students,
  submissionsMap,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  const categories = ['전체', '과제', '가정통신문', '준비물', '수행평가'];

  const filteredAssignments = assignments.filter(asg => {
    if (selectedCategory === '전체') return true;
    return asg.category === selectedCategory;
  });

  // Calculate stats for current active assignment or overall
  const activeSubmissions = activeAssignmentId ? (submissionsMap[activeAssignmentId] || {}) : {};
  const totalStudents = students.length || 1;
  const submittedCount = (Object.values(activeSubmissions) as ({ status: string } | undefined)[]).filter(s => s?.status === 'submitted').length;
  const missingCount = totalStudents - submittedCount;
  const submissionRate = Math.round((submittedCount / totalStudents) * 100);

  const getCategoryIcon = (cat: AssignmentCategory) => {
    switch (cat) {
      case '과제': return <BookOpen className="w-3 h-3 text-[#A3B18A]" />;
      case '가정통신문': return <FileText className="w-3 h-3 text-[#BC6C25]" />;
      case '준비물': return <Package className="w-3 h-3 text-[#588157]" />;
      case '수행평가': return <Award className="w-3 h-3 text-[#8C4A1A]" />;
      default: return <Clock className="w-3 h-3 text-[#5D574F]" />;
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`정말 '${title}' 항목을 삭제하시겠습니까?\n(체크된 제출 기록도 함께 삭제됩니다)`)) {
      onDeleteAssignment(id, title);
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 select-none bg-[#F2EDE4] overflow-y-auto">
      <div>
        {/* Header & Add Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-bold text-[#A89F91] uppercase tracking-[0.15em]">
              과제 및 제출물 목록
            </h3>
            <span className="text-[10px] bg-white/70 text-[#5D574F] px-1.5 py-0.2 rounded-md font-bold">
              {assignments.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenNewAssignmentModal}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="새 과제/제출물 생성"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>추가</span>
            </button>

            {/* Mobile Close Drawer Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 text-[#5D574F] hover:bg-black/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1 mb-2.5 pb-2.5 border-b border-[#DCD5C8]/60">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#3D3A35] text-white shadow-xs'
                  : 'bg-white/50 text-[#5D574F] hover:bg-white/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Student Roster Management Quick Button in Sidebar */}
        {onOpenRosterModal && (
          <button
            onClick={() => {
              onOpenRosterModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#FAF3EB] hover:bg-[#F5E6D3] text-[#8C4A1A] border border-[#BC6C25]/40 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all mb-3 cursor-pointer"
            title="학생 명단 관리 및 수정 열기"
          >
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#BC6C25]" />
              <span>학생 명단 수정 / 관리</span>
            </span>
            <span className="px-2 py-0.5 bg-white text-[#8C4A1A] border border-[#BC6C25]/30 rounded-full text-[10px] font-bold">
              총 {students.length}명
            </span>
          </button>
        )}

        {/* Assignment Navigation List */}
        <nav className="space-y-1.5 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-6 px-3 bg-white/40 border border-dashed border-[#DCD5C8] rounded-xl flex flex-col items-center gap-2">
              <span className="text-xs text-[#A89F91]">등록된 항목이 없습니다</span>
              <button
                onClick={() => {
                  onOpenNewAssignmentModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="text-[11px] font-bold text-[#BC6C25] hover:text-[#8C4A1A] underline cursor-pointer"
              >
                + 새 과제 추가하기
              </button>
            </div>
          ) : (
            filteredAssignments.map(asg => {
              const isActive = asg.id === activeAssignmentId;
              const asgSubs = submissionsMap[asg.id] || {};
              const currentSubmitted = (Object.values(asgSubs) as ({ status: string } | undefined)[]).filter(s => s?.status === 'submitted').length;
              const isAllDone = students.length > 0 && currentSubmitted >= students.length;

              return (
                <div
                  key={asg.id}
                  onClick={() => {
                    onSelectAssignment(asg.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`group/item px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 relative ${
                    isActive
                      ? 'bg-white shadow-xs border-[#DCD5C8] ring-2 ring-[#A3B18A]/50'
                      : 'bg-white/40 border-transparent hover:bg-white/70 text-[#5D574F]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <div 
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isAllDone 
                            ? 'bg-[#A3B18A]' 
                            : isActive 
                              ? 'bg-[#BC6C25]' 
                              : 'bg-[#DCD5C8]'
                        }`} 
                      />
                      <span className={`text-xs font-bold truncate ${isActive ? 'text-[#3D3A35]' : ''}`}>
                        {asg.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isAllDone && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#A3B18A]" />
                      )}
                      
                      {/* Delete Assignment Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, asg.id, asg.title)}
                        className="p-1 text-[#C4BCAD] hover:text-[#C53030] hover:bg-red-50 rounded-md transition-colors opacity-80 md:opacity-0 md:group-hover/item:opacity-100"
                        title={`'${asg.title}' 과제 삭제`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#A89F91] pl-4">
                    <span className="flex items-center gap-1">
                      {getCategoryIcon(asg.category)}
                      <span>{asg.category}</span>
                    </span>
                    <span className={`font-semibold ${isAllDone ? 'text-[#A3B18A]' : 'text-[#5D574F]'}`}>
                      {currentSubmitted}/{students.length}명
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </nav>
      </div>

      {/* Bottom Class Summary Card */}
      <div className="mt-3 p-3.5 bg-[#EAE5D8]/70 rounded-2xl border border-dashed border-[#DCD5C8] shrink-0">
        <h4 className="text-xs font-bold text-[#3D3A35] mb-2 flex items-center justify-between">
          <span>학급 제출 요약</span>
          <span className="text-[10px] font-normal text-[#5D574F]">총 {students.length}명</span>
        </h4>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#5D574F]">현재 제출율</span>
            <span className="font-bold text-[#A3B18A]">{submissionRate}%</span>
          </div>

          <div className="h-2 w-full bg-white/70 rounded-full overflow-hidden p-0.5 border border-[#DCD5C8]/50">
            <div 
              className="h-full bg-[#A3B18A] rounded-full transition-all duration-300"
              style={{ width: `${submissionRate}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] pt-0.5">
            <span className="text-[#5D574F] flex items-center gap-1">
              {missingCount > 0 ? (
                <AlertCircle className="w-3 h-3 text-[#BC6C25]" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-[#A3B18A]" />
              )}
              <span>미제출 인원</span>
            </span>
            <span className={`font-bold ${missingCount > 0 ? 'text-[#BC6C25]' : 'text-[#A3B18A]'}`}>
              {missingCount}명
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-72 bg-[#F2EDE4] border-r border-[#DCD5C8] flex-col justify-between shrink-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Modal */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200" 
            onClick={onCloseMobile} 
          />
          <div className="relative w-4/5 max-w-xs h-full bg-[#F2EDE4] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
