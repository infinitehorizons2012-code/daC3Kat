import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

// Web Audio API Gentle Bell Synth (100% Offline & Zero Lag)
const playBellChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch (e) { console.error(e); }
};

// Web Audio Ambient Noise Generator (Rain / Waves / White Noise)
class AmbientNoiseSynth {
  constructor() {
    this.ctx = null;
    this.node = null;
    this.gain = null;
    this.isPlaying = false;
  }

  start(type = 'rain') {
    this.stop();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink/Brown noise filter simulation for soft rain
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      this.node = this.ctx.createBufferSource();
      this.node.buffer = noiseBuffer;
      this.node.loop = true;

      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Soft volume

      this.node.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      this.node.start();
      this.isPlaying = true;
    } catch (e) { console.error(e); }
  }

  stop() {
    if (this.node) {
      try { this.node.stop(); } catch (e) {}
      this.node = null;
    }
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) {}
      this.ctx = null;
    }
    this.isPlaying = false;
  }
}

const ambientSynth = new AmbientNoiseSynth();


const getDynamicEstPoms = (action, workMins) => {
  if (!action) return 1;

  let mins = 30;
  if (action.scheduled_datetime && action.scheduled_end_datetime) {
    const s = new Date(action.scheduled_datetime);
    const e = new Date(action.scheduled_end_datetime);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const diffMs = e - s;
      if (diffMs > 0) mins = Math.round(diffMs / 60000);
    }
  } else if (action.time_needed_mins) {
    mins = Number(action.time_needed_mins);
  }

  const pomMins = workMins || 25;
  const calculatedPoms = Math.max(1, Math.ceil(mins / pomMins));

  return (action.estimated_poms && action.estimated_poms > 1) ? Math.max(action.estimated_poms, calculatedPoms) : calculatedPoms;
};


const calcActionMins = (a) => {
  if (!a) return 30;
  if (a.scheduled_datetime && a.scheduled_end_datetime) {
    const s = new Date(a.scheduled_datetime);
    const e = new Date(a.scheduled_end_datetime);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const diffMs = e - s;
      if (diffMs > 0) return Math.round(diffMs / 60000);
    }
  }
  return Number(a.time_needed_mins) || 30;
};


const getISOWeekStr = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export default function FocusEngine({ onOpenReport }) {
  const [data, setData] = useState({ actions: [], projects: [], areas: [] });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings & Selection
  const [workMins, setWorkMins] = useState(25);
  const [breakMins, setBreakMins] = useState(2);
  const [selectedActionId, setSelectedActionId] = useState('');

  // Quick Unplanned Input
  const [unplannedInput, setUnplannedInput] = useState('');
  const [unplannedSuccess, setUnplannedSuccess] = useState(false);

  // Ambient Sound State
  const [ambientType, setAmbientType] = useState('none'); // 'none', 'rain', 'waves'

  // Timer State
  const [mode, setMode] = useState('work'); // 'work' or 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWidgetMode, setIsWidgetMode] = useState(false);

  // Search & Filter state for Action Finder
  const [searchTerm, setSearchTerm] = useState('');
  const [filterContext, setFilterContext] = useState('');
  const [filterEnergy, setFilterEnergy] = useState('');

  const timerRef = useRef(null);

  const fetchData = async () => {
    try {
      const [acRes, fsRes, hRes, arRes] = await Promise.all([
        fetch(`${API_URL}/actions`),
        fetch(`${API_URL}/focus-sessions`),
        fetch(`${API_URL}/horizons`),
        fetch(`${API_URL}/areas`)
      ]);
      const acData = await acRes.json();
      const fsData = await fsRes.json();
      const hData = await hRes.json();
      const arData = await arRes.json();

      setData({
        actions: Array.isArray(acData) ? acData.filter(a => a.status !== 'Done' && a.status !== 'Cancelled') : [],
        projects: hData.projects || [],
        areas: arData || []
      });
      setSessions(Array.isArray(fsData) ? fsData : []);

  // Search & Filter state for Action Finder
  const [searchTerm, setSearchTerm] = useState('');
  const [filterContext, setFilterContext] = useState('');
  const [filterEnergy, setFilterEnergy] = useState('');

      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft((mode === 'work' ? workMins : breakMins) * 60);
    }
  }, [workMins, breakMins, mode]);

  // Ambient sound toggle
  useEffect(() => {
    if (isRunning && ambientType !== 'none') {
      ambientSynth.start(ambientType);
    } else {
      ambientSynth.stop();
    }
    return () => ambientSynth.stop();
  }, [isRunning, ambientType]);

  // Countdown Loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleCompleteRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, workMins, breakMins, selectedActionId]);

  const handleCompleteRound = async () => {
    setIsRunning(false);
    playBellChime();

    const currentAction = data.actions.find(a => a.action_id === selectedActionId);
    const actionName = currentAction ? currentAction.name : 'Hiệp Tập Trung Pomodoro';

    if (mode === 'work') {
      // 1. Log focus session
      try {
        await fetch(`${API_URL}/focus-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_id: selectedActionId || null,
            action_name: actionName,
            duration_mins: workMins,
            session_type: 'work'
          })
        });

        // 2. Increment completed_poms for current action
        if (currentAction) {
          const newCompleted = (currentAction.completed_poms || 0) + 1;
          const est = getDynamicEstPoms(currentAction, workMins);
          const isDoneNow = newCompleted >= est;

          await fetch(`${API_URL}/actions/${currentAction.action_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              completed_poms: newCompleted,
              ...(isDoneNow ? { status: 'Done' } : {})
            })
          });

          if (isDoneNow) {
            alert(`🎉 CHÚC MỪNG! Bé đã hoàn thành toàn bộ ${est} Pomodoros và xong việc: "${currentAction.name}"!`);
          }
        }

        fetchData();
      } catch (e) { console.error(e); }

      alert(`🔴 Xong Hiệp Tập Trung (${workMins}m)! Bé chuyển sang nghỉ ngơi ${breakMins}m nhé.`);
      setMode('break');
      setTimeLeft(breakMins * 60);
    } else {
      alert(`🔔 Hết giờ nghỉ ${breakMins}m! Sẵn sàng cho hiệp tiếp theo chưa?`);
      setMode('work');
      setTimeLeft(workMins * 60);
    }
  };

  // Quick 3s Unplanned Work submit (DOES NOT pause timer!)
  const handleQuickUnplanned = async (e) => {
    e.preventDefault();
    if (!unplannedInput.trim()) return;

    try {
      await fetch(`${API_URL}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: unplannedInput,
          storage_system: 'Inbox',
          work_type: 'Unplanned Work',
          status: 'Pending',
          category: 'Strategic',
          context: '@Máy_tính'
        })
      });
      setUnplannedInput('');
      setUnplannedSuccess(true);
      setTimeout(() => setUnplannedSuccess(false), 2000);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft((mode === 'work' ? workMins : breakMins) * 60);
  };

  const skipRound = () => {
    setIsRunning(false);
    const nextMode = mode === 'work' ? 'break' : 'work';
    setMode(nextMode);
    setTimeLeft((nextMode === 'work' ? workMins : breakMins) * 60);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSecs = (mode === 'work' ? workMins : breakMins) * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSecs - timeLeft) / (totalSecs || 1)) * 100));

  const currentAction = data.actions.find(a => a.action_id === selectedActionId);
  const currentArea = currentAction ? data.areas.find(ar => ar.area_id === currentAction.area_id) : null;
  const currentProject = currentAction ? data.projects.find(p => p.project_id === currentAction.project_id) : null;

  const estPoms = currentAction ? getDynamicEstPoms(currentAction, workMins) : 4;
  const compPoms = currentAction ? (currentAction.completed_poms || 0) : 0;

  // Today Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.created_at && s.created_at.startsWith(todayStr));
  const todayWorkMins = todaySessions.reduce((sum, s) => sum + (s.duration_mins || 0), 0);
  const todayRounds = todaySessions.length;

  if (loading) return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in max-w-4xl mx-auto w-full">
      
      
      {/* 1. RA-ĐA GỢI Ý THÔNG MINH (RECOMMENDATIONS BY CURRENT HOUR, DAY & WEEK) */}
      {(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentHourStr = `${String(currentHour).padStart(2, '0')}:00`;
        const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const todayDayName = dayNames[now.getDay()];
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentISOWeek = getISOWeekStr(now);

        // Filter recommendations for today
        const recCalendar = data.actions.filter(a => {
          if (a.storage_system === 'Calendar' || (a.scheduled_datetime && a.scheduled_datetime.startsWith(todayKey))) {
            return true;
          }
          return false;
        });

        const recNext = data.actions.filter(a => a.storage_system === 'Next_Actions' && (a.scheduled_datetime?.startsWith(todayKey) || a.target_week === currentISOWeek || !a.scheduled_datetime));
        const recFloating = data.actions.filter(a => a.storage_system === 'Floating_Backlog');
        const recWaiting = data.actions.filter(a => a.storage_system === 'Waiting_For');

        return (
          <div className="w-full glass-panel p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/30">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-3 mb-4 gap-2">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest">
                  <i className="fa-solid fa-radar text-amber-400 animate-pulse text-sm"></i> Ra-Đa Đề Xuất Công Việc Tự Động
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Khung Giờ {currentHourStr} • {todayDayName} ({todayKey}) • Tuần {currentISOWeek}
                </h3>
              </div>

              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-500/30">
                ⚡ Tự động quét Lịch hẹn, Routine & Next Actions hiện tại
              </span>
            </div>

            {/* 4 Category Recommendation Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 🟢 Lịch Hẹn Hôm Nay */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-emerald-500/30 flex flex-col justify-between min-h-[120px]">
                <div>
                  <div className="text-[10px] font-black uppercase text-emerald-400 mb-2 flex items-center justify-between">
                    <span>🟢 Lịch Hẹn Hôm Nay</span>
                    <span className="bg-emerald-900/80 px-1.5 rounded text-white">{recCalendar.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-[90px] overflow-y-auto custom-scrollbar pr-1">
                    {recCalendar.map(a => (
                      <div key={a.action_id} className="p-1.5 bg-slate-900/80 rounded-xl text-xs font-bold text-white flex items-center justify-between gap-1 border border-slate-700">
                        <span className="truncate text-[11px]">{a.name}</span>
                        <button 
                          onClick={() => setSelectedActionId(a.action_id)}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] rounded-lg shrink-0 transition-all"
                        >
                          🎯 Gắn
                        </button>
                      </div>
                    ))}
                    {recCalendar.length === 0 && <div className="text-[10px] text-slate-400 italic">Không có lịch hẹn hôm nay</div>}
                  </div>
                </div>
              </div>

              {/* ⚡ Next Actions Ưu Tiên */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-blue-500/30 flex flex-col justify-between min-h-[120px]">
                <div>
                  <div className="text-[10px] font-black uppercase text-blue-400 mb-2 flex items-center justify-between">
                    <span>⚡ Next Actions Ưu Tiên</span>
                    <span className="bg-blue-900/80 px-1.5 rounded text-white">{recNext.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-[90px] overflow-y-auto custom-scrollbar pr-1">
                    {recNext.slice(0, 3).map(a => (
                      <div key={a.action_id} className="p-1.5 bg-slate-900/80 rounded-xl text-xs font-bold text-white flex items-center justify-between gap-1 border border-slate-700">
                        <span className="truncate text-[11px]">{a.name}</span>
                        <button 
                          onClick={() => setSelectedActionId(a.action_id)}
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] rounded-lg shrink-0 transition-all"
                        >
                          🎯 Gắn
                        </button>
                      </div>
                    ))}
                    {recNext.length === 0 && <div className="text-[10px] text-slate-400 italic">Không có Next Action</div>}
                  </div>
                </div>
              </div>

              {/* 🎈 Thả Nổi Khả Thi */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-cyan-500/30 flex flex-col justify-between min-h-[120px]">
                <div>
                  <div className="text-[10px] font-black uppercase text-cyan-400 mb-2 flex items-center justify-between">
                    <span>🎈 Thả Nổi Khả Thi</span>
                    <span className="bg-cyan-900/80 px-1.5 rounded text-white">{recFloating.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-[90px] overflow-y-auto custom-scrollbar pr-1">
                    {recFloating.slice(0, 3).map(a => (
                      <div key={a.action_id} className="p-1.5 bg-slate-900/80 rounded-xl text-xs font-bold text-white flex items-center justify-between gap-1 border border-slate-700">
                        <span className="truncate text-[11px]">{a.name}</span>
                        <button 
                          onClick={() => setSelectedActionId(a.action_id)}
                          className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[9px] rounded-lg shrink-0 transition-all"
                        >
                          🎯 Gắn
                        </button>
                      </div>
                    ))}
                    {recFloating.length === 0 && <div className="text-[10px] text-slate-400 italic">Không có việc thả nổi</div>}
                  </div>
                </div>
              </div>

              {/* ⏳ Việc Đang Chờ Phản Hồi */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-amber-500/30 flex flex-col justify-between min-h-[120px]">
                <div>
                  <div className="text-[10px] font-black uppercase text-amber-400 mb-2 flex items-center justify-between">
                    <span>⏳ Chờ Phản Hồi</span>
                    <span className="bg-amber-900/80 px-1.5 rounded text-white">{recWaiting.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-[90px] overflow-y-auto custom-scrollbar pr-1">
                    {recWaiting.slice(0, 3).map(a => (
                      <div key={a.action_id} className="p-1.5 bg-slate-900/80 rounded-xl text-xs font-bold text-white flex items-center justify-between gap-1 border border-slate-700">
                        <span className="truncate text-[11px]">{a.name}</span>
                        <button 
                          onClick={() => setSelectedActionId(a.action_id)}
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[9px] rounded-lg shrink-0 transition-all"
                        >
                          🎯 Gắn
                        </button>
                      </div>
                    ))}
                    {recWaiting.length === 0 && <div className="text-[10px] text-slate-400 italic">Không có việc chờ phản hồi</div>}
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 2. ACTION FINDER & SEARCH ENGINE (BỘ TÌM KIẾM HÀNH ĐỘNG ĐỂ LÀM) */}
      {(() => {
        const filteredActions = data.actions.filter(a => {
          if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const n = (a.name || '').toLowerCase();
            const cat = (a.category || '').toLowerCase();
            const proj = (data.projects.find(p => p.project_id === a.project_id)?.name || '').toLowerCase();
            if (!n.includes(q) && !cat.includes(q) && !proj.includes(q)) return false;
          }
          if (filterContext && a.context !== filterContext) return false;
          return true;
        });

        return (
          <div className="w-full glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm mt-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-3 mb-3 gap-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-magnifying-glass text-amber-500"></i> Tìm Hành Động Để Làm (Action Finder)
              </h3>

              <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="🔍 Tìm từ khóa (Karate, Bơi, Python)..."
                  className="p-2 border border-slate-300 rounded-xl outline-none focus:border-amber-500 text-xs w-52 font-bold bg-slate-50 focus:bg-white"
                />
                <select 
                  value={filterContext} 
                  onChange={e => setFilterContext(e.target.value)} 
                  className="p-2 border border-slate-300 rounded-xl outline-none text-xs font-bold bg-white text-slate-700"
                >
                  <option value="">Tất cả Context</option>
                  <option value="@Máy_tính">@Máy_tính</option>
                  <option value="@Điện_thoại">@Điện_thoại</option>
                  <option value="@Trường_học">@Trường_học</option>
                  <option value="@Gia_đình">@Gia_đình</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
              {filteredActions.map(a => (
                <div key={a.action_id} className="p-3 bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl flex items-center justify-between transition-all group">
                  <div className="truncate pr-2">
                    <span className="font-black text-xs text-slate-800 truncate block">{a.name}</span>
                    <span className="text-[10px] text-slate-500 font-bold block">{a.storage_system} • {a.context || '@Máy_tính'}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedActionId(a.action_id)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-xl shadow-xs shrink-0 transition-all"
                  >
                    🎯 Gắn Pomodoro
                  </button>
                </div>
              ))}
              {filteredActions.length === 0 && (
                <div className="col-span-full text-center py-6 text-slate-400 text-xs font-medium">
                  Không tìm thấy hành động phù hợp từ khóa tìm kiếm.
                </div>
              )}
            </div>
          </div>
        );
      })()}


      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm relative overflow-hidden bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 text-amber-100 text-xs font-black uppercase tracking-widest mb-1">
            <i className="fa-solid fa-fire"></i> GTD x Unschooling Pomodoro Engine
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-stopwatch text-yellow-200"></i> Trạm Rèn Luyện Trí Não (Focus Mode)
          </h2>
          <p className="text-xs text-amber-100 mt-1 font-medium max-w-2xl">
            Đo lường năng lượng thực thi ở tầng Runway (25m Tập trung / 2m Nghỉ) - 100% êm mát máy, 0% tốn CPU.
          </p>
        </div>

        <button 
          onClick={() => setIsWidgetMode(!isWidgetMode)}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-md flex items-center gap-2 self-start md:self-auto ${isWidgetMode ? 'bg-white text-orange-600' : 'bg-slate-900/40 text-white hover:bg-slate-900/60'}`}
        >
          <i className="fa-solid fa-window-restore"></i> {isWidgetMode ? 'Mở rộng màn hình' : 'Thu nhỏ góc màn hình'}
        </button>
          {onOpenReport && (
            <button 
              onClick={onOpenReport}
              className="px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-md bg-amber-400 text-slate-950 hover:bg-amber-300 flex items-center gap-2"
            >
              <i className="fa-solid fa-chart-pie"></i> 📊 Xem Báo Cáo & Nhật Ký
            </button>
          )}
      </div>

      {/* Main Focus Card */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col items-center relative overflow-hidden">
        
        {/* Active Action Context Bar */}
        <div className="w-full bg-slate-900 text-white p-4 rounded-2xl mb-6 shadow-md border border-slate-800">
          <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <i className="fa-solid fa-thumbtack"></i> Đang Thực Thi:
          </div>
          <div className="text-base font-black text-white truncate">
            {currentAction ? currentAction.name : 'Chưa chọn việc (Học tự do / Rèn luyện trí não)'}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-300 flex-wrap">
            {currentArea && <span className="bg-slate-800 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-500/30">🏷️ {currentArea.name}</span>}
            {currentProject && <span className="bg-slate-800 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">🎯 Dự án: {currentProject.name}</span>}
            {currentAction && <span className="bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">⚡ {currentAction.context || '@Máy_tính'}</span>}
          </div>
        </div>

        {/* Action Picker Selector */}
        <div className="w-full max-w-md mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
            <i className="fa-solid fa-list-check mr-1"></i> Chọn việc từ Runway để gắn vào Hiệp Pomodoro
          </label>
          <select 
            value={selectedActionId} 
            onChange={e => setSelectedActionId(e.target.value)}
            className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-orange-400 font-bold bg-white text-slate-800"
          >
            <option value="">[Chọn việc từ Runway...]</option>
            {data.actions.map(a => {
              const est = getDynamicEstPoms(a, workMins);
              const mins = calcActionMins(a);
              const durText = mins >= 60 ? `${Math.round(mins / 60 * 10) / 10}h` : `${mins}m`;
              return (
                <option key={a.action_id} value={a.action_id}>
                  {a.name} ({a.completed_poms || 0}/{est} poms • {durText})
                </option>
              );
            })}
          </select>
        </div>

        {/* Pomodoro Progress Dots */}
        <div className="flex items-center gap-2 mb-6 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
          <span className="text-xs font-black text-orange-800 uppercase tracking-wider mr-1">Tiến độ Pomodoro:</span>
          <div className="flex items-center gap-1.5 text-lg">
            {Array.from({ length: estPoms }).map((_, i) => (
              <span key={i} className={`transition-all ${i < compPoms ? 'text-red-500 scale-110' : 'text-slate-300'}`}>
                {i < compPoms ? '🔴' : '⚪'}
              </span>
            ))}
          </div>
          <span className="text-xs font-bold text-orange-700 ml-2">(Đã xong {compPoms}/{estPoms} Pomodoros)</span>
        </div>

        {/* Mode Selector Pill & Ambient Sound */}
        <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => { setMode('work'); setIsRunning(false); setTimeLeft(workMins * 60); }} 
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${mode === 'work' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <i className="fa-solid fa-brain"></i> Hiệp Tập Trung ({workMins}m)
            </button>
            <button 
              onClick={() => { setMode('break'); setIsRunning(false); setTimeLeft(breakMins * 60); }} 
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${mode === 'break' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <i className="fa-solid fa-mug-hot"></i> Hiệp Nghỉ Ngơi ({breakMins}m)
            </button>
          </div>

          {/* Ambient Sound Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold text-slate-700">
            <i className="fa-solid fa-headphones text-indigo-500 ml-1"></i>
            <select 
              value={ambientType} 
              onChange={e => setAmbientType(e.target.value)} 
              className="bg-white p-1.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-700"
            >
              <option value="none">🔇 Tắt âm nền</option>
              <option value="rain">🌧️ Tiếng mưa ngâu (Mát lành)</option>
              <option value="waves">🌊 Tiếng ồn trắng (Deep Work)</option>
            </select>
          </div>
        </div>

        {/* Circular Progress & Timer */}
        <div className="relative flex items-center justify-center my-2">
          <svg width="240" height="240" className="transform -rotate-90">
            <circle cx="120" cy="120" r="100" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
            <circle 
              cx="120" cy="120" r="100" 
              fill="transparent" 
              stroke={mode === 'work' ? '#f97316' : '#10b981'} 
              strokeWidth="16" 
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={((100 - progressPercent) / 100) * (2 * Math.PI * 100)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-black tracking-tight text-slate-800 font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest mt-1 px-2.5 py-0.5 rounded-full ${mode === 'work' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {mode === 'work' ? '🧠 Đang Tập Trung' : '☕ Đang Nghỉ Ngơi'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-4">
          <button 
            onClick={resetTimer} 
            className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all shadow-sm" 
            title="Đặt lại"
          >
            <i className="fa-solid fa-rotate-left text-lg"></i>
          </button>

          <button 
            onClick={toggleTimer} 
            className={`px-8 py-4 rounded-2xl font-black text-lg text-white shadow-xl transition-all flex items-center gap-3 ${isRunning ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : (mode === 'work' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30')}`}
          >
            <i className={`fa-solid ${isRunning ? 'fa-pause' : 'fa-play'}`}></i>
            {isRunning ? 'Tạm Dừng' : 'Bắt Đầu Hiệp'}
          </button>

          <button 
            onClick={skipRound} 
            className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all shadow-sm" 
            title="Bỏ qua hiệp"
          >
            <i className="fa-solid fa-forward-step text-lg"></i>
          </button>
        </div>

        {/* ⚡ Nút "+ Nhập Đột Xuất trong 3s" (KHÔNG DỪNG ĐỒNG HỒ) */}
        <div className="w-full max-w-lg mt-8 p-4 bg-orange-50/80 rounded-2xl border border-orange-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest flex items-center gap-1">
              <i className="fa-solid fa-bolt text-amber-500"></i> Bộc phát ý tưởng / Việc khẩn đột xuất?
            </span>
            <span className="text-[10px] text-orange-600 font-bold">(Không làm dừng đồng hồ)</span>
          </div>
          <form onSubmit={handleQuickUnplanned} className="flex gap-2">
            <input 
              type="text"
              value={unplannedInput}
              onChange={e => setUnplannedInput(e.target.value)}
              placeholder="Nhập việc đột xuất vào đây trong 3s rồi làm tiếp..."
              className="flex-1 p-2.5 rounded-xl border border-orange-200 text-xs outline-none focus:border-orange-500 font-bold text-slate-800 bg-white"
            />
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-4 rounded-xl text-xs font-black shadow-sm transition-colors whitespace-nowrap">
              + Thêm nhanh
            </button>
          </form>
          {unplannedSuccess && <div className="text-[10px] text-emerald-600 font-bold mt-1">✨ Đã đẩy việc đột xuất vào Inbox an toàn! Đồng hồ vẫn đang chạy.</div>}
        </div>

        {/* Customized Durations Setup */}
        <div className="flex items-center gap-6 mt-6 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <span>Thời gian Học:</span>
            <input 
              type="number" min="1" max="120" 
              value={workMins} 
              onChange={e => setWorkMins(Number(e.target.value) || 25)}
              className="w-14 p-1 border rounded-lg text-center font-black outline-none focus:border-orange-400" 
            />
            <span>m</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Thời gian Nghỉ:</span>
            <input 
              type="number" min="1" max="60" 
              value={breakMins} 
              onChange={e => setBreakMins(Number(e.target.value) || 2)}
              className="w-14 p-1 border rounded-lg text-center font-black outline-none focus:border-emerald-400" 
            />
            <span>m</span>
          </div>
        </div>
      </div>

      {/* Today Achievements & History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-orange-100 bg-orange-50/30 text-center">
          <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Hiệp Tập Trung Hôm Nay</div>
          <div className="text-3xl font-black text-orange-700">{todayRounds} <span className="text-xs text-orange-400 font-normal">hiệp Pomodoro</span></div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-amber-100 bg-amber-50/30 text-center">
          <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Tổng Phút Deep Work</div>
          <div className="text-3xl font-black text-amber-700">{todayWorkMins} <span className="text-xs text-amber-400 font-normal">phút</span></div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-emerald-100 bg-emerald-50/30 text-center">
          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Mức Độ Êm Mát Máy</div>
          <div className="text-3xl font-black text-emerald-700">100% <span className="text-xs text-emerald-500 font-normal">0% CPU</span></div>
        </div>
      </div>

      {/* Floating Mini Widget Overlay */}
      {isWidgetMode && createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] glass-panel bg-slate-900/90 text-white p-4 rounded-3xl shadow-2xl border border-slate-700/80 backdrop-blur-lg flex items-center gap-4 animate-slide-up">
          <div className="relative flex items-center justify-center">
            <span className="text-xl font-black font-mono text-orange-400">{formatTime(timeLeft)}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase">{mode === 'work' ? '🧠 Hiệp Học' : '☕ Hiệp Nghỉ'}</span>
            <span className="text-xs font-bold text-white truncate max-w-[120px]">
              {data.actions.find(a => a.action_id === selectedActionId)?.name || 'Pomodoro'}
            </span>
          </div>

          <button 
            onClick={toggleTimer} 
            className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all ${isRunning ? 'bg-amber-500 text-slate-950' : 'bg-orange-500 text-white'}`}
          >
            <i className={`fa-solid ${isRunning ? 'fa-pause' : 'fa-play'} text-sm`}></i>
          </button>

          <button 
            onClick={() => setIsWidgetMode(false)} 
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs ml-1"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
