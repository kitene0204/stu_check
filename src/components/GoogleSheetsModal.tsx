import React, { useState } from 'react';
import { X, FileSpreadsheet, Copy, Download, ExternalLink, Check, Send, Code, HelpCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'copy' | 'webhook'>('copy');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(config.spreadsheetUrl || '');
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [copied, setCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !assignment) return null;

  const tsvData = formatGoogleSheetData(assignment, students, submissions);

  const handleCopyTSV = () => {
    navigator.clipboard.writeText(tsvData);
    setCopied(true);
    onShowToast('📊 구글 시트용 데이터가 복사되었습니다! 열려있는 구글 시트 A1 셀에서 Ctrl+V 하세요.');
    setTimeout(() => setCopied(false), 3000);
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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      spreadsheetUrl: spreadsheetUrl.trim(),
      webhookUrl: webhookUrl.trim(),
      lastExportedAt: new Date().toISOString(),
    });
    onShowToast('🔗 구글 시트 설정이 안전하게 저장되었습니다.');
  };

  // Google Apps Script template code
  const appsScriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.clear();
  sheet.appendRow(['번호', '이름', '모둠', data.assignmentTitle + ' (제출상태)', '제출일시', '비고']);
  data.rows.forEach(function(row) {
    sheet.appendRow(row);
  });
  return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setScriptCopied(true);
    onShowToast('📋 Apps Script 코드가 복사되었습니다.');
    setTimeout(() => setScriptCopied(false), 3000);
  };

  // Direct automated webhook post
  const handleSendToWebhook = async () => {
    if (!webhookUrl) {
      onShowToast('⚠️ 구글 Apps Script 웹훅 URL을 먼저 입력해 주세요.');
      return;
    }

    setIsSending(true);
    try {
      const rows = students.map(st => {
        const sub = submissions[st.id] || { status: 'pending' };
        const statusKorean = 
          sub.status === 'submitted' ? '제출 완료 (O)' :
          sub.status === 'pending' ? '미제출 (X)' :
          sub.status === 'resubmit' ? '보완요청 (△)' : '면제 (-)';

        return [
          st.number,
          st.name,
          st.groupNumber ? `${st.groupNumber}모둠` : '-',
          statusKorean,
          sub.status === 'submitted' ? (assignment.dueDate || new Date().toLocaleDateString()) : '-',
          sub.note || st.note || ''
        ];
      });

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentTitle: assignment.title,
          rows,
        })
      });

      onShowToast('🚀 구글 시트로 데이터가 전송되었습니다! 구글 시트 새로고침을 확인하세요.');
    } catch (e) {
      console.error(e);
      onShowToast('⚠️ 전송 중 오류가 발생했습니다. URL을 확인해 주세요.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2 text-[#3D3A35]">
            <FileSpreadsheet className="w-5 h-5 text-[#2D6A4F]" />
            <h3 className="font-bold text-base">구글 시트(Google Sheets) 데이터 전송 가이드</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5D574F] hover:bg-[#DCD5C8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#DCD5C8] bg-white px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('copy')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'copy'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-[#A89F91] hover:text-[#5D574F]'
            }`}
          >
            방법 ① 3초 복사 & 붙여넣기 (가장 추천)
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'webhook'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-[#A89F91] hover:text-[#5D574F]'
            }`}
          >
            방법 ② Apps Script 자동 전송 웹훅
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {activeTab === 'copy' ? (
            <div className="space-y-4">
              <div className="bg-[#EBF5EE] border border-[#2D6A4F]/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-[#2D6A4F] font-bold text-xs">
                  <HelpCircle className="w-4 h-4" />
                  <span>구글 시트에 데이터를 채우는 가장 쉬운 방법</span>
                </div>
                <ol className="text-xs text-[#2D6A4F] space-y-2 list-decimal list-inside leading-relaxed">
                  <li>아래 <strong>[구글 시트용 표 전체 복사]</strong> 버튼을 누릅니다.</li>
                  <li>선생님의 구글 시트(학생 체크 DB) 화면으로 이동하여 <strong>A1 셀</strong>을 클릭합니다.</li>
                  <li>키보드에서 <strong>Ctrl + V</strong> (맥은 Cmd+V)를 누르면 전체 표가 즉시 완성됩니다!</li>
                </ol>
                
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCopyTSV}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2D6A4F] text-white hover:bg-[#23533E] rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? '✅ 복사 완료! 구글 시트 A1 셀에서 Ctrl+V 하세요' : '📋 구글 시트용 표 전체 복사 (Ctrl+C)'}</span>
                  </button>

                  <button
                    onClick={handleDownloadCSV}
                    className="px-3 py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs font-semibold text-[#5D574F] flex items-center gap-1"
                    title="CSV 다운로드"
                  >
                    <Download className="w-4 h-4" />
                    <span>CSV 파일</span>
                  </button>
                </div>
              </div>

              {/* Connected Sheet URL Setting */}
              <form onSubmit={handleSaveSettings} className="space-y-2 p-4 bg-white border border-[#DCD5C8] rounded-2xl">
                <label className="text-xs font-bold text-[#3D3A35] block">
                  선생님의 구글 시트 URL 링크 저장 (바로가기용)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/141EEX..."
                    className="flex-1 px-3 py-2 bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#2D6A4F]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2D6A4F] text-white hover:bg-[#23533E] rounded-xl text-xs font-bold shrink-0"
                  >
                    저장
                  </button>
                </div>

                {spreadsheetUrl && (
                  <div className="pt-2 flex justify-end">
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#2D6A4F] font-bold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>연결된 구글 시트 새 탭에서 열기</span>
                    </a>
                  </div>
                )}
              </form>

              {/* Data Preview */}
              <div>
                <label className="text-[11px] font-bold text-[#A89F91] uppercase tracking-wider block mb-1">
                  복사될 표 데이터 미리보기 (앞 4행)
                </label>
                <pre className="p-3 bg-white border border-[#DCD5C8] rounded-xl text-[11px] font-mono text-[#5D574F] max-h-28 overflow-y-auto">
                  {tsvData.split('\n').slice(0, 5).join('\n') + '\n...'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-[#DCD5C8] rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-[#3D3A35] flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-[#BC6C25]" />
                  <span>Google Apps Script 웹훅 연동 (자동 전송)</span>
                </h4>
                <p className="text-xs text-[#5D574F] leading-relaxed">
                  구글 시트 상단 메뉴 <strong>[확장 프로그램] → [Apps Script]</strong>에 아래 코드를 넣고 <strong>[배포] → [새 배포 (웹 앱, 모든 사용자 허용)]</strong>로 배포한 뒤 웹앱 URL을 입력하시면 원클릭 자동 전송이 가능합니다.
                </p>

                <div className="relative">
                  <pre className="p-3 bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-[10px] font-mono text-[#3D3A35] overflow-x-auto max-h-32">
                    {appsScriptCode}
                  </pre>
                  <button
                    onClick={handleCopyAppsScript}
                    className="absolute top-2 right-2 px-2 py-1 bg-white hover:bg-[#EAE5D8] border border-[#DCD5C8] rounded-lg text-[10px] font-bold text-[#3D3A35] flex items-center gap-1"
                  >
                    {scriptCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    <span>{scriptCopied ? '복사됨' : '코드 복사'}</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#DCD5C8]">
                  <label className="text-xs font-bold text-[#3D3A35] block">
                    배포된 Google Apps Script 웹앱 URL
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#DCD5C8] rounded-xl text-xs text-[#3D3A35] focus:outline-[#2D6A4F]"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveSettings}
                      className="px-3 py-2 bg-white border border-[#DCD5C8] hover:bg-[#F2EDE4] rounded-xl text-xs font-bold text-[#5D574F]"
                    >
                      URL 저장
                    </button>
                    <button
                      onClick={handleSendToWebhook}
                      disabled={isSending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2D6A4F] text-white hover:bg-[#23533E] rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSending ? '구글 시트로 전송 중...' : '🚀 지금 구글 시트로 즉시 전송하기'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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

