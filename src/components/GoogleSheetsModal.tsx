import React, { useState } from 'react';
import { X, FileSpreadsheet, Copy, Download, ExternalLink, Check, Sparkles } from 'lucide-react';
import { Assignment, Student, GoogleSheetsConfig, SubmissionStatus } from '../types';
import { formatGoogleSheetData } from '../services/storageService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | undefined;
  students: Student[];
  submissions: Record<string, { status: SubmissionStatus; note?: string }>;
  config: GoogleSheetsConfig;
  onSaveConfig: (cfg: GoogleSheetsConfig) => void;
  onShowToast: (msg: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  assignment,
  students,
  submissions,
  config,
  onSaveConfig,
  onShowToast,
}) => {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(config.spreadsheetUrl || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !assignment) return null;

  const tsvData = formatGoogleSheetData(assignment, students, submissions);

  const handleCopyTSV = () => {
    navigator.clipboard.writeText(tsvData);
    setCopied(true);
    onShowToast('📊 구글 시트용 표 데이터가 클립보드에 복사되었습니다! 구글 시트에서 Ctrl+V 하세요.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(tsvData.replace(/\t/g, ','));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${assignment.title}_제출현황_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('📥 CSV 파일로 다운로드되었습니다.');
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      spreadsheetUrl: spreadsheetUrl.trim(),
      lastExportedAt: new Date().toISOString(),
    });
    onShowToast('🔗 구글 시트 바로가기 주소가 저장되었습니다.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2 text-[#3D3A35]">
            <FileSpreadsheet className="w-5 h-5 text-[#2D6A4F]" />
            <h3 className="font-bold text-base">구글 시트(Google Sheets) 연동 및 내보내기</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5D574F] hover:bg-[#DCD5C8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Quick Sheet Direct Copy */}
          <div className="p-4 bg-[#F2EDE4]/70 rounded-2xl border border-[#DCD5C8] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3D3A35] flex items-center gap-1.5">
                <span>1초 구글 시트 복사 & 붙여넣기</span>
              </span>
              <span className="text-[11px] text-[#A89F91]">{students.length}명 데이터</span>
            </div>
            <p className="text-xs text-[#5D574F] leading-relaxed">
              버튼을 누른 후 구글 스프레드시트의 원하는 셀을 클릭하고 <strong>Ctrl+V</strong>를 누르면 번호, 이름, 모둠, 제출여부가 완벽한 표 형태로 즉시 채워집니다.
            </p>
            
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCopyTSV}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#2D6A4F] text-white hover:bg-[#23533E] rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '구글 시트 데이터 복사됨!' : '구글 시트용 표 전체 복사 (Ctrl+C)'}</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="px-3 py-2.5 bg-white hover:bg-[#EAE5D8] border border-[#DCD5C8] rounded-xl text-xs font-semibold text-[#5D574F] flex items-center gap-1"
                title="CSV 다운로드"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV 파일</span>
              </button>
            </div>
          </div>

          {/* Connected Sheet URL Setting */}
          <form onSubmit={handleSaveUrl} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#5D574F] block mb-1">
                학교/학급 구글 시트 URL 링크 연결 (선택)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 px-3 py-2 bg-white border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#A3B18A]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-bold"
                >
                  저장
                </button>
              </div>
            </div>

            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>연결된 구글 시트 새 탭에서 열기</span>
              </a>
            )}
          </form>

          {/* Data Preview */}
          <div>
            <label className="text-[11px] font-bold text-[#A89F91] uppercase tracking-wider block mb-1">
              내보낼 표 데이터 미리보기 (앞 3줄)
            </label>
            <pre className="p-3 bg-white border border-[#DCD5C8] rounded-xl text-[11px] font-mono text-[#5D574F] max-h-24 overflow-y-auto">
              {tsvData.split('\n').slice(0, 4).join('\n') + '\n...'}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F2EDE4] border-t border-[#DCD5C8] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#3D3A35] text-white hover:bg-[#2C2925] rounded-xl text-xs font-semibold"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
