import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

const getWeekString = (offsetWeeks = 0, baseDate = new Date()) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${week.toString().padStart(2, '0')}`;
};

const getWeekFromDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return getWeekString(0, d);
};

export default function WeeklyReview() {
  const [data, setData] = useState({ actions: [], projects: [], areas: [], goals: [], visions: [], missions: [] });
  const [loading, setLoading] = useState(true);
  
  // Multi-week navigation state
  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeek = getWeekString(0);
  const selectedWeek = getWeekString(weekOffset);

  // Tabs for Left Column
  const [sourceTab, setSourceTab] = useState('projects'); // projects, floating, horizons
  const [selectedProject, setSelectedProject] = useState(null);
  const [newActionName, setNewActionName] = useState('');

  // Weekly capacities & notes map: { '2026-W33': { capacity_hrs: 40, notes: '...' } }
  const [capacitiesMap, setCapacitiesMap] = useState({});
  const [savingNotes, setSavingNotes] = useState(false);
  const notesTimeoutRef = useRef(null);

  const [routines, setRoutines] = useState([]);

  const fetchData = async () => {
    try {
      const [actionsRes, horizonsRes, areasRes, capRes, routinesRes] = await Promise.all([
        fetch(`${API_URL}/actions`), 
        fetch(`${API_URL}/horizons`), 
        fetch(`${API_URL}/areas`), 
        fetch(`${API_URL}/weekly-capacities`),
        fetch(`${API_URL}/routines`).catch(() => ({ json: () => [] }))
      ]);
      const acData = await actionsRes.json();
      const hData = await horizonsRes.json();
      const arData = await areasRes.json();
      const capData = await capRes.json();
      const rData = await routinesRes.json();
      
      const capMap = {};
      if (Array.isArray(capData)) {
        capData.forEach(c => {
          capMap[c.week_id] = { capacity_hrs: c.capacity_hrs, notes: c.notes || '' };
        });
      }

      setData({ 
        actions: Array.isArray(acData) ? acData : [], 
        projects: (hData && hData.projects) || [], 
        areas: Array.isArray(arData) ? arData : [],
        goals: (hData && hData.goals) || [],
        visions: (hData && hData.visions) || [],
        missions: (hData && hData.missions) || []
      });
      setCapacitiesMap(capMap);
      setRoutines(Array.isArray(rData) ? rData : []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Helper to convert HH:MM to decimal hours safely
  const timeToHours = (t) => {
    if (!t || typeof t !== 'string') return 0;
    const parts = t.split(':');
    if (!parts || parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h + m / 60;
  };

  const calcRoutineDurationHrs = (start, end) => {
    let s = timeToHours(start);
    let e = timeToHours(end);
    if (e < s) e += 24;
    return Math.max(0, e - s);
  };

  // Filter routines for selectedWeek
  const weekRoutines = (routines || []).filter(r => r && (!r.week_id || r.week_id === selectedWeek));
  const dailyRoutineHrs = weekRoutines.reduce((sum, r) => sum + calcRoutineDurationHrs(r.start_time, r.end_time), 0);
  const weeklyRoutineHrs = Math.round(dailyRoutineHrs * 7 * 10) / 10;
  const defaultRoutineDeducted168Hrs = Math.max(0, Math.round((168 - weeklyRoutineHrs) * 10) / 10);

  const currentCapacityObj = (capacitiesMap && capacitiesMap[selectedWeek]) || {};
  const weeklyCapacityHrs = currentCapacityObj.capacity_hrs !== undefined ? currentCapacityObj.capacity_hrs : defaultRoutineDeducted168Hrs;
  const weekNotes = currentCapacityObj.notes || '';

  const handleUpdateCapacityHrs = async (newHrs) => {
    const val = Math.max(1, Math.min(168, Number(newHrs) || 40));
    const updated = { ...capacitiesMap, [selectedWeek]: { ...currentCapacityObj, capacity_hrs: val } };
    setCapacitiesMap(updated);

    try {
      await fetch(`${API_URL}/weekly-capacities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ week_id: selectedWeek, capacity_hrs: val, notes: weekNotes }])
      });
    } catch (e) { console.error(e); }
  };

  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    const updated = { ...capacitiesMap, [selectedWeek]: { ...currentCapacityObj, notes: newNotes } };
    setCapacitiesMap(updated);

    // Debounce auto-save notes
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    setSavingNotes(true);
    notesTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/weekly-capacities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ week_id: selectedWeek, capacity_hrs: weeklyCapacityHrs, notes: newNotes }])
        });
      } catch (err) { console.error(err); }
      setSavingNotes(false);
    }, 800);
  };

  const handlePullToWeek = async (action) => {
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          storage_system: 'Next_Actions',
          target_week: selectedWeek 
        })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handlePushBack = async (action) => {
    const newSystem = action.project_id ? 'Project_Backlog' : 'Floating_Backlog';
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          storage_system: newSystem,
          target_week: null 
        })
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
      storage_system: 'Project_Backlog',
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
  
  // Right Column calculations for selectedWeek
  const weekActions = data.actions.filter(a => {
    if (a.status === 'Cancelled') return false;
    
    if (a.storage_system === 'Next_Actions') {
      return a.target_week ? a.target_week === selectedWeek : selectedWeek === currentWeek;
    }
    
    if (a.storage_system === 'Calendar') {
      const actWeek = getWeekFromDate(a.scheduled_datetime);
      return actWeek ? actWeek === selectedWeek : selectedWeek === currentWeek;
    }
    
    if (a.storage_system === 'Waiting_For') {
      return a.target_week ? a.target_week === selectedWeek : selectedWeek === currentWeek;
    }

    return false;
  });

  const nextActions = weekActions.filter(a => a.storage_system === 'Next_Actions');
  const calActions = weekActions.filter(a => a.storage_system === 'Calendar');
  const waitActions = weekActions.filter(a => a.storage_system === 'Waiting_For');

  const calcMins = (a) => {
    if (!a) return 30;
    let scheduledMins = 30;
    if (a.storage_system === 'Calendar' && a.scheduled_datetime && a.scheduled_end_datetime) {
      const s = new Date(a.scheduled_datetime);
      const e = new Date(a.scheduled_end_datetime);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const diffMs = e - s;
        if (diffMs > 0) scheduledMins = Math.round(diffMs / 60000);
      }
    } else if (a.time_needed_mins) {
      scheduledMins = Number(a.time_needed_mins);
    }
    // 🌟 If actual Pomodoro focus mins is logged (e.g. 180m = 3h), use actual focus duration!
    const actualMins = Number(a.total_focus_mins) || 0;
    return Math.max(scheduledMins, actualMins);
  };

  const nextMins = nextActions.reduce((s, a) => s + calcMins(a), 0);
  const calMins = calActions.reduce((s, a) => s + calcMins(a), 0);
  const waitMins = waitActions.reduce((s, a) => s + calcMins(a), 0);

  const occupiedMins = calMins + waitMins;
  const totalCommittedMins = occupiedMins + nextMins;
  const remainingFreeMins = Math.max((weeklyCapacityHrs * 60) - totalCommittedMins, 0);
  const isOverCapacity = totalCommittedMins > (weeklyCapacityHrs * 60);

  // Left Column Filters (Only show actions that are NOT yet assigned to the selectedWeek)
  const floatingActions = data.actions.filter(a => a.storage_system === 'Floating_Backlog' && a.status !== 'Done');
  const horizonActions = data.actions.filter(a => (a.goal_id || a.vision_id || a.mission_id) && !a.project_id && a.status !== 'Done' && !['Next_Actions', 'Calendar', 'Waiting_For', 'Inbox'].includes(a.storage_system));

  return (
    <div className="flex flex-col gap-6 min-h-[500px]">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div>
          <h2 className="text-2xl font-black text-slate-800"><i className="fa-solid fa-scale-balanced text-indigo-600 mr-2"></i> Weekly Review (Lên Kế Hoạch Đa Tuần)</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Lên kế hoạch cho bất kỳ tuần nào bằng cách rút (Pull) việc từ hệ thống vào Dạ Dày của tuần đó.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[75vh]">
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
                            <button onClick={() => handlePullToWeek(a)} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all" title={`Rút vào ${selectedWeek}`}>
                              <i className="fa-solid fa-arrow-right mr-1"></i> Rút ({selectedWeek})
                            </button>
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
                        <div className="text-xs text-slate-400 mt-1">{calcMins(a)}m • {a.context}</div>
                      </div>
                      <button onClick={() => handlePullToWeek(a)} className="px-3 py-1.5 bg-cyan-100 text-cyan-600 hover:bg-cyan-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100" title={`Rút vào ${selectedWeek}`}>
                        <i className="fa-solid fa-arrow-right mr-1"></i> Rút ({selectedWeek})
                      </button>
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
                        <button onClick={() => handlePullToWeek(a)} className="px-3 py-1.5 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100" title={`Rút vào ${selectedWeek}`}>
                          <i className="fa-solid fa-arrow-right mr-1"></i> Rút ({selectedWeek})
                        </button>
                      </div>
                    )
                  })}
                  {horizonActions.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">Không có việc nào chưa xếp lịch.</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: The Selected Week's Capacity */}
        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-200 bg-slate-800">
          
          {/* Week Selector Header */}
          <div className="p-4 text-white flex flex-col gap-3 border-b border-slate-700">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-black uppercase tracking-widest text-sm text-green-400 flex items-center gap-2">
                <i className="fa-solid fa-battery-three-quarters text-lg"></i> Dạ Dày Tuần
              </h3>
              
              {/* Week Navigator Controls */}
              <div className="flex items-center gap-1.5 bg-slate-700/80 p-1 rounded-xl border border-slate-600">
                <button 
                  onClick={() => setWeekOffset(prev => prev - 1)} 
                  className="w-7 h-7 rounded-lg bg-slate-600 hover:bg-slate-500 text-white flex items-center justify-center transition-colors text-xs"
                  title="Tuần trước"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                
                <span className="text-xs font-black text-amber-300 px-2 tracking-wider">
                  {selectedWeek} {selectedWeek === currentWeek && <span className="text-[9px] bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded ml-1">HIỆN TẠI</span>}
                </span>
                
                <button 
                  onClick={() => setWeekOffset(prev => prev + 1)} 
                  className="w-7 h-7 rounded-lg bg-slate-600 hover:bg-slate-500 text-white flex items-center justify-center transition-colors text-xs"
                  title="Tuần sau"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>

                {weekOffset !== 0 && (
                  <button 
                    onClick={() => setWeekOffset(0)} 
                    className="text-[10px] font-bold text-slate-300 hover:text-white bg-indigo-600/60 hover:bg-indigo-600 px-2 py-1 rounded-lg ml-1 transition-colors"
                  >
                    Về tuần này
                  </button>
                )}
              </div>

              {/* Inline Capacity Input */}
              <div className="flex items-center gap-1 bg-slate-700/80 px-2 py-1 rounded-xl border border-slate-600">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Sức chứa:</span>
                <input 
                  type="number" 
                  min="1" max="168" 
                  value={weeklyCapacityHrs} 
                  onChange={e => handleUpdateCapacityHrs(e.target.value)} 
                  className="w-12 bg-slate-800 text-white border border-slate-600 rounded text-center text-xs font-black p-0.5 outline-none focus:border-green-400" 
                />
                <span className="text-[10px] text-slate-400 font-bold">h</span>
              </div>
            </div>

            {/* Live Routine 168h Deduction Sync Banner */}
            <div className="flex flex-wrap justify-between items-center bg-slate-800/90 px-3 py-2 rounded-xl border border-pink-500/30 text-xs text-slate-200 gap-2">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-arrows-spin text-pink-400 text-sm animate-spin-slow"></i>
                <span>Tự động tính từ Routine: <strong>168h - {weeklyRoutineHrs}h</strong> Routine = <strong className="text-pink-300 font-black">{defaultRoutineDeducted168Hrs}h rảnh</strong></span>
              </span>
              
              <button 
                type="button"
                onClick={() => handleUpdateCapacityHrs(defaultRoutineDeducted168Hrs)} 
                className="text-[11px] font-black text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 px-3 py-1 rounded-lg shadow-md transition-all flex items-center gap-1.5"
                title="Đồng bộ sức chứa Dạ Dày Tuần theo con số trừ từ Routine"
              >
                <i className="fa-solid fa-rotate"></i> Nạp {defaultRoutineDeducted168Hrs}h từ Routine
              </button>
            </div>

            {/* Capacity Stats Display with Clear Explanations */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-700/50 p-2 rounded-xl border border-slate-600">
              <div className="text-center p-1" title="Số giờ bị khóa cứng do Lịch hẹn cố định + Việc đang chờ phản hồi">
                <div className="text-[10px] text-slate-400 font-black uppercase mb-1">Đã chiếm dụng</div>
                <div className="text-sm font-bold text-amber-400">{Math.round(occupiedMins/60*10)/10}h <span className="text-[10px] text-amber-200/60 font-normal">(Lịch + Chờ)</span></div>
              </div>
              <div className="text-center p-1 border-l border-slate-600" title="Tổng số giờ của các việc linh hoạt (Next Actions) đã nạp vào Dạ Dày Tuần này">
                <div className="text-[10px] text-slate-400 font-black uppercase mb-1">Việc linh hoạt (NA)</div>
                <div className="text-sm font-bold text-blue-400">{Math.round(nextMins/60*10)/10}h <span className="text-[10px] text-slate-400 font-normal">({nextActions.length} việc)</span></div>
              </div>
              <div className="text-center p-1 border-l border-slate-600" title="Quỹ thời gian rảnh thực tế còn lại trong tuần để nhận thêm công việc mới (Sức chứa - Đã chiếm dụng - Việc linh hoạt)">
                <div className="text-[10px] text-slate-400 font-black uppercase mb-1">Rảnh còn lại</div>
                <div className={`text-sm font-bold ${isOverCapacity ? 'text-red-400' : 'text-green-400'}`}>{Math.round(remainingFreeMins/60*10)/10}h</div>
              </div>
              <div className="text-center p-1 border-l border-slate-600" title="Tổng số giờ đã nạp vào tuần (Lịch + Chờ + Việc NA)">
                <div className="text-[10px] text-slate-400 font-black uppercase mb-1">Tổng đã nạp</div>
                <div className={`text-sm font-bold ${isOverCapacity ? 'text-red-400' : 'text-indigo-300'}`}>{Math.round(totalCommittedMins/60*10)/10}h / {weeklyCapacityHrs}h</div>
              </div>
            </div>

            {/* Progress Bar for available capacity vs used */}
            <div className="bg-slate-700 h-2 w-full overflow-hidden flex rounded-full mt-1">
              <div 
                className={`h-full transition-all duration-500 ${isOverCapacity ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500'}`} 
                style={{ width: `${Math.min((totalCommittedMins / ((weeklyCapacityHrs * 60) || 1)) * 100, 100)}%` }}
              ></div>
            </div>
            {isOverCapacity && <div className="text-[10px] text-red-400 font-bold uppercase text-right"><i className="fa-solid fa-triangle-exclamation"></i> Vượt quá dung lượng rảnh!</div>}
          </div>

          {/* Committed actions list for selectedWeek */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-50 flex flex-col gap-4">
            
            {/* Notes Section for Selected Week */}
            <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <i className="fa-solid fa-pen-to-square"></i> Ghi chú & Suy nghĩ cho {selectedWeek}
                </label>
                {savingNotes && <span className="text-[10px] text-indigo-400 italic">Đang lưu...</span>}
              </div>
              <textarea 
                rows="2"
                value={weekNotes}
                onChange={handleNotesChange}
                placeholder={`Nhập mục tiêu chính hoặc suy nghĩ định hướng cho ${selectedWeek}...`}
                className="w-full text-xs text-slate-700 bg-slate-50/50 p-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400 focus:bg-white resize-none font-medium"
              />
            </div>

            <div>
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-3">Công việc cam kết cho {selectedWeek}</h5>
              <div className="space-y-3">
                {weekActions.map(a => {
                  const isCal = a.storage_system === 'Calendar';
                  const isWait = a.storage_system === 'Waiting_For';
                  return (
                    <div key={a.action_id} className={`p-3 bg-white border rounded-xl shadow-sm flex items-center justify-between gap-3 group transition-colors ${isCal ? 'border-emerald-200' : (isWait ? 'border-amber-200' : 'border-slate-200')}`}>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isCal ? 'bg-emerald-100 text-emerald-600' : (isWait ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600')}`}>
                          <i className={isCal ? 'fa-regular fa-calendar-check text-sm' : (isWait ? 'fa-solid fa-hourglass-half text-sm' : 'fa-solid fa-bolt text-sm')}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={`text-sm font-black truncate ${a.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-800'}`}>{a.name}</div>
                            {a.status === 'Done' && (
                              <span className="bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full text-[9px] flex items-center gap-1 shrink-0 shadow-xs">
                                <i className="fa-solid fa-circle-check"></i> ✅ HOÀN THÀNH
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                            {data.projects.find(p => p.project_id === a.project_id)?.name && (
                              <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">{data.projects.find(p => p.project_id === a.project_id)?.name}</span>
                            )}
                            
                            {isCal ? (
                              <span className="text-emerald-700 font-bold">
                                <i className="fa-regular fa-calendar mr-1"></i>
                                {a.scheduled_datetime && !isNaN(new Date(a.scheduled_datetime).getTime()) ? new Date(a.scheduled_datetime).toLocaleDateString('vi-VN') : 'Lịch hẹn'} ({calcMins(a)}m)
                              </span>
                            ) : isWait ? (
                              <span className="text-amber-700 font-bold">
                                <i className="fa-solid fa-user mr-1"></i> Chờ: {a.assigned_to} ({calcMins(a)}m)
                              </span>
                            ) : (
                              <span className="text-blue-700 font-bold">
                                <i className="fa-solid fa-clock mr-1"></i> {calcMins(a)}m • {a.energy_level || 'Medium'}
                              </span>
                            )}

                            {(a.completed_at || a.last_executed_at) && (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-black">
                                🕒 Xong lúc: {(a.completed_at || a.last_executed_at).slice(0, 16).replace('T', ' ')}
                              </span>
                            )}

                            {a.total_focus_mins && Number(a.total_focus_mins) > 120 && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-black">
                                ⚡ Tập trung thực tế: {a.total_focus_mins}m (+{Number(a.total_focus_mins) - 120}m)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Visual Hours Badge */}
                      <div className={`flex flex-col items-end justify-center px-3 py-1 rounded-lg shrink-0 ${isCal || isWait ? 'bg-amber-50' : 'bg-blue-50'}`}>
                        <span className={`text-sm font-black ${isCal || isWait ? 'text-amber-500' : 'text-blue-500'}`}>
                          {Math.round(calcMins(a) / 60 * 10) / 10}h
                        </span>
                      </div>

                      {/* Push Back Button only for Next Actions */}
                      {!isCal && !isWait && (
                        <button onClick={() => handlePushBack(a)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-1 shrink-0" title="Loại khỏi tuần này">
                          <i className="fa-solid fa-rotate-left"></i>
                        </button>
                      )}
                    </div>
                  );
                })}
                {weekActions.length === 0 && (
                  <div className="text-center py-10 text-slate-400 font-medium">Chưa có việc nào trong {selectedWeek}. Hãy chọn việc bên trái và nhấn "Rút"!</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
