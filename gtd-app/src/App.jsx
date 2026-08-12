import React, { useState } from 'react';
import Runway from './components/Runway';
import Kanban from './components/Kanban';
import Horizons from './components/Horizons';
import WeeklyReview from './components/WeeklyReview';
import ReviewHub from './components/ReviewHub';
import Areas from './components/Areas';
import DailyReviewWizard from './components/DailyReviewWizard';

const tabs = {
  focus: { label: 'Runway / Next Actions', icon: 'fa-solid fa-plane-departure', color: 'text-blue-600', bg: 'bg-blue-100' },
  daily: { label: 'Daily Review', icon: 'fa-solid fa-sun', color: 'text-orange-600', bg: 'bg-orange-100' },
  weekly: { label: 'Weekly Planning', icon: 'fa-solid fa-calendar-week', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  reviews: { label: 'Trạm Kiểm Duyệt (Kết quả)', icon: 'fa-solid fa-satellite-dish', color: 'text-slate-600', bg: 'bg-slate-100' },
  kanban: { label: 'Kanban Dự án', icon: 'fa-solid fa-layer-group', color: 'text-purple-600', bg: 'bg-purple-100' },
  areas: { label: 'Khu vực (20,000 ft)', icon: 'fa-solid fa-map-location-dot', color: 'text-teal-600', bg: 'bg-teal-100' },
  horizons: { label: 'Cây Horizons', icon: 'fa-solid fa-tree', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

function App() {
  const [activeTab, setActiveTab] = useState('focus');
  const [isMenu1Open, setIsMenu1Open] = useState(false);
  const [isMenu2Open, setIsMenu2Open] = useState(false);

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

          {/* Right Logo */}
          <div className="relative cursor-pointer transition-transform hover:scale-110 hover:-rotate-3 active:scale-95 duration-200 flex-shrink-0 mt-2 md:mt-0">
            <div className="absolute -inset-2 bg-pink-400/40 rounded-full blur-md animate-pulse"></div>
            <div className="relative text-white font-black text-3xl tracking-wider px-6 py-2 glass-panel rounded-full border-4 border-white/80 shadow-[0_4px_15px_rgba(244,63,94,0.4)] bg-gradient-to-r from-rose-400 to-orange-400 flex items-center gap-2">
              <i className="fa-solid fa-star text-yellow-200 text-2xl animate-bounce"></i> 168
            </div>
          </div>

        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {activeTab === 'focus' && <Runway />}
          {activeTab === 'areas' && <Areas />}
          {activeTab === 'kanban' && <Kanban />}
          {activeTab === 'horizons' && <Horizons />}
          {activeTab === 'reviews' && <ReviewHub />}
          {activeTab === 'daily' && <DailyReviewWizard onExit={() => setActiveTab('focus')} />}
          {activeTab === 'weekly' && <WeeklyReview />}
        </div>

      </div>
    </div>
  );
}

export default App;
