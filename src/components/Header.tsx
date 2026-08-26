import React, { useState } from 'react';
import { 
  GraduationCap, 
  Settings, 
  FileSpreadsheet, 
  Printer, 
  Users, 
  Database,
  Menu,
  X,
  Share2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { ClassRoom, SupabaseConfig, GoogleSheetsConfig } from '../types';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

interface HeaderProps {
  classRoom: ClassRoom;
  onUpdateClassRoom: (updated: ClassRoom) => void;
  supabaseConfig: SupabaseConfig;
  sheetsConfig: GoogleSheetsConfig;
  syncState: SyncState;
  onTriggerManualSync: () => void;
  onOpenRosterModal: () => void;
  onOpenPrintModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenSheetsModal: () => void;
  onOpenSettingsModal: () => void;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  classRoom,
  supabaseConfig,
  syncState,
  onTriggerManualSync,
  onOpenRosterModal,
  onOpenPrintModal,
  onOpenSupabaseModal,
  onOpenSheetsModal,
  onOpenSettingsModal,
  onToggleMobileSidebar,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayTitle = classRoom.customTitle && classRoom.customTitle.trim()
    ? classRoom.customTitle
    : `${classRoom.schoolName} ${classRoom.grade}학년 ${classRoom.classNumber}반`;

  const displaySubtitle = classRoom.customSubtitle && classRoom.customSubtitle.trim()
    ? classRoom.customSubtitle
    : 'STUDENT ASSIGNMENT & SUBMISSION TRACKER';

  const isSyncing = syncState === 'syncing';
  const isSynced = syncState === 'synced';

  return (
    <header className="bg-[#EAE5D8] border-b border-[#DCD5C8] shrink-0 select-none z-30 shadow-xs">
      <div className="h-16 md:h-20 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2">
        {/* Left: Mobile Drawer Trigger + Brand & Class Info (min-w-0 for ellipsis without wrapping/overflow) */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1 overflow-hidden">
          {/* Mobile Sidebar (Assignment List) Drawer Toggle Button */}
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-1.5 sm:p-2 rounded-xl bg-white/80 border border-[#DCD5C8] text-[#3D3A35] hover:bg-white active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
              title="과제 목록 열기/닫기"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onOpenSettingsModal}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-[#A3B18A] hover:bg-[#8F9E75] rounded-lg sm:rounded-2xl flex items-center justify-center text-white shadow-xs transition-transform hover:scale-105 shrink-0 cursor-pointer"
            title="웹앱 및 학급 설정 열기"
          >
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          <div 
            className="cursor-pointer min-w-0 flex-1 group" 
            onClick={onOpenSettingsModal} 
            title="클릭하여 제목 및 학급 설정 수정"
          >
            <h1 className="text-xs sm:text-base md:text-xl font-bold tracking-tight text-[#3D3A35] truncate">
              {displayTitle}
            </h1>
            <p className="text-[8px] sm:text-[10px] md:text-[11px] text-[#5D574F]/80 uppercase tracking-tight md:tracking-widest font-medium truncate">
              {displaySubtitle}
            </p>
          </div>
        </div>

        {/* Right: Desktop Action Bar (Visible on lg and larger) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {/* Realtime Manual Sync Button with Animated Spinner & Status Indicator */}
          <button
            onClick={onTriggerManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer border active:scale-95 ${
              isSyncing
                ? 'bg-[#EBF5EE] border-[#2D6A4F] text-[#2D6A4F] ring-2 ring-[#2D6A4F]/20'
                : isSynced
                  ? 'bg-[#E8F0E4] border-[#A3B18A] text-[#3D5A30] hover:bg-[#DCE9D6]'
                  : 'bg-white hover:bg-[#FAF9F5] border-[#DCD5C8] text-[#3D3A35]'
            }`}
            title="구글 시트 / Supabase / 스마트폰 전체 즉시 동기화"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 text-[#2D6A4F] animate-spin" />
                <span className="font-extrabold text-[#2D6A4F]">동기화 중...</span>
              </>
            ) : isSynced ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] animate-in zoom-in-50" />
                <span className="font-extrabold text-[#2D6A4F]">동기화 완료</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-[#5D574F]" />
                <span>수동 동기화</span>
              </>
            )}
          </button>

          <div className="h-4 w-px bg-[#DCD5C8] mx-0.5" />

          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-xs transition-all shadow-xs cursor-pointer border ${
              supabaseConfig.isEnabled && supabaseConfig.url
                ? 'bg-[#E8F0E4] border-[#A3B18A] text-[#3D5A30] hover:bg-[#DCE9D6]'
                : 'bg-white border-[#BC6C25]/40 text-[#8C4A1A] hover:bg-[#FAF3EB]'
            }`}
            title="Supabase 실시간 클라우드 동기화 설정"
          >
            <span className="relative flex h-2 w-2">
              {supabaseConfig.isEnabled && supabaseConfig.url ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#588157] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3D5A30]"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#BC6C25]"></span>
              )}
            </span>
            <Database className="w-3.5 h-3.5" />
            <span>
              {supabaseConfig.isEnabled && supabaseConfig.url ? 'Supabase 실시간 ON' : 'Supabase 설정'}
            </span>
          </button>

          {/* Google Sheets Pill */}
          <button
            onClick={onOpenSheetsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F4F9F4] rounded-full border border-[#2D6A4F]/30 shadow-xs text-[#2D6A4F] font-semibold text-xs transition-all cursor-pointer"
            title="구글 시트 연동 및 내보내기"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>구글 시트</span>
          </button>

          <div className="h-4 w-px bg-[#DCD5C8] mx-0.5" />

          {/* Print Button */}
          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-xl border border-[#DCD5C8] text-xs font-medium text-[#5D574F]"
            title="A4 인쇄용 서식 출력"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>A4 서식</span>
          </button>

          {/* Roster Management */}
          <button
            onClick={onOpenRosterModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-xl border border-[#DCD5C8] text-xs font-medium text-[#5D574F]"
            title="학생 명단 관리 및 일괄 등록"
          >
            <Users className="w-3.5 h-3.5" />
            <span>명단 관리</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2D6A4F] text-white hover:bg-[#23533E] rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="설정 및 스마트폰 연동"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>설정</span>
          </button>
        </div>

        {/* Mobile Header Right Actions (Compact, responsive, and non-overlapping) */}
        <div className="flex lg:hidden items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Mobile Direct Roster Edit Button (Always visible on mobile) */}
          <button
            onClick={onOpenRosterModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF3EB] hover:bg-[#F5E6D3] text-[#8C4A1A] border border-[#BC6C25]/50 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
            title="학생 명단 관리 및 수정"
          >
            <Users className="w-4 h-4 text-[#BC6C25]" />
            <span className="text-[11px] font-bold">명단</span>
          </button>

          {/* Mobile Manual Sync Icon/Pill: Icon only on very small screens, short badge on sm */}
          <button
            onClick={onTriggerManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border active:scale-95 shrink-0 cursor-pointer ${
              isSyncing
                ? 'bg-[#EBF5EE] border-[#2D6A4F] text-[#2D6A4F] ring-1 ring-[#2D6A4F]/30'
                : isSynced
                  ? 'bg-[#E8F0E4] border-[#A3B18A] text-[#3D5A30]'
                  : 'bg-white border-[#DCD5C8] text-[#3D3A35] hover:bg-[#FAF9F5]'
            }`}
            title={isSyncing ? '동기화 중...' : isSynced ? '동기화 완료' : '즉시 수동 동기화'}
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 text-[#2D6A4F] animate-spin" />
            ) : isSynced ? (
              <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
            ) : (
              <RefreshCw className="w-4 h-4 text-[#5D574F]" />
            )}
            <span className="hidden sm:inline text-[11px] font-bold">
              {isSyncing ? '동기화 중' : isSynced ? '완료' : '동기화'}
            </span>
          </button>

          {/* Quick Settings Icon Button */}
          <button
            onClick={onOpenSettingsModal}
            className="p-2 bg-[#2D6A4F] hover:bg-[#23533E] text-white rounded-xl shadow-xs active:scale-95 transition-transform shrink-0 cursor-pointer"
            title="설정 및 연동 QR"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Quick Menu Dropdown Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-white/80 hover:bg-white border border-[#DCD5C8] text-[#3D3A35] rounded-xl shadow-xs active:scale-95 transition-transform shrink-0 cursor-pointer"
            title="더보기 메뉴"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Top Menu Overlay Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden px-3.5 py-3 bg-[#FAF9F6] border-t border-[#DCD5C8] flex flex-wrap gap-2 animate-in slide-in-from-top duration-200">
          {/* Mobile explicit sync status in drawer menu */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onTriggerManualSync();
            }}
            disabled={isSyncing}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
              isSyncing
                ? 'bg-[#EBF5EE] border-[#2D6A4F] text-[#2D6A4F]'
                : isSynced
                  ? 'bg-[#E8F0E4] border-[#A3B18A] text-[#3D5A30]'
                  : 'bg-white border-[#DCD5C8] text-[#3D3A35]'
            }`}
          >
            <span className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#2D6A4F]' : isSynced ? 'text-[#2D6A4F]' : 'text-[#5D574F]'}`} />
              <span>클라우드 & 구글 시트 동기화</span>
            </span>
            <span className="text-[11px] font-extrabold">
              {isSyncing ? '동기화 진행 중...' : isSynced ? '동기화 완료됨' : '지금 동기화 실행'}
            </span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenSupabaseModal();
            }}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs font-semibold text-[#3D3A35]"
          >
            <Database className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Supabase DB</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenSheetsModal();
            }}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs font-semibold text-[#2D6A4F]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>구글 시트</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenRosterModal();
            }}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs font-semibold text-[#5D574F]"
          >
            <Users className="w-3.5 h-3.5" />
            <span>명단 관리</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenPrintModal();
            }}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs font-semibold text-[#5D574F]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>A4 인쇄</span>
          </button>
        </div>
      )}
    </header>
  );
};
