import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

// Helper to format ISO week string e.g. "2026-W33"
const getISOWeekStr = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

// Helper to get 7 days range (Mon to Sun) for a week string
const getWeekDays = (weekStr) => {
  try {
    const parts = weekStr.split('-W');
    const year = parseInt(parts[0]);
    const weekNum = parseInt(parts[1]);

    const simple = new Date(year, 0, 1 + (weekNum - 1) * 7);
    const dayOfWeek = simple.getDay();
    const isoMonday = new Date(simple);
    if (dayOfWeek <= 4)
      isoMonday.setDate(simple.getDate() - simple.getDay() + 1);
    else
      isoMonday.setDate(simple.getDate() + (8 - simple.getDay()));

    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(isoMonday);
      d.setDate(isoMonday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      days.push({
        name: dayNames[i],
        dateKey: dateKey,
        dateFormatted: `${d.getDate()}/${d.getMonth() + 1}`,
        dateObj: d,
        dayIndex: i
      });
    }
    return days;
  } catch (e) {
    return [];
  }
};

const calcActionDurationText = (ev) => {
  if (!ev) return '30m';
  if (ev.scheduled_datetime && ev.scheduled_end_datetime) {
    const s = new Date(ev.scheduled_datetime);
    const e = new Date(ev.scheduled_end_datetime);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const diffMs = e - s;
      if (diffMs > 0) {
        const mins = Math.round(diffMs / 60000);
        if (mins >= 60) {
          const hrs = Math.round(mins / 60 * 10) / 10;
          return `${hrs}h`;
        }
        return `${mins}m`;
      }
    }
  }
  return ev.time_needed_mins ? `${ev.time_needed_mins}m` : '30m';
};

// Helper to extract start hour integer from item (0 - 23)
const getItemStartHour = (item) => {
  if (item.scheduled_datetime) {
    const h = parseInt(item.scheduled_datetime.slice(11, 13), 10);
    if (!isNaN(h)) return h;
  }
  if (item.start_time) {
    const h = parseInt(item.start_time.slice(0, 2), 10);
    if (!isNaN(h)) return h;
  }
  return 9; // default fallback 9am
};

// 35 Time Slots (30-Minute Intervals) from 06:00 to 23:00
const TIME_SLOTS = [];
for (let h = 6; h <= 23; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_SLOTS.push(`${hh}:00`);
  if (h < 23) TIME_SLOTS.push(`${hh}:30`);
}


const isRoutineActiveOnDay = (r, dayIndex) => {
  if (!r) return false;
  if (r.is_daily === 1 || r.is_daily === true || r.is_daily === '1') return true;
  if (!r.days || r.days === 'None' || r.days === 'null') return true; // Default active all days if not specified
  try {
    const daysArr = typeof r.days === 'string' ? JSON.parse(r.days) : r.days;
    if (Array.isArray(daysArr)) return daysArr.includes(dayIndex);
  } catch (e) {}
  return true;
};

const isRoutineInSlot = (r, slotStr) => {
  if (!r || !r.start_time) return false;
  const startTime5 = r.start_time.slice(0, 5);
  const startH = parseInt(r.start_time.slice(0, 2), 10);
  const startM = parseInt(r.start_time.slice(3, 5), 10) || 0;
  
  // Exact 30-minute slot match (e.g. 07:00 or 07:30)
  if (startTime5 === slotStr) return true;
  
  // Slot rounding match (if start_time is e.g. 07:15, match nearest 30-min slot 07:00)
  const slotH = parseInt(slotStr.slice(0, 2), 10);
  const slotM = parseInt(slotStr.slice(3, 5), 10);
  if (startH === slotH) {
    if (startM < 30 && slotM === 0) return true;
    if (startM >= 30 && slotM === 30) return true;
  }
  
  // Overnight boundary match at 06:00
  if (startH >= 21 && slotStr === '06:00') return true;
  return false;
};

export default function WeeklyCalendarView() {
  const [selectedWeek, setSelectedWeek] = useState(getISOWeekStr());
  const [data, setData] = useState({ actions: [], routines: [], projects: [], goals: [], visions: [], missions: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [acRes, rtRes, hzRes] = await Promise.all([
        fetch(`${API_URL}/actions`),
        fetch(`${API_URL}/routines?week_id=${selectedWeek}`),
        fetch(`${API_URL}/horizons`)
      ]);
      const actions = await acRes.json();
      const routines = await rtRes.json();
      const horizons = await hzRes.json();

      setData({
        actions: Array.isArray(actions) ? actions : [],
        routines: Array.isArray(routines) ? routines : [],
        projects: horizons.projects || [],
        goals: horizons.goals || [],
        visions: horizons.visions || [],
        missions: horizons.missions || []
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWeek]);

  // Week navigation
  const shiftWeek = (offset) => {
    const parts = selectedWeek.split('-W');
    let year = parseInt(parts[0]);
    let week = parseInt(parts[1]) + offset;

    if (week > 52) { week = 1; year += 1; }
    if (week < 1) { week = 52; year -= 1; }

    setSelectedWeek(`${year}-W${String(week).padStart(2, '0')}`);
  };

  const handleToggleAction = async (action) => {
    const newStatus = action.status === 'Done' ? 'Pending' : 'Done';
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleAssignToDate = async (action, dateKey) => {
    try {
      const scheduledTime = action.scheduled_datetime 
        ? `${dateKey}T${action.scheduled_datetime.slice(11, 16)}` 
        : `${dateKey}T09:00`;

      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_datetime: scheduledTime,
          target_week: selectedWeek
        })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const days = getWeekDays(selectedWeek);
  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  const activeActions = data.actions.filter(a => a.status !== 'Cancelled');
  const assignedActionIds = new Set();

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in">
      
      {/* Header Controls Bar */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-1">
            <i className="fa-solid fa-calendar-week"></i> Weekly Timeline Grid
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-calendar-check text-amber-400"></i> Lịch Tuần ({selectedWeek})
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Phân bổ chính xác theo từng khung giờ (06:00 đến 23:00) chuẩn khớp giữa Trục Giờ & Cột Ngày.
          </p>
        </div>

        {/* Week Switcher */}
        <div className="flex items-center gap-2 bg-slate-800/90 p-2 rounded-2xl border border-slate-700/80 shadow-inner">
          <button 
            onClick={() => shiftWeek(-1)}
            className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold transition-all text-xs"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <span className="font-black text-sm text-indigo-300 px-3 py-1 bg-slate-900/80 rounded-xl border border-indigo-500/30">
            {selectedWeek}
          </span>

          <button 
            onClick={() => shiftWeek(1)}
            className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold transition-all text-xs"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>

          {selectedWeek !== getISOWeekStr() && (
            <button 
              onClick={() => setSelectedWeek(getISOWeekStr())}
              className="text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl transition-all shadow-md ml-1"
            >
              Về Tuần Này
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>
      ) : (
        <>
          
      {/* 7-COLOR TYPE LEGEND BANNER (BẢNG NHẬN DIỆN MÀU 7 PHÂN LOẠI) */}
      <div className="glass-panel p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs font-black">
        <div className="flex items-center gap-2 text-slate-500 uppercase tracking-widest text-[10px] mr-2">
          <i className="fa-solid fa-palette text-indigo-500 text-sm"></i> Chú thích 7 Phân loại:
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-xl shadow-2xs flex items-center gap-1">
            <i className="fa-solid fa-calendar-check text-[10px]"></i> 🟢 Lịch Hẹn
          </span>

          <span className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-2xs flex items-center gap-1">
            <i className="fa-solid fa-arrows-spin text-[10px]"></i> 🔄 Routine
          </span>

          <span className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-xl shadow-2xs flex items-center gap-1">
            <i className="fa-solid fa-hourglass-half text-[10px]"></i> ⏳ Chờ Phản Hồi
          </span>

          <span className="px-2.5 py-1 bg-blue-500 text-white rounded-xl shadow-2xs flex items-center gap-1">
            <i className="fa-solid fa-bolt text-[10px]"></i> ⚡ Next Action
          </span>

          <span className="px-2.5 py-1 bg-cyan-500 text-slate-950 rounded-xl shadow-2xs flex items-center gap-1">
            <i className="fa-solid fa-parachute-box text-[10px]"></i> 🎈 Thả Nổi
          </span>

          <span className="px-2.5 py-1 bg-slate-700 text-slate-100 rounded-xl shadow-2xs flex items-center gap-1">
            <i className="fa-solid fa-lock text-[10px]"></i> 🔒 Đóng Băng
          </span>

          <span className="px-2.5 py-1 bg-indigo-900 text-indigo-200 rounded-xl shadow-2xs flex items-center gap-1">
            <i className="fa-solid fa-cloud-moon text-[10px]"></i> 💤 Someday
          </span>
        </div>
      </div>


          {/* MAIN TIMELINE MATRIX (TẦNG TRÊN: LỊCH CỐ ĐỊNH & ROUTINE KHUNG GIỜ) */}
          <div className="glass-panel p-4 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
            
            {/* 7-DAY HEADERS ROW */}
            <div className="grid grid-cols-8 gap-2 border-b border-slate-200 pb-3 mb-2 min-w-[900px]">
              {/* Top Left Header Cell */}
              <div className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center justify-center bg-slate-100 rounded-xl py-2">
                ⏱️ Khung Giờ
              </div>

              {days.map(day => {
                const isToday = day.dateKey === todayKey;
                return (
                  <div 
                    key={day.dateKey} 
                    className={`p-2 rounded-xl text-center flex flex-col items-center justify-center ${
                      isToday ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <span className="font-black text-xs uppercase tracking-wider">{day.name}</span>
                    <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-200' : 'text-slate-400'}`}>{day.dateFormatted}</span>
                  </div>
                );
              })}
            </div>

            {/* HOURLY ROWS (06:00 ➔ 23:00) */}
            <div className="space-y-1.5 min-w-[900px]">
              {HOURS.map(hour => {
                const hourStr = `${String(hour).padStart(2, '0')}:00`;

                return (
                  <div key={hour} className="grid grid-cols-8 gap-2 items-stretch min-h-[48px] hover:bg-slate-50/80 rounded-xl transition-all p-0.5 border-b border-slate-100">
                    
                    {/* Left Hour Label Slot */}
                    <div className="flex items-center justify-center bg-slate-900 text-slate-200 font-black text-xs rounded-xl shadow-2xs">
                      <span className="text-amber-300">{hourStr}</span>
                    </div>

                    {/* 7 Days cells for this hour */}
                    {days.map(day => {
                      // Filter Calendar Events starting at this hour
                      const hourCalendar = activeActions.filter(a => {
                        if (a.storage_system === 'Calendar' || (a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey))) {
                          if (a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey)) {
                            const h = getItemStartHour(a);
                            if (h === hour) {
                              assignedActionIds.add(a.action_id);
                              return true;
                            }
                          }
                          if (a.storage_system === 'Calendar' && !a.scheduled_datetime && hour === 9) {
                            assignedActionIds.add(a.action_id);
                            return true;
                          }
                        }
                        return false;
                      });

                      // Filter & Deduplicate Routines strictly for selectedWeek slot
                      const rawRoutines = data.routines.filter(r => {
                        if (r.week_id && r.week_id !== selectedWeek && r.week_id !== 'All') return false;
                        const activeDay = isRoutineActiveOnDay(r, day.dayIndex);
                        if (!activeDay) return false;
                        return isRoutineInHourSlot(r, hour);
                      });

                      const hourRoutines = [];
                      const seenRoutineKeys = new Set();
                      for (const r of rawRoutines) {
                        const key = `${r.name || r.title}_${r.start_time}_${r.end_time}`;
                        if (!seenRoutineKeys.has(key)) {
                          seenRoutineKeys.add(key);
                          hourRoutines.push(r);
                        }
                      }

                      // Filter Waiting Items for this 30-minute slot
                      const hourWaiting = activeActions.filter(a => {
                        if (a.storage_system === 'Waiting_For') {
                          if ((a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey)) || (a.defer_until_date && a.defer_until_date.startsWith(day.dateKey))) {
                            const itemTime = (a.scheduled_datetime || a.defer_until_date || '').slice(11, 16);
                            const itemH = parseInt(itemTime.slice(0, 2), 10);
                            const itemM = parseInt(itemTime.slice(3, 5), 10) || 0;
                            if (itemH === slotH) {
                              if (slotM === 0 && itemM < 30) {
                                assignedActionIds.add(a.action_id);
                                return true;
                              }
                              if (slotM === 30 && itemM >= 30) {
                                assignedActionIds.add(a.action_id);
                                return true;
                              }
                            }
                          }
                        }
                        return false;
                      });

                      const hasItems = hourCalendar.length > 0 || hourRoutines.length > 0 || hourWaiting.length > 0;

                      return (
                        <div key={day.dateKey} className={`p-1 rounded-xl border flex flex-col gap-1 transition-all ${hasItems ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/30 border-slate-100/60'}`}>
                          
                          {/* Calendar Events 🟢 / Completed Done ✅ */}
                          {hourCalendar.map(ev => {
                            const isDone = ev.status === 'Done';
                            const startTime = ev.scheduled_datetime ? ev.scheduled_datetime.slice(11, 16) : hourStr;
                            const durText = calcActionDurationText(ev);
                            const compTime = ev.completed_at || ev.last_executed_at;
                            const formattedCompTime = compTime ? compTime.slice(0, 16).replace('T', ' ') : null;

                            return (
                              <div 
                                key={ev.action_id} 
                                className={`p-2 rounded-xl text-[11px] font-bold shadow-md flex flex-col gap-1 animate-fade-in transition-all border ${
                                  isDone 
                                    ? 'bg-gradient-to-r from-emerald-800 to-teal-900 text-white border-amber-400 ring-2 ring-amber-400/50' 
                                    : 'bg-emerald-500 text-slate-950 border-emerald-600'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[9px] font-black">
                                  {isDone ? (
                                    <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black flex items-center gap-1 shadow-xs">
                                      <i className="fa-solid fa-circle-check text-emerald-800"></i> ✅ HOÀN THÀNH
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-700 text-white px-1 rounded flex items-center gap-1">
                                      🟢 LỊCH HẸN • {startTime}
                                    </span>
                                  )}
                                  <span className="bg-amber-300 text-slate-950 px-1 rounded border border-amber-400 font-black">
                                    ⏱️ {durText}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-1">
                                  <span className={`font-black text-xs truncate ${isDone ? 'text-amber-200 line-through' : ''}`}>
                                    {ev.name || ev.title}
                                  </span>
                                </div>

                                {isDone && (
                                  <div className="mt-1 pt-1 border-t border-emerald-600/80 text-[9px] font-black text-amber-200 flex flex-col gap-0.5">
                                    {formattedCompTime && (
                                      <span className="flex items-center gap-1 text-emerald-200">
                                        <i className="fa-solid fa-clock text-amber-300"></i> Hoàn thành: {formattedCompTime}
                                      </span>
                                    )}
                                    {ev.total_focus_mins && (
                                      <span className="text-amber-300">
                                        ⏱️ Tích lũy: {ev.total_focus_mins}m tập trung
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Routines 🔄 */}
                          {hourRoutines.map(r => {
                            const isSleep = (r.title || r.name || '').toLowerCase().includes('ngủ') || (r.title || r.name || '').toLowerCase().includes('nghỉ');
                            const badgeBg = isSleep ? 'bg-gradient-to-r from-indigo-700 to-purple-800 text-white border border-indigo-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400';
                            const icon = isSleep ? 'fa-moon' : 'fa-arrows-spin';
                            const timeSpan = r.start_time && r.end_time ? `${r.start_time}-${r.end_time}` : (r.start_time || `${hourStr}`);

                            return (
                              <div key={r.routine_id} className={`p-1.5 rounded-lg text-[11px] font-bold shadow-xs flex flex-col gap-0.5 animate-fade-in ${badgeBg}`}>
                                <div className="flex items-center justify-between text-[9px] font-black">
                                  <span className="bg-purple-900/60 px-1 rounded flex items-center gap-1 text-[8px] uppercase tracking-wider">
                                    🔄 ROUTINE • {timeSpan}
                                  </span>
                                </div>
                                <span className="truncate font-black flex items-center gap-1">
                                  <i className={`fa-solid ${icon} text-[10px]`}></i> {r.title || r.name}
                                </span>
                              </div>
                            );
                          })}

                          {/* Chờ Phản Hồi ⏳ */}
                          {hourWaiting.map(w => (
                            <div key={w.action_id} className="p-1.5 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-bold shadow-xs flex flex-col gap-0.5">
                              <span className="text-[9px] font-black"><i className="fa-solid fa-hourglass-half mr-1"></i>Chờ: {w.assigned_to || 'N/A'}</span>
                              <span className="truncate">{w.name}</span>
                            </div>
                          ))}

                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TẦNG DƯỚI: CÔNG VIỆC TRONG NGÀY (NEXT ACTIONS, THẢ NỔI, ĐÓNG BĂNG, SOMEDAY) */}
          <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm mt-2">
            <div className="border-b pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-layer-group text-blue-600"></i> 👇 Tầng Dưới (Công Việc Trong Ngày: Next Actions, Thả Nổi, Đóng Băng, Someday)
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border">
                Các việc linh hoạt phân bố theo ngày từ Thứ 2 đến Chủ Nhật
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {days.map(day => {
                const dayNext = activeActions.filter(a => a.storage_system === 'Next_Actions' && a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey));
                const dayFloating = activeActions.filter(a => a.storage_system === 'Floating_Backlog' && a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey));
                const dayDeferred = activeActions.filter(a => a.storage_system === 'Deferred' && a.defer_until_date && a.defer_until_date.startsWith(day.dateKey));
                const daySomeday = activeActions.filter(a => a.storage_system === 'Someday_Maybe' && a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey));

                dayNext.forEach(a => assignedActionIds.add(a.action_id));
                dayFloating.forEach(a => assignedActionIds.add(a.action_id));
                dayDeferred.forEach(a => assignedActionIds.add(a.action_id));
                daySomeday.forEach(a => assignedActionIds.add(a.action_id));

                return (
                  <div key={day.dateKey} className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col gap-2 min-h-[140px]">
                    <div className="font-black text-xs text-indigo-900 border-b border-indigo-100 pb-1 flex justify-between">
                      <span>{day.name}</span>
                      <span className="text-[10px] text-indigo-400">{day.dateFormatted}</span>
                    </div>

                    {/* Next Actions ⚡ */}
                    {dayNext.map(a => (
                      <div key={a.action_id} className="p-1.5 rounded-lg bg-blue-50 text-blue-950 border border-blue-200 text-[11px] font-bold shadow-2xs flex items-center justify-between gap-1">
                        <button onClick={() => handleToggleAction(a)} className="w-3.5 h-3.5 rounded border border-blue-400 flex items-center justify-center shrink-0 hover:bg-blue-500 hover:text-white">
                          {a.status === 'Done' && <i className="fa-solid fa-check text-[8px]"></i>}
                        </button>
                        <span className="truncate flex-1">{a.name}</span>
                        <span className="text-[8px] font-black bg-blue-200 text-blue-800 px-1 py-0.2 rounded shrink-0">⚡ NA</span>
                      </div>
                    ))}

                    {/* Thả Nổi 🎈 */}
                    {dayFloating.map(a => (
                      <div key={a.action_id} className="p-1.5 rounded-lg bg-cyan-50 text-cyan-950 border border-cyan-200 text-[11px] font-bold shadow-2xs flex items-center justify-between gap-1">
                        <span className="truncate flex-1"><i className="fa-solid fa-parachute-box text-cyan-600 mr-1"></i>{a.name}</span>
                        <span className="text-[8px] font-black bg-cyan-200 text-cyan-800 px-1 py-0.2 rounded shrink-0">🎈 Nổi</span>
                      </div>
                    ))}

                    {/* Đóng Băng 🔒 */}
                    {dayDeferred.map(a => (
                      <div key={a.action_id} className="p-1.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-bold shadow-2xs flex items-center justify-between gap-1">
                        <span className="truncate flex-1"><i className="fa-solid fa-lock text-slate-500 mr-1"></i>{a.name}</span>
                        <span className="text-[8px] font-black bg-slate-300 text-slate-700 px-1 py-0.2 rounded shrink-0">🔒 Khóa</span>
                      </div>
                    ))}

                    {/* Someday 💤 */}
                    {daySomeday.map(a => (
                      <div key={a.action_id} className="p-1.5 rounded-lg bg-purple-50 text-purple-950 border border-purple-200 text-[11px] font-bold shadow-2xs flex items-center justify-between gap-1">
                        <span className="truncate flex-1"><i className="fa-solid fa-cloud-moon text-purple-500 mr-1"></i>{a.name}</span>
                        <span className="text-[8px] font-black bg-purple-200 text-purple-800 px-1 py-0.2 rounded shrink-0">💤 Ý tưởng</span>
                      </div>
                    ))}

                    {dayNext.length === 0 && dayFloating.length === 0 && dayDeferred.length === 0 && daySomeday.length === 0 && (
                      <div className="text-center py-4 text-slate-400 text-[9px] italic">
                        Trống việc linh hoạt
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: WEEKLY BACKLOG POOL */}
          <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm mt-4">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-boxes-packing text-indigo-600"></i> Danh Sách Chờ Trong Tuần ({selectedWeek} - Chưa Gán Ngày Cụ Thể)
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border">
                Tự động gom từ Next Actions, Thả nổi, Đóng băng, Someday...
              </span>
            </div>

            {(() => {
              const unassignedWeeklyActions = activeActions.filter(a => {
                if (assignedActionIds.has(a.action_id)) return false;
                if (a.target_week === selectedWeek) return true;
                if (!a.scheduled_datetime && a.storage_system !== 'Inbox') return true;
                return false;
              });

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unassignedWeeklyActions.map(a => {
                    return (
                      <div key={a.action_id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs flex flex-col justify-between gap-2 hover:border-indigo-300 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleToggleAction(a)} className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center shrink-0 hover:bg-emerald-500 hover:text-white">
                              {a.status === 'Done' && <i className="fa-solid fa-check text-xs"></i>}
                            </button>
                            <span className="font-bold text-xs text-slate-800 truncate">{a.name}</span>
                          </div>
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">
                            {a.storage_system}
                          </span>
                        </div>

                        {/* Quick Day Assign Buttons */}
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pt-2 border-t border-slate-200/60">
                          <span className="text-[9px] font-black text-slate-400 uppercase mr-1">Gán ngày:</span>
                          {days.map(d => (
                            <button
                              key={d.dateKey}
                              type="button"
                              onClick={() => handleAssignToDate(a, d.dateKey)}
                              className="px-1.5 py-0.5 bg-white hover:bg-indigo-600 hover:text-white text-slate-600 text-[9px] font-black rounded border border-slate-200 transition-all shrink-0"
                              title={`Gán việc này vào ${d.name} (${d.dateFormatted})`}
                            >
                              +{d.name.replace('Thứ ', 'T')}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {unassignedWeeklyActions.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-400 font-medium text-xs">
                      🎉 Toàn bộ công việc trong tuần đã được gán ngày cụ thể trên Lịch 7 Ngày!
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
