import React, { useState, useMemo } from 'react';
import { Users, CheckCircle2, Circle, Search, X, Check } from 'lucide-react';
import { Student } from '../types';

interface StudentTargetSelectorProps {
  students: Student[];
  targetType: 'all' | 'custom';
  onChangeTargetType: (type: 'all' | 'custom') => void;
  selectedStudentIds: string[];
  onChangeSelectedStudentIds: (ids: string[]) => void;
}

export const StudentTargetSelector: React.FC<StudentTargetSelectorProps> = ({
  students,
  targetType,
  onChangeTargetType,
  selectedStudentIds,
  onChangeSelectedStudentIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract distinct groups in class
  const availableGroups = useMemo(() => {
    const groups = new Set<number>();
    students.forEach(s => {
      if (s.groupNumber) groups.add(s.groupNumber);
    });
    return Array.from(groups).sort((a, b) => a - b);
  }, [students]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter(s => 
      s.name.toLowerCase().includes(query) ||
      String(s.number).includes(query) ||
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

  const handleSelectGroup = (groupNum: number) => {
    const groupStudentIds = students.filter(s => s.groupNumber === groupNum).map(s => s.id);
    // If all in group are already selected, toggle off; otherwise add them all
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
            : `선택 ${selectedStudentIds.length}명 / 전체 ${students.length}명`}
        </span>
      </div>

      {/* Target Type Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChangeTargetType('all')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
            targetType === 'all'
              ? 'bg-[#3D3A35] text-white border-[#3D3A35] shadow-xs'
              : 'bg-white text-[#5D574F] border-[#DCD5C8] hover:bg-[#F2EDE4]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>우리반 전체 학생 ({students.length}명)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeTargetType('custom');
            if (selectedStudentIds.length === 0) {
              // Default to all selected for easy unchecking
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
          <span>일부 학생만 지정 ({selectedStudentIds.length}명)</span>
        </button>
      </div>

      {/* Custom Student Selector Panel */}
      {targetType === 'custom' && (
        <div className="pt-2 border-t border-[#EEECE6] space-y-2 animate-in fade-in duration-150">
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="text-[#A89F91] text-[10px] mr-0.5">빠른 선택:</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2 py-0.5 bg-white hover:bg-[#F2EDE4] border border-[#DCD5C8] rounded-md text-[#5D574F] cursor-pointer"
            >
              모두 선택
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2 py-0.5 bg-white hover:bg-[#F2EDE4] border border-[#DCD5C8] rounded-md text-[#5D574F] cursor-pointer"
            >
              모두 해제
            </button>
            <button
              type="button"
              onClick={handleSelectOdd}
              className="px-2 py-0.5 bg-white hover:bg-[#F2EDE4] border border-[#DCD5C8] rounded-md text-[#5D574F] cursor-pointer"
            >
              홀수번
            </button>
            <button
              type="button"
              onClick={handleSelectEven}
              className="px-2 py-0.5 bg-white hover:bg-[#F2EDE4] border border-[#DCD5C8] rounded-md text-[#5D574F] cursor-pointer"
            >
              짝수번
            </button>

            {availableGroups.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => handleSelectGroup(g)}
                className="px-2 py-0.5 bg-white hover:bg-[#F2EDE4] border border-[#DCD5C8] rounded-md text-[#5D574F] cursor-pointer"
              >
                {g}모둠
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#A89F91] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 이름 또는 번호 검색..."
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
                      <span className={`text-[10px] px-1 py-0.2 rounded ${isSelected ? 'bg-[#BC6C25] text-white font-bold' : 'bg-gray-100 text-gray-500'}`}>
                        {student.number}
                      </span>
                      <span className="truncate">{student.name}</span>
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
