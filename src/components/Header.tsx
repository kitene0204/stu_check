import React, { useState } from 'react';
import { 
  GraduationCap, 
  Database, 
  FileSpreadsheet, 
  Printer, 
  Users, 
  Settings, 
  CheckCircle2, 
  Edit3,
  Check
} from 'lucide-react';
import { ClassRoom, SupabaseConfig, GoogleSheetsConfig } from '../types';

interface HeaderProps {
  classRoom: ClassRoom;
  onUpdateClassRoom: (updated: ClassRoom) => void;
  supabaseConfig: SupabaseConfig;
  sheetsConfig: GoogleSheetsConfig;
  onOpenRosterModal: () => void;
  onOpenPrintModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenSheetsModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  classRoom,
  onUpdateClassRoom,
  supabaseConfig,
  sheetsConfig,
  onOpenRosterModal,
  onOpenPrintModal,
  onOpenSupabaseModal,
  onOpenSheetsModal,
  onOpenSettingsModal,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [schoolName, setSchoolName] = useState(classRoom.schoolName);
  const [grade, setGrade] = useState(classRoom.grade.toString());
  const [classNum, setClassNum] = useState(classRoom.classNumber.toString());

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClassRoom({
      ...classRoom,
      schoolName: schoolName.trim() || '새싹초등학교',
      grade: parseInt(grade, 10) || 3,
      classNumber: parseInt(classNum, 10) || 1,
    });
    setIsEditingTitle(false);
  };

  const displayTitle = classRoom.customTitle && classRoom.customTitle.trim()
    ? classRoom.customTitle
    : `${classRoom.schoolName} ${classRoom.grade}학년 ${classRoom.classNumber}반`;

  const displaySubtitle = classRoom.customSubtitle && classRoom.customSubtitle.trim()
    ? classRoom.customSubtitle
    : 'STUDENT ASSIGNMENT & SUBMISSION TRACKER';

  return (
    <header className="h-20 flex flex-wrap items-center justify-between px-6 md:px-8 bg-[#EAE5D8] border-b border-[#DCD5C8] shrink-0 select-none z-10">
      {/* Brand & Class Info */}
      <div className="flex items-center gap-3 md:gap-4 py-2">
        <button
          onClick={onOpenSettingsModal}
          className="w-10 h-10 md:w-11 md:h-11 bg-[#A3B18A] hover:bg-[#8F9E75] rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 cursor-pointer"
          title="웹앱 및 학급 설정 열기"
        >
          <GraduationCap className="w-6 h-6" />
        </button>

        {isEditingTitle ? (
          <form onSubmit={handleSaveTitle} className="flex items-center gap-2 bg-white/80 p-1.5 rounded-xl border border-[#DCD5C8]">
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="px-2 py-1 text-sm bg-white border border-[#DCD5C8] rounded-lg w-28 focus:outline-[#A3B18A]"
              placeholder="학교명"
            />
            <div className="flex items-center gap-1 text-xs text-[#5D574F]">
              <input
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-10 px-1 py-1 text-center bg-white border border-[#DCD5C8] rounded-lg focus:outline-[#A3B18A]"
                min="1"
                max="6"
              />
              <span>학년</span>
              <input
                type="number"
                value={classNum}
                onChange={(e) => setClassNum(e.target.value)}
                className="w-10 px-1 py-1 text-center bg-white border border-[#DCD5C8] rounded-lg focus:outline-[#A3B18A]"
                min="1"
                max="20"
              />
              <span>반</span>
            </div>
            <button
              type="submit"
              className="p-1 bg-[#A3B18A] text-white rounded-lg hover:bg-[#92A179]"
              title="저장"
            >
              <Check className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="group cursor-pointer" onClick={onOpenSettingsModal} title="클릭하여 제목 및 학급 설정 수정">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-[#3D3A35] flex items-center gap-1.5">
                {displayTitle}
                <Edit3 className="w-3.5 h-3.5 text-[#A89F91] opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            </div>
            <p className="text-[11px] text-[#5D574F]/80 uppercase tracking-widest font-medium">
              {displaySubtitle}
            </p>
          </div>
        )}
      </div>

      {/* Sync Status & Navigation Action Badges */}
      <div className="flex items-center gap-2 md:gap-3 py-2">
        {/* Supabase Status Pill - High Visibility */}
        <button
          onClick={onOpenSupabaseModal}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-all shadow-xs cursor-pointer border ${
            supabaseConfig.isEnabled && supabaseConfig.url
              ? 'bg-[#E8F0E4] border-[#A3B18A] text-[#3D5A30] hover:bg-[#DCE9D6] ring-2 ring-[#A3B18A]/20'
              : 'bg-white border-[#BC6C25]/40 text-[#8C4A1A] hover:bg-[#FAF3EB] hover:border-[#BC6C25] ring-2 ring-[#BC6C25]/15'
          }`}
          title="Supabase 실시간 클라우드 동기화 설정 (클릭하여 열기)"
        >
          <span className="relative flex h-2.5 w-2.5">
            {supabaseConfig.isEnabled && supabaseConfig.url ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#588157] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3D5A30]"></span>
              </>
            ) : (
              <>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#BC6C25]"></span>
              </>
            )}
          </span>
          <Database className={`w-3.5 h-3.5 ${supabaseConfig.isEnabled && supabaseConfig.url ? 'text-[#3D5A30]' : 'text-[#8C4A1A]'}`} />
          <span className="font-bold">
            {supabaseConfig.isEnabled && supabaseConfig.url ? 'Supabase 실시간 ON' : '⚡ Supabase 연동 설정'}
          </span>
        </button>

        {/* Google Sheets Pill */}
        <button
          onClick={onOpenSheetsModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#F4F9F4] rounded-full border border-[#2D6A4F]/30 shadow-xs text-[#2D6A4F] font-semibold transition-all cursor-pointer text-xs ring-1 ring-[#2D6A4F]/10 hover:ring-[#2D6A4F]/30"
          title="구글 시트 연동 및 내보내기"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#2D6A4F]" />
          <span>구글 시트 연동</span>
        </button>

        <div className="h-5 w-px bg-[#DCD5C8] mx-1 hidden md:block" />

        {/* Print Button */}
        <button
          onClick={onOpenPrintModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-xl border border-[#DCD5C8] text-xs font-medium text-[#5D574F] hover:text-[#3D3A35] transition-colors"
          title="A4 인쇄용 서식 출력"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">A4 인쇄 서식</span>
        </button>

        {/* Roster Management */}
        <button
          onClick={onOpenRosterModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-semibold transition-colors shadow-xs"
        >
          <Users className="w-3.5 h-3.5" />
          <span>명단 관리</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettingsModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white rounded-xl border border-[#DCD5C8] text-xs font-semibold text-[#5D574F] hover:text-[#3D3A35] transition-all shadow-xs"
          title="웹앱 제목 및 전체 설정"
        >
          <Settings className="w-3.5 h-3.5 text-[#5D574F]" />
          <span className="hidden sm:inline">설정</span>
        </button>
      </div>
    </header>
  );
};
