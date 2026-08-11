import React, { useState, useEffect } from 'react';
import WeeklyReview from './WeeklyReview';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function WeeklyReviewWizard({ onExit }) {
  const [step, setStep] = useState(1);
  const [actions, setActions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [horizons, setHorizons] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // For quick adding actions to projects
  const [quickAction, setQuickAction] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actRes, prjRes, horRes] = await Promise.all([
        fetch(`${API_URL}/actions`),
        fetch(`${API_URL}/projects`),
        fetch(`${API_URL}/horizons`)
      ]);
      setActions(await actRes.json());
      setProjects(await prjRes.json());
      setHorizons(await horRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateAction = async (id, payload) => {
    try {
      await fetch(`${API_URL}/actions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleAddProjectAction = async (projectId) => {
    const name = quickAction[projectId];
    if (!name) return;
    try {
      await fetch(`${API_URL}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          project_id: projectId,
          storage_system: 'Next_Actions',
          work_type: 'Defined Work'
        })
      });
      setQuickAction({...quickAction, [projectId]: ''});
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-center py-20"><i className="fa-solid fa-spinner fa-spin text-3xl text-slate-300"></i></div>;

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
    else onExit();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
    else onExit();
  };

  // If step 6, just render the WeeklyReview component (Khóa 168h)
  if (step === 6) {
    return (
      <div className="animate-fade-in relative">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={handlePrev} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="flex-1 flex justify-between items-center glass-panel rounded-2xl p-2 px-6">
            <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Weekly Review - Bước 6: Khóa 168h</div>
            <div className="flex gap-2">
              {[1,2,3,4,5,6].map(s => (
                <div key={s} className={`w-6 h-2 rounded-full transition-all ${s === step ? 'bg-indigo-500' : s < step ? 'bg-indigo-200' : 'bg-slate-200'}`}></div>
              ))}
            </div>
          </div>
          <button onClick={onExit} className="px-6 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-sm transition-colors">Hoàn tất <i className="fa-solid fa-check ml-1"></i></button>
        </div>
        <WeeklyReview />
      </div>
    );
  }

  let stepContent = null;
  let stepTitle = "";
  let stepDesc = "";
  let icon = "";

  if (step === 1) {
    stepTitle = "Dọn sạch Inbox & Nháp (In-tray Zero)";
    stepDesc = "Phân loại mọi ý tưởng, ghi chú thả nổi sinh ra trong tuần qua.";
    icon = "fa-inbox text-indigo-500";
    const inbox = actions.filter(a => (a.storage_system === 'Inbox' || a.storage_system === 'Floating_Backlog') && a.status !== 'Done' && a.status !== 'Cancelled');
    stepContent = (
      <div className="space-y-3">
        {inbox.length === 0 ? <p className="text-center text-slate-400 py-10">Inbox đã sạch sẽ! ✨</p> : null}
        {inbox.map(a => (
          <div key={a.action_id} className="p-4 border border-slate-200 rounded-xl bg-white flex items-center justify-between">
            <span className="font-bold text-slate-700">{a.name}</span>
            <div className="flex gap-2">
              <button onClick={() => updateAction(a.action_id, {storage_system: 'Next_Actions'})} className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-bold">Runway</button>
              <button onClick={() => updateAction(a.action_id, {storage_system: 'Project_Backlog'})} className="px-3 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded text-xs font-bold">Backlog</button>
              <button onClick={() => updateAction(a.action_id, {status: 'Cancelled'})} className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-bold">Xóa</button>
            </div>
          </div>
        ))}
      </div>
    );
  } 
  else if (step === 2) {
    stepTitle = "Dọn dẹp Runway (Clear Next Actions)";
    stepDesc = "Đóng gói các việc tuần qua. Đã làm xong? Bỏ cuộc? Hay đẩy lại về Kho chờ?";
    icon = "fa-broom text-blue-500";
    const runway = actions.filter(a => a.storage_system === 'Next_Actions' && a.status !== 'Done' && a.status !== 'Cancelled');
    stepContent = (
      <div className="space-y-3">
        {runway.length === 0 ? <p className="text-center text-slate-400 py-10">Runway không còn việc tồn đọng! ✨</p> : null}
        {runway.map(a => (
          <div key={a.action_id} className="p-4 border border-slate-200 rounded-xl bg-white flex items-center justify-between">
            <span className="font-bold text-slate-700">{a.name}</span>
            <div className="flex gap-2">
              <button onClick={() => updateAction(a.action_id, {status: 'Done'})} className="px-3 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded text-xs font-bold">Xong</button>
              <button onClick={() => updateAction(a.action_id, {storage_system: 'Project_Backlog'})} className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-bold">Về Kho</button>
            </div>
          </div>
        ))}
      </div>
    );
  }
  else if (step === 3) {
    stepTitle = "Rà soát Waiting & Deferred";
    stepDesc = "Ai đang nợ bạn tiến độ? Có việc nào đã đến ngày kích hoạt chưa?";
    icon = "fa-hourglass-half text-purple-500";
    const wd = actions.filter(a => (a.storage_system === 'Waiting_For' || a.storage_system === 'Deferred') && a.status !== 'Done' && a.status !== 'Cancelled');
    stepContent = (
      <div className="space-y-3">
        {wd.length === 0 ? <p className="text-center text-slate-400 py-10">Không có việc nào đang chờ. ✨</p> : null}
        {wd.map(a => (
          <div key={a.action_id} className="p-4 border border-purple-200 rounded-xl bg-purple-50 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-700">{a.name}</span>
              <div className="text-[10px] uppercase font-black text-purple-600 mt-1">{a.storage_system === 'Waiting_For' ? 'Đang chờ người khác' : 'Đang hoãn lại'}</div>
            </div>
            <button onClick={() => updateAction(a.action_id, {storage_system: 'Next_Actions'})} className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-bold">Lôi ra làm</button>
          </div>
        ))}
      </div>
    );
  }
  else if (step === 4) {
    stepTitle = "Rà soát Dự án (10k ft)";
    stepDesc = "Dự án nào đang bị ĐÓNG BĂNG? Mọi dự án Active đều phải có ít nhất 1 Next Action!";
    icon = "fa-layer-group text-orange-500";
    const activeProjects = projects.filter(p => p.status === 'Active');
    const projectWithNextActions = activeProjects.map(p => {
      const pActions = actions.filter(a => a.project_id === p.project_id && a.storage_system === 'Next_Actions' && a.status !== 'Done' && a.status !== 'Cancelled');
      return { ...p, hasActions: pActions.length > 0 };
    });
    const frozenProjects = projectWithNextActions.filter(p => !p.hasActions);

    stepContent = (
      <div className="space-y-4">
        {frozenProjects.length === 0 ? <p className="text-center text-emerald-600 font-bold py-10">Tuyệt vời! 100% dự án đều có Next Action. 🎉</p> : (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i> Cảnh báo: Có {frozenProjects.length} dự án đang đóng băng (không có việc nào ở Runway)!
          </div>
        )}
        {projectWithNextActions.map(p => (
          <div key={p.project_id} className={`p-4 border rounded-xl ${p.hasActions ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-orange-300 shadow-sm'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`font-bold ${p.hasActions ? 'text-slate-500' : 'text-slate-800'}`}>{p.name}</span>
              {p.hasActions ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black uppercase">Đang chạy</span> : <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-black uppercase">Đóng băng</span>}
            </div>
            {!p.hasActions && (
              <div className="flex gap-2 mt-3">
                <input type="text" value={quickAction[p.project_id] || ''} onChange={e => setQuickAction({...quickAction, [p.project_id]: e.target.value})} placeholder="Nhập 1 Next Action để phá băng..." className="flex-1 border border-slate-200 rounded p-2 text-sm outline-none focus:border-orange-400" />
                <button onClick={() => handleAddProjectAction(p.project_id)} className="bg-orange-500 text-white px-3 rounded font-bold hover:bg-orange-600 transition-colors">Thêm</button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  else if (step === 5) {
    stepTitle = "Kiểm tra van kích hoạt Mục tiêu (30k, 40k, 50k)";
    stepDesc = "Nhìn lại Sứ mệnh và xem có Mục tiêu nào đang Pended muốn kích hoạt (Active) không?";
    icon = "fa-tree text-emerald-500";
    
    stepContent = (
      <div className="space-y-6">
        {horizons?.missions?.filter(m => m.status === 'Active').map(m => (
          <div key={m.mission_id} className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Sứ mệnh (50k)</div>
            <div className="font-bold">{m.statement}</div>
          </div>
        ))}
        
        <div>
          <h4 className="font-black text-slate-700 mb-3 text-sm uppercase tracking-widest"><i className="fa-solid fa-bullseye text-red-500 mr-2"></i> Mục tiêu đang ấp ủ (Pended)</h4>
          <div className="space-y-2">
            {horizons?.goals?.filter(g => g.status === 'Pended').length === 0 ? <p className="text-slate-400 text-sm">Không có mục tiêu nào đang Pended.</p> : null}
            {horizons?.goals?.filter(g => g.status === 'Pended').map(g => (
              <div key={g.goal_id} className="p-3 border border-slate-200 bg-slate-50 rounded-xl flex justify-between items-center">
                <span className="font-medium text-slate-600 text-sm">{g.statement}</span>
                <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-1 rounded font-black uppercase">Pended</span>
              </div>
            ))}
          </div>
        </div>
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
          <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Weekly Review</div>
          <div className="flex gap-2">
            {[1,2,3,4,5,6].map(s => (
              <div key={s} className={`w-6 h-2 rounded-full transition-all ${s === step ? 'bg-indigo-500' : s < step ? 'bg-indigo-200' : 'bg-slate-200'}`}></div>
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
          <button onClick={handleNext} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-3">
            Tiếp tục <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
