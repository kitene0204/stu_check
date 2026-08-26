import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  GraduationCap, 
  School, 
  FileSpreadsheet, 
  Database, 
  Check, 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  QrCode,
  Copy,
  Info,
  Users
} from 'lucide-react';
import { ClassRoom, SupabaseConfig, GoogleSheetsConfig, Student, Assignment, SubmissionMap } from '../types';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classRoom: ClassRoom;
  onUpdateClassRoom: (updated: ClassRoom) => void;
  supabaseConfig: SupabaseConfig;
  sheetsConfig: GoogleSheetsConfig;
  onOpenSupabaseModal: () => void;
  onOpenSheetsModal: () => void;
  onOpenRosterModal?: () => void;
  students: Student[];
  assignments: Assignment[];
  submissionsMap: SubmissionMap;
  onRestoreAllData: (data: { classRoom: ClassRoom; students: Student[]; assignments: Assignment[]; submissionsMap: SubmissionMap }) => void;
  onShowToast: (msg: string) => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  classRoom,
  onUpdateClassRoom,
  supabaseConfig,
  sheetsConfig,
  onOpenSupabaseModal,
  onOpenSheetsModal,
  onOpenRosterModal,
  students,
  assignments,
  submissionsMap,
  onRestoreAllData,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'title' | 'mobile' | 'sync' | 'backup'>('title');

  // Title form state
  const [useCustomTitle, setUseCustomTitle] = useState(Boolean(classRoom.customTitle));
  const [schoolName, setSchoolName] = useState(classRoom.schoolName);
  const [grade, setGrade] = useState(classRoom.grade.toString());
  const [classNumber, setClassNumber] = useState(classRoom.classNumber.toString());
  const [academicYear, setAcademicYear] = useState(classRoom.academicYear.toString());
  const [teacherName, setTeacherName] = useState(classRoom.teacherName || '');
  const [customTitle, setCustomTitle] = useState(classRoom.customTitle || '');
  const [customSubtitle, setCustomSubtitle] = useState(classRoom.customSubtitle || '');

  if (!isOpen) return null;

  const currentDisplayTitle = useCustomTitle && customTitle.trim()
    ? customTitle.trim()
    : `${schoolName.trim() || '전주삼천초등학교'} ${grade || '6'}학년 ${classNumber || '1'}반`;

  const currentDisplaySubtitle = customSubtitle.trim() || 'STUDENT ASSIGNMENT & SUBMISSION TRACKER';

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ClassRoom = {
      ...classRoom,
      schoolName: schoolName.trim() || '전주삼천초등학교',
      grade: parseInt(grade, 10) || 6,
      classNumber: parseInt(classNumber, 10) || 1,
      academicYear: parseInt(academicYear, 10) || new Date().getFullYear(),
      teacherName: teacherName.trim() || undefined,
      customTitle: useCustomTitle && customTitle.trim() ? customTitle.trim() : undefined,
      customSubtitle: customSubtitle.trim() || undefined,
    };
    onUpdateClassRoom(updated);
    onShowToast('🏫 학급 및 웹앱 제목이 즉시 저장되었습니다.');
  };

  // Generate Mobile QR & Link Payload
  const getMobileSyncUrl = () => {
    try {
      const payload = {
        classRoom: {
          ...classRoom,
          schoolName: schoolName.trim() || '전주삼천초등학교',
          grade: parseInt(grade, 10) || 6,
          classNumber: parseInt(classNumber, 10) || 1,
          customTitle: useCustomTitle && customTitle.trim() ? customTitle.trim() : undefined,
          customSubtitle: customSubtitle.trim() || undefined,
          teacherName: teacherName.trim() || undefined,
        },
        students,
        supabaseConfig,
        sheetsConfig,
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      return `${window.location.origin}${window.location.pathname}?syncData=${encoded}`;
    } catch (e) {
      return window.location.href;
    }
  };

  const mobileSyncUrl = getMobileSyncUrl();
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(mobileSyncUrl)}`;

  const handleCopyMobileLink = () => {
    navigator.clipboard.writeText(mobileSyncUrl);
    onShowToast('🔗 스마트폰 즉시 연동 링크가 복사되었습니다! 카톡이나 메신저로 열어보세요.');
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      classRoom: {
        ...classRoom,
        schoolName,
        grade: parseInt(grade, 10) || 6,
        classNumber: parseInt(classNumber, 10) || 1,
        academicYear: parseInt(academicYear, 10) || new Date().getFullYear(),
        teacherName,
        customTitle: useCustomTitle ? customTitle : undefined,
        customSubtitle: customSubtitle || undefined,
      },
      students,
      assignments,
      submissionsMap,
      sheetsConfig,
      supabaseConfig: {
        ...supabaseConfig,
        anonKey: '***HIDDEN***', // Hide secret key on export
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `학급제출물_전체데이터백업_${schoolName}_${grade}학년${classNumber}반_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('📦 전체 학급 데이터 백업 파일이 다운로드되었습니다.');
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.students || !parsed.assignments) {
          throw new Error('올바른 백업 형식이 아닙니다.');
        }

        if (confirm(`'${parsed.classRoom?.schoolName || '학급'}'의 백업 데이터를 현재 화면에 복원하시겠습니까? (기존 데이터가 교체됩니다)`)) {
          onRestoreAllData({
            classRoom: parsed.classRoom || classRoom,
            students: parsed.students || [],
            assignments: parsed.assignments || [],
            submissionsMap: parsed.submissionsMap || {},
          });
          onShowToast('🎉 백업 데이터가 성공적으로 복원되었습니다.');
          onClose();
        }
      } catch (err) {
        alert('백업 파일을 읽는 중 오류가 발생했습니다. 올바른 JSON 파일인지 확인해 주세요.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2.5 text-[#3D3A35]">
            <div className="p-1.5 bg-[#A3B18A] text-white rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">웹앱 및 학급 환경 설정</h3>
              <p className="text-[11px] text-[#5D574F]">제목 변경, 스마트폰 연동, 데이터 안전 보관</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A89F91] hover:text-[#3D3A35] hover:bg-[#DCD5C8]/40 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#DCD5C8] bg-white px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('title')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'title'
                ? 'border-[#A3B18A] text-[#3D5A30]'
                : 'border-transparent text-[#A89F91] hover:text-[#5D574F]'
            }`}
          >
            웹앱 제목 / 학급 정보
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'mobile'
                ? 'border-[#A3B18A] text-[#3D5A30]'
                : 'border-transparent text-[#A89F91] hover:text-[#5D574F]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>스마트폰 즉시 연동 (QR)</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'sync'
                ? 'border-[#A3B18A] text-[#3D5A30]'
                : 'border-transparent text-[#A89F91] hover:text-[#5D574F]'
            }`}
          >
            연동 상태 허브
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-[#A3B18A] text-[#3D5A30]'
                : 'border-transparent text-[#A89F91] hover:text-[#5D574F]'
            }`}
          >
            데이터 백업/복원
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'title' && (
            <form onSubmit={handleSaveTitle} className="space-y-4">
              {/* Live Preview Box */}
              <div className="p-4 bg-[#F2EDE4]/70 border border-[#DCD5C8] rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-[#A89F91] uppercase tracking-wider block">
                  실시간 헤더 미리보기
                </span>
                <div className="flex items-center gap-3 bg-[#EAE5D8] p-3 rounded-xl border border-[#DCD5C8]/80">
                  <div className="w-9 h-9 bg-[#A3B18A] rounded-xl flex items-center justify-center text-white shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-base text-[#3D3A35] leading-tight">
                      {currentDisplayTitle}
                    </div>
                    <div className="text-[10px] text-[#5D574F]/80 uppercase tracking-widest font-medium">
                      {currentDisplaySubtitle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Title Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-white border border-[#DCD5C8] rounded-xl">
                <div>
                  <div className="text-xs font-bold text-[#3D3A35]">사용자 정의 제목 직접 입력</div>
                  <div className="text-[11px] text-[#A89F91]">학교/학년/반 조합 대신 원하는 이름으로 표시합니다.</div>
                </div>
                <input
                  type="checkbox"
                  checked={useCustomTitle}
                  onChange={(e) => setUseCustomTitle(e.target.checked)}
                  className="w-4 h-4 accent-[#A3B18A] rounded cursor-pointer"
                />
              </div>

              {useCustomTitle ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3D3A35]">메인 타이틀 문구</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="예: 전주삼천초등학교 6학년 1반"
                    className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3D3A35]">학교 이름</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="예: 전주삼천초등학교"
                      className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3D3A35]">학년</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3D3A35]">반</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={classNumber}
                      onChange={(e) => setClassNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Subtitle & Teacher Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3D3A35]">하단 영문/한글 부제목</label>
                  <input
                    type="text"
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    placeholder="STUDENT ASSIGNMENT & SUBMISSION TRACKER"
                    className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3D3A35]">담임 교사명 (선택)</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="예: 김선생님"
                    className="w-full px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
                  />
                </div>
              </div>

              {/* Student Roster Quick Entry Card */}
              {onOpenRosterModal && (
                <div className="p-3.5 bg-[#FAF3EB] border border-[#BC6C25]/40 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-[#BC6C25] text-white rounded-lg shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#8C4A1A]">학생 명단 수정 / 일괄 등록</div>
                      <div className="text-[10px] text-[#A89F91] truncate">현재 등록된 학생: {students.length}명 (엑셀/한글 복사 붙여넣기 가능)</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRosterModal();
                    }}
                    className="px-3 py-1.5 bg-[#8C4A1A] hover:bg-[#6D3914] text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-xs"
                  >
                    명단 수정 열기
                  </button>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#2D6A4F] text-white hover:bg-[#23533E] rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>설정 내용 즉시 저장 및 적용하기</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'mobile' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-[#A3B18A]/40 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                {/* QR Code */}
                <div className="p-3 bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl flex flex-col items-center shrink-0">
                  <img
                    src={qrCodeImageUrl}
                    alt="스마트폰 연동 QR코드"
                    className="w-44 h-44 rounded-lg object-contain"
                  />
                  <span className="text-[10px] font-bold text-[#5D574F] mt-2 flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-[#2D6A4F]" />
                    <span>스마트폰 카메라로 스캔</span>
                  </span>
                </div>

                {/* Explanation */}
                <div className="space-y-2.5 text-xs text-[#5D574F] flex-1">
                  <div className="font-bold text-sm text-[#3D3A35] flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#2D6A4F]" />
                    <span>1초 만에 스마트폰에 학급 설정 동기화</span>
                  </div>
                  <p className="leading-relaxed">
                    스마트폰 카메라로 위 QR코드를 촬영하거나 아래 연동 링크를 열면, 데스크탑에서 설정하신 <strong>&apos;{currentDisplayTitle}&apos;</strong>, 학생 명단({students.length}명), 연동 정보가 스마트폰에 즉시 동기화됩니다!
                  </p>
                  
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleCopyMobileLink}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2D6A4F] text-white hover:bg-[#23533E] rounded-xl font-bold transition-all shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>스마트폰 연동 링크 복사하기</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Why does title reset on new device? */}
              <div className="p-3.5 bg-[#F2EDE4]/70 border border-[#DCD5C8] rounded-xl text-xs text-[#5D574F] space-y-1">
                <div className="font-bold text-[#3D3A35] flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-[#BC6C25]" />
                  <span>스마트폰에서 기본 제목으로 나왔던 이유</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  웹 브라우저는 기기마다 독립된 로컬 저장소를 사용합니다. 데스크탑에서 변경하신 정보는 스마트폰에 자동으로 넘어가지 않으므로, <strong>위 QR 코드로 1회 열어주시거나</strong> 스마트폰 설정에서 동일하게 학교명을 입력해주시면 됩니다.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* Google Sheets Hub Card */}
              <div className="p-4 bg-white border border-[#2D6A4F]/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#E8F0E4] text-[#2D6A4F] rounded-lg">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#3D3A35]">구글 시트(Google Sheets) 연동 상태</h4>
                      <p className="text-[11px] text-[#A89F91]">과제별 제출 현황 자동 기록 및 탭 생성</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    sheetsConfig.spreadsheetUrl || sheetsConfig.webhookUrl
                      ? 'bg-[#E8F0E4] text-[#2D6A4F]'
                      : 'bg-amber-50 text-[#8C4A1A]'
                  }`}>
                    {sheetsConfig.spreadsheetUrl || sheetsConfig.webhookUrl ? '연결됨 (지속 유지)' : '미연결'}
                  </span>
                </div>

                <div className="text-xs text-[#5D574F] bg-[#FAF9F6] p-2.5 rounded-xl border border-[#DCD5C8] space-y-1">
                  <div className="truncate">
                    <strong className="text-[#3D3A35]">연결 시트 URL:</strong>{' '}
                    {sheetsConfig.spreadsheetUrl || <span className="text-[#A89F91]">미등록</span>}
                  </div>
                  <div className="truncate">
                    <strong className="text-[#3D3A35]">웹훅 URL:</strong>{' '}
                    {sheetsConfig.webhookUrl || <span className="text-[#A89F91]">미등록</span>}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSheetsModal();
                    }}
                    className="px-3 py-1.5 bg-[#2D6A4F] text-white hover:bg-[#23533E] rounded-xl text-xs font-bold cursor-pointer"
                  >
                    구글 시트 연동 설정 열기
                  </button>
                </div>
              </div>

              {/* Supabase Cloud Sync Card */}
              <div className="p-4 bg-white border border-[#A3B18A]/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#E8F0E4] text-[#3D5A30] rounded-lg">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#3D3A35]">Supabase 실시간 클라우드 DB 연동</h4>
                      <p className="text-[11px] text-[#A89F91]">교탁 PC ↔ 스마트폰 실시간 양방향 동기화</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    supabaseConfig.isEnabled && supabaseConfig.url
                      ? 'bg-[#E8F0E4] text-[#3D5A30]'
                      : 'bg-[#FAF3EB] text-[#8C4A1A]'
                  }`}>
                    {supabaseConfig.isEnabled && supabaseConfig.url ? '실시간 동기화 ON' : '로컬 캐시 모드'}
                  </span>
                </div>

                <div className="text-xs text-[#5D574F] bg-[#FAF9F6] p-2.5 rounded-xl border border-[#DCD5C8] space-y-1">
                  <div className="truncate">
                    <strong className="text-[#3D3A35]">Project URL:</strong>{' '}
                    {supabaseConfig.url || <span className="text-[#A89F91]">미등록</span>}
                  </div>
                  <div>
                    <strong className="text-[#3D3A35]">API Key:</strong>{' '}
                    {supabaseConfig.anonKey ? '●●●●●●●● (안전 보관됨)' : <span className="text-[#A89F91]">미등록</span>}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSupabaseModal();
                    }}
                    className="px-3 py-1.5 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Supabase 설정 열기
                  </button>
                </div>
              </div>

              {/* Data Persistence Safety Notice */}
              <div className="p-3 bg-[#EBF5EE] border border-[#2D6A4F]/20 rounded-xl flex items-start gap-2 text-xs text-[#2D6A4F]">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  선생님께서 등록하신 구글 시트 링크 및 Supabase 인증 키는 브라우저의 안전 저장소(Local Storage)에 영구 보관되며, 직접 수정하거나 초기화하기 전까지 <strong>계속 연결이 유지</strong>됩니다.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-[#DCD5C8] rounded-2xl space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#3D3A35]">전체 데이터 JSON 파일 백업</h4>
                  <p className="text-[11px] text-[#A89F91]">
                    현재 등록된 학생 명단({students.length}명), 과제 목록({assignments.length}개), 제출 체크 기록 일체를 파일로 다운로드합니다.
                  </p>
                </div>

                <button
                  onClick={handleExportBackup}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FAF9F6] hover:bg-[#EAE5D8] border border-[#DCD5C8] rounded-xl text-xs font-bold text-[#3D3A35] transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>학급 데이터 전체 백업 다운로드 (.json)</span>
                </button>
              </div>

              <div className="p-4 bg-white border border-[#DCD5C8] rounded-2xl space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#3D3A35]">백업 파일 불러오기 및 복원</h4>
                  <p className="text-[11px] text-[#A89F91]">
                    이전에 다운로드해 둔 JSON 백업 파일을 선택하여 데이터를 즉시 복원합니다.
                  </p>
                </div>

                <label className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FAF9F6] hover:bg-[#EAE5D8] border border-[#DCD5C8] rounded-xl text-xs font-bold text-[#3D3A35] cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>백업 파일 선택하여 복원하기 (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#EAE5D8] border-t border-[#DCD5C8] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs font-bold text-[#5D574F] cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
