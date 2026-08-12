import React, { useState, useEffect } from 'react';
import DailyReviewWizard from './DailyReviewWizard';
import WeeklyReviewWizard from './WeeklyReviewWizard';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function ReviewHub() {
  const [mode, setMode] = useState('hub'); // 'hub', 'daily', 'weekly'
  const [data, setData] = useState({ actions: [], capacities: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [actRes, capRes] = await Promise.all([
        fetch(`${API_URL}/actions`),
        fetch(`${API_URL}/weekly-capacities`)
      ]);
      const actData = await actRes.json();
      const capData = await capRes.json();
      setData({ actions: actData, capacities: capData });
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu ReviewHub:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'hub') {
      fetchData();
    }
  }, [mode]);

  const toggleActionStatus = async (action) => {
    const newStatus = action.status === 'Done' ? 'Pending' : 'Done';
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData(); // reload
    } catch (e) {
      console.error(e);
    }
  };

  if (mode === 'daily') return <DailyReviewWizard onExit={() => setMode('hub')} />;
  if (mode === 'weekly') return <WeeklyReviewWizard onExit={() => setMode('hub')} />;

  if (loading) {
    return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;
  }

  // Calculate stats
  const inboxCount = data.actions.filter(a => a.storage_system === 'Inbox' && a.status !== 'Done').length;
  const runwayCount = data.actions.filter(a => a.storage_system === 'Next_Actions' && a.status !== 'Done').length;
  const waitingCount = data.actions.filter(a => a.storage_system === 'Waiting_For' && a.status !== 'Done').length;
  
  const bigRocks = data.actions.filter(a => a.is_big_rock === 1 && a.status !== 'Done');
  const completedBigRocks = data.actions.filter(a => a.is_big_rock === 1 && a.status === 'Done');

  return (
    <div className="flex flex-col gap-6 min-h-[500px] animate-fade-in">
      
      {/* 1. KẾT QUẢ REVIEW (DASHBOARD) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cột trái: Big Rocks */}
        <div className="flex-1 glass-panel p-6 rounded-3xl shadow-sm border border-emerald-100">
          <div className="flex justify-between items-center mb-6 border-b border-emerald-100 pb-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight"><i className="fa-solid fa-gem text-emerald-500 mr-2"></i> Big Rocks (Việc Trọng Tâm)</h2>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">{bigRocks.length} đang chờ</span>
          </div>
          
          <div className="space-y-3">
            {bigRocks.length === 0 && completedBigRocks.length === 0 && (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">Chưa có Big Rock nào được chọn.<br/>Hãy thực hiện Daily Review để chọn nhé!</p>
              </div>
            )}
            
            {bigRocks.map(rock => (
              <div key={rock.action_id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-4 hover:border-emerald-300 transition-colors shadow-sm">
                <button onClick={() => toggleActionStatus(rock)} className="mt-1 w-6 h-6 rounded border-2 border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 flex items-center justify-center transition-colors">
                  <i className="fa-solid fa-check text-xs"></i>
                </button>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{rock.name}</h4>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{rock.storage_system.replace('_', ' ')} • {rock.time_needed_mins || 30} phút</p>
                </div>
              </div>
            ))}

            {completedBigRocks.length > 0 && (
              <div className="pt-4 mt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Đã Hoàn Thành Gần Đây</h4>
                {completedBigRocks.slice(0, 3).map(rock => (
                  <div key={rock.action_id} className="p-3 mb-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 opacity-60">
                    <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center"><i className="fa-solid fa-check text-[10px]"></i></div>
                    <span className="font-bold text-slate-500 line-through text-sm">{rock.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: System Health */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="glass-panel p-6 rounded-3xl shadow-sm border border-blue-100 flex-1">
            <h3 className="text-lg font-black text-slate-800 mb-4 border-b border-blue-100 pb-2"><i className="fa-solid fa-heart-pulse text-blue-500 mr-2"></i> Sức khỏe Hệ thống</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="font-bold text-gray-700"><i className="fa-solid fa-inbox mr-2"></i> Inbox (Chờ xử lý)</span>
                <span className={`font-black text-lg ${inboxCount > 5 ? 'text-red-500' : 'text-gray-800'}`}>{inboxCount}</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-700"><i className="fa-solid fa-plane-departure mr-2"></i> Runway (Tuần này)</span>
                <span className="font-black text-lg text-blue-800">{runwayCount}</span>
              </div>
              <div className="flex justify-between items-center bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-700"><i className="fa-solid fa-hourglass-half mr-2"></i> Đang chờ phản hồi</span>
                <span className="font-black text-lg text-amber-800">{waitingCount}</span>
              </div>
            </div>
            {inboxCount > 10 && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
                <i className="fa-solid fa-triangle-exclamation mr-1"></i> Quá nhiều ý tưởng tồn đọng trong Inbox. Bạn cần làm Daily Review để dọn dẹp ngay!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. CÁC NÚT KÍCH HOẠT QUY TRÌNH REVIEW */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <h3 className="text-xl font-black text-slate-800 mb-6 text-center tracking-tight"><i className="fa-solid fa-satellite-dish text-indigo-500 mr-2"></i> Kích Hoạt Quy Trình Rà Soát (Reviews)</h3>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl mx-auto">
          
          <div 
            onClick={() => setMode('daily')}
            className="flex-1 bg-white hover:bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-400 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 group flex items-center text-left gap-5"
          >
            <div className="w-16 h-16 shrink-0 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <i className="fa-solid fa-sun text-2xl text-emerald-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Daily Review</h3>
              <p className="text-xs text-slate-500 font-medium mb-2">Dọn dẹp ngày cũ & Chọn 3 Big Rocks cho ngày mai.</p>
              <div className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">10 Phút</div>
            </div>
          </div>

          <div 
            onClick={() => setMode('weekly')}
            className="flex-1 bg-white hover:bg-indigo-50 p-5 rounded-2xl border-2 border-indigo-100 hover:border-indigo-400 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 group flex items-center text-left gap-5"
          >
            <div className="w-16 h-16 shrink-0 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform">
              <i className="fa-solid fa-calendar-week text-2xl text-indigo-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Weekly Review</h3>
              <p className="text-xs text-slate-500 font-medium mb-2">Rà soát dự án, cập nhật tầm nhìn & Dung lượng tuần.</p>
              <div className="inline-block bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">45-60 Phút</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
