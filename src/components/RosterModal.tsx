import React, { useState } from 'react';
import { X, Users, ClipboardPaste, Plus, Trash2, Check, RefreshCw, Sparkles } from 'lucide-react';
import { Student } from '../types';
import { parseStudentRosterText } from '../services/storageService';
import { INITIAL_STUDENTS } from '../data/initialData';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSaveStudents: (newStudents: Student[]) => void;
  onShowToast: (msg: string) => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  students,
  onSaveStudents,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'paste' | 'add'>('list');
  const [pasteText, setPasteText] = useState('');
  
  // Single student form
  const [newNum, setNewNum] = useState<number>(students.length + 1);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F'>('M');
  const [newGroup, setNewGroup] = useState<number>(1);
  const [newNote, setNewNote] = useState('');

  if (!isOpen) return null;

  const handlePasteImport = () => {
    if (!pasteText.trim()) {
      onShowToast('⚠️ 붙여넣을 학생 명단 텍스트를 입력해 주세요.');
      return;
    }

    const parsed = parseStudentRosterText(pasteText);
    if (parsed.length === 0) {
      onShowToast('⚠️ 학생 데이터를 인식하지 못했습니다. 번호와 이름을 확인해 주세요.');
      return;
    }

    onSaveStudents(parsed);
    onShowToast(`✅ ${parsed.length}명의 학생 명단이 성공적으로 등록되었습니다.`);
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
    onSaveStudents(updated);
    onShowToast(`✅ ${newStudent.number}번 ${newStudent.name} 학생이 추가되었습니다.`);
    setNewName('');
    setNewNote('');
    setNewNum(updated.length + 1);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`${name} 학생을 명단에서 삭제하시겠습니까?`)) {
      const updated = students.filter(s => s.id !== id);
      onSaveStudents(updated);
      onShowToast(`🗑️ ${name} 학생이 삭제되었습니다.`);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('기본 샘플 학급 명단(24명)으로 초기화하시겠습니까?')) {
      onSaveStudents(INITIAL_STUDENTS);
      onShowToast('🔄 기본 샘플 명단으로 재설정되었습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2 text-[#3D3A35]">
            <Users className="w-5 h-5 text-[#A3B18A]" />
            <h3 className="font-bold text-base">학급 학생 명단 관리 (총 {students.length}명)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5D574F] hover:bg-[#DCD5C8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#DCD5C8] bg-[#F2EDE4] px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'list'
                ? 'bg-[#FAF9F6] text-[#3D3A35] border-t border-x border-[#DCD5C8]'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
          >
            학생 목록 ({students.length}명)
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-[#FAF9F6] text-[#3D3A35] border-t border-x border-[#DCD5C8]'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-[#BC6C25]" />
            <span>엑셀/구글 시트 일괄 등록</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-[#FAF9F6] text-[#3D3A35] border-t border-x border-[#DCD5C8]'
                : 'text-[#5D574F] hover:text-[#3D3A35]'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#A3B18A]" />
            <span>개별 학생 추가</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-[#5D574F]">
                <span>현재 등록된 학급 학생 목록입니다.</span>
                <button
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1 text-[11px] text-[#A89F91] hover:text-[#3D3A35] underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  기본 24명 샘플 복원
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {students.map((st) => (
                  <div
                    key={st.id}
                    className="p-2.5 bg-white rounded-xl border border-[#EEECE6] flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-[#A89F91] w-6 text-center">
                        {st.number.toString().padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold text-[#3D3A35]">{st.name}</span>
                      {st.gender && (
                        <span className="text-[10px] text-[#A89F91]">
                          ({st.gender === 'M' ? '남' : '여'})
                        </span>
                      )}
                      {st.groupNumber && (
                        <span className="text-[10px] bg-[#F2EDE4] text-[#5D574F] px-1.5 py-0.5 rounded">
                          {st.groupNumber}모둠
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteStudent(st.id, st.name)}
                      className="p-1 text-[#A89F91] hover:text-red-600 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#EAE5D8]/40 border border-[#DCD5C8] rounded-xl text-xs text-[#5D574F] leading-relaxed">
                💡 <strong>엑셀 / 구글 스프레드시트에서 복사(Ctrl+C) 후 여기에 붙여넣기(Ctrl+V)하세요.</strong>
                <p className="text-[11px] text-[#A89F91] mt-1">
                  지원 형식: <code>[번호] [이름] [성별(남/여)] [모둠(숫자)] [메모]</code> (탭이나 쉼표로 자동 구분됩니다.)
                </p>
              </div>

              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`예시:\n1\t강민준\t남\t1\n2\t김서연\t여\t1\n3\t박도윤\t남\t2\n...`}
                rows={10}
                className="w-full p-3.5 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] font-mono focus:outline-none focus:ring-1 focus:ring-[#A3B18A]"
              />

              <div className="flex justify-end">
                <button
                  onClick={handlePasteImport}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>명단 일괄 분석 및 저장하기</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddSingle} className="space-y-4 max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#5D574F] block mb-1">번호</label>
                  <input
                    type="number"
                    value={newNum}
                    onChange={(e) => setNewNum(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs focus:outline-[#A3B18A]"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5D574F] block mb-1">이름</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="학생 이름"
                    className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs focus:outline-[#A3B18A]"
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
                    className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs focus:outline-[#A3B18A]"
                  >
                    <option value="M">남학생</option>
                    <option value="F">여학생</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5D574F] block mb-1">모둠 번호 (1~6)</label>
                  <input
                    type="number"
                    value={newGroup}
                    onChange={(e) => setNewGroup(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs focus:outline-[#A3B18A]"
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
                  placeholder="예: 안경 착용, 앞자리 배정"
                  className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs focus:outline-[#A3B18A]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                + 학생 1명 추가하기
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F2EDE4] border-t border-[#DCD5C8] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#3D3A35] text-white hover:bg-[#2C2925] rounded-xl text-xs font-bold transition-colors"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};
