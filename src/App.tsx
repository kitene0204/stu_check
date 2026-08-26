import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PlusCircle, FolderPlus, Users, BookOpen } from 'lucide-react';
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
  saveSupabaseConfig,
  fetchServerStoreData,
  saveServerStoreData,
} from './services/storageService';

import {
  initSupabase,
  fetchSupabaseData,
  upsertSubmissionsToSupabase,
  syncStudentsToSupabase,
  syncAssignmentsToSupabase,
  syncFullClassBundleToSupabase,
  subscribeToSubmissions
} from './services/supabaseService';

import { syncToGoogleSheetsWebhook } from './services/googleSheetsService';

export default function App() {
  // State Initialization from LocalStorage (Instant initial render)
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
    }, 3000);
  }, []);

  // Track initialization
  const isInitializedRef = useRef(false);

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
        showToast('📱 데스크탑 학급 데이터 및 연동 설정이 즉시 동기화되었습니다!');
        
        // Clean URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error('Failed to parse sync data from URL', e);
    }
  }, [showToast]);

  // Primary Data Source Sync on Mount:
  // 1. Fetch Supabase Cloud DB as primary source of truth
  // 2. Fetch Server Persistent Store (/api/store)
  // 3. Connect to Realtime channels (Supabase Realtime + SSE) for live synchronization
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initializeDataSources = async () => {
      setSyncState('syncing');

      const currentSupabaseCfg = supabaseConfig;
      const currentClassId = classRoom.id;

      // 1. Fetch Supabase Cloud DB first (Master cloud database across all devices)
      if (currentSupabaseCfg.isEnabled && currentSupabaseCfg.url && currentSupabaseCfg.anonKey) {
        try {
          const remote = await fetchSupabaseData(currentSupabaseCfg, currentClassId);

          if (remote.hasRemoteData) {
            if (remote.students && Array.isArray(remote.students)) {
              setStudents(remote.students);
              localStorage.setItem('class_tracker_students', JSON.stringify(remote.students));
            }

            if (remote.assignments && Array.isArray(remote.assignments)) {
              setAssignments(remote.assignments);
              localStorage.setItem('class_tracker_assignments', JSON.stringify(remote.assignments));
              if (remote.assignments.length > 0) {
                setActiveAssignmentId(remote.assignments[0].id);
              } else {
                setActiveAssignmentId('');
              }
            }

            if (remote.submissionsMap) {
              setSubmissionsMap(remote.submissionsMap);
              localStorage.setItem('class_tracker_submissions', JSON.stringify(remote.submissionsMap));
            }

            if (remote.classRoom) {
              setClassRoom(prev => {
                const merged = { ...prev, ...remote.classRoom };
                localStorage.setItem('class_tracker_classroom', JSON.stringify(merged));
                return merged;
              });
            }
          }
        } catch (err) {
          console.warn('Supabase initial fetch warning:', err);
        }
      }

      // 2. Fetch Server Store backup
      try {
        const serverData = await fetchServerStoreData();
        if (serverData && (serverData.students || serverData.classRoom)) {
          if (!localStorage.getItem('class_tracker_initialized_flag')) {
            if (serverData.students && Array.isArray(serverData.students) && serverData.students.length > 0) {
              setStudents(serverData.students);
              localStorage.setItem('class_tracker_students', JSON.stringify(serverData.students));
            }
            if (serverData.classRoom) {
              setClassRoom(serverData.classRoom);
              localStorage.setItem('class_tracker_classroom', JSON.stringify(serverData.classRoom));
            }
            if (serverData.assignments && Array.isArray(serverData.assignments)) {
              setAssignments(serverData.assignments);
              localStorage.setItem('class_tracker_assignments', JSON.stringify(serverData.assignments));
            }
            if (serverData.submissionsMap) {
              setSubmissionsMap(serverData.submissionsMap);
              localStorage.setItem('class_tracker_submissions', JSON.stringify(serverData.submissionsMap));
            }
          }
        }
      } catch (err) {
        console.warn('Backend store initialization warning:', err);
      }

      setSyncState('synced');
      setTimeout(() => setSyncState('idle'), 2000);
    };

    initializeDataSources();
  }, []);

  // Server-Sent Events (SSE) Live Real-time listener: Instant sub-millisecond sync across all devices
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('store_update', (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (!payload) return;

          if (payload.students && Array.isArray(payload.students) && payload.students.length > 0) {
            setStudents(payload.students);
            localStorage.setItem('class_tracker_students', JSON.stringify(payload.students));
          }
          if (payload.submissionsMap) {
            setSubmissionsMap(payload.submissionsMap);
            localStorage.setItem('class_tracker_submissions', JSON.stringify(payload.submissionsMap));
          }
          if (payload.classRoom) {
            setClassRoom(payload.classRoom);
            localStorage.setItem('class_tracker_classroom', JSON.stringify(payload.classRoom));
          }
          if (payload.assignments && Array.isArray(payload.assignments)) {
            setAssignments(payload.assignments);
            localStorage.setItem('class_tracker_assignments', JSON.stringify(payload.assignments));
          }

          setSyncState('synced');
          setTimeout(() => setSyncState('idle'), 1500);
        } catch (err) {
          console.error('SSE store_update parse error:', err);
        }
      });

      eventSource.addEventListener('roster_update', (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload && payload.students && Array.isArray(payload.students)) {
            setStudents(payload.students);
            localStorage.setItem('class_tracker_students', JSON.stringify(payload.students));
            setSyncState('synced');
            setTimeout(() => setSyncState('idle'), 1500);
          }
        } catch (err) {
          console.error('SSE roster_update parse error:', err);
        }
      });

      eventSource.addEventListener('submissions_update', (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload && payload.submissionsMap) {
            setSubmissionsMap(payload.submissionsMap);
            localStorage.setItem('class_tracker_submissions', JSON.stringify(payload.submissionsMap));
            setSyncState('synced');
            setTimeout(() => setSyncState('idle'), 1500);
          }
        } catch (err) {
          console.error('SSE submissions_update parse error:', err);
        }
      });
    } catch (err) {
      console.warn('SSE connection warning:', err);
    }

    // Fallback polling every 4 seconds in case SSE drops
    const pollInterval = setInterval(async () => {
      try {
        const serverData = await fetchServerStoreData();
        if (!serverData) return;

        if (serverData.students && Array.isArray(serverData.students) && serverData.students.length > 0) {
          setStudents(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(serverData.students)) {
              localStorage.setItem('class_tracker_students', JSON.stringify(serverData.students));
              return serverData.students!;
            }
            return prev;
          });
        }

        if (serverData.submissionsMap && Object.keys(serverData.submissionsMap).length > 0) {
          setSubmissionsMap(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(serverData.submissionsMap)) {
              localStorage.setItem('class_tracker_submissions', JSON.stringify(serverData.submissionsMap));
              return serverData.submissionsMap!;
            }
            return prev;
          });
        }
      } catch (e) {
        // silent
      }
    }, 4000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(pollInterval);
    };
  }, []);

  // Active assignment
  const activeAssignment = useMemo(() => {
    return assignments.find(a => a.id === activeAssignmentId) || assignments[0];
  }, [assignments, activeAssignmentId]);

  // Current submissions for active assignment
  const currentSubmissions = useMemo(() => {
    if (!activeAssignment?.id) return {};
    return submissionsMap[activeAssignment.id] || {};
  }, [submissionsMap, activeAssignment?.id]);

  // Realtime Supabase Sync Subscription
  useEffect(() => {
    if (!supabaseConfig.isEnabled || !supabaseConfig.url || !supabaseConfig.anonKey) {
      return;
    }

    const client = initSupabase(supabaseConfig);
    if (!client) return;

    // Subscribe to realtime changes for submissions, roster, and assignments
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
      },
      (newRemoteStudents) => {
        if (Array.isArray(newRemoteStudents) && newRemoteStudents.length > 0) {
          setStudents(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(newRemoteStudents)) {
              saveStudents(newRemoteStudents, classRoom.id);
              return newRemoteStudents;
            }
            return prev;
          });
          showToast(`⚡ 다른 기기에서 학생 명단(${newRemoteStudents.length}명)이 실시간 동기화되었습니다.`);
        }
      },
      (newRemoteAssignments) => {
        if (Array.isArray(newRemoteAssignments)) {
          setAssignments(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(newRemoteAssignments)) {
              saveAssignments(newRemoteAssignments);
              return newRemoteAssignments;
            }
            return prev;
          });
          setActiveAssignmentId(prev => {
            if (newRemoteAssignments.some(a => a.id === prev)) return prev;
            return newRemoteAssignments[0]?.id || '';
          });
        }
      },
      (newRemoteClassRoom) => {
        if (newRemoteClassRoom) {
          setClassRoom(prev => {
            const merged = { ...prev, ...newRemoteClassRoom };
            saveClassRoom(merged);
            return merged;
          });
        }
      }
    );

    // Periodic Cloud Sync Interval (Every 3.5 seconds) for guaranteed cross-browser freshness
    const supabasePollInterval = setInterval(async () => {
      try {
        const remote = await fetchSupabaseData(supabaseConfig, classRoom.id);
        if (remote.hasRemoteData) {
          if (remote.students && Array.isArray(remote.students)) {
            setStudents(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(remote.students)) {
                saveStudents(remote.students, classRoom.id);
                return remote.students;
              }
              return prev;
            });
          }
          if (remote.assignments && Array.isArray(remote.assignments)) {
            setAssignments(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(remote.assignments)) {
                saveAssignments(remote.assignments);
                return remote.assignments;
              }
              return prev;
            });
          }
          if (remote.submissionsMap && Object.keys(remote.submissionsMap).length > 0) {
            setSubmissionsMap(prev => {
              const prevStr = JSON.stringify(prev);
              const merged = { ...prev, ...remote.submissionsMap };
              if (prevStr !== JSON.stringify(merged)) {
                saveSubmissions(merged);
                return merged;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // silent
      }
    }, 3500);

    return () => {
      if (channel && client) {
        client.removeChannel(channel);
      }
      clearInterval(supabasePollInterval);
    };
  }, [supabaseConfig, classRoom.id, showToast]);

  // Realtime Automatic Push Sync Helper
  const triggerAutoSync = useCallback(async (
    asgId: string, 
    itemsToSync: { studentId: string; status: SubmissionStatus; note?: string; updatedAt: string }[],
    updatedSubmissionsForActive?: Record<string, SubmissionItem>,
    updatedFullMap?: SubmissionMap
  ) => {
    setSyncState('syncing');

    // 1. Supabase Cloud Sync
    if (supabaseConfig.isEnabled && supabaseConfig.url) {
      try {
        await upsertSubmissionsToSupabase(supabaseConfig, classRoom.id, asgId, itemsToSync);
      } catch (err) {
        console.error('Auto sync to Supabase failed:', err);
      }
    }

    // 2. Google Sheets Webhook Sync
    if (sheetsConfig.autoSyncEnabled && sheetsConfig.webhookUrl && activeAssignment) {
      try {
        const subsToUse = updatedSubmissionsForActive || currentSubmissions;
        await syncToGoogleSheetsWebhook(sheetsConfig, classRoom, activeAssignment, students, subsToUse);
      } catch (err) {
        console.error('Auto sync to Google Sheets failed:', err);
      }
    }

    // 3. Server store persistence (always pass latest updated map)
    const mapToSave = updatedFullMap || submissionsMap;
    saveServerStoreData({
      classRoom,
      students,
      assignments,
      submissionsMap: mapToSave,
      supabaseConfig,
      sheetsConfig,
    });

    setSyncState('synced');
    setTimeout(() => {
      setSyncState('idle');
    }, 1800);
  }, [supabaseConfig, sheetsConfig, classRoom, activeAssignment, students, currentSubmissions, assignments, submissionsMap]);

  // Manual Full Sync Button Action
  const handleTriggerManualSync = useCallback(async () => {
    setSyncState('syncing');
    showToast('🔄 클라우드, 서버 및 로컬 데이터 전체 동기화 중...');

    try {
      let syncCount = 0;

      // 1. Supabase Sync (Download & Upload latest)
      if (supabaseConfig.isEnabled && supabaseConfig.url) {
        // Upload students roster to Supabase
        await syncStudentsToSupabase(supabaseConfig, classRoom.id, students);

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
        if (remoteData.students && remoteData.students.length > 0) {
          setStudents(remoteData.students);
          saveStudents(remoteData.students, classRoom.id);
        }
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

      // 3. Save to backend server store & LocalStorage
      saveClassRoom(classRoom);
      saveStudents(students, classRoom.id);
      saveAssignments(assignments);
      saveSubmissions(submissionsMap);
      saveSupabaseConfig(supabaseConfig);
      saveSheetsConfig(sheetsConfig);

      await saveServerStoreData({
        classRoom,
        students,
        assignments,
        submissionsMap,
        supabaseConfig,
        sheetsConfig,
      });

      setSyncState('synced');

      if (syncCount > 0) {
        showToast('✅ Supabase 클라우드, 서버 및 모든 기기 실시간 동기화 완료!');
      } else {
        showToast('✅ 서버 및 모든 브라우저 실시간 동기화 완료!');
      }

      setTimeout(() => {
        setSyncState('idle');
      }, 2000);
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

    if (supabaseConfig.isEnabled && supabaseConfig.url) {
      syncFullClassBundleToSupabase(supabaseConfig, updated, students, assignments, submissionsMap);
    }
  };

  const handleUpdateStudents = async (updatedStudents: Student[]) => {
    // 1. Instant local state update for immediate UI re-rendering
    setStudents(updatedStudents);
    
    // 2. Persist to LocalStorage and Server store
    saveStudents(updatedStudents, classRoom.id);

    // 3. Sync to Supabase if configured
    if (supabaseConfig.isEnabled && supabaseConfig.url) {
      try {
        setSyncState('syncing');
        const ok = await syncStudentsToSupabase(supabaseConfig, classRoom.id, updatedStudents);
        if (ok) {
          showToast(`⚡ Supabase 클라우드에 ${updatedStudents.length}명의 명단이 실시간 저장되었습니다!`);
        }
        setSyncState('synced');
        setTimeout(() => setSyncState('idle'), 2000);
      } catch (e) {
        console.error('Failed to sync students to Supabase:', e);
      }
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

    // Realtime Push to Supabase & Google Sheets & Server Store
    triggerAutoSync(
      asgId, 
      [{
        studentId,
        status: newStatus,
        note: currentSub.note,
        updatedAt: nowIso,
      }], 
      newSubmissionsForActive,
      updatedMap
    );

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

    // Realtime Push to Supabase & Google Sheets & Server Store
    triggerAutoSync(
      asgId, 
      [{
        studentId,
        status: newStatus,
        note: updatedSubItem.note,
        updatedAt: nowIso,
      }], 
      newSubmissionsForActive,
      updatedMap
    );
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

    // Realtime Push to Supabase & Google Sheets & Server Store
    triggerAutoSync(asgId, supabasePayload, updatedCurrentAsg, updatedSubmissions);

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

  const handleSaveSupabaseConfig = async (cfg: SupabaseConfig) => {
    setSupabaseConfig(cfg);
    saveSupabaseConfig(cfg);

    if (cfg.isEnabled && cfg.url && cfg.anonKey) {
      setSyncState('syncing');
      try {
        // Upload current state to Supabase
        await syncFullClassBundleToSupabase(cfg, classRoom, students, assignments, submissionsMap);
        
        // Also fetch any existing remote data
        const remote = await fetchSupabaseData(cfg, classRoom.id);
        if (remote.students && remote.students.length > 0) {
          setStudents(remote.students);
          saveStudents(remote.students, classRoom.id);
        }
        if (remote.assignments && remote.assignments.length > 0) {
          setAssignments(remote.assignments);
          saveAssignments(remote.assignments);
        }
        if (remote.submissionsMap && Object.keys(remote.submissionsMap).length > 0) {
          setSubmissionsMap(prev => ({ ...prev, ...remote.submissionsMap }));
        }

        setSyncState('synced');
        showToast('⚡ Supabase 설정 저장 및 전체 데이터 동기화가 완료되었습니다!');
      } catch (err) {
        console.error('Supabase save error:', err);
        setSyncState('error');
      }
      setTimeout(() => setSyncState('idle'), 2500);
    } else {
      showToast('💾 로컬 스토리지 모드로 저장되었습니다.');
    }
  };

  const handleSaveSheetsConfig = (cfg: GoogleSheetsConfig) => {
    setSheetsConfig(cfg);
    saveSheetsConfig(cfg);
  };

  const handleRestoreAllData = async (restored: { classRoom: ClassRoom; students: Student[]; assignments: Assignment[]; submissionsMap: SubmissionMap }) => {
    setClassRoom(restored.classRoom);
    saveClassRoom(restored.classRoom);

    setStudents(restored.students);
    saveStudents(restored.students, restored.classRoom.id);

    setAssignments(restored.assignments);
    saveAssignments(restored.assignments);

    setSubmissionsMap(restored.submissionsMap);
    saveSubmissions(restored.submissionsMap);

    if (restored.assignments.length > 0) {
      setActiveAssignmentId(restored.assignments[0].id);
    }

    // Save to server
    await saveServerStoreData({
      classRoom: restored.classRoom,
      students: restored.students,
      assignments: restored.assignments,
      submissionsMap: restored.submissionsMap,
      supabaseConfig,
      sheetsConfig,
    });

    // Save to Supabase if connected
    if (supabaseConfig.isEnabled && supabaseConfig.url) {
      await syncFullClassBundleToSupabase(
        supabaseConfig,
        restored.classRoom,
        restored.students,
        restored.assignments,
        restored.submissionsMap
      );
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
          onOpenRosterModal={() => setIsRosterModalOpen(true)}
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
            onOpenNewAssignmentModal={() => setIsNewAssignmentModalOpen(true)}
            onOpenRosterModal={() => setIsRosterModalOpen(true)}
            onDeleteAssignment={handleDeleteAssignment}
            totalStudents={totalStudents}
            submittedCount={submittedCount}
            missingCount={missingCount}
            resubmitCount={resubmitCount}
          />

          {/* Student Matrix Display by ViewMode or Empty State */}
          <div className="flex-1">
            {assignments.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-[#E6E1D5] rounded-2xl bg-[#FAF9F6]/50 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#F4F1EA] flex items-center justify-center text-[#8C4A1A] mb-4 shadow-inner">
                  <BookOpen className="w-8 h-8 text-[#BC6C25]" />
                </div>
                <h3 className="text-lg font-serif-kr font-bold text-[#3D3A35] mb-2">
                  등록된 과제 및 제출 항목이 없습니다
                </h3>
                <p className="text-xs sm:text-sm text-[#7D7568] max-w-md mb-6 leading-relaxed">
                  새로운 과제나 준비물을 추가하여 학생별 제출 현황을 간편하게 체크해보세요.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setIsNewAssignmentModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#BC6C25] hover:bg-[#A3591B] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>새 과제 등록하기</span>
                  </button>
                  <button
                    onClick={() => setIsRosterModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF3EB] hover:bg-[#F5E6D3] text-[#8C4A1A] border border-[#BC6C25]/40 rounded-xl text-xs sm:text-sm font-bold active:scale-95 transition-all cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-[#BC6C25]" />
                    <span>학생 명단 관리</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
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
              </>
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
                : 'bg-emerald-50 text-[#2D6A4F] border-emerald-300 hover:bg-emerald-100'
            }`}
            title="실시간 클라우드 및 서버 동기화 상태"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" />
            <span>{supabaseConfig.isEnabled && supabaseConfig.url ? 'Supabase 실시간 클라우드 ON' : '실시간 전역 서버 동기화 ON'}</span>
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
        onSaveStudents={handleUpdateStudents}
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

          // Realtime Push to Supabase & Google Sheets & Server
          triggerAutoSync(
            asgId, 
            [{
              studentId,
              status,
              note,
              updatedAt: nowIso,
            }], 
            updatedMap[asgId],
            updatedMap
          );
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
        onOpenRosterModal={() => setIsRosterModalOpen(true)}
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
