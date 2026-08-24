import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  ClassRoom, 
  Student, 
  Assignment, 
  GoogleSheetsConfig, 
  SupabaseConfig, 
  ViewMode, 
  FilterMode, 
  SubmissionStatus, 
  SubmissionMap, 
  SubmissionItem 
} from './types';

import { Header, SyncState } from './components/Header';
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

import {
  loadClassRoom,
  saveClassRoom,
  loadStudents,
  saveStudents,
  loadAssignments,
  saveAssignments,
  loadSubmissions,
  saveSubmissions,
  loadSheetsConfig,
  saveSheetsConfig,
  loadSupabaseConfig,
  saveSupabaseConfig
} from './services/storageService';

import {
  initSupabase,
  fetchSupabaseData,
  upsertSubmissionsToSupabase,
  syncStudentsToSupabase,
  syncAssignmentsToSupabase,
  subscribeToSubmissions
} from './services/supabaseService';

import { syncToGoogleSheetsWebhook } from './services/googleSheetsService';

export default function App() {
  // State Initialization
  const [classRoom, setClassRoom] = useState<ClassRoom>(loadClassRoom);
  const [students, setStudents] = useState<Student[]>(loadStudents);
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);
  const [submissionsMap, setSubmissionsMap] = useState<SubmissionMap>(loadSubmissions);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(loadSupabaseConfig);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(loadSheetsConfig);

  // Sync state: 'idle' | 'syncing' | 'synced' | 'error'
  const [syncState, setSyncState] = useState<SyncState>('idle');

  const [activeAssignmentId, setActiveAssignmentId] = useState<string>(() => {
    return assignments.length > 0 ? assignments[0].id : '';
  });

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Modals & Navigation state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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

  // Check for mobile QR sync parameters on load
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const syncPayload = searchParams.get('syncData');

      if (syncPayload) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(syncPayload))));
        if (decoded.classRoom) {
          setClassRoom(decoded.classRoom);
          saveClassRoom(decoded.classRoom);
        }
        if (decoded.students && Array.isArray(decoded.students)) {
          setStudents(decoded.students);
          saveStudents(decoded.students);
        }
        if (decoded.supabaseConfig) {
          setSupabaseConfig(decoded.supabaseConfig);
          saveSupabaseConfig(decoded.supabaseConfig);
        }
        if (decoded.sheetsConfig) {
          setSheetsConfig(decoded.sheetsConfig);
          saveSheetsConfig(decoded.sheetsConfig);
        }
        showToast('📱 데스크탑 학급 데이터 및 연동 설정이 스마트폰에 동기화되었습니다!');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error('Failed to parse sync data from URL', e);
    }
  }, [showToast]);

  // Active assignment
  const activeAssignment = useMemo(() => {
    return assignments.find(a => a.id === activeAssignmentId) || assignments[0];
  }, [assignments, activeAssignmentId]);

  // Current submissions for active assignment
  const currentSubmissions = useMemo(() => {
    if (!activeAssignment?.id) return {};
    return submissionsMap[activeAssignment.id] || {};
  }, [submissionsMap, activeAssignment?.id]);

  // Realtime Supabase Sync Setup
  useEffect(() => {
    if (!supabaseConfig.isEnabled || !supabaseConfig.url || !supabaseConfig.anonKey) {
      return;
    }

    const client = initSupabase(supabaseConfig);
    if (!client) return;

    // Initial fetch from cloud
    const loadRemote = async () => {
      try {
        setSyncState('syncing');
        const data = await fetchSupabaseData(supabaseConfig, classRoom.id);
        if (data.students.length > 0) {
          setStudents(data.students);
          saveStudents(data.students);
        }
        if (data.assignments.length > 0) {
          setAssignments(data.assignments);
          saveAssignments(data.assignments);
          if (!activeAssignmentId && data.assignments[0]) {
            setActiveAssignmentId(data.assignments[0].id);
          }
        }
        if (Object.keys(data.submissionsMap).length > 0) {
          setSubmissionsMap(prev => {
            const merged = { ...prev, ...data.submissionsMap };
            saveSubmissions(merged);
            return merged;
          });
        }
        setSyncState('synced');
        setTimeout(() => setSyncState('idle'), 2500);
      } catch (err) {
        console.error('Supabase initial fetch failed:', err);
        setSyncState('error');
        setTimeout(() => setSyncState('idle'), 2500);
      }
    };

    loadRemote();

    // Subscribe to realtime changes
    const channel = subscribeToSubmissions(
      supabaseConfig,
      classRoom.id,
      (remoteSub) => {
        setSubmissionsMap(prev => {
          const asgSubs = prev[remoteSub.assignment_id] || {};
          const currentItem = asgSubs[remoteSub.student_id];
          
          if (currentItem && new Date(currentItem.updatedAt || 0).getTime() >= new Date(remoteSub.updated_at).getTime()) {
            return prev;
          }

          const updated: SubmissionMap = {
            ...prev,
            [remoteSub.assignment_id]: {
              ...asgSubs,
              [remoteSub.student_id]: {
                status: remoteSub.status as SubmissionStatus,
                note: remoteSub.note || undefined,
                updatedAt: remoteSub.updated_at,
              }
            }
          };
          saveSubmissions(updated);
          return updated;
        });

        setSyncState('synced');
        setTimeout(() => setSyncState('idle'), 2000);
      }
    );

    return () => {
      if (channel && client) {
        client.removeChannel(channel);
      }
    };
  }, [supabaseConfig, classRoom.id, activeAssignmentId]);

  // Realtime Automatic Push Sync Helper
  const triggerAutoSync = useCallback(async (
    asgId: string, 
    itemsToSync: { studentId: string; status: SubmissionStatus; note?: string; updatedAt: string }[],
    updatedSubmissionsForActive?: Record<string, SubmissionItem>
  ) => {
    // Show quick subtle syncing state
    setSyncState('syncing');

    let supabaseOk = false;
    let sheetsOk = false;

    // 1. Supabase Cloud Sync
    if (supabaseConfig.isEnabled && supabaseConfig.url) {
      try {
        await upsertSubmissionsToSupabase(supabaseConfig, classRoom.id, asgId, itemsToSync);
        supabaseOk = true;
      } catch (err) {
        console.error('Auto sync to Supabase failed:', err);
      }
    }

    // 2. Google Sheets Webhook Sync
    if (sheetsConfig.autoSync && sheetsConfig.webhookUrl && activeAssignment) {
      try {
        const subsToUse = updatedSubmissionsForActive || currentSubmissions;
        await syncToGoogleSheetsWebhook(sheetsConfig, classRoom, activeAssignment, students, subsToUse);
        sheetsOk = true;
      } catch (err) {
        console.error('Auto sync to Google Sheets failed:', err);
      }
    }

    // Set synced status
    setSyncState('synced');
    setTimeout(() => {
      setSyncState('idle');
    }, 2200);
  }, [supabaseConfig, sheetsConfig, classRoom, activeAssignment, students, currentSubmissions]);

  // Manual Full Sync Button Action
  const handleTriggerManualSync = useCallback(async () => {
    setSyncState('syncing');
    showToast('🔄 클라우드 및 구글 시트 데이터 동기화 중...');

    try {
      let syncCount = 0;

      // 1. Supabase Sync (Download & Upload latest)
      if (supabaseConfig.isEnabled && supabaseConfig.url) {
        // Upload current active assignment submissions
        if (activeAssignment?.id) {
          const currentItems = students.map(st => {
            const sub = currentSubmissions[st.id] || { status: 'pending' };
            return {
              studentId: st.id,
              status: sub.status,
              note: sub.note,
              updatedAt: sub.updatedAt || new Date().toISOString()
            };
          });

          await upsertSubmissionsToSupabase(supabaseConfig, classRoom.id, activeAssignment.id, currentItems);
        }

        // Fetch remote updates
        const remoteData = await fetchSupabaseData(supabaseConfig, classRoom.id);
        if (Object.keys(remoteData.submissionsMap).length > 0) {
          setSubmissionsMap(prev => {
            const merged = { ...prev, ...remoteData.submissionsMap };
            saveSubmissions(merged);
            return merged;
          });
        }
        syncCount++;
      }

      // 2. Google Sheets Webhook Sync
      if (sheetsConfig.webhookUrl && activeAssignment) {
        await syncToGoogleSheetsWebhook(sheetsConfig, classRoom, activeAssignment, students, currentSubmissions);
        syncCount++;
      }

      // Local storage refresh guarantee
      saveClassRoom(classRoom);
      saveStudents(students);
      saveAssignments(assignments);
      saveSubmissions(submissionsMap);

      setSyncState('synced');

      if (syncCount > 0) {
        showToast('✅ 구글 시트 & Supabase & 로컬 데이터 동기화 완료!');
      } else {
        showToast('✅ 로컬 데이터 저장 및 동기화 완료! (클라우드 연동 시 자동 실시간 백업)');
      }

      setTimeout(() => {
        setSyncState('idle');
      }, 2500);
    } catch (e) {
      console.error('Manual sync error:', e);
      setSyncState('error');
      showToast('⚠️ 동기화 중 일부 오류가 발생했습니다.');
      setTimeout(() => {
        setSyncState('idle');
      }, 3000);
    }
  }, [supabaseConfig, sheetsConfig, classRoom, activeAssignment, students, currentSubmissions, assignments, submissionsMap, showToast]);

  // Calculated stats
  const totalStudents = students.length;
  const submittedCount = useMemo(() => {
    return (Object.values(currentSubmissions) as ({ status: SubmissionStatus } | undefined)[]).filter(
      s => s?.status === 'submitted'
    ).length;
  }, [currentSubmissions]);

  const missingCount = totalStudents - submittedCount;
  const resubmitCount = useMemo(() => {
    return (Object.values(currentSubmissions) as ({ status: SubmissionStatus } | undefined)[]).filter(
      s => s?.status === 'resubmit'
    ).length;
  }, [currentSubmissions]);

  // Filter students based on filterMode
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const sub = currentSubmissions[student.id];
      const status = sub?.status || 'pending';

      if (filterMode === 'all') return true;
      if (filterMode === 'submitted') return status === 'submitted';
      if (filterMode === 'pending') return status === 'pending';
      if (filterMode === 'resubmit') return status === 'resubmit';
      return true;
    });
  }, [students, currentSubmissions, filterMode]);

  // Handlers
  const handleUpdateClassRoom = (updated: ClassRoom) => {
    setClassRoom(updated);
    saveClassRoom(updated);
  };

  const handleUpdateStudents = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    if (supabaseConfig.isEnabled && supabaseConfig.url) {
      syncStudentsToSupabase(supabaseConfig, classRoom.id, updatedStudents);
    }
  };

  const handleAddAssignment = (newAsg: Assignment) => {
    const updated = [newAsg, ...assignments];
    setAssignments(updated);
    saveAssignments(updated);
    setActiveAssignmentId(newAsg.id);

    if (supabaseConfig.isEnabled && supabaseConfig.url) {
      syncAssignmentsToSupabase(supabaseConfig, classRoom.id, updated);
    }
  };

  const handleDeleteAssignment = (id: string, title: string) => {
    const updated = assignments.filter(a => a.id !== id);
    setAssignments(updated);
    saveAssignments(updated);

    const updatedSubmissions = { ...submissionsMap };
    delete updatedSubmissions[id];
    setSubmissionsMap(updatedSubmissions);
    saveSubmissions(updatedSubmissions);

    if (activeAssignmentId === id) {
      setActiveAssignmentId(updated[0]?.id || '');
    }

    if (supabaseConfig.isEnabled && supabaseConfig.url) {
      syncAssignmentsToSupabase(supabaseConfig, classRoom.id, updated);
    }

    showToast(`🗑️ '${title}' 과제가 삭제되었습니다.`);
  };

  const handleToggleStatus = (studentId: string) => {
    if (!activeAssignment?.id) return;

    const asgId = activeAssignment.id;
    const currentSub = currentSubmissions[studentId] || { status: 'pending' };
    
    // Cycle: pending -> submitted -> pending
    const newStatus: SubmissionStatus = currentSub.status === 'submitted' ? 'pending' : 'submitted';
    const nowIso = new Date().toISOString();

    const updatedSubItem: SubmissionItem = {
      ...currentSub,
      status: newStatus,
      updatedAt: nowIso,
    };

    const newSubmissionsForActive = {
      ...currentSubmissions,
      [studentId]: updatedSubItem,
    };

    const updatedMap: SubmissionMap = {
      ...submissionsMap,
      [asgId]: newSubmissionsForActive
    };

    setSubmissionsMap(updatedMap);
    saveSubmissions(updatedMap);

    // Realtime Push to Supabase & Google Sheets
    triggerAutoSync(asgId, [{
      studentId,
      status: newStatus,
      note: currentSub.note,
      updatedAt: nowIso,
    }], newSubmissionsForActive);

    // Trigger celebration if this submission achieves 100%
    if (newStatus === 'submitted' && (submittedCount + 1) === totalStudents && totalStudents > 0) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#A3B18A', '#588157', '#BC6C25', '#DDA15E', '#EAE5D8']
        });
        showToast('🎉 축하합니다! 모든 학생이 제출을 완료했습니다!');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleChangeStatus = (studentId: string, newStatus: SubmissionStatus, note?: string) => {
    if (!activeAssignment?.id) return;

    const asgId = activeAssignment.id;
    const currentSub = currentSubmissions[studentId] || { status: 'pending' };
    const nowIso = new Date().toISOString();

    const updatedSubItem: SubmissionItem = {
      status: newStatus,
      note: note !== undefined ? note : currentSub.note,
      updatedAt: nowIso,
    };

    const newSubmissionsForActive = {
      ...currentSubmissions,
      [studentId]: updatedSubItem,
    };

    const updatedMap: SubmissionMap = {
      ...submissionsMap,
      [asgId]: newSubmissionsForActive
    };

    setSubmissionsMap(updatedMap);
    saveSubmissions(updatedMap);

    // Realtime Push to Supabase & Google Sheets
    triggerAutoSync(asgId, [{
      studentId,
      status: newStatus,
      note: updatedSubItem.note,
      updatedAt: nowIso,
    }], newSubmissionsForActive);
  };

  const handleCheckAll = () => {
    if (!activeAssignment?.id || students.length === 0) return;

    const asgId = activeAssignment.id;
    const nowIso = new Date().toISOString();
    const updatedCurrentAsg: Record<string, SubmissionItem> = {};
    const supabasePayload: { studentId: string; status: SubmissionStatus; note?: string; updatedAt: string }[] = [];

    students.forEach(student => {
      const existing = currentSubmissions[student.id];
      const subItem: SubmissionItem = {
        status: 'submitted',
        note: existing?.note,
        updatedAt: nowIso,
      };
      updatedCurrentAsg[student.id] = subItem;
      supabasePayload.push({
        studentId: student.id,
        status: 'submitted',
        note: existing?.note,
        updatedAt: nowIso,
      });
    });

    const updatedSubmissions = {
      ...submissionsMap,
      [asgId]: updatedCurrentAsg,
    };

    setSubmissionsMap(updatedSubmissions);
    saveSubmissions(updatedSubmissions);

    // Realtime Push to Supabase & Google Sheets
    triggerAutoSync(asgId, supabasePayload, updatedCurrentAsg);

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
      {/* Top Header with Realtime Sync Status & Manual Sync Button */}
      <Header
        classRoom={classRoom}
        onUpdateClassRoom={handleUpdateClassRoom}
        supabaseConfig={supabaseConfig}
        sheetsConfig={sheetsConfig}
        syncState={syncState}
        onTriggerManualSync={handleTriggerManualSync}
        onOpenRosterModal={() => setIsRosterModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Responsive Drawer on Mobile, Fixed on Desktop) */}
        <Sidebar
          assignments={assignments}
          activeAssignmentId={activeAssignment?.id || null}
          onSelectAssignment={(id) => setActiveAssignmentId(id)}
          onOpenNewAssignmentModal={() => setIsNewAssignmentModalOpen(true)}
          onDeleteAssignment={handleDeleteAssignment}
          students={students}
          submissionsMap={submissionsMap}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Right Main Checklist View Panel */}
        <section className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto bg-white flex flex-col">
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

      {/* Natural Tones Footer with Sync indicator */}
      <footer className="h-10 md:h-11 bg-[#FAF9F6] border-t border-[#DCD5C8] px-3.5 sm:px-6 md:px-8 flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-[#A89F91] shrink-0">
        <div className="truncate">
          &copy; 2026 {classRoom.schoolName} {classRoom.grade}학년 {classRoom.classNumber}반
        </div>
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] shrink-0">
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border cursor-pointer transition-colors ${
              supabaseConfig.isEnabled && supabaseConfig.url
                ? 'bg-[#E8F0E4] text-[#3D5A30] border-[#A3B18A]'
                : 'bg-amber-50 text-[#8C4A1A] border-amber-300 hover:bg-amber-100'
            }`}
            title="Supabase 실시간 클라우드 연동 상태"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${supabaseConfig.isEnabled && supabaseConfig.url ? 'bg-[#588157] animate-pulse' : 'bg-[#BC6C25]'}`} />
            <span>{supabaseConfig.isEnabled && supabaseConfig.url ? '실시간 동기화 ON' : '로컬 모드 (연동 가능)'}</span>
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
        onUpdateStudents={handleUpdateStudents}
        onShowToast={showToast}
      />

      <NewAssignmentModal
        isOpen={isNewAssignmentModalOpen}
        onClose={() => setIsNewAssignmentModalOpen(false)}
        onAddAssignment={handleAddAssignment}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={sheetsConfig}
        onSaveConfig={handleSaveSheetsConfig}
        activeAssignment={activeAssignment}
        students={students}
        submissions={currentSubmissions}
        classRoom={classRoom}
        onShowToast={showToast}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onSaveConfig={handleSaveSupabaseConfig}
        classRoomId={classRoom.id}
        students={students}
        assignments={assignments}
        submissionsMap={submissionsMap}
        onShowToast={showToast}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        classRoom={classRoom}
        students={students}
        assignments={assignments}
        submissionsMap={submissionsMap}
      />

      <StudentDetailModal
        student={selectedStudentForDetail}
        isOpen={Boolean(selectedStudentForDetail)}
        onClose={() => setSelectedStudentForDetail(null)}
        assignments={assignments}
        submissionsMap={submissionsMap}
        onUpdateStatus={(studentId, asgId, status, note) => {
          const nowIso = new Date().toISOString();
          const asgSubs = submissionsMap[asgId] || {};
          const updatedSubItem: SubmissionItem = {
            status,
            note,
            updatedAt: nowIso,
          };
          const updatedMap: SubmissionMap = {
            ...submissionsMap,
            [asgId]: {
              ...asgSubs,
              [studentId]: updatedSubItem,
            }
          };
          setSubmissionsMap(updatedMap);
          saveSubmissions(updatedMap);

          // Realtime Push to Supabase & Google Sheets
          triggerAutoSync(asgId, [{
            studentId,
            status,
            note,
            updatedAt: nowIso,
          }], updatedMap[asgId]);
        }}
      />

      <AppSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        classRoom={classRoom}
        onUpdateClassRoom={handleUpdateClassRoom}
        supabaseConfig={supabaseConfig}
        sheetsConfig={sheetsConfig}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        students={students}
        assignments={assignments}
        submissionsMap={submissionsMap}
        onRestoreAllData={handleRestoreAllData}
        onShowToast={showToast}
      />

      {/* Toast notifications */}
      <Toast message={toastMessage} />
    </div>
  );
}
