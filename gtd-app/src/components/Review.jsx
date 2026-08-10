import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function Review() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-8 rounded-2xl min-h-[500px] flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-[500px]">
      <div className="glass-panel p-6 rounded-2xl flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-600"><i className="fa-solid fa-chart-pie mr-2"></i> Review Cuối Tuần</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tỷ lệ Đột Xuất */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
          <h3 className="font-bold text-slate-700 text-lg">Tỷ lệ Việc Đột Xuất</h3>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle 
                cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="10" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (251.2 * (stats.unplannedRatio / 100))}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-orange-600">{stats.unplannedRatio}%</span>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            {stats.unplanned} / {stats.total} việc là đột xuất. <br/>
            {stats.unplannedRatio > 30 ? "⚠️ Cảnh báo: Tỷ lệ chữa cháy đang quá cao!" : "✅ Tốt: Bạn đang kiểm soát lịch trình tốt."}
          </p>
        </div>

        {/* Tỷ lệ Hoàn Thành */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
          <h3 className="font-bold text-slate-700 text-lg">Tỷ lệ Hoàn Thành</h3>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle 
                cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="10" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (251.2 * (stats.completedRatio / 100))}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-emerald-500">{stats.completedRatio}%</span>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            {stats.completed} / {stats.total} việc đã xong.
          </p>
        </div>

      </div>
    </div>
  );
}
