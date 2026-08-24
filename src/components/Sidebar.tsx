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
  Trash2
} from 'lucide-react';
import { Assignment, AssignmentCategory, Student, SubmissionMap } from '../types';

interface SidebarProps {
  assignments: Assignment[];
  activeAssignmentId: string | null;
  onSelectAssignment: (id: string) => void;
  onOpenNewAssignmentModal: () => void;
  onDeleteAssignment: (id: string, title: string) => void;
  students: Student[];
  submissionsMap: SubmissionMap;
}

export const Sidebar: React.FC<SidebarProps> = ({
  assignments,
  activeAssignmentId,
  onSelectAssignment,
  onOpenNewAssignmentModal,
  onDeleteAssignment,
  students,
  submissionsMap,
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

  return (
    <aside className="w-72 bg-[#F2EDE4] border-r border-[#DCD5C8] p-5 flex flex-col justify-between shrink-0 overflow-y-auto select-none">
      <div>
        {/* Header & Add Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold text-[#A89F91] uppercase tracking-[0.2em]">
            과제 및 제출물 목록
          </h3>
          <button
            onClick={onOpenNewAssignmentModal}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="새 과제/제출물 생성"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>추가</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1 mb-4 pb-2 border-b border-[#DCD5C8]/60">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#3D3A35] text-white shadow-xs'
                  : 'bg-white/40 text-[#5D574F] hover:bg-white/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Assignment Navigation List */}
        <nav className="space-y-1.5 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#A89F91]">
              등록된 항목이 없습니다.
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
                  onClick={() => onSelectAssignment(asg.id)}
                  className={`group/item px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 relative ${
                    isActive
                      ? 'bg-white shadow-xs border-[#DCD5C8] ring-1 ring-[#A3B18A]/40'
                      : 'bg-transparent border-transparent hover:bg-white/50 text-[#5D574F]'
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
                      <span className={`text-xs font-semibold truncate ${isActive ? 'text-[#3D3A35]' : ''}`}>
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
                        className="p-1 text-[#C4BCAD] hover:text-[#C53030] hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover/item:opacity-100"
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
                    <span className={`font-medium ${isAllDone ? 'text-[#A3B18A]' : 'text-[#5D574F]'}`}>
                      {currentSubmitted}/{students.length}명
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </nav>
      </div>

      {/* Bottom Class Summary Card (Natural Tones) */}
      <div className="mt-4 p-4 bg-[#EAE5D8]/60 rounded-2xl border border-dashed border-[#DCD5C8] shrink-0">
        <h4 className="text-xs font-bold text-[#3D3A35] mb-2.5 flex items-center justify-between">
          <span>학급 제출 요약</span>
          <span className="text-[10px] font-normal text-[#5D574F]">총 {students.length}명</span>
        </h4>
        
        <div className="space-y-2">
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

          <div className="flex justify-between items-center text-[11px] pt-1">
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
    </aside>
  );
};
