import React, { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('kat');

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
          <button onClick={() => setActiveTab('ly-thuyet')} className={`px-4 py-2 rounded-[20px] font-semibold transition-all ${activeTab === 'ly-thuyet' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-primary'}`}>
            <i className="fa-solid fa-book mr-2"></i> Lý thuyết
          </button>
          <button onClick={() => setActiveTab('kat')} className={`px-4 py-2 rounded-[20px] font-semibold transition-all ${activeTab === 'kat' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-primary'}`}>
            <i className="fa-solid fa-graduation-cap mr-2"></i> Kat
          </button>
          <button onClick={() => setActiveTab('prinberk')} className={`px-4 py-2 rounded-[20px] font-semibold transition-all ${activeTab === 'prinberk' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-primary'}`}>
            <i className="fa-regular fa-gem mr-2"></i> Prinberk
          </button>
          <button onClick={() => setActiveTab('dream')} className={`px-4 py-2 rounded-[20px] font-semibold transition-all ${activeTab === 'dream' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-primary'}`}>
            <i className="fa-solid fa-rocket mr-2"></i> Dream
          </button>
        </nav>

        {/* Content Area */}
        <div className="glass-panel rounded-[24px] p-8 min-h-[500px]">
          <h1 className="text-2xl font-bold text-center text-primary mb-4">
            Chào mừng đến với Trạm điều khiển 168 (React Version)
          </h1>
          <p className="text-center text-slate-600">
            Hệ thống đang được nâng cấp lên kiến trúc Serverless (React + Cloudflare D1).
          </p>
        </div>

        {/* Khu vực 2: GTD Dashboard (Sẽ phát triển sau) */}
        <nav className="glass-panel rounded-[24px] p-2 flex flex-wrap justify-center gap-2">
          <button className="px-4 py-2 rounded-[20px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-pink-600 transition-all">
            <i className="fa-solid fa-bolt mr-2"></i> Đột xuất
          </button>
          <button className="px-4 py-2 rounded-[20px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-all">
            <i className="fa-solid fa-plane-departure mr-2"></i> Runway / Next Actions
          </button>
          <button className="px-4 py-2 rounded-[20px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-purple-600 transition-all">
            <i className="fa-solid fa-layer-group mr-2"></i> Kanban Dự án
          </button>
        </nav>

      </div>
    </div>
  );
}

export default App;
