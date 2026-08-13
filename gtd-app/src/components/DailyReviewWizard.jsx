import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function DailyReviewWizard({ onExit }) {
  const [step, setStep] = useState(1); // Step 1 to 4
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newInboxItem, setNewInboxItem] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/actions`);
      const data = await res.json();
      setActions(Array.isArray(data) ? data : []);
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
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddInbox = async (e) => {
    e.preventDefault();
    if (!newInboxItem.trim()) return;

    try {
      await fetch(`${API_URL}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newInboxItem,
          storage_system: 'Inbox',
          status: 'Pending',
          category: 'Strategic',
          context: '@Máy_tính'
        })
      });
      setNewInboxItem('');
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;
  }

  const inboxActions = actions.filter(a => a.storage_system === 'Inbox' && a.status !== 'Done');
  const runwayActions = actions.filter(a => a.storage_system === 'Next_Actions' && a.status !== 'Done');
  const bigRocksCount = runwayActions.filter(a => a.is_big_rock).length;

  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const todayActions = actions.filter(a => (a.scheduled_datetime && a.scheduled_datetime.startsWith(todayKey)) || a.storage_system === 'Next_Actions');

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in relative max-w-4xl mx-auto w-full">
      
      {/* Header Wizard Controls Bar */}
      <div className="glass-panel p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-black uppercase tracking-widest mb-1">
            <i className="fa-solid fa-clipboard-check"></i> Quy Trình Step-by-Step (Daily Review)
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-sun text-amber-400"></i> Daily Review 4 Bước Rà Soát Ngày
          </h2>
        </div>

        <button 
          onClick={onExit}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700"
        >
          <i className="fa-solid fa-xmark mr-1"></i> Thoát Quy Trình
        </button>
      </div>

      {/* Step Progress Indicators */}
      <div className="grid grid-cols-4 gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-inner text-center">
        <div onClick={() => setStep(1)} className={`cursor-pointer p-2.5 rounded-xl transition-all border ${step === 1 ? 'bg-emerald-600 text-white border-emerald-400 font-black shadow-md' : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'}`}>
          <div className="text-[10px] font-black uppercase tracking-widest">Bước 1</div>
          <div className="text-xs truncate font-bold">📥 Dọn Inbox ({inboxActions.length})</div>
        </div>

        <div onClick={() => setStep(2)} className={`cursor-pointer p-2.5 rounded-xl transition-all border ${step === 2 ? 'bg-emerald-600 text-white border-emerald-400 font-black shadow-md' : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'}`}>
          <div className="text-[10px] font-black uppercase tracking-widest">Bước 2</div>
          <div className="text-xs truncate font-bold">📅 Rà Ngày Cũ</div>
        </div>

        <div onClick={() => setStep(3)} className={`cursor-pointer p-2.5 rounded-xl transition-all border ${step === 3 ? 'bg-emerald-600 text-white border-emerald-400 font-black shadow-md' : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'}`}>
          <div className="text-[10px] font-black uppercase tracking-widest">Bước 3</div>
          <div className="text-xs truncate font-bold">⭐ 3 Big Rocks</div>
        </div>

        <div onClick={() => setStep(4)} className={`cursor-pointer p-2.5 rounded-xl transition-all border ${step === 4 ? 'bg-emerald-600 text-white border-emerald-400 font-black shadow-md' : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'}`}>
          <div className="text-[10px] font-black uppercase tracking-widest">Bước 4</div>
          <div className="text-xs truncate font-bold">🚀 Hoàn Thành</div>
        </div>
      </div>

      {/* STEP CONTENT CONTAINER */}
      <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between flex-1 min-h-[380px]">
        
        {/* STEP 1: DỌN INBOX */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-inbox text-emerald-600"></i> Bước 1: Rà Soát & Thu Gom Inbox
                </h3>
                <p className="text-xs text-slate-500 font-medium">Nhập nhanh các ý tưởng tồn đọng để dọn sạch Inbox về 0 (Inbox Zero).</p>
              </div>
              <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                Còn {inboxActions.length} mục
              </span>
            </div>

            {/* Quick Add Inbox Form */}
            <form onSubmit={handleAddInbox} className="flex gap-2">
              <input 
                type="text" 
                value={newInboxItem}
                onChange={e => setNewInboxItem(e.target.value)}
                placeholder="Thu gom ý tưởng mới vào Inbox..." 
                className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
              />
              <button type="submit" className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm">
                + Thêm
              </button>
            </form>

            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {inboxActions.map(a => (
                <div key={a.action_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800">{a.name}</span>
                  <button 
                    onClick={() => updateAction(a.action_id, { storage_system: 'Next_Actions' })}
                    className="text-[10px] font-black bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-700 px-2.5 py-1 rounded-lg transition-all"
                  >
                    Chuyển sang Next Actions ⚡
                  </button>
                </div>
              ))}
              {inboxActions.length === 0 && (
                <div className="text-center py-8 text-emerald-600 font-bold text-xs bg-emerald-50/50 rounded-2xl border border-emerald-200">
                  🎉 Tuyệt vời! Inbox đã được dọn sạch về 0 (Inbox Zero)!
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: RÀ NGÀY CŨ */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b pb-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-calendar-check text-blue-600"></i> Bước 2: Rà Soát Ngày Cũ & Khóa Sổ Hôm Nay
              </h3>
              <p className="text-xs text-slate-500 font-medium">Tích xanh các việc đã làm xong hôm nay hoặc chuyển ngày cho các việc chưa hoàn thành.</p>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar">
              {todayActions.map(a => (
                <div key={a.action_id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${a.status === 'Done' ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateAction(a.action_id, { status: a.status === 'Done' ? 'Pending' : 'Done' })}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${a.status === 'Done' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-300 hover:border-emerald-500'}`}
                    >
                      {a.status === 'Done' && <i className="fa-solid fa-check text-xs"></i>}
                    </button>
                    <span className={`text-xs font-bold ${a.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{a.name}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{a.storage_system}</span>
                </div>
              ))}
              {todayActions.length === 0 && (
                <div className="text-center py-8 text-slate-400 font-medium text-xs">
                  Không có công việc tồn đọng cần khóa sổ hôm nay.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: CHỐT 3 BIG ROCKS */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-star text-amber-500"></i> Bước 3: Chốt 3 Big Rocks Cho Ngày Mai
                </h3>
                <p className="text-xs text-slate-500 font-medium">Đánh dấu 3 việc quan trọng nhất ở Runway để tập trung làm ngay sáng mai.</p>
              </div>
              <span className="text-xs font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300">
                Đã chọn: {bigRocksCount} / 3
              </span>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar">
              {runwayActions.map(a => (
                <div 
                  key={a.action_id} 
                  onClick={() => updateAction(a.action_id, { is_big_rock: !a.is_big_rock })}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${a.is_big_rock ? 'bg-amber-100 border-amber-400 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-300'}`}
                >
                  <span className={`text-xs font-bold ${a.is_big_rock ? 'text-amber-900' : 'text-slate-800'}`}>{a.name}</span>
                  <i className={`fa-solid fa-star text-lg ${a.is_big_rock ? 'text-amber-500' : 'text-slate-300'}`}></i>
                </div>
              ))}
              {runwayActions.length === 0 && (
                <div className="text-center py-8 text-slate-400 font-medium text-xs">
                  Không có công việc nào trong Runway (Next Actions) để chọn.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: HOÀN THÀNH */}
        {step === 4 && (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <i className="fa-solid fa-circle-check text-4xl"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-800">Hoàn Thành Quy Trình Daily Review!</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
              Hệ thống đã dọn sạch Inbox, khóa sổ ngày cũ & chốt xong 3 Big Rocks cho ngày mai. Bạn sẵn sàng bứt phá ngày mới!
            </p>
            <button 
              onClick={onExit}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
            >
              🚀 Quay Về Trạm Kiểm Duyệt
            </button>
          </div>
        )}

        {/* Wizard Footer Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
          <button 
            disabled={step === 1}
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${step === 1 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <i className="fa-solid fa-arrow-left mr-1"></i> Quay lại
          </button>

          {step < 4 ? (
            <button 
              onClick={() => setStep(prev => Math.min(4, prev + 1))}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Tiếp tục (Bước {step + 1})</span> <i className="fa-solid fa-arrow-right"></i>
            </button>
          ) : (
            <button 
              onClick={onExit}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md"
            >
              Hoàn thành
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
