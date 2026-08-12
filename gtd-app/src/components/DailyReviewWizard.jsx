import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function DailyReviewWizard({ onExit }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/actions`);
      const data = await res.json();
      setActions(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateAction = async (id, payload) => {
    try {
      await fetch(`${API_URL}/actions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchData(); // reload
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-center py-20"><i className="fa-solid fa-spinner fa-spin text-3xl text-slate-300"></i></div>;
  }

  const runway = actions.filter(a => a.storage_system === 'Next_Actions' && a.status !== 'Done' && a.status !== 'Cancelled');
  const bigRocksCount = runway.filter(a => a.is_big_rock).length;

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in relative max-w-3xl mx-auto w-full">
      <div className="glass-panel p-8 rounded-3xl shadow-sm flex flex-col flex-1">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100">
            <i className="fa-solid fa-star text-3xl text-amber-400"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Chốt 3 Big Rocks Cho Ngày Mai</h2>
            <p className="text-sm text-slate-500 font-medium">Đánh dấu 3 việc quan trọng nhất ở Runway để làm ngay sáng mai.</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-8 min-h-[300px]">
          <div className="space-y-3">
            <div className="bg-amber-50 text-amber-700 p-3 rounded-lg font-bold text-sm mb-4 border border-amber-200 flex justify-between items-center">
              <span>Đã chọn:</span>
              <span className="text-lg bg-white px-3 py-1 rounded-md shadow-sm">{bigRocksCount} / 3</span>
            </div>
            {runway.map(a => (
              <div 
                key={a.action_id} 
                className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${a.is_big_rock ? 'bg-amber-100 border-amber-300 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-200'}`} 
                onClick={() => updateAction(a.action_id, {is_big_rock: !a.is_big_rock})}
              >
                <span className={`font-bold ${a.is_big_rock ? 'text-amber-800' : 'text-slate-700'}`}>{a.name}</span>
                <i className={`fa-solid fa-star text-xl ${a.is_big_rock ? 'text-amber-500' : 'text-slate-200 hover:text-amber-200'}`}></i>
              </div>
            ))}
            {runway.length === 0 && (
               <p className="text-center text-slate-400 py-10 font-medium">Không có việc nào trong Runway (Next Actions) để chọn.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
