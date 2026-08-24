import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
      <div className="bg-[#3D3A35] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#5D574F] flex items-center gap-2.5 text-xs font-medium max-w-md">
        <span>{message}</span>
      </div>
    </div>
  );
};
