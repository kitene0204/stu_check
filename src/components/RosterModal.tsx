import React, { useState, useMemo } from 'react';
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
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Student } from '../types';
import { parseStudentRosterText } from '../services/storageService';
import { INITIAL_STUDENTS } from '../data/initialData';

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
  students,
  onSaveStudents,
  onUpdateStudents,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'paste' | 'add'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  
  // Single student form
  const [newNum, setNewNum] = useState<number>(students.length + 1);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F'>('M');
  const [newGroup, setNewGroup] = useState<number>(1);
  const [newNote, setNewNote] = useState('');

  // Universal save dispatcher to prevent prop name mismatch
  const saveRoster = (newRoster: Student[]) => {
    if (onSaveStudents) onSaveStudents(newRoster);
    if (onUpdateStudents) onUpdateStudents(newRoster);
  };

  // Real-time parsing of pasted text
  const parsedStudents = useMemo(() => {
    if (!pasteText.trim()) return [];
    return parseStudentRosterText(pasteText);
  }, [pasteText]);

  if (!isOpen) return null;

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
      const maxNum = students.reduce((max, s) => Math.max(max, s.number), 0);
      const renumbered = parsedStudents.map((st, idx) => ({
        ...st,
        number: maxNum + idx + 1,
      }));
      finalRoster = [...students, ...renumbered];
    }

    // Save and notify
    saveRoster(finalRoster);
    onShowToast(`✅ ${finalRoster.length}명의 학급 명단이 성공적으로 저장되었습니다!`);
    setPasteText('');
    setActiveTab('list');
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      onShowToast('⚠️ 학생 이름을 입력해 주세요.');
      return;
    }

    const newStudent: Student = {
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      number: newNum || students.length + 1,
      name: newName.trim(),
      gender: newGender,
      groupNumber: newGroup || 1,
      note: newNote.trim(),
    };

    const updated = [...students, newStudent].sort((a, b) => a.number - b.number);
    saveRoster(updated);
    onShowToast(`✅ ${newStudent.number}번 ${newStudent.name} 학생이 추가되었습니다.`);
    setNewName('');
    setNewNote('');
    setNewNum(updated.length + 1);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`${name} 학생을 명단에서 삭제하시겠습니까?`)) {
      const updated = students.filter(s => s.id !== id);
      saveRoster(updated);
      onShowToast(`🗑️ ${name} 학생이 삭제되었습니다.`);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('기본 샘플 학급 명단(24명)으로 초기화하시겠습니까?')) {
      saveRoster(INITIAL_STUDENTS);
      onShowToast('🔄 기본 샘플 명단으로 재설정되었습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3.5 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2.5 text-[#3D3A35]">
            <div className="w-9 h-9 rounded-xl bg-[#A3B18A] text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#3D3A35]">
                학급 학생 명단 관리 (총 {students.length}명)
              </h3>
              <p className="text-[11px] text-[#5D574F]">
                엑셀/구글 시트 복사 붙여넣기 또는 개별 등록
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
            onClick={() => setActiveTab('list')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'list'
                ? 'bg-[#FAF9F6] text-[#3D3A35] border-t border-x border-[#DCD5C8] shadow-2xs'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#5D574F]" />
            <span>현재 명단 ({students.length}명)</span>
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
          {/* 1. Paste Tab */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#EAE5D8]/50 border border-[#DCD5C8] rounded-2xl text-xs text-[#5D574F] leading-relaxed">
                <div className="flex items-center gap-1.5 text-[#3D3A35] font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-[#BC6C25]" />
                  <span>엑셀 / 구글 시트 / 한글에서 학생 이름을 복사(Ctrl+C)하여 붙여넣기(Ctrl+V)하세요.</span>
                </div>
                <p className="text-[11px] text-[#7D7568]">
                  • <b>이름만 적어도</b> 1번부터 자동으로 번호가 매겨집니다. (예: 송다성, 엄호준, 윤시우...)<br />
                  • <code>[번호] [이름] [성별(남/여)] [모둠]</code> 형태의 표 복사도 완벽하게 지원합니다.
                </p>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`예시 (이름만 줄바꿈하여 입력해도 자동 인식됩니다):\n송다성\n엄호준\n윤시우\n이솔빛나\n이정\n...`}
                  rows={8}
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
                        ✨ 총 {parsedStudents.length}명의 학생이 성공적으로 인식되었습니다!
                      </span>
                    </div>
                    <span className="text-[11px] text-[#3D5A30] font-semibold">
                      (1번 {parsedStudents[0]?.name} ~ {parsedStudents[parsedStudents.length - 1]?.number}번 {parsedStudents[parsedStudents.length - 1]?.name})
                    </span>
                  </div>

                  {/* Preview Chips */}
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white/70 rounded-xl border border-[#DCD5C8]">
                    {parsedStudents.map((st) => (
                      <span
                        key={st.id}
                        className="px-2 py-1 bg-white border border-[#DCD5C8] text-[#3D3A35] rounded-lg text-[11px] font-bold shadow-2xs"
                      >
                        {st.number}번 {st.name} {st.gender ? `(${st.gender === 'M' ? '남' : '여'})` : ''}
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
                        <span>새 명단으로 덮어쓰기 (추천)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#5D574F]">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="accent-[#2D6A4F] w-4 h-4"
                        />
                        <span>기존 명단 뒤에 추가</span>
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
                      ? `✨ ${parsedStudents.length}명 명단 지금 저장 및 적용하기`
                      : '학생 명단을 입력하면 저장 버튼이 활성화됩니다'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 2. List Tab */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-[#5D574F] bg-white p-3 rounded-2xl border border-[#DCD5C8]">
                <span>현재 등록된 학급 학생: <b>총 {students.length}명</b></span>
                <button
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1 text-[11px] text-[#A89F91] hover:text-[#3D3A35] underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  기본 24명 샘플 복원
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {students.map((st) => (
                  <div
                    key={st.id}
                    className="p-3 bg-white rounded-2xl border border-[#DCD5C8] flex items-center justify-between shadow-2xs hover:border-[#A3B18A] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-[#FAF9F6] border border-[#DCD5C8] text-xs font-bold text-[#5D574F] flex items-center justify-center">
                        {st.number}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#3D3A35]">{st.name}</span>
                          {st.gender && (
                            <span className={`text-[10px] px-1 py-0.2 rounded font-semibold ${st.gender === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                              {st.gender === 'M' ? '남' : '여'}
                            </span>
                          )}
                        </div>
                        {st.note && (
                          <p className="text-[10px] text-[#8C8477] truncate max-w-[140px]">{st.note}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {st.groupNumber && (
                        <span className="text-[10px] bg-[#F2EDE4] text-[#5D574F] px-2 py-0.5 rounded-lg font-bold">
                          {st.groupNumber}모둠
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteStudent(st.id, st.name)}
                        className="p-1.5 text-[#A89F91] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="학생 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Add Single Student Tab */}
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
                  <label className="text-xs font-bold text-[#5D574F] block mb-1">모둠 번호 (1~10)</label>
                  <input
                    type="number"
                    value={newGroup}
                    onChange={(e) => setNewGroup(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs font-bold text-[#3D3A35] focus:outline-hidden focus:ring-2 focus:ring-[#A3B18A]"
                    min="1"
                    max="10"
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
            {activeTab === 'paste' && parsedStudents.length > 0 ? (
              <span className="text-[#2D6A4F] font-bold">✨ {parsedStudents.length}명 준비 완료</span>
            ) : (
              <span>등록된 학생: {students.length}명</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'paste' && parsedStudents.length > 0 ? (
              <button
                onClick={handlePasteImport}
                className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#23533E] text-white rounded-xl text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{parsedStudents.length}명 저장 및 적용</span>
              </button>
            ) : null}

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
