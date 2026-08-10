import React from 'react';

export default function Horizons() {
  return (
    <div className="glass-panel p-8 rounded-2xl min-h-[500px]">
      <h2 className="text-2xl font-bold text-emerald-700 mb-4"><i className="fa-solid fa-tree"></i> Cây Mục tiêu (Horizons)</h2>
      <p className="text-slate-600 mb-6">Màn hình này sẽ hiển thị sự phân cấp: Sứ mệnh (50k) {'>'} Tầm nhìn (40k) {'>'} Mục tiêu (30k).</p>
      
      <div className="flex flex-col gap-4 pl-4 border-l-2 border-emerald-300">
        <div className="relative">
          <div className="absolute w-4 h-0.5 bg-emerald-300 top-4 -left-4"></div>
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 block">50,000 ft - Sứ mệnh</span>
            <h3 className="font-medium text-slate-800">Trở thành một chuyên gia xuất sắc...</h3>
          </div>
          
          <div className="flex flex-col gap-4 pl-8 mt-4 border-l-2 border-emerald-200">
            <div className="relative">
              <div className="absolute w-4 h-0.5 bg-emerald-200 top-4 -left-4"></div>
              <div className="bg-white/60 border border-slate-200 p-4 rounded-xl shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">40,000 ft - Tầm nhìn 3-5 năm</span>
                <h3 className="font-medium text-slate-800">Hoàn thành chương trình Đại học với điểm xuất sắc</h3>
              </div>
              
              <div className="flex flex-col gap-4 pl-8 mt-4 border-l-2 border-slate-200">
                <div className="relative">
                  <div className="absolute w-4 h-0.5 bg-slate-200 top-4 -left-4"></div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 block">30,000 ft - Mục tiêu (Active)</span>
                      <h3 className="font-medium text-slate-800">Đạt IELTS 8.0 trong năm nay</h3>
                    </div>
                    <button className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full font-medium text-slate-600 transition-colors">
                      Đóng băng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
