import React, { useState, useMemo } from 'react';
import { Users, CheckCircle2, Circle, Search, X, Check, XCircle, CheckSquare, FolderPlus } from 'lucide-react';
import { Student } from '../types';

interface StudentTargetSelectorProps {
  students: Student[];
  targetType: 'all' | 'custom' | 'group';
  onChangeTargetType: (type: 'all' | 'custom' | 'group') => void;
  selectedStudentIds: string[];
  onChangeSelectedStudentIds: (ids: string[]) => void;
  targetGroupName?: string;
  onChangeTargetGroupName?: (groupName: string) => void;
}

export const StudentTargetSelector: React.FC<StudentTargetSelectorProps> = ({
  students,
  targetType,
  onChangeTargetType,
  selectedStudentIds,
  onChangeSelectedStudentIds,
  targetGroupName,
  onChangeTargetGroupName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract distinct groups/classes in roster
  const availableGroupNames = useMemo(() => {
    const groups = new Set<string>();
    students.forEach(s => {
      const g = s.groupName?.trim() || (s.groupNumber ? `${s.groupNumber}모둠` : '1모둠');
      groups.add(g);
    });
    return Array.from(groups).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter(s => 
      s.name.toLowerCase().includes(query) ||
      String(s.number).includes(query) ||
      (s.groupName && s.groupName.toLowerCase().includes(query)) ||
      (s.groupNumber && `${s.groupNumber}모둠`.includes(query))
    );
  }, [students, searchQuery]);

  const handleToggleStudent = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      onChangeSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      onChangeSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleSelectAll = () => {
    onChangeSelectedStudentIds(students.map(s => s.id));
  };

  const handleDeselectAll = () => {
    onChangeSelectedStudentIds([]);
  };

  const handleSelectOdd = () => {
    onChangeSelectedStudentIds(students.filter(s => s.number % 2 !== 0).map(s => s.id));
  };

  const handleSelectEven = () => {
    onChangeSelectedStudentIds(students.filter(s => s.number % 2 === 0).map(s => s.id));
  };

  const handleSelectGroup = (gName: string) => {
    const groupStudentIds = students.filter(s => (s.groupName || `${s.groupNumber || 1}모둠`) === gName).map(s => s.id);
    const allSelected = groupStudentIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      onChangeSelectedStudentIds(selectedStudentIds.filter(id => !groupStudentIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedStudentIds, ...groupStudentIds]));
      onChangeSelectedStudentIds(merged);
    }
  };

  return (
    <div className="space-y-2.5 bg-[#FAF9F6] p-3.5 rounded-xl border border-[#DCD5C8]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#5D574F] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#BC6C25]" />
          <span>제출 대상 학생 설정</span>
        </label>
        <span className="text-[11px] font-semibold text-[#8C4A1A]">
          {targetType === 'all'
            ? `전체 ${students.length}명 대상`
            : targetType === 'group'
              ? `[${targetGroupName || '선택 그룹'}] ${selectedStudentIds.length}명 대상`
              : `선택 ${selectedStudentIds.length}명 / 전체 ${students.length}명`}
        </span>
      </div>

      {/* Target Type Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            onChangeTargetType('all');
            if (onChangeTargetGroupName) onChangeTargetGroupName('');
            onChangeSelectedStudentIds(students.map(s => s.id));
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
            targetType === 'all'
              ? 'bg-[#3D3A35] text-white border-[#3D3A35] shadow-xs'
              : 'bg-white text-[#5D574F] border-[#DCD5C8] hover:bg-[#F2EDE4]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>우리반 전체 ({students.length}명)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeTargetType('group');
            const defaultGroup = targetGroupName || availableGroupNames[0] || '1반';
            if (onChangeTargetGroupName) onChangeTargetGroupName(defaultGroup);
            const groupStudentIds = students
              .filter(s => (s.groupName || `${s.groupNumber || 1}모둠`) === defaultGroup)
              .map(s => s.id);
            onChangeSelectedStudentIds(groupStudentIds);
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
            targetType === 'group'
              ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-xs'
              : 'bg-white text-[#5D574F] border-[#DCD5C8] hover:bg-[#F2EDE4]'
          }`}
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>특정 그룹/반 지정</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeTargetType('custom');
            if (selectedStudentIds.length === 0) {
              onChangeSelectedStudentIds(students.map(s => s.id));
            }
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
            targetType === 'custom'
              ? 'bg-[#BC6C25] text-white border-[#BC6C25] shadow-xs'
              : 'bg-white text-[#5D574F] border-[#DCD5C8] hover:bg-[#F2EDE4]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>일부 학생만 직접 지정</span>
        </button>
      </div>

      {/* Group Selector Mode */}
      {targetType === 'group' && (
        <div className="pt-2 border-t border-[#EEECE6] space-y-3 animate-in fade-in duration-150">
          <div className="p-3 bg-[#EBF5EE] border border-[#A3B18A] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2D6A4F] flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4" />
                <span>과제를 부여할 그룹(반)을 선택하세요:</span>
              </span>
              <span className="text-[11px] text-[#3D5A30] font-semibold">
                선택된 대상: <b>{targetGroupName || '없음'}</b> ({selectedStudentIds.length}명)
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {availableGroupNames.length === 0 ? (
                <div className="text-xs text-[#7D7568] py-2">
                  등록된 그룹이 없습니다. 명단 관리에서 학생별 반/그룹을 설정해주세요.
                </div>
              ) : (
                availableGroupNames.map((gName) => {
                  const groupCount = students.filter(s => (s.groupName || `${s.groupNumber || 1}모둠`) === gName).length;
                  const isSelected = targetGroupName === gName;
                  return (
                    <button
                      key={gName}
                      type="button"
                      onClick={() => {
                        if (onChangeTargetGroupName) onChangeTargetGroupName(gName);
                        const gIds = students
                          .filter(s => (s.groupName || `${s.groupNumber || 1}모둠`) === gName)
                          .map(s => s.id);
                        onChangeSelectedStudentIds(gIds);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                        isSelected
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] ring-2 ring-[#2D6A4F]/30 scale-[1.02]'
                          : 'bg-white hover:bg-[#F2EDE4] text-[#3D3A35] border-[#DCD5C8]'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{gName}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-[#EAE5D8] text-[#5D574F]'
                      }`}>
                        {groupCount}명
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Preview of Students in Selected Group */}
          {targetGroupName && (
            <div className="p-3 bg-white border border-[#DCD5C8] rounded-xl space-y-1.5">
              <div className="text-[11px] font-bold text-[#5D574F] flex items-center justify-between">
                <span>'{targetGroupName}' 소속 학생 명단 ({selectedStudentIds.length}명):</span>
                <span className="text-[10px] text-[#8C4A1A]">이 과제는 위 학생들에게만 배정됩니다</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                {students
                  .filter(s => (s.groupName || `${s.groupNumber || 1}모둠`) === targetGroupName)
                  .map(st => (
                    <span
                      key={st.id}
                      className="px-2 py-1 bg-[#FAF9F6] border border-[#DCD5C8] text-[#3D3A35] rounded-lg text-[11px] font-medium"
                    >
                      {st.number}번 {st.name}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Student Selector Panel */}
      {targetType === 'custom' && (
        <div className="pt-2 border-t border-[#EEECE6] space-y-2.5 animate-in fade-in duration-150">
          {/* Quick Selection Toolbar with Prominent [전체 선택 해제] Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#FAF3EB]/80 border border-[#BC6C25]/25 rounded-xl">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDeselectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-[#C53030] hover:text-[#9B2C2C] border-2 border-red-300 hover:border-red-400 rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                title="선택된 모든 학생을 한 번에 해제합니다"
              >
                <XCircle className="w-4 h-4 text-[#C53030]" />
                <span>전체 선택 해제</span>
              </button>

              <button
                type="button"
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F2EDE4] text-[#3D3A35] border border-[#DCD5C8] rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                title="학급 학생 전체를 선택합니다"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#588157]" />
                <span>전체 선택</span>
              </button>
            </div>

            {/* Quick Filter Buttons (Odd, Even, Groups) */}
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <span className="text-[#8C4A1A] text-[10px] font-semibold mr-0.5">빠른 선택:</span>
              <button
                type="button"
                onClick={handleSelectOdd}
                className="px-2 py-1 bg-white hover:bg-[#F2EDE4] border border-[#DCD5C8] rounded-md text-[#5D574F] font-medium cursor-pointer"
              >
                홀수번
              </button>
              <button
                type="button"
                onClick={handleSelectEven}
                className="px-2 py-1 bg-white hover:bg-[#F2EDE4] border border-[#DCD5C8] rounded-md text-[#5D574F] font-medium cursor-pointer"
              >
                짝수번
              </button>
              {availableGroupNames.map(gName => (
                <button
                  key={gName}
                  type="button"
                  onClick={() => handleSelectGroup(gName)}
                  className="px-2 py-1 bg-white hover:bg-[#FAF3EB] hover:text-[#8C4A1A] border border-[#DCD5C8] rounded-md text-[#5D574F] font-medium cursor-pointer"
                >
                  {gName}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#A89F91] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 이름, 번호 또는 그룹(반) 검색..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#DCD5C8] rounded-lg text-xs text-[#3D3A35] placeholder:text-[#A89F91] focus:outline-none focus:ring-1 focus:ring-[#BC6C25]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#A89F91] hover:text-[#3D3A35]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Student Grid / Chips */}
          <div className="max-h-44 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-white/70 rounded-xl border border-[#DCD5C8]">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full py-4 text-center text-xs text-[#A89F91]">
                검색된 학생이 없습니다.
              </div>
            ) : (
              filteredStudents.map(student => {
                const isSelected = selectedStudentIds.includes(student.id);
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleToggleStudent(student.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF3EB] text-[#8C4A1A] border-[#BC6C25] font-bold shadow-2xs'
                        : 'bg-white text-[#7D7568] border-[#E6E1D5] hover:bg-[#F9F7F2]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-[#BC6C25] text-white font-bold' : 'bg-gray-100 text-gray-500'}`}>
                        {student.number}
                      </span>
                      <span className="truncate">{student.name}</span>
                      {(student.groupName || student.groupNumber) && (
                        <span className="text-[9px] px-1 py-0.2 bg-black/5 rounded text-[#7D7568]">
                          {student.groupName || `${student.groupNumber}모둠`}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 ml-1">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-[#BC6C25]" />
                      ) : (
                        <Circle className="w-3 h-3 text-[#DCD5C8]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selectedStudentIds.length === 0 && (
            <p className="text-[11px] text-[#C53030] font-semibold flex items-center gap-1">
              ⚠️ 최소 1명 이상의 대상을 선택해야 합니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
