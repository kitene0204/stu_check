/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  loadClassRoom, 
  saveClassRoom, 
  loadStudents, 
  saveStudents, 
  loadAssignments, 
  saveAssignments, 
  loadSubmissions, 
  saveSubmissions,
  loadSupabaseConfig,
  saveSupabaseConfig,
  loadSheetsConfig,
  saveSheetsConfig,
} from './services/storageService';
import { 
  Student, 
  Assignment, 
  ClassRoom, 
  SupabaseConfig, 
  GoogleSheetsConfig, 
  ViewMode, 
  FilterMode, 
  SubmissionStatus,
  SubmissionMap,
  SubmissionItem
} from './types';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AssignmentHeader } from './components/AssignmentHeader';
import { StudentGrid } from './components/StudentGrid';
import { StudentList } from './components/StudentList';
import { StudentGroupView } from './components/StudentGroupView';

import { NoticeModal } from './components/NoticeModal';
import { RosterModal } from './components/RosterModal';
import { NewAssignmentModal } from './components/NewAssignmentModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { SupabaseModal } from './components/SupabaseModal';
import { PrintModal } from './components/PrintModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { Toast } from './components/Toast';

export default function App() {
  // State Initialization
  const [classRoom, setClassRoom] = useState<ClassRoom>(loadClassRoom);
  const [students, setStudents] = useState<Student[]>(loadStudents);
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);
  const [submissionsMap, setSubmissionsMap] = useState<SubmissionMap>(loadSubmissions);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(loadSupabaseConfig);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(loadSheetsConfig);

  const [activeAssignmentId, setActiveAssignmentId] = useState<string>(() => {
    return assignments.length > 0 ? assignments[0].id : '';
  });

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Modals state
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Student detail modal
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Active assignment
  const activeAssignment = useMemo(() => {
    return assignments.find(a => a.id === activeAssignmentId) || assignments[0];
  }, [assignments, activeAssignmentId]);

  // Current submissions for active assignment
  const currentSubmissions = useMemo((): Record<string, SubmissionItem> => {
    if (!activeAssignment) return {};
    return submissionsMap[activeAssignment.id] || {};
  }, [submissionsMap, activeAssignment]);

  // Stats calculation
  const totalStudents = students.length;
  const submittedCount = useMemo(() => {
    return (Object.values(currentSubmissions) as SubmissionItem[]).filter(s => s?.status === 'submitted').length;
  }, [currentSubmissions]);

  const resubmitCount = useMemo(() => {
    return (Object.values(currentSubmissions) as SubmissionItem[]).filter(s => s?.status === 'resubmit').length;
  }, [currentSubmissions]);

  const missingCount = Math.max(0, totalStudents - submittedCount);

  // Filtered students according to filterMode
  const filteredStudents = useMemo(() => {
    if (filterMode === 'all') return students;
    if (filterMode === 'submitted') {
      return students.filter(st => currentSubmissions[st.id]?.status === 'submitted');
    }
    if (filterMode === 'pending') {
      return students.filter(st => {
        const s = currentSubmissions[st.id]?.status || 'pending';
        return s === 'pending';
      });
    }
    if (filterMode === 'resubmit') {
      return students.filter(st => currentSubmissions[st.id]?.status === 'resubmit');
    }
    return students;
  }, [students, currentSubmissions, filterMode]);

  // Persistence helpers
  const handleUpdateClassRoom = (updated: ClassRoom) => {
    setClassRoom(updated);
    saveClassRoom(updated);
    showToast('🏫 학급 정보가 저장되었습니다.');
  };

  const handleSaveStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    saveStudents(newStudents);
  };

  const handleAddAssignment = (newAsg: Assignment) => {
    const updated = [newAsg, ...assignments];
    setAssignments(updated);
    saveAssignments(updated);
    setActiveAssignmentId(newAsg.id);
  };

  const handleDeleteAssignment = (assignmentId: string, title: string) => {
    const updated = assignments.filter(a => a.id !== assignmentId);
    setAssignments(updated);
    saveAssignments(updated);

    const updatedSubmissions = { ...submissionsMap };
    delete updatedSubmissions[assignmentId];
    setSubmissionsMap(updatedSubmissions);
    saveSubmissions(updatedSubmissions);

    if (activeAssignmentId === assignmentId) {
      setActiveAssignmentId(updated.length > 0 ? updated[0].id : null);
    }

    showToast(`🗑️ '${title}' 과제가 삭제되었습니다.`);
  };

  // Toggle single student submission status
  const handleToggleStatus = (studentId: string) => {
    if (!activeAssignment) return;

    const asgId = activeAssignment.id;
    const existing = currentSubmissions[studentId] || { status: 'pending' };
    
    // Cycle: pending -> submitted -> resubmit -> pending
    let nextStatus: SubmissionStatus = 'submitted';
    if (existing.status === 'submitted') nextStatus = 'pending';
    else if (existing.status === 'pending') nextStatus = 'submitted';
    else if (existing.status === 'resubmit') nextStatus = 'submitted';
    else if (existing.status === 'excused') nextStatus = 'submitted';

    const updatedSubmissions: SubmissionMap = {
      ...submissionsMap,
      [asgId]: {
        ...submissionsMap[asgId],
        [studentId]: {
          ...existing,
          status: nextStatus,
          submittedAt: nextStatus === 'submitted' ? new Date().toISOString() : undefined,
        }
      }
    };

    setSubmissionsMap(updatedSubmissions);
    saveSubmissions(updatedSubmissions);

    // If this makes it 100% completed, trigger celebratory confetti!
    const newSubmittedCount = Object.values(updatedSubmissions[asgId] || {}).filter(s => s?.status === 'submitted').length;
    if (newSubmittedCount === totalStudents && totalStudents > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#A3B18A', '#588157', '#BC6C25', '#DDA15E', '#EAE5D8']
        });
      } catch (e) {
        console.error(e);
      }
      showToast('🎉 축하합니다! 학급 전원이 제출을 완료했습니다!');
    }
  };

  // Set precise status
  const handleChangeStatus = (studentId: string, status: SubmissionStatus) => {
    if (!activeAssignment) return;
    const asgId = activeAssignment.id;
    const existing = currentSubmissions[studentId] || { status: 'pending' };

    const updatedSubmissions: SubmissionMap = {
      ...submissionsMap,
      [asgId]: {
        ...submissionsMap[asgId],
        [studentId]: {
          ...existing,
          status,
          submittedAt: status === 'submitted' ? new Date().toISOString() : undefined,
        }
      }
    };

    setSubmissionsMap(updatedSubmissions);
    saveSubmissions(updatedSubmissions);
  };

  // Save student note and status from modal
  const handleSaveStudentDetail = (studentId: string, status: SubmissionStatus, note: string) => {
    if (!activeAssignment) return;
    const asgId = activeAssignment.id;

    const updatedSubmissions: SubmissionMap = {
      ...submissionsMap,
      [asgId]: {
        ...submissionsMap[asgId],
        [studentId]: {
          status,
          note,
          submittedAt: status === 'submitted' ? new Date().toISOString() : undefined,
        }
      }
    };

    setSubmissionsMap(updatedSubmissions);
    saveSubmissions(updatedSubmissions);
  };

  // Check all students as submitted
  const handleCheckAll = () => {
    if (!activeAssignment) return;
    const asgId = activeAssignment.id;
    const newAsgMap: Record<string, SubmissionItem> = {};

    students.forEach(st => {
      const prev = currentSubmissions[st.id];
      newAsgMap[st.id] = {
        status: 'submitted',
        note: prev?.note,
        submittedAt: new Date().toISOString(),
      };
    });

    const updatedSubmissions: SubmissionMap = {
      ...submissionsMap,
      [asgId]: newAsgMap,
    };

    setSubmissionsMap(updatedSubmissions);
    saveSubmissions(updatedSubmissions);

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#A3B18A', '#588157', '#BC6C25', '#DDA15E', '#EAE5D8']
      });
    } catch (e) {
      console.error(e);
    }

    showToast('✨ 전체 학생이 제출 완료 처리되었습니다.');
  };

  const handleSaveSupabaseConfig = (cfg: SupabaseConfig) => {
    setSupabaseConfig(cfg);
    saveSupabaseConfig(cfg);
  };

  const handleSaveSheetsConfig = (cfg: GoogleSheetsConfig) => {
    setSheetsConfig(cfg);
    saveSheetsConfig(cfg);
  };

  const handleRestoreAllData = (restored: { classRoom: ClassRoom; students: Student[]; assignments: Assignment[]; submissionsMap: SubmissionMap }) => {
    setClassRoom(restored.classRoom);
    saveClassRoom(restored.classRoom);

    setStudents(restored.students);
    saveStudents(restored.students);

    setAssignments(restored.assignments);
    saveAssignments(restored.assignments);

    setSubmissionsMap(restored.submissionsMap);
    saveSubmissions(restored.submissionsMap);

    if (restored.assignments.length > 0) {
      setActiveAssignmentId(restored.assignments[0].id);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FAF9F6] text-[#5D574F] font-sans overflow-hidden select-none">
      {/* Top Header with Natural Tones */}
      <Header
        classRoom={classRoom}
        onUpdateClassRoom={handleUpdateClassRoom}
        supabaseConfig={supabaseConfig}
        sheetsConfig={sheetsConfig}
        onOpenRosterModal={() => setIsRosterModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          assignments={assignments}
          activeAssignmentId={activeAssignment?.id || null}
          onSelectAssignment={(id) => setActiveAssignmentId(id)}
          onOpenNewAssignmentModal={() => setIsNewAssignmentModalOpen(true)}
          onDeleteAssignment={handleDeleteAssignment}
          students={students}
          submissionsMap={submissionsMap}
        />

        {/* Right Main Checklist View Panel */}
        <section className="flex-1 p-6 md:p-8 overflow-y-auto bg-white flex flex-col">
          {/* Assignment Header / Controls */}
          <AssignmentHeader
            assignment={activeAssignment}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            filterMode={filterMode}
            onChangeFilterMode={setFilterMode}
            onCheckAll={handleCheckAll}
            onOpenNoticeModal={() => setIsNoticeModalOpen(true)}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            onDeleteAssignment={handleDeleteAssignment}
            totalStudents={totalStudents}
            submittedCount={submittedCount}
            missingCount={missingCount}
            resubmitCount={resubmitCount}
          />

          {/* Student Matrix Display by ViewMode */}
          <div className="flex-1">
            {viewMode === 'grid' && (
              <StudentGrid
                students={filteredStudents}
                submissions={currentSubmissions}
                onToggleStatus={handleToggleStatus}
                onOpenStudentDetail={(student) => setSelectedStudentForDetail(student)}
              />
            )}

            {viewMode === 'list' && (
              <StudentList
                students={filteredStudents}
                submissions={currentSubmissions}
                onChangeStatus={handleChangeStatus}
                onOpenStudentDetail={(student) => setSelectedStudentForDetail(student)}
              />
            )}

            {viewMode === 'groups' && (
              <StudentGroupView
                students={filteredStudents}
                submissions={currentSubmissions}
                onToggleStatus={handleToggleStatus}
                onOpenStudentDetail={(student) => setSelectedStudentForDetail(student)}
              />
            )}
          </div>
        </section>
      </main>

      {/* Natural Tones Footer */}
      <footer className="h-11 bg-[#FAF9F6] border-t border-[#DCD5C8] px-6 md:px-8 flex items-center justify-between text-[11px] font-medium text-[#A89F91] shrink-0">
        <div>&copy; 2026 {classRoom.schoolName} {classRoom.grade}학년 {classRoom.classNumber}반 학급 도우미 v1.2.0</div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>데이터 저장 상태:</span>
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border cursor-pointer transition-colors ${
              supabaseConfig.isEnabled && supabaseConfig.url
                ? 'bg-[#E8F0E4] text-[#3D5A30] border-[#A3B18A]'
                : 'bg-amber-50 text-[#8C4A1A] border-amber-300 hover:bg-amber-100'
            }`}
            title="클릭하여 Supabase 연동 설정 열기"
          >
            <span className={`w-2 h-2 rounded-full ${supabaseConfig.isEnabled && supabaseConfig.url ? 'bg-[#588157] animate-pulse' : 'bg-[#BC6C25]'}`} />
            <span>{supabaseConfig.isEnabled && supabaseConfig.url ? 'Supabase 클라우드 실시간 동기화' : '로컬 캐시 안전 보관 (클라우드 연동하기)'}</span>
          </button>
        </div>
      </footer>

      {/* Modals */}
      <NoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        assignment={activeAssignment}
        students={students}
        submissions={currentSubmissions}
        onShowToast={showToast}
      />

      <RosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        students={students}
        onSaveStudents={handleSaveStudents}
        onShowToast={showToast}
      />

      <NewAssignmentModal
        isOpen={isNewAssignmentModalOpen}
        onClose={() => setIsNewAssignmentModalOpen(false)}
        classId={classRoom.id}
        onAddAssignment={handleAddAssignment}
        onShowToast={showToast}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        assignment={activeAssignment}
        students={students}
        submissions={currentSubmissions}
        config={sheetsConfig}
        onSaveConfig={handleSaveSheetsConfig}
        onShowToast={showToast}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onSaveConfig={handleSaveSupabaseConfig}
        onShowToast={showToast}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        classRoom={classRoom}
        assignment={activeAssignment}
        students={students}
        submissions={currentSubmissions}
      />

      <StudentDetailModal
        isOpen={Boolean(selectedStudentForDetail)}
        onClose={() => setSelectedStudentForDetail(null)}
        student={selectedStudentForDetail}
        currentStatus={selectedStudentForDetail ? (currentSubmissions[selectedStudentForDetail.id]?.status || 'pending') : 'pending'}
        currentNote={selectedStudentForDetail ? (currentSubmissions[selectedStudentForDetail.id]?.note || '') : ''}
        onSave={handleSaveStudentDetail}
        onShowToast={showToast}
      />

      <AppSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        classRoom={classRoom}
        onUpdateClassRoom={handleUpdateClassRoom}
        supabaseConfig={supabaseConfig}
        sheetsConfig={sheetsConfig}
        onOpenSupabaseModal={() => {
          setIsSettingsModalOpen(false);
          setIsSupabaseModalOpen(true);
        }}
        onOpenSheetsModal={() => {
          setIsSettingsModalOpen(false);
          setIsSheetsModalOpen(true);
        }}
        students={students}
        assignments={assignments}
        submissionsMap={submissionsMap}
        onRestoreAllData={handleRestoreAllData}
        onShowToast={showToast}
      />

      {/* Notification Toast */}
      <Toast message={toastMessage} />
    </div>
  );
}
