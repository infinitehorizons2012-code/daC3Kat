import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function DailyReviewWizard({ onExit }) {
  const [step, setStep] = useState(1);
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

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else onExit(); // Done
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
    else onExit();
  };

  // Step logic
  let stepContent = null;
  let stepTitle = "";
  let stepDesc = "";
  let icon = "";

  if (step === 1) {
    stepTitle = "Dọn sạch Inbox & Nháp (In-tray Zero)";
    stepDesc = "Chuyển các ý tưởng thả nổi thành Hành động cụ thể hoặc cất đi.";
    icon = "fa-inbox text-emerald-500";
    
    const inbox = actions.filter(a => a.storage_system === 'Floating_Backlog' && a.status !== 'Done' && a.status !== 'Cancelled');
    
    stepContent = (
      <div className="space-y-3">
        {inbox.length === 0 ? <p className="text-center text-slate-400 py-10">Inbox đã sạch sẽ! ✨</p> : null}
        {inbox.map(a => (
          <div key={a.action_id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex items-center justify-between">
            <span className="font-bold text-slate-700">{a.name}</span>
            <div className="flex gap-2">
              <button onClick={() => updateAction(a.action_id, {storage_system: 'Next_Actions'})} className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-bold text-xs">Runway</button>
              <button onClick={() => updateAction(a.action_id, {status: 'Cancelled'})} className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-bold text-xs">Xóa</button>
            </div>
          </div>
        ))}
      </div>
    );
  } 
  else if (step === 2) {
    stepTitle = "Cập nhật Runway (Thực thi)";
    stepDesc = "Đánh dấu Done, Cancel hoặc Đẩy về Backlog các việc hôm nay.";
    icon = "fa-plane-departure text-blue-500";
    
    const runway = actions.filter(a => a.storage_system === 'Next_Actions' && a.status !== 'Done' && a.status !== 'Cancelled');
    
    stepContent = (
      <div className="space-y-3">
        {runway.length === 0 ? <p className="text-center text-slate-400 py-10">Runway trống! ✨</p> : null}
        {runway.map(a => (
          <div key={a.action_id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex items-center justify-between">
            <span className="font-bold text-slate-700 flex-1">{a.name}</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => updateAction(a.action_id, {status: 'Done'})} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded font-bold text-xs">Xong</button>
              <button onClick={() => updateAction(a.action_id, {storage_system: 'Project_Backlog'})} className="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded font-bold text-xs">Về Backlog</button>
            </div>
          </div>
        ))}
      </div>
    );
  }
  else if (step === 3) {
    stepTitle = "Đánh giá Việc Đột Xuất (Unplanned Work)";
    stepDesc = "Đo lường mức độ xao nhãng của ngày hôm nay.";
    icon = "fa-bolt text-orange-500";
    
    // Simplification: show unplanned work that is not done/cancelled
    const unplanned = actions.filter(a => a.work_type === 'Unplanned Work' && a.status !== 'Done' && a.status !== 'Cancelled');
    
    stepContent = (
      <div className="space-y-3">
        {unplanned.length === 0 ? <p className="text-center text-slate-400 py-10">Hôm nay không bị xao nhãng! 🎉</p> : null}
        {unplanned.map(a => (
          <div key={a.action_id} className="p-4 border border-orange-200 rounded-xl bg-orange-50 flex items-center justify-between">
            <span className="font-bold text-slate-700">{a.name}</span>
            <button onClick={() => updateAction(a.action_id, {status: 'Done'})} className="px-3 py-1.5 bg-orange-200 text-orange-700 hover:bg-orange-300 rounded font-bold text-xs">Xong</button>
          </div>
        ))}
      </div>
    );
  }
  else if (step === 4) {
    stepTitle = "Kiểm tra Lịch & Bối Cảnh";
    stepDesc = "Xem trước các lịch hẹn cứng và bối cảnh (Context) của ngày mai.";
    icon = "fa-calendar-day text-purple-500";
    
    const cal = actions.filter(a => a.storage_system === 'Calendar' && a.status !== 'Done' && a.status !== 'Cancelled');
    
    stepContent = (
      <div className="space-y-3">
        {cal.length === 0 ? <p className="text-center text-slate-400 py-10">Ngày mai không có lịch hẹn cứng! ✨</p> : null}
        {cal.map(a => (
          <div key={a.action_id} className="p-4 border border-purple-200 rounded-xl bg-purple-50 flex flex-col">
            <span className="font-bold text-slate-700">{a.name}</span>
            {a.scheduled_datetime && <span className="text-xs text-purple-600 font-bold mt-1">{new Date(a.scheduled_datetime).toLocaleString('vi-VN')}</span>}
          </div>
        ))}
      </div>
    );
  }
  else if (step === 5) {
    stepTitle = "Chốt 3 Big Rocks Cho Ngày Mai";
    stepDesc = "Đánh dấu 3 việc quan trọng nhất ở Runway để làm ngay sáng mai.";
    icon = "fa-star text-amber-400";
    
    const runway = actions.filter(a => a.storage_system === 'Next_Actions' && a.status !== 'Done' && a.status !== 'Cancelled');
    const bigRocksCount = runway.filter(a => a.is_big_rock).length;

    stepContent = (
      <div className="space-y-3">
        <div className="bg-amber-50 text-amber-700 p-3 rounded-lg font-bold text-sm mb-4 border border-amber-200 flex justify-between items-center">
          <span>Đã chọn:</span>
          <span className="text-lg bg-white px-3 py-1 rounded-md">{bigRocksCount} / 3</span>
        </div>
        {runway.map(a => (
          <div key={a.action_id} className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${a.is_big_rock ? 'bg-amber-100 border-amber-300 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-200'}`} onClick={() => updateAction(a.action_id, {is_big_rock: !a.is_big_rock})}>
            <span className={`font-bold ${a.is_big_rock ? 'text-amber-800' : 'text-slate-700'}`}>{a.name}</span>
            <i className={`fa-solid fa-star text-xl ${a.is_big_rock ? 'text-amber-500' : 'text-slate-200'}`}></i>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in relative max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={handlePrev} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="flex-1 flex justify-between items-center glass-panel rounded-2xl p-2 px-6">
          <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Daily Review</div>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(s => (
              <div key={s} className={`w-8 h-2 rounded-full transition-all ${s === step ? 'bg-emerald-500' : s < step ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl shadow-sm flex flex-col flex-1">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100">
            <i className={`fa-solid ${icon} text-3xl`}></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">{stepTitle}</h2>
            <p className="text-sm text-slate-500 font-medium">{stepDesc}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-8 min-h-[300px]">
          {stepContent}
        </div>

        <div className="mt-auto border-t border-slate-100 pt-6">
          <button onClick={handleNext} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-3">
            {step === 5 ? 'Hoàn tất Daily Review' : 'Tiếp tục'} <i className={`fa-solid ${step === 5 ? 'fa-check-circle' : 'fa-arrow-right'}`}></i>
          </button>
        </div>
      </div>
    </div>
  );
}
