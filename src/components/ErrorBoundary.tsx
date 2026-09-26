import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleClearAndReset = () => {
    try {
      localStorage.removeItem('class_tracker_students');
      localStorage.removeItem('class_tracker_assignments');
      localStorage.removeItem('class_tracker_submissions');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#FAF9F6] text-[#3D3A35] flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCD5C8] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-red-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-[#3D3A35]">
              화면을 불러오는 중 일시적인 오류가 발생했습니다
            </h2>

            <p className="text-xs text-[#7D7568] leading-relaxed">
              데이터는 안전하게 보관되어 있습니다. 아래 새로고침 버튼을 누르면 정상적으로 복구됩니다.
            </p>

            {this.state.error && (
              <div className="p-2.5 bg-gray-50 rounded-xl text-[11px] font-mono text-gray-500 overflow-x-auto text-left max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#23533E] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>페이지 새로고침</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold cursor-pointer active:scale-95"
              >
                <span>데이터 초기화 복원</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-100 text-[#5D574F] border border-[#DCD5C8] rounded-xl text-xs font-semibold cursor-pointer active:scale-95"
              >
                <Home className="w-3.5 h-3.5" />
                <span>다시 시도</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
