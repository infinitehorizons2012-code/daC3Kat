import React, { useState } from 'react';
import FocusMode from './components/FocusMode';
import Kanban from './components/Kanban';
import Horizons from './components/Horizons';

function App() {
  const [activeTab, setActiveTab] = useState('focus');

  return (
    <div className="min-h-screen p-4 flex justify-center">
      <div className="w-full max-w-[1200px] flex flex-col gap-6">
        
        {/* Header / Logo */}
        <div className="flex justify-center my-4">
          <div className="relative cursor-pointer transition-transform hover:scale-110 active:scale-95 duration-200">
            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md animate-pulse"></div>
            <div className="relative text-white font-black text-3xl tracking-wider px-5 py-2 glass-panel rounded-full border border-white/40 shadow-[0_4px_15px_rgba(59,130,246,0.3)] bg-gradient-to-r from-blue-600 to-indigo-600">
              168
            </div>
          </div>
        </div>

        {/* Khu vực 1: Triết lý & Nhắc nhở */}
        <nav className="glass-panel rounded-[24px] p-2 flex flex-wrap justify-center gap-2 sticky top-4 z-50">
          <button className="px-4 py-2 rounded-[20px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-primary transition-all">
            <i className="fa-solid fa-book mr-2"></i> Lý thuyết
          </button>
          <button className="px-4 py-2 rounded-[20px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-primary transition-all">
            <i className="fa-solid fa-graduation-cap mr-2"></i> Kat
          </button>
          <button className="px-4 py-2 rounded-[20px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-primary transition-all">
            <i className="fa-regular fa-gem mr-2"></i> Prinberk
          </button>
          <button className="px-4 py-2 rounded-[20px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-primary transition-all">
            <i className="fa-solid fa-rocket mr-2"></i> Dream
          </button>
        </nav>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {activeTab === 'focus' && <FocusMode />}
          {activeTab === 'kanban' && <Kanban />}
          {activeTab === 'horizons' && <Horizons />}
        </div>

        {/* Khu vực 2: GTD Dashboard */}
        <nav className="glass-panel rounded-[24px] p-2 flex flex-wrap justify-center gap-2">
          <button onClick={() => setActiveTab('focus')} className={`px-4 py-2 rounded-[20px] font-semibold transition-all ${activeTab === 'focus' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'}`}>
            <i className="fa-solid fa-plane-departure mr-2"></i> Runway / Next Actions
          </button>
          <button onClick={() => setActiveTab('kanban')} className={`px-4 py-2 rounded-[20px] font-semibold transition-all ${activeTab === 'kanban' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-purple-600'}`}>
            <i className="fa-solid fa-layer-group mr-2"></i> Kanban Dự án
          </button>
          <button onClick={() => setActiveTab('horizons')} className={`px-4 py-2 rounded-[20px] font-semibold transition-all ${activeTab === 'horizons' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-600'}`}>
            <i className="fa-solid fa-tree mr-2"></i> Cây Horizons
          </button>
        </nav>

      </div>
    </div>
  );
}

export default App;
