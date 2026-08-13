import React, { useState, useEffect } from 'react';
import Runway from './components/Runway';
import Kanban from './components/Kanban';
import Horizons from './components/Horizons';
import WeeklyReview from './components/WeeklyReview';
import ReviewHub from './components/ReviewHub';
import Areas from './components/Areas';
import DailyReviewWizard from './components/DailyReviewWizard';
import TimeManagement from './components/TimeManagement';
import Routine from './components/Routine';
import FocusEngine from './components/FocusEngine';
import FocusReportView from './components/FocusReportView';
import PCTrackerView from './components/PCTrackerView';
import WeeklyCalendarView from './components/WeeklyCalendarView';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

const tabs = {
  weekly_calendar: { label: 'Lịch Tuần Master', icon: 'fa-solid fa-calendar-week', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  focus: { label: 'Runway', icon: 'fa-solid fa-plane-departure', color: 'text-blue-600', bg: 'bg-blue-100' },
  pomodoro: { label: 'Focus Mode', icon: 'fa-solid fa-stopwatch', color: 'text-orange-600', bg: 'bg-orange-100' },
  focus_report: { label: 'Báo Cáo Pomodoro', icon: 'fa-solid fa-chart-pie', color: 'text-amber-600', bg: 'bg-amber-100' },
  pc_tracker: { label: 'Nhật Ký Máy Tính Bé', icon: 'fa-solid fa-desktop', color: 'text-teal-600', bg: 'bg-teal-100' },
  routine: { label: 'Routine', icon: 'fa-solid fa-arrows-spin', color: 'text-pink-600', bg: 'bg-pink-100' },
  time: { label: 'Time Matrix', icon: 'fa-solid fa-clock-rotate-left', color: 'text-amber-600', bg: 'bg-amber-100' },
  daily: { label: 'Daily Review', icon: 'fa-solid fa-sun', color: 'text-orange-600', bg: 'bg-orange-100' },
  weekly: { label: 'Weekly Planning', icon: 'fa-solid fa-calendar-week', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  reviews: { label: 'Trạm Kiểm Duyệt', icon: 'fa-solid fa-satellite-dish', color: 'text-slate-600', bg: 'bg-slate-100' },
  kanban: { label: 'Kanban Dự án', icon: 'fa-solid fa-layer-group', color: 'text-purple-600', bg: 'bg-purple-100' },
  areas: { label: 'Bánh xe cuộc đời', icon: 'fa-solid fa-map-location-dot', color: 'text-teal-600', bg: 'bg-teal-100' },
  horizons: { label: 'Cây Horizons', icon: 'fa-solid fa-tree', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center my-6">
          <i className="fa-solid fa-triangle-exclamation text-4xl text-rose-500 mb-3 animate-bounce"></i>
          <h3 className="text-lg font-black text-rose-800 mb-2">Đã xảy ra lỗi nạp dữ liệu trên phân hệ này</h3>
          <p className="text-xs text-rose-600 mb-4 max-w-md bg-white p-3 rounded-xl border border-rose-200 font-mono">
            {this.state.error?.toString()}
          </p>
          <button 
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-rotate"></i> Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('focus');
  const [isMenu1Open, setIsMenu1Open] = useState(false);
  const [isMenu2Open, setIsMenu2Open] = useState(false);

  // Stats & Cloudflare DB Connection status
  const [completedCount, setCompletedCount] = useState(0);
  const [dbConnected, setDbConnected] = useState(false);

  const checkConnectionAndStats = async () => {
    try {
      const res = await fetch(`${API_URL}/actions`);
      if (res.ok) {
        const actions = await res.json();
        setDbConnected(true);
        if (Array.isArray(actions)) {
          const doneCount = actions.filter(a => a.status === 'Done').length;
          setCompletedCount(doneCount);
        }
      } else {
        setDbConnected(false);
      }
    } catch (e) {
      console.error(e);
      setDbConnected(false);
    }
  };

  useEffect(() => {
    checkConnectionAndStats();
    const interval = setInterval(checkConnectionAndStats, 5000); // Check DB every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-4 flex justify-center">
      <div className="w-full max-w-[1200px] flex flex-col gap-6">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 z-[100] sticky top-4 glass-panel px-6 py-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/80 bg-white/40">
          
          {/* Left Controls (Dropdowns) */}
          <div className="flex flex-wrap gap-3 items-center justify-center w-full md:w-auto">
            
            {/* Dropdown 1: Triết lý */}
            <div className="relative group" onMouseEnter={() => setIsMenu1Open(true)} onMouseLeave={() => setIsMenu1Open(false)}>
              <button className="glass-panel bg-white/70 px-4 py-2 rounded-2xl font-black text-slate-600 flex items-center gap-2 hover:bg-white transition-all shadow-sm">
                <i className="fa-solid fa-book-open text-rose-500"></i> Triết lý <i className="fa-solid fa-chevron-down text-[10px] ml-1 opacity-50"></i>
              </button>
              
              <div className={`absolute top-full left-0 mt-2 w-48 glass-panel rounded-2xl p-2 transition-all flex flex-col gap-1 shadow-xl border border-white z-50 ${isMenu1Open ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                <button className="text-left px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors text-sm flex items-center">
                  <i className="fa-solid fa-book w-6 text-center opacity-70"></i> Lý thuyết
                </button>
                <button className="text-left px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm flex items-center">
                  <i className="fa-solid fa-graduation-cap w-6 text-center opacity-70"></i> Kat
                </button>
                <button className="text-left px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors text-sm flex items-center">
                  <i className="fa-regular fa-gem w-6 text-center opacity-70"></i> Prinberk
                </button>
                <button className="text-left px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-colors text-sm flex items-center">
                  <i className="fa-solid fa-rocket w-6 text-center opacity-70"></i> Dream
                </button>
              </div>
            </div>

            {/* KHOANH ĐỎ 1: NÚT LỊCH TUẦN MASTER WEEKLY */}
            <button 
              onClick={() => setActiveTab('weekly_calendar')}
              className={`glass-panel px-4 py-2 rounded-2xl font-black flex items-center gap-2 transition-all shadow-sm border hover:scale-105 ${activeTab === 'weekly_calendar' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 ring-2 ring-indigo-300 shadow-md' : 'bg-white/80 text-indigo-700 hover:bg-indigo-50 border-indigo-200'}`}
              title="Mở Lịch Tuần Master (7 Ngày từ Thứ 2 đến Chủ Nhật)"
            >
              <i className="fa-solid fa-calendar-week text-indigo-500"></i> Lịch Tuần
            </button>

            {/* Dropdown 2: Phân hệ GTD */}
            <div className="relative group" onMouseEnter={() => setIsMenu2Open(true)} onMouseLeave={() => setIsMenu2Open(false)}>
              <button className={`glass-panel bg-white/70 px-4 py-2 rounded-2xl font-black flex items-center gap-2 transition-all shadow-sm border border-white/60 hover:scale-105 ${tabs[activeTab].color} ${tabs[activeTab].bg}`}>
                <i className={tabs[activeTab].icon}></i> {tabs[activeTab].label} <i className="fa-solid fa-chevron-down text-[10px] ml-1 opacity-50"></i>
              </button>
              
              <div className={`absolute top-full left-0 mt-2 w-64 glass-panel rounded-2xl p-2 transition-all flex flex-col gap-1 shadow-xl border border-white/80 z-50 ${isMenu2Open ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                {Object.entries(tabs).map(([key, tab]) => (
                  <button 
                    key={key}
                    onClick={() => { setActiveTab(key); setIsMenu2Open(false); }} 
                    className={`text-left px-4 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center ${activeTab === key ? `${tab.bg} ${tab.color} shadow-sm border border-white` : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    <i className={`${tab.icon} w-6 text-center ${activeTab === key ? '' : 'opacity-70'}`}></i> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Portal Target cho Runway Tabs */}
            <div id="runway-dropdown-portal-target"></div>

          </div>

          {/* Right Header Badges: Star Badge & 168 DB Connection Circle */}
          <div className="flex items-center gap-3 flex-shrink-0 mt-2 md:mt-0">
            {/* Star Badge (Số sao tích lũy từ công việc đã hoàn thành) */}
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-3.5 py-1.5 rounded-full font-black text-sm shadow-md border border-amber-200 transition-all hover:scale-105" title="Số sao tích lũy từ công việc đã hoàn thành">
              <i className="fa-solid fa-star text-amber-100 text-base animate-pulse"></i>
              <span>{completedCount}</span>
            </div>

            {/* 168 Badge with Cloudflare D1 Connection Ring */}
            <div 
              className={`relative font-black text-2xl tracking-wider px-5 py-1 rounded-full flex items-center justify-center transition-all ${
                dbConnected 
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white ring-4 ring-emerald-400/90 shadow-[0_0_20px_rgba(52,211,153,0.6)]' 
                  : 'bg-slate-700 text-slate-300 border-2 border-slate-600'
              }`}
              title={dbConnected ? "🟢 Đã kết nối Cloudflare D1 Database (Có vòng tròn sáng)" : "⚪ Chưa kết nối Database (Không có vòng tròn)"}
            >
              168
            </div>
          </div>

        </div>

        {/* Content Area with Anti-Blank ErrorBoundary */}
        <div className="min-h-[500px]">
          <ErrorBoundary key={activeTab}>
            {activeTab === 'weekly_calendar' && <WeeklyCalendarView />}
            {activeTab === 'focus' && <Runway />}
            {activeTab === 'pomodoro' && <FocusEngine onOpenReport={() => setActiveTab('focus_report')} />}
            {activeTab === 'focus_report' && <FocusReportView />}
          {activeTab === 'pc_tracker' && <PCTrackerView />}
            {activeTab === 'routine' && <Routine />}
            {activeTab === 'time' && <TimeManagement />}
            {activeTab === 'areas' && <Areas />}
            {activeTab === 'kanban' && <Kanban />}
            {activeTab === 'horizons' && <Horizons />}
            {activeTab === 'reviews' && <ReviewHub />}
            {activeTab === 'daily' && <DailyReviewWizard onExit={() => setActiveTab('focus')} />}
            {activeTab === 'weekly' && <WeeklyReview />}
          </ErrorBoundary>
        </div>

      </div>
    </div>
  );
}

export default App;
