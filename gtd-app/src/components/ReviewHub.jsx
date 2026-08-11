
import React, { useState } from 'react';
import DailyReviewWizard from './DailyReviewWizard';
import WeeklyReviewWizard from './WeeklyReviewWizard';

export default function ReviewHub() {
  const [mode, setMode] = useState('hub'); // 'hub', 'daily', 'weekly'

  if (mode === 'daily') return <DailyReviewWizard onExit={() => setMode('hub')} />;
  if (mode === 'weekly') return <WeeklyReviewWizard onExit={() => setMode('hub')} />;

  return (
    <div className="flex flex-col gap-6 min-h-[500px] animate-fade-in">
      <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden h-[70vh]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
        
        <i className="fa-solid fa-satellite-dish text-6xl text-slate-300 mb-6 drop-shadow-sm"></i>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Trạm Kiểm Duyệt <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Reviews</span></h2>
        <p className="text-lg text-slate-500 mt-3 font-medium max-w-xl">Trái tim giữ cho hệ thống 168h luôn sống động và cập nhật. Hãy chọn quy trình rà soát phù hợp với thời điểm hiện tại.</p>
        
        <div className="flex flex-col md:flex-row gap-6 mt-12 w-full max-w-2xl z-10">
          
          <div 
            onClick={() => setMode('daily')}
            className="flex-1 bg-white/60 hover:bg-white p-6 rounded-3xl border-2 border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <i className="fa-solid fa-sun text-2xl text-emerald-600"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Daily Review</h3>
            <p className="text-sm text-slate-500 font-medium mb-4">Dọn dẹp ngày cũ & Khóa 3 Big Rocks cho ngày mai (5 bước).</p>
            <div className="mt-auto bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">10 Phút</div>
          </div>

          <div 
            onClick={() => setMode('weekly')}
            className="flex-1 bg-white/60 hover:bg-white p-6 rounded-3xl border-2 border-indigo-100 hover:border-indigo-300 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
              <i className="fa-solid fa-calendar-week text-2xl text-indigo-600"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Weekly Review</h3>
            <p className="text-sm text-slate-500 font-medium mb-4">Rà soát toàn diện dự án & Lên kế hoạch dung lượng 168h (6 bước).</p>
            <div className="mt-auto bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">45-60 Phút</div>
          </div>

        </div>
      </div>
    </div>
  );
}
