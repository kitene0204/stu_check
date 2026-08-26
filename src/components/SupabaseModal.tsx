import React, { useState } from 'react';
import { X, Database, Check, RefreshCw, KeyRound, Globe, Copy, Info, Sparkles } from 'lucide-react';
import { SupabaseConfig } from '../types';
import { getSupabaseClient } from '../services/storageService';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onSaveConfig: (cfg: SupabaseConfig) => void;
  onShowToast: (msg: string) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onShowToast,
}) => {
  const [url, setUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [isEnabled, setIsEnabled] = useState(config.isEnabled || false);
  const [testing, setTesting] = useState(false);
  const [showSql, setShowSql] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);

    const newConfig: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      isEnabled: Boolean(url.trim() && anonKey.trim()),
      lastSyncedAt: new Date().toISOString(),
    };

    if (newConfig.isEnabled) {
      try {
        const client = getSupabaseClient(newConfig);
        if (client) {
          onShowToast('⚡ Supabase 클라우드 실시간 동기화가 활성화되었습니다!');
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      onShowToast('💾 로컬 스토리지 모드로 저장되었습니다.');
    }

    setTesting(false);
    onSaveConfig(newConfig);
    onClose();
  };

  const sqlSchema = `-- 초등 학급 도우미 Supabase 완벽 연동 SQL 스크립트 (SQL Editor에 전체 복사 후 [Run] 클릭)

-- 1. 제출 현황 테이블 생성
CREATE TABLE IF NOT EXISTS public.class_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, assignment_id, student_id)
);

-- 2. 학생 명단 테이블 생성
CREATE TABLE IF NOT EXISTS public.class_students (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  student_id TEXT,
  number INT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT DEFAULT 'M',
  group_number INT DEFAULT 1,
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, id)
);

-- 3. 학급 메타데이터 및 전체 명단 백업 테이블 생성
CREATE TABLE IF NOT EXISTS public.class_metadata (
  class_id TEXT PRIMARY KEY,
  classroom_data JSONB,
  students JSONB,
  assignments JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 익명/공개(anon / authenticated) 모든 읽기, 쓰기, 수정 권한 허용
GRANT ALL ON TABLE public.class_submissions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.class_students TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.class_metadata TO anon, authenticated, service_role;

-- 5. Row Level Security 정책 해제 및 무조건 허용 정책 생성 (어떤 브라우저/스마트폰이든 즉시 동기화)
ALTER TABLE public.class_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_metadata DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public All submissions" ON public.class_submissions;
CREATE POLICY "Public All submissions" ON public.class_submissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public All students" ON public.class_students;
CREATE POLICY "Public All students" ON public.class_students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public All metadata" ON public.class_metadata;
CREATE POLICY "Public All metadata" ON public.class_metadata FOR ALL USING (true) WITH CHECK (true);

-- 6. 실시간(Realtime) 복제 활성화 (이미 추가되어 있어도 오류 방지)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_submissions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_students;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_metadata;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    onShowToast('📋 Supabase SQL 테이블 스크립트가 복사되었습니다.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#DCD5C8] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE5D8] border-b border-[#DCD5C8]">
          <div className="flex items-center gap-2 text-[#3D3A35]">
            <Database className="w-5 h-5 text-[#A3B18A]" />
            <h3 className="font-bold text-base">Supabase 클라우드 실시간 동기화</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5D574F] hover:bg-[#DCD5C8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {/* Status Explanation */}
          <div className="p-3.5 bg-[#F2EDE4]/70 border border-[#DCD5C8] rounded-xl text-xs text-[#5D574F] leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-[#3D3A35] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#A3B18A] animate-ping" />
              <span>교탁 PC & 스마트폰 & 태블릿 실시간 동시 연동</span>
            </div>
            Supabase 프로젝트 정보를 입력하면, 교실 어디서 스마트폰으로 체크하든 교탁 컴퓨터와 실시간으로 1초 만에 동기화됩니다. (비워두시면 브라우저 로컬 스토리지에 안전하게 자동 저장됩니다.)
          </div>

          <div>
            <label className="text-xs font-bold text-[#5D574F] flex items-center gap-1 mb-1">
              <Globe className="w-3.5 h-3.5 text-[#A89F91]" />
              <span>Supabase Project URL</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              className="w-full px-3.5 py-2.5 bg-white border border-[#DCD5C8] rounded-xl text-xs font-mono text-[#3D3A35] focus:outline-[#A3B18A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#5D574F] flex items-center gap-1 mb-1">
              <KeyRound className="w-3.5 h-3.5 text-[#A89F91]" />
              <span>Supabase anon Public API Key</span>
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#DCD5C8] rounded-xl text-xs font-mono text-[#3D3A35] focus:outline-[#A3B18A]"
            />
          </div>

          {/* SQL Helper Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="text-xs font-semibold text-[#A89F91] hover:text-[#3D3A35] flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showSql ? 'Supabase 테이블 SQL 닫기' : 'Supabase SQL 테이블 생성 쿼리 보기'}</span>
            </button>

            {showSql && (
              <div className="mt-2 p-3 bg-white border border-[#DCD5C8] rounded-xl text-[11px] font-mono text-[#5D574F] space-y-2">
                <div className="flex justify-between items-center text-[10px] text-[#A89F91]">
                  <span>Supabase SQL Editor에 실행하세요:</span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1 text-[#A3B18A] hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    SQL 복사
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap bg-[#FAF9F6] p-2 rounded border border-[#EEECE6]">
                  {sqlSchema}
                </pre>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex justify-end gap-2 border-t border-[#DCD5C8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-[#5D574F] hover:bg-[#EAE5D8] border border-[#DCD5C8] rounded-xl text-xs font-semibold"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={testing}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#A3B18A] text-white hover:bg-[#92A179] rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>설정 저장 및 동기화</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
