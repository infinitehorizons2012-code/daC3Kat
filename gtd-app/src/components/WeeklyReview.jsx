import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

const getWeekString = (offsetWeeks = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${week.toString().padStart(2, '0')}`;
};

export default function WeeklyReview() {
  const [data, setData] = useState({ actions: [], projects: [], areas: [], goals: [], visions: [], missions: [] });
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [sourceTab, setSourceTab] = useState('projects'); // projects, floating, horizons
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [newActionName, setNewActionName] = useState('');
  const [weeklyCapacityHrs, setWeeklyCapacityHrs] = useState(40);

  const [capacities, setCapacities] = useState({});
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const currentWeek = getWeekString(0);

  const fetchData = async () => {
    try {
      const [actionsRes, horizonsRes, areasRes, capRes] = await Promise.all([
        fetch(`${API_URL}/actions`), 
        fetch(`${API_URL}/horizons`), 
        fetch(`${API_URL}/areas`), 
        fetch(`${API_URL}/weekly-capacities`)
      ]);
      const acData = await actionsRes.json();
      const hData = await horizonsRes.json();
      const arData = await areasRes.json();
      
      setData({ 
        actions: acData, 
        projects: hData.projects || [], 
        areas: arData,
        goals: hData.goals || [],
        visions: hData.visions || [],
        missions: hData.missions || []
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePullToWeek = async (action) => {
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_system: 'Next_Actions' })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handlePushBack = async (action) => {
    // Send back to Project Backlog or Floating based on whether it has a project
    const newSystem = action.project_id ? 'Project_Backlog' : 'Floating_Backlog';
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_system: newSystem })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleCreateAction = async (e) => {
    e.preventDefault();
    if (!newActionName.trim() || !selectedProject) return;
    
    const payload = {
      name: newActionName,
      area_id: selectedProject.area_id,
      project_id: selectedProject.project_id,
      storage_system: 'Project_Backlog', // Add to backlog by default during review
      category: 'Strategic',
      context: '@Máy_tính',
      time_needed_mins: 30,
      energy_level: 'Medium',
      work_type: 'Defined Work'
    };

    try {
      await fetch(`${API_URL}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setNewActionName('');
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;

  const activeProjects = data.projects.filter(p => p.status === 'Active');
  
  // Right Column calculations
  const weekActions = data.actions.filter(a => a.status !== 'Done' && ['Next_Actions', 'Calendar', 'Waiting_For'].includes(a.storage_system));
  const nextActions = weekActions.filter(a => a.storage_system === 'Next_Actions');
  const calActions = weekActions.filter(a => a.storage_system === 'Calendar');
  const waitActions = weekActions.filter(a => a.storage_system === 'Waiting_For');

  const calcMins = (a) => {
    if (a.storage_system === 'Calendar' && a.scheduled_datetime && a.scheduled_end_datetime) {
      const diffMs = new Date(a.scheduled_end_datetime) - new Date(a.scheduled_datetime);
      if (diffMs > 0) return Math.round(diffMs / 60000);
    }
    return a.time_needed_mins || 30; // default 30 mins
  };

  const nextMins = nextActions.reduce((s, a) => s + calcMins(a), 0);
  const calMins = calActions.reduce((s, a) => s + calcMins(a), 0);
  const waitMins = waitActions.reduce((s, a) => s + calcMins(a), 0);

  const occupiedMins = calMins + waitMins;
  const availableMins = Math.max((weeklyCapacityHrs * 60) - occupiedMins, 0);
  const isOverCapacity = nextMins > availableMins;

  // Filters for left column
  const floatingActions = data.actions.filter(a => a.storage_system === 'Floating_Backlog' && a.status !== 'Done');
  const horizonActions = data.actions.filter(a => (a.goal_id || a.vision_id || a.mission_id) && !a.project_id && a.status !== 'Done' && !['Next_Actions', 'Calendar', 'Waiting_For', 'Inbox'].includes(a.storage_system));

  return (
    <div className="flex flex-col gap-6 min-h-[500px]">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div>
          <h2 className="text-2xl font-black text-slate-800"><i className="fa-solid fa-scale-balanced text-indigo-600 mr-2"></i> Weekly Review (Lên Kế Hoạch)</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Lên kế hoạch tuần 168h bằng cách rút (Pull) việc từ các hệ thống.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
        {/* LEFT COLUMN: Sources */}
        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-200">
          <div className="flex bg-slate-50 border-b border-slate-200">
            <button onClick={() => setSourceTab('projects')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${sourceTab === 'projects' ? 'bg-white text-purple-600 border-t-2 border-t-purple-500 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
              <i className="fa-solid fa-layer-group mr-1"></i> Dự Án ({activeProjects.length})
            </button>
            <button onClick={() => setSourceTab('floating')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${sourceTab === 'floating' ? 'bg-white text-cyan-600 border-t-2 border-t-cyan-500 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
              <i className="fa-solid fa-parachute-box mr-1"></i> Thả Nổi ({floatingActions.length})
            </button>
            <button onClick={() => setSourceTab('horizons')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${sourceTab === 'horizons' ? 'bg-white text-emerald-600 border-t-2 border-t-emerald-500 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
              <i className="fa-solid fa-mountain-sun mr-1"></i> Mục Tiêu ({horizonActions.length})
            </button>
          </div>
          
          <div className="flex flex-1 overflow-hidden bg-white">
            {/* PROJECTS TAB */}
            {sourceTab === 'projects' && (
              <>
                <div className="w-1/3 border-r border-slate-100 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-50/30">
                  {activeProjects.map(p => (
                    <div 
                      key={p.project_id} 
                      onClick={() => setSelectedProject(p)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedProject?.project_id === p.project_id ? 'bg-white border-purple-300 shadow-sm' : 'border-transparent hover:bg-slate-100'}`}
                    >
                      <div className="text-xs font-bold text-slate-700 line-clamp-2">{p.name}</div>
                    </div>
                  ))}
                </div>
                <div className="w-2/3 p-4 overflow-y-auto custom-scrollbar">
                  {selectedProject ? (
                    <div>
                      <h4 className="font-black text-slate-800 mb-4">{selectedProject.name}</h4>
                      <form onSubmit={handleCreateAction} className="flex gap-2 mb-6">
                        <input 
                          type="text" 
                          value={newActionName}
                          onChange={e => setNewActionName(e.target.value)}
                          placeholder="Thêm việc cho dự án (vào Backlog)..." 
                          className="flex-1 p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-purple-400"
                        />
                        <button type="submit" className="bg-purple-100 text-purple-600 hover:bg-purple-200 px-3 rounded-lg font-bold transition-colors"><i className="fa-solid fa-plus"></i></button>
                      </form>
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Kho chờ Dự Án (Project Backlog)</h5>
                        {data.actions.filter(a => a.project_id === selectedProject.project_id && a.status !== 'Done' && a.storage_system === 'Project_Backlog').map(a => (
                          <div key={a.action_id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center group">
                            <div className="text-sm font-medium text-slate-700">{a.name}
                              {a.depends_on_action_id && <div className="text-[10px] text-orange-500 mt-1"><i className="fa-solid fa-link"></i> Đang chờ: {data.actions.find(x => x.action_id === a.depends_on_action_id)?.name}</div>}
                            </div>
                            <button onClick={() => handlePullToWeek(a)} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-arrow-right"></i> Rút</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <i className="fa-solid fa-hand-pointer text-3xl mb-3 opacity-30"></i>
                      <p className="text-sm font-medium">Chọn một dự án để xem chi tiết</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* FLOATING TAB */}
            {sourceTab === 'floating' && (
              <div className="w-full p-4 overflow-y-auto custom-scrollbar">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-3">Việc Thả Nổi (Floating Backlog)</h5>
                <div className="space-y-2">
                  {floatingActions.map(a => (
                    <div key={a.action_id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center group hover:border-cyan-200">
                      <div>
                        <div className="text-sm font-bold text-slate-700">{a.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{a.time_needed_mins}m • {a.context}</div>
                      </div>
                      <button onClick={() => handlePullToWeek(a)} className="px-3 py-1.5 bg-cyan-100 text-cyan-600 hover:bg-cyan-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100"><i className="fa-solid fa-arrow-right"></i> Rút</button>
                    </div>
                  ))}
                  {floatingActions.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">Không có việc thả nổi nào.</p>}
                </div>
              </div>
            )}

            {/* HORIZONS TAB */}
            {sourceTab === 'horizons' && (
              <div className="w-full p-4 overflow-y-auto custom-scrollbar">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-3">Hành động gắn trực tiếp với Mục tiêu/Tầm nhìn</h5>
                <div className="space-y-2">
                  {horizonActions.map(a => {
                    const goal = data.goals.find(g => g.goal_id === a.goal_id);
                    const label = goal ? `Mục tiêu: ${goal.statement}` : 'Chung';
                    return (
                      <div key={a.action_id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center group hover:border-emerald-200">
                        <div>
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{label}</div>
                          <div className="text-sm font-bold text-slate-700">{a.name}</div>
                        </div>
                        <button onClick={() => handlePullToWeek(a)} className="px-3 py-1.5 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100"><i className="fa-solid fa-arrow-right"></i> Rút</button>
                      </div>
                    )
                  })}
                  {horizonActions.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">Không có việc nào chưa xếp lịch.</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: The Week's Capacity */}
        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-200 bg-slate-800">
          <div className="p-4 text-white flex flex-col gap-3 border-b border-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-sm text-green-400"><i className="fa-solid fa-battery-three-quarters mr-2"></i> Dạ Dày Tuần Này</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-700 px-2 py-1 rounded">{currentWeek}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2">Tổng Sức Chứa:</span>
                <input type="number" min="1" max="168" value={weeklyCapacityHrs} onChange={e => setWeeklyCapacityHrs(Number(e.target.value) || 1)} className="w-14 bg-slate-700 text-white border border-slate-600 rounded text-center text-xs font-bold p-1 outline-none focus:border-green-400" />
                <span className="text-[10px] text-slate-400 font-bold">h</span>
              </div>
            </div>

            {/* Capacity Stats Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-700/50 p-2 rounded-xl border border-slate-600">
              <div className="text-center p-1">
                <div className="text-xs text-slate-400 font-black uppercase mb-1">Đã chiếm dụng</div>
                <div className="text-sm font-bold text-amber-400">{Math.round(occupiedMins/60*10)/10}h <span className="text-[10px] text-slate-500 font-normal">(Lịch + Chờ)</span></div>
              </div>
              <div className="text-center p-1 border-l border-slate-600">
                <div className="text-xs text-slate-400 font-black uppercase mb-1">Dung lượng rảnh</div>
                <div className="text-sm font-bold text-green-400">{Math.round(availableMins/60*10)/10}h</div>
              </div>
              <div className="text-center p-1 border-l border-slate-600">
                <div className="text-xs text-slate-400 font-black uppercase mb-1">Đã lên lịch (NA)</div>
                <div className={`text-sm font-bold ${isOverCapacity ? 'text-red-400' : 'text-blue-400'}`}>{Math.round(nextMins/60*10)/10}h</div>
              </div>
              <div className="text-center p-1 border-l border-slate-600">
                <div className="text-xs text-slate-400 font-black uppercase mb-1">Số việc NA</div>
                <div className="text-sm font-bold text-white">{nextActions.length}</div>
              </div>
            </div>

            {/* Progress Bar for available capacity vs used */}
            <div className="bg-slate-700 h-2 w-full overflow-hidden flex rounded-full mt-1">
              <div 
                className={`h-full transition-all duration-500 ${isOverCapacity ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min((nextMins / (availableMins || 1)) * 100, 100)}%` }}
              ></div>
            </div>
            {isOverCapacity && <div className="text-[10px] text-red-400 font-bold uppercase text-right"><i className="fa-solid fa-triangle-exclamation"></i> Vượt quá dung lượng rảnh!</div>}
          </div>

          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-50">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-3">Công việc cam kết tuần này</h5>
            <div className="space-y-3">
              {weekActions.map(a => {
                const isCal = a.storage_system === 'Calendar';
                const isWait = a.storage_system === 'Waiting_For';
                return (
                  <div key={a.action_id} className={`p-3 bg-white border rounded-xl shadow-sm flex items-start gap-3 group transition-colors ${isCal ? 'border-emerald-200' : (isWait ? 'border-amber-200' : 'border-slate-200')}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isCal ? 'bg-emerald-100 text-emerald-600' : (isWait ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600')}`}>
                      <i className={isCal ? 'fa-regular fa-calendar-check text-sm' : (isWait ? 'fa-solid fa-hourglass-half text-sm' : 'fa-solid fa-bolt text-sm')}></i>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800">{a.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-2">
                        {data.projects.find(p => p.project_id === a.project_id)?.name && (
                          <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{data.projects.find(p => p.project_id === a.project_id)?.name}</span>
                        )}
                        {isCal ? (
                          <span className="text-emerald-600">
                            <i className="fa-regular fa-calendar mr-1"></i>
                            {new Date(a.scheduled_datetime).toLocaleDateString('vi-VN')} ({calcMins(a)}m)
                          </span>
                        ) : isWait ? (
                          <span className="text-amber-600">
                            <i className="fa-solid fa-user mr-1"></i> Chờ: {a.assigned_to} ({calcMins(a)}m)
                          </span>
                        ) : (
                          <span className="text-blue-600">
                            <i className="fa-solid fa-clock mr-1"></i> {calcMins(a)}m • {a.energy_level || 'Medium'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Push Back Button only for Next Actions */}
                    {!isCal && !isWait && (
                      <button onClick={() => handlePushBack(a)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Loại khỏi tuần này">
                        <i className="fa-solid fa-rotate-left"></i>
                      </button>
                    )}
                  </div>
                );
              })}
              {weekActions.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-medium">Chưa có việc nào trong tuần này. Hãy rút (Pull) từ các nguồn bên trái sang!</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <WeeklyCapacityModal 
        isOpen={isCapacityModalOpen} 
        onClose={() => setIsCapacityModalOpen(false)} 
        capacities={capacities} 
        onRefresh={fetchData} 
      />
    </div>
  );
}



function WeeklyCapacityModal({ isOpen, onClose, capacities, onRefresh }) {
  const [localCaps, setLocalCaps] = useState({});
  const [saving, setSaving] = useState(false);
  const [weeks, setWeeks] = useState([]);
  const [newWeekStr, setNewWeekStr] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setLocalCaps({...capacities});
      const defaultWeeks = Array.from({length: 5}).map((_, i) => getWeekString(i));
      setWeeks(defaultWeeks);
      setNewWeekStr('');
    }
  }, [isOpen, capacities]);

  if (!isOpen) return null;

  const handleAddWeek = () => {
    if (newWeekStr && !weeks.includes(newWeekStr)) {
      setWeeks([newWeekStr, ...weeks].sort());
      setLocalCaps(prev => ({...prev, [newWeekStr]: prev[newWeekStr] || 40}));
      setNewWeekStr('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = Object.keys(localCaps).map(w => ({ week_id: w, capacity_hrs: localCaps[w] }));
    try {
      await fetch(`https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api/weekly-capacities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      onRefresh();
      onClose();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex justify-center items-center backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
        <h3 className="text-lg font-black text-slate-800 mb-1"><i className="fa-solid fa-calendar-week text-indigo-500 mr-2"></i> Lập kế hoạch Dạ dày</h3>
        <p className="text-xs text-slate-500 mb-4">Thiết lập số giờ muốn làm việc cho các tuần bất kỳ.</p>
        
        <div className="flex gap-2 mb-4 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
          <input 
            type="week" 
            value={newWeekStr}
            onChange={e => setNewWeekStr(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-indigo-200 outline-none focus:border-indigo-500 text-sm font-bold text-slate-700"
          />
          <button 
            onClick={handleAddWeek}
            disabled={!newWeekStr}
            className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-bold text-sm transition-colors"
          >
            Thêm
          </button>
        </div>

        <div className="space-y-3 mb-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
          {weeks.map((week) => {
            const isCurrent = week === getWeekString(0);
            return (
              <div key={week} className={`flex justify-between items-center p-3 rounded-xl border ${isCurrent ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                  <div className="font-bold text-slate-700 text-sm">{week}</div>
                  {isCurrent && <div className="text-[10px] font-black text-amber-600 uppercase">Tuần này</div>}
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" min="1" max="168"
                    value={localCaps[week] || 40}
                    onChange={(e) => setLocalCaps({...localCaps, [week]: Number(e.target.value) || 0})}
                    className="w-16 bg-white border border-slate-300 rounded-lg text-center font-bold p-1.5 outline-none focus:border-indigo-500 text-sm"
                  />
                  <span className="text-xs font-bold text-slate-400">giờ</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex gap-3 mt-auto pt-2 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Hủy</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md">
            {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </div>
  );
}
