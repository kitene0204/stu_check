import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Users, 
  ClipboardPaste, 
  Plus, 
  Trash2, 
  Check, 
  RefreshCw, 
  Sparkles,
  UserCheck,
  AlertCircle,
  FolderPlus,
  Pencil,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square
} from 'lucide-react';
import { Student } from '../types';
import { parseStudentRosterText, sanitizeStudents } from '../services/storageService';
import { INITIAL_STUDENTS } from '../data/initialData';

// Safe helper to extract group/class name from student object
export const getStudentGroupName = (student: Student | null | undefined): string => {
  if (!student) return '1반';
  if (student.groupName != null) {
    const trimmed = String(student.groupName).trim();
    if (trimmed) return trimmed;
  }
  if (student.groupNumber != null && !isNaN(Number(student.groupNumber))) {
    return `${student.groupNumber}모둠`;
  }
  return '1반';
};

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSaveStudents?: (newStudents: Student[]) => void;
  onUpdateStudents?: (newStudents: Student[]) => void;
  onShowToast: (msg: string) => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  students = [],
  onSaveStudents,
  onUpdateStudents,
  onShowToast,
}) => {
  // Safe array of students - sanitized so every student is guaranteed non-null with valid fields
  const safeStudents = useMemo(() => {
    return sanitizeStudents(students);
  }, [students]);

  // Tab navigation: 'list' | 'paste' | 'add'
  const [activeTab, setActiveTab] = useState<'list' | 'paste' | 'add'>('list');

  // Paste Tab State
  const [pasteText, setPasteText] = useState('');
  const [pasteGroupName, setPasteGroupName] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  // Group Tool State in 'list' tab
  const [isGroupToolOpen, setIsGroupToolOpen] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [selectedStudentIdsForGroup, setSelectedStudentIdsForGroup] = useState<string[]>([]);
  const [batchTargetGroup, setBatchTargetGroup] = useState('1반');
  const [splitNumClasses, setSplitNumClasses] = useState(2);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(Math.max(1, Math.min(10, safeStudents.length)));
  const [rangeGroupName, setRangeGroupName] = useState('1반');
  const [teamSize, setTeamSize] = useState(4);

  // Inline group editing state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingGroupNameInput, setEditingGroupNameInput] = useState('');

  // Single student form
  const [newNum, setNewNum] = useState<number>(safeStudents.length + 1);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F'>('M');
  const [newGroupName, setNewGroupName] = useState('1반');
  const [newNote, setNewNote] = useState('');

  // Safe window.confirm wrapper for iframes and sandboxes
  const safeConfirm = (msg: string): boolean => {
    try {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        return window.confirm(msg);
      }
    } catch {
      return true;
    }
    return true;
  };

  // Sync rangeEnd and newNum when safeStudents changes
  useEffect(() => {
    if (safeStudents.length > 0) {
      setRangeEnd(prev => prev === 1 ? Math.min(10, safeStudents.length) : prev);
      setNewNum(safeStudents.length + 1);
    }
  }, [safeStudents.length]);

  // Extract all distinct group names
  const uniqueGroups = useMemo(() => {
    const set = new Set<string>();
    safeStudents.forEach(s => {
      const g = getStudentGroupName(s);
      if (g) set.add(g);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [safeStudents]);

  // Real-time parsing of pasted text
  const parsedStudents = useMemo(() => {
    if (!pasteText.trim()) return [];
    return parseStudentRosterText(pasteText, pasteGroupName.trim() || undefined);
  }, [pasteText, pasteGroupName]);

  // Filter students for list tab display
  const displayedStudents = useMemo(() => {
    if (filterGroup === 'all') return safeStudents;
    return safeStudents.filter(s => getStudentGroupName(s) === filterGroup);
  }, [safeStudents, filterGroup]);

  // Early return ONLY after ALL hooks have been declared
  if (!isOpen) return null;

  // Universal save dispatcher to prevent prop name mismatch
  const saveRoster = (newRoster: Student[]) => {
    if (onSaveStudents) onSaveStudents(newRoster);
    if (onUpdateStudents) onUpdateStudents(newRoster);
  };

  // 1. Paste Import Handler
  const handlePasteImport = () => {
    if (!pasteText.trim()) {
      onShowToast('⚠️ 붙여넣을 학생 명단 텍스트를 입력해 주세요.');
      return;
    }

    if (parsedStudents.length === 0) {
      onShowToast('⚠️ 학생 데이터를 인식하지 못했습니다. 한 줄에 한 명씩 이름을 적어주세요.');
      return;
    }

    let finalRoster: Student[] = [];

    if (importMode === 'replace') {
      finalRoster = parsedStudents;
    } else {
      // Append mode
      const maxNum = safeStudents.reduce((max, s) => Math.max(max, s.number || 0), 0);
      const renumbered = parsedStudents.map((st, idx) => ({
        ...st,
        number: maxNum + idx + 1,
      }));
      finalRoster = [...safeStudents, ...renumbered];
    }

    saveRoster(finalRoster);
    onShowToast(`✅ ${finalRoster.length}명의 학급 명단이 성공적으로 저장되었습니다!`);
    setPasteText('');
    setPasteGroupName('');
    setActiveTab('list');
  };

  // 2. Add Single Student Handler
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      onShowToast('⚠️ 학생 이름을 입력해 주세요.');
      return;
    }

    const gName = newGroupName.trim() || '1반';
    const numMatch = gName.match(/([0-9]+)/);
    const gNum = numMatch ? parseInt(numMatch[1], 10) : 1;

    const newStudent: Student = {
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      number: newNum || safeStudents.length + 1,
      name: newName.trim(),
      gender: newGender,
      groupName: gName,
      groupNumber: gNum,
      note: newNote.trim(),
    };

    const updated = [...safeStudents, newStudent].sort((a, b) => (a.number || 0) - (b.number || 0));
    saveRoster(updated);
    onShowToast(`✅ ${newStudent.number}번 ${newStudent.name} (${gName}) 학생이 추가되었습니다.`);
    setNewName('');
    setNewNote('');
    setNewNum(updated.length + 1);
  };

  // 3. Delete Student Handler
  const handleDeleteStudent = (id: string, name: string) => {
    if (safeConfirm(`${name} 학생을 명단에서 삭제하시겠습니까?`)) {
      const updated = safeStudents.filter(s => s.id !== id);
      saveRoster(updated);
      onShowToast(`🗑️ ${name} 학생이 삭제되었습니다.`);
    }
  };

  // 4. Reset to Default Handler
  const handleResetToDefault = () => {
    if (safeConfirm('기본 샘플 학급 명단으로 초기화하시겠습니까?')) {
      saveRoster(INITIAL_STUDENTS);
      onShowToast('🔄 기본 샘플 명단으로 재설정되었습니다.');
    }
  };

  // 5. Update Single Student Group
  const handleUpdateStudentGroup = (studentId: string, targetName: string) => {
    const gName = targetName.trim();
    if (!gName) return;
    const numMatch = gName.match(/([0-9]+)/);
    const gNum = numMatch ? parseInt(numMatch[1], 10) : 1;

    const updated = safeStudents.map(s => {
      if (s.id === studentId) {
        return { ...s, groupName: gName, groupNumber: gNum };
      }
      return s;
    });

    saveRoster(updated);
    setEditingStudentId(null);
    onShowToast(`✅ 학생 그룹이 '${gName}'(으)로 변경되었습니다.`);
  };

  // 6. Batch Assign Selected Students to Group
  const handleBatchAssignGroup = (targetName: string) => {
    const gName = targetName.trim();
    if (!gName) {
      onShowToast('⚠️ 변경할 그룹(반) 이름을 입력해 주세요.');
      return;
    }
    if (selectedStudentIdsForGroup.length === 0) {
      onShowToast('⚠️ 그룹을 변경할 학생을 먼저 선택해 주세요.');
      return;
    }

    const numMatch = gName.match(/([0-9]+)/);
    const gNum = numMatch ? parseInt(numMatch[1], 10) : 1;
    const set = new Set(selectedStudentIdsForGroup);

    const updated = safeStudents.map(s => {
      if (set.has(s.id)) {
        return { ...s, groupName: gName, groupNumber: gNum };
      }
      return s;
    });

    saveRoster(updated);
    onShowToast(`✅ 선택한 ${selectedStudentIdsForGroup.length}명의 학생이 '${gName}'(으)로 일괄 변경되었습니다!`);
    setSelectedStudentIdsForGroup([]);
  };

  // 7. Auto Split into N Classes (e.g. 2반, 3반)
  const handleAutoSplitClasses = (numClasses: number) => {
    if (safeStudents.length === 0) return;
    const count = Math.max(2, Math.min(10, numClasses));
    const perClass = Math.ceil(safeStudents.length / count);

    const updated = safeStudents.map((s, idx) => {
      const classIdx = Math.min(count, Math.floor(idx / perClass) + 1);
      const gName = `${classIdx}반`;
      return { ...s, groupName: gName, groupNumber: classIdx };
    });

    saveRoster(updated);
    onShowToast(`✨ 전체 ${safeStudents.length}명이 ${count}개 반(1반~${count}반)으로 자동 분할되었습니다!`);
  };

  // 8. Range Assign Group (e.g. 1~10번 1반, 11~19번 2반)
  const handleRangeAssign = (start: number, end: number, gName: string) => {
    const name = gName.trim();
    if (!name) {
      onShowToast('⚠️ 지정할 그룹(반) 이름을 입력해 주세요.');
      return;
    }
    const numMatch = name.match(/([0-9]+)/);
    const gNum = numMatch ? parseInt(numMatch[1], 10) : 1;

    let affected = 0;
    const updated = safeStudents.map(s => {
      if (s.number >= start && s.number <= end) {
        affected++;
        return { ...s, groupName: name, groupNumber: gNum };
      }
      return s;
    });

    saveRoster(updated);
    onShowToast(`✅ ${start}번~${end}번 학생(${affected}명)이 '${name}'(으)로 설정되었습니다.`);
  };

  // 9. Auto Split Teams (모둠 - 4명씩 등)
  const handleAutoSplitTeams = (size: number) => {
    if (safeStudents.length === 0) return;
    const perTeam = Math.max(2, Math.min(10, size));
    const updated = safeStudents.map((s, idx) => {
      const gNum = Math.floor(idx / perTeam) + 1;
      const gName = `${gNum}모둠`;
      return { ...s, groupName: gName, groupNumber: gNum };
    });

    saveRoster(updated);
    onShowToast(`✨ ${perTeam}명씩 모둠(1모둠, 2모둠...)으로 재편성되었습니다!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3.5 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2.5 text-[#3D3A35]">
            <div className="w-9 h-9 rounded-xl bg-[#A3B18A] text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#3D3A35]">
                학급 학생 명단 및 그룹/반 관리 (총 {safeStudents.length}명)
              </h3>
              <p className="text-[11px] text-[#5D574F]">
                다른 반 수업, 분반, 모둠 설정 및 과제별 그룹 지정 지원
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7D7568] hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#DCD5C8] bg-[#F2EDE4] px-4 sm:px-6 pt-2 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'list'
                ? 'bg-[#FAF9F6] text-[#2D6A4F] border-t border-x border-[#DCD5C8] shadow-2xs'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>현재 명단 ({safeStudents.length}명)</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'paste'
                ? 'bg-[#FAF9F6] text-[#2D6A4F] border-t border-x border-[#DCD5C8] shadow-2xs'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
          >
            <ClipboardPaste className="w-4 h-4 text-[#2D6A4F]" />
            <span>엑셀/구글 시트 일괄 등록</span>
            {parsedStudents.length > 0 && (
              <span className="px-1.5 py-0.2 bg-[#2D6A4F] text-white rounded-full text-[10px] font-bold">
                {parsedStudents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'add'
                ? 'bg-[#FAF9F6] text-[#3D3A35] border-t border-x border-[#DCD5C8] shadow-2xs'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#A3B18A]" />
            <span>개별 학생 추가</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: List & Group Management */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {/* Header Status Bar & Group Toolbar Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-[#DCD5C8]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#5D574F]">
                    등록 학생: <b>총 {safeStudents.length}명</b>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8F0E4] text-[#2D6A4F] font-bold border border-[#A3B18A]">
                    {uniqueGroups.length}개 그룹/반 보유
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGroupToolOpen(!isGroupToolOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isGroupToolOpen
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-xs'
                        : 'bg-[#FAF3EB] text-[#8C4A1A] border-[#BC6C25]/40 hover:bg-[#F5E6D3]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>그룹/반 나누기 도구</span>
                    {isGroupToolOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={handleResetToDefault}
                    className="flex items-center gap-1 text-[11px] text-[#A89F91] hover:text-[#3D3A35] underline cursor-pointer"
                    title="초기 샘플 24명 복원"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>샘플 복원</span>
                  </button>
                </div>
              </div>

              {/* Group Division Tool Panel (Collapsible) */}
              {isGroupToolOpen && (
                <div className="p-3.5 bg-[#FAF9F6] border-2 border-[#A3B18A] rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#2D6A4F] border-b border-[#DCD5C8] pb-1.5">
                    <FolderPlus className="w-4 h-4 text-[#2D6A4F]" />
                    <span>그룹 / 다른 반 수업 일괄 설정 도구</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Tool A: Auto Split by Classes */}
                    <div className="p-3 bg-white rounded-xl border border-[#DCD5C8] space-y-2">
                      <div className="font-bold text-[#3D3A35] text-[11px]">
                        1. 전체 학생을 N개 반으로 자동 분할
                      </div>
                      <p className="text-[10px] text-[#7D7568]">
                        번호순으로 균등하게 1반, 2반 등으로 자동 나눕니다.
                      </p>
                      <div className="flex items-center gap-2">
                        <select
                          value={splitNumClasses}
                          onChange={(e) => setSplitNumClasses(parseInt(e.target.value, 10))}
                          className="px-2.5 py-1.5 bg-[#FAF9F6] border border-[#DCD5C8] rounded-lg text-xs font-bold text-[#3D3A35]"
                        >
                          <option value={2}>2개 반 (1반, 2반)</option>
                          <option value={3}>3개 반 (1반, 2반, 3반)</option>
                          <option value={4}>4개 반 (1반~4반)</option>
                          <option value={5}>5개 반 (1반~5반)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAutoSplitClasses(splitNumClasses)}
                          className="px-3 py-1.5 bg-[#2D6A4F] hover:bg-[#23533E] text-white rounded-lg text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-xs"
                        >
                          {splitNumClasses}개 반으로 나누기
                        </button>
                      </div>
                    </div>

                    {/* Tool B: Range Assign */}
                    <div className="p-3 bg-white rounded-xl border border-[#DCD5C8] space-y-2">
                      <div className="font-bold text-[#3D3A35] text-[11px]">
                        2. 출석 번호 범위로 반/그룹 지정
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <input
                          type="number"
                          value={rangeStart}
                          onChange={(e) => setRangeStart(parseInt(e.target.value, 10) || 1)}
                          className="w-12 px-1.5 py-1 bg-[#FAF9F6] border border-[#DCD5C8] rounded-md text-center font-bold text-xs"
                          min={1}
                        />
                        <span>번 ~</span>
                        <input
                          type="number"
                          value={rangeEnd}
                          onChange={(e) => setRangeEnd(parseInt(e.target.value, 10) || 1)}
                          className="w-12 px-1.5 py-1 bg-[#FAF9F6] border border-[#DCD5C8] rounded-md text-center font-bold text-xs"
                          min={1}
                        />
                        <span>번 ➔</span>
                        <input
                          type="text"
                          value={rangeGroupName}
                          onChange={(e) => setRangeGroupName(e.target.value)}
                          placeholder="예: 2반"
                          className="w-16 px-1.5 py-1 bg-[#FAF9F6] border border-[#DCD5C8] rounded-md font-bold text-xs text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleRangeAssign(rangeStart, rangeEnd, rangeGroupName)}
                          className="px-2.5 py-1 bg-[#8C4A1A] hover:bg-[#6E3A15] text-white rounded-md text-xs font-bold cursor-pointer"
                        >
                          적용
                        </button>
                      </div>
                      <div className="flex gap-1 text-[10px] text-[#A89F91]">
                        <span>추천:</span>
                        <button type="button" onClick={() => { setRangeStart(1); setRangeEnd(10); setRangeGroupName('1반'); }} className="underline hover:text-[#3D3A35]">1~10번 1반</button>
                        <span>•</span>
                        <button type="button" onClick={() => { setRangeStart(11); setRangeEnd(safeStudents.length); setRangeGroupName('2반'); }} className="underline hover:text-[#3D3A35]">11번~끝 2반</button>
                      </div>
                    </div>

                    {/* Tool C: Batch Assign Selected */}
                    <div className="p-3 bg-white rounded-xl border border-[#DCD5C8] space-y-2">
                      <div className="font-bold text-[#3D3A35] text-[11px] flex items-center justify-between">
                        <span>3. 학생 체크 선택 후 일괄 변경</span>
                        <span className="text-[#2D6A4F] font-bold">
                          선택: {selectedStudentIdsForGroup.length}명
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={batchTargetGroup}
                          onChange={(e) => setBatchTargetGroup(e.target.value)}
                          placeholder="예: 2반"
                          className="w-24 px-2 py-1 bg-[#FAF9F6] border border-[#DCD5C8] rounded-md text-xs font-bold text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleBatchAssignGroup(batchTargetGroup)}
                          disabled={selectedStudentIdsForGroup.length === 0}
                          className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                            selectedStudentIdsForGroup.length > 0
                              ? 'bg-[#2D6A4F] text-white hover:bg-[#23533E] shadow-2xs'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {selectedStudentIdsForGroup.length}명 일괄 변경
                        </button>
                      </div>
                    </div>

                    {/* Tool D: Team Split (모둠) */}
                    <div className="p-3 bg-white rounded-xl border border-[#DCD5C8] space-y-2">
                      <div className="font-bold text-[#3D3A35] text-[11px]">
                        4. 모둠으로 나누기 (1모둠, 2모둠...)
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={teamSize}
                          onChange={(e) => setTeamSize(parseInt(e.target.value, 10))}
                          className="px-2.5 py-1 bg-[#FAF9F6] border border-[#DCD5C8] rounded-lg text-xs font-bold text-[#3D3A35]"
                        >
                          <option value={3}>3명씩 모둠</option>
                          <option value={4}>4명씩 모둠</option>
                          <option value={5}>5명씩 모둠</option>
                          <option value={6}>6명씩 모둠</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAutoSplitTeams(teamSize)}
                          className="px-3 py-1 bg-[#FAF3EB] hover:bg-[#F5E6D3] text-[#8C4A1A] border border-[#BC6C25]/40 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {teamSize}명씩 모둠 편성
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Group Filter Chips Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] text-[#A89F91] shrink-0 font-bold">그룹 필터:</span>
                <button
                  type="button"
                  onClick={() => setFilterGroup('all')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer shrink-0 border transition-all ${
                    filterGroup === 'all'
                      ? 'bg-[#3D3A35] text-white border-[#3D3A35]'
                      : 'bg-white text-[#5D574F] border-[#DCD5C8] hover:bg-[#FAF9F5]'
                  }`}
                >
                  전체 ({safeStudents.length}명)
                </button>

                {uniqueGroups.map((gName) => {
                  const count = safeStudents.filter(s => getStudentGroupName(s) === gName).length;
                  return (
                    <button
                      key={gName}
                      type="button"
                      onClick={() => setFilterGroup(gName)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer shrink-0 border transition-all flex items-center gap-1 ${
                        filterGroup === gName
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                          : 'bg-white text-[#3D3A35] border-[#DCD5C8] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <span>{gName}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded-full ${filterGroup === gName ? 'bg-white/20' : 'bg-gray-100'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Student Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                {displayedStudents.map((st, idx) => {
                  if (!st) return null;
                  const stId = st.id || `st-item-${idx}`;
                  const isChecked = Boolean(selectedStudentIdsForGroup && selectedStudentIdsForGroup.includes(stId));
                  const currentGroupName = getStudentGroupName(st);
                  const stNum = st.number != null && !isNaN(st.number) ? st.number : idx + 1;
                  const stName = st.name || `학생 ${stNum}`;

                  return (
                    <div
                      key={stId}
                      className={`p-3 bg-white rounded-2xl border transition-all flex items-center justify-between shadow-2xs ${
                        isChecked ? 'border-[#2D6A4F] bg-[#EBF5EE]/30' : 'border-[#DCD5C8] hover:border-[#A3B18A]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Checkbox for batch group assignment */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedStudentIdsForGroup(prev => prev.filter(id => id !== stId));
                            } else {
                              setSelectedStudentIdsForGroup(prev => [...prev, stId]);
                            }
                          }}
                          className="text-[#A89F91] hover:text-[#2D6A4F] cursor-pointer shrink-0"
                          title="체크하여 그룹 일괄 변경"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#2D6A4F]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#DCD5C8]" />
                          )}
                        </button>

                        <span className="w-7 h-7 rounded-xl bg-[#FAF9F6] border border-[#DCD5C8] text-xs font-bold text-[#5D574F] flex items-center justify-center font-mono shrink-0">
                          {stNum}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-bold text-[#3D3A35]">{stName}</span>
                            {st.gender && (
                              <span className={`text-[10px] px-1 py-0.2 rounded font-semibold ${st.gender === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                                {st.gender === 'M' ? '남' : '여'}
                              </span>
                            )}
                          </div>
                          {st.note && (
                            <p className="text-[10px] text-[#8C8477] truncate max-w-[130px]">{st.note}</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Group Badge (Clickable to Edit) & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {editingStudentId === stId ? (
                          <div className="flex items-center gap-1 bg-[#FAF3EB] p-1 rounded-xl border border-[#BC6C25]/40 animate-in fade-in">
                            <input
                              type="text"
                              value={editingGroupNameInput}
                              onChange={(e) => setEditingGroupNameInput(e.target.value)}
                              placeholder="그룹/반"
                              className="w-14 px-1.5 py-0.5 text-[11px] font-bold bg-white border border-[#BC6C25] rounded text-center"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateStudentGroup(stId, editingGroupNameInput);
                                if (e.key === 'Escape') setEditingStudentId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentGroup(stId, editingGroupNameInput)}
                              className="p-1 bg-[#2D6A4F] text-white rounded text-[10px] font-bold hover:bg-[#23533E]"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStudentId(null)}
                              className="p-1 text-gray-500 hover:text-black"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudentId(stId);
                              setEditingGroupNameInput(currentGroupName);
                            }}
                            className="text-[10px] bg-[#FAF3EB] hover:bg-[#F5E6D3] text-[#8C4A1A] border border-[#BC6C25]/30 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                            title="클릭하여 그룹/반 변경"
                          >
                            <span>{currentGroupName}</span>
                            <Pencil className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteStudent(stId, stName)}
                          className="p-1.5 text-[#A89F91] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="학생 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Paste Import */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#EAE5D8]/50 border border-[#DCD5C8] rounded-2xl text-xs text-[#5D574F] leading-relaxed">
                <div className="flex items-center gap-1.5 text-[#3D3A35] font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-[#BC6C25]" />
                  <span>엑셀 / 구글 시트 / 한글에서 학생 이름을 복사(Ctrl+C)하여 붙여넣기(Ctrl+V)하세요.</span>
                </div>
                <p className="text-[11px] text-[#7D7568]">
                  • <b>이름만 적어도</b> 1번부터 자동으로 번호가 매겨집니다.<br />
                  • <b>다른 반 명단을 추가</b>할 때는 아래 '그룹/학급 명칭'에 <code>2반</code>을 적고 <b>'기존 명단 뒤에 추가'</b>를 선택하세요!
                </p>
              </div>

              {/* Group Name Assignment for this Batch */}
              <div className="p-3 bg-white border border-[#DCD5C8] rounded-2xl space-y-2">
                <label className="text-xs font-bold text-[#3D3A35] flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4 text-[#2D6A4F]" />
                  <span>붙여넣을 명단의 그룹 / 학급 명칭 지정 (선택):</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pasteGroupName}
                    onChange={(e) => setPasteGroupName(e.target.value)}
                    placeholder="예: 1반, 2반, 3반, A그룹, 1모둠..."
                    className="flex-1 px-3 py-1.5 bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs font-bold text-[#3D3A35] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                  />
                  <div className="flex gap-1 shrink-0">
                    {['1반', '2반', '3반', '1모둠', '2모둠'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPasteGroupName(preset)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border ${
                          pasteGroupName === preset
                            ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                            : 'bg-white hover:bg-gray-100 text-[#5D574F] border-[#DCD5C8]'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`예시 (이름만 줄바꿈하여 입력해도 자동 인식됩니다):\n송다성\n엄호준\n윤시우\n이솔빛나\n이정\n...`}
                  rows={6}
                  className="w-full p-3.5 bg-white border border-[#DCD5C8] rounded-2xl text-xs text-[#3D3A35] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#2D6A4F] shadow-inner placeholder:text-[#A89F91]"
                />
              </div>

              {/* Realtime Detection Banner & Mode Selector */}
              {parsedStudents.length > 0 ? (
                <div className="p-4 bg-[#E8F0E4] border border-[#A3B18A] rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F] animate-ping" />
                      <span className="font-extrabold text-sm text-[#2D6A4F]">
                        ✨ 총 {parsedStudents.length}명의 학생이 인식되었습니다!
                      </span>
                    </div>
                    {pasteGroupName && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#2D6A4F] text-white font-bold">
                        소속: {pasteGroupName}
                      </span>
                    )}
                  </div>

                  {/* Preview Chips */}
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-2 bg-white/70 rounded-xl border border-[#DCD5C8]">
                    {parsedStudents.map((st) => (
                      <span
                        key={st.id}
                        className="px-2 py-1 bg-white border border-[#DCD5C8] text-[#3D3A35] rounded-lg text-[11px] font-bold shadow-2xs"
                      >
                        {st.number}번 {st.name} {st.groupName ? `[${st.groupName}]` : ''}
                      </span>
                    ))}
                  </div>

                  {/* Mode Option */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#A3B18A]/40 text-xs">
                    <span className="font-bold text-[#3D3A35]">저장 방식 선택:</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#2D6A4F]">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="accent-[#2D6A4F] w-4 h-4"
                        />
                        <span>새 명단으로 덮어쓰기</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#8C4A1A]">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="accent-[#8C4A1A] w-4 h-4"
                        />
                        <span>기존 명단 뒤에 추가 (다른 반 추가 시 추천)</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : pasteText.trim().length > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-amber-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>텍스트를 분석 중입니다. 한 줄에 한 명씩 학생 이름을 입력해 주세요.</span>
                </div>
              ) : null}

              {/* Primary Action Button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handlePasteImport}
                  disabled={parsedStudents.length === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer ${
                    parsedStudents.length > 0
                      ? 'bg-[#2D6A4F] hover:bg-[#23533E] text-white ring-2 ring-[#2D6A4F]/30'
                      : 'bg-[#DCD5C8] text-[#8C8477] cursor-not-allowed opacity-70'
                  }`}
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>
                    {parsedStudents.length > 0
                      ? `✨ ${parsedStudents.length}명 명단 저장 및 적용하기`
                      : '학생 명단을 입력하면 저장 버튼이 활성화됩니다'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Add Single Student */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddSingle} className="space-y-4 max-w-md mx-auto bg-white p-5 rounded-2xl border border-[#DCD5C8]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#5D574F] block mb-1">출석 번호</label>
                  <input
                    type="number"
                    value={newNum}
                    onChange={(e) => setNewNum(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs font-bold text-[#3D3A35] focus:outline-hidden focus:ring-2 focus:ring-[#A3B18A]"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5D574F] block mb-1">학생 이름</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs font-bold text-[#3D3A35] focus:outline-hidden focus:ring-2 focus:ring-[#A3B18A]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#5D574F] block mb-1">성별</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] font-bold focus:outline-hidden focus:ring-2 focus:ring-[#A3B18A]"
                  >
                    <option value="M">남학생</option>
                    <option value="F">여학생</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5D574F] block mb-1">소속 그룹 / 반</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="예: 1반, 2반, 1모둠"
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs font-bold text-[#3D3A35] focus:outline-hidden focus:ring-2 focus:ring-[#A3B18A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#5D574F] block mb-1">특이사항 / 메모 (선택)</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="예: 안경 착용, 발표 도우미"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-hidden focus:ring-2 focus:ring-[#A3B18A]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#2D6A4F] text-white hover:bg-[#23533E] rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ 학생 1명 추가하기</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#EAE5D8] border-t border-[#DCD5C8] flex items-center justify-between">
          <div className="text-[11px] text-[#5D574F] font-semibold">
            <span>등록된 학생: <b>{safeStudents.length}명</b></span>
            {uniqueGroups.length > 0 && (
              <span className="ml-2 text-[#2D6A4F] font-bold">({uniqueGroups.join(', ')})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#3D3A35] text-white hover:bg-[#2C2925] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              완료 / 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
