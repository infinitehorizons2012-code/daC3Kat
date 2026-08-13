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

    // Compute Monday of the ISO week
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

export default function WeeklyCalendarView() {
  const [selectedWeek, setSelectedWeek] = useState(getISOWeekStr());
  const [data, setData] = useState({ actions: [], routines: [], projects: [], goals: [], visions: [], missions: [] });
  const [loading, setLoading] = useState(true);
  const [editingAction, setEditingAction] = useState(null);

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

  // Quick Assign Action to specific date
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

  // Categorize actions
  const activeActions = data.actions.filter(a => a.status !== 'Done' && a.status !== 'Cancelled');
  
  // Track assigned action IDs across 7 days
  const assignedActionIds = new Set();

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in">
      
      {/* Header Controls Bar */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-1">
            <i className="fa-solid fa-calendar-week"></i> Master Weekly Calendar
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-amber-400"></i> Lịch Tuần Master ({selectedWeek})
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Quản lý tổng hòa Lịch hẹn cố định, Routine thói quen, Chờ phản hồi & Công việc từng ngày từ Thứ 2 đến Chủ Nhật.
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
          {/* 7-DAY COLUMN GRID (Thứ 2 đến Chủ Nhật) */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {days.map((day) => {
              const isToday = day.dateKey === todayKey;

              // Filter actions for this specific day dateKey
              const dayCalendar = activeActions.filter(a => {
                if (a.storage_system === 'Calendar' || (a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey))) {
                  if (a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey)) {
                    assignedActionIds.add(a.action_id);
                    return true;
                  }
                  if (a.storage_system === 'Calendar' && !a.scheduled_datetime) {
                    assignedActionIds.add(a.action_id);
                    return true;
                  }
                }
                return false;
              });

              const dayWaiting = activeActions.filter(a => {
                if (a.storage_system === 'Waiting_For') {
                  if ((a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey)) || (a.defer_until_date && a.defer_until_date.startsWith(day.dateKey))) {
                    assignedActionIds.add(a.action_id);
                    return true;
                  }
                }
                return false;
              });

              const dayNext = activeActions.filter(a => {
                if (a.storage_system === 'Next_Actions' && a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey)) {
                  assignedActionIds.add(a.action_id);
                  return true;
                }
                return false;
              });

              const dayFloating = activeActions.filter(a => {
                if (a.storage_system === 'Floating_Backlog' && a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey)) {
                  assignedActionIds.add(a.action_id);
                  return true;
                }
                return false;
              });

              const dayDeferred = activeActions.filter(a => {
                if (a.storage_system === 'Deferred' && a.defer_until_date && a.defer_until_date.startsWith(day.dateKey)) {
                  assignedActionIds.add(a.action_id);
                  return true;
                }
                return false;
              });

              const daySomeday = activeActions.filter(a => {
                if (a.storage_system === 'Someday_Maybe' && a.scheduled_datetime && a.scheduled_datetime.startsWith(day.dateKey)) {
                  assignedActionIds.add(a.action_id);
                  return true;
                }
                return false;
              });

              // Filter routines active for this day index
              const dayRoutines = data.routines.filter(r => r.is_daily || (r.days && r.days.includes(day.dayIndex)));

              return (
                <div 
                  key={day.dateKey}
                  className={`glass-panel p-3 rounded-2xl border flex flex-col justify-between transition-all min-h-[480px] shadow-sm ${
                    isToday 
                      ? 'bg-gradient-to-b from-indigo-50/90 to-white border-indigo-300 ring-2 ring-indigo-400/80 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  {/* Column Header */}
                  <div className="border-b pb-2.5 mb-3 flex justify-between items-center">
                    <div>
                      <h4 className={`font-black text-sm uppercase tracking-wide ${isToday ? 'text-indigo-700' : 'text-slate-800'}`}>
                        {day.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">{day.dateFormatted}</span>
                    </div>
                    {isToday && (
                      <span className="text-[9px] font-black uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                        Hôm nay
                      </span>
                    )}
                  </div>

                  {/* Scrollable Day Content */}
                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 max-h-[420px]">
                    
                    {/* SECTION 1: LỊCH HẸN & ROUTINE & CHỜ PHẢN HỒI (CỐ ĐỊNH) */}
                    <div className="space-y-1.5">
                      
                      {/* Lịch Hẹn 🟢 */}
                      {dayCalendar.map(ev => {
                        const startTime = ev.scheduled_datetime ? ev.scheduled_datetime.slice(11, 16) : '00:00';
                        const durText = calcActionDurationText(ev);
                        return (
                          <div key={ev.action_id} className="p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold shadow-2xs flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-black shrink-0">{startTime}</span>
                              <span className="text-[9px] bg-amber-300 text-slate-950 px-1 rounded font-black shrink-0">⏱️ {durText}</span>
                            </div>
                            <span className="truncate text-slate-800">{ev.name}</span>
                          </div>
                        );
                      })}

                      {/* Routines 🔄 */}
                      {dayRoutines.map(r => (
                        <div key={r.routine_id} className="p-1.5 rounded-xl bg-pink-50 text-pink-800 border border-pink-200 text-[11px] font-bold shadow-2xs flex items-center justify-between gap-1">
                          <span className="truncate flex items-center gap-1">
                            <i className="fa-solid fa-arrows-spin text-pink-500 text-[10px]"></i> {r.title || r.name}
                          </span>
                          <span className="text-[9px] bg-pink-100 text-pink-700 px-1 rounded shrink-0">{r.start_time || 'Routine'}</span>
                        </div>
                      ))}

                      {/* Chờ phản hồi ⏳ */}
                      {dayWaiting.map(w => (
                        <div key={w.action_id} className="p-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold shadow-2xs flex flex-col gap-0.5">
                          <span className="text-[9px] text-amber-600 font-black uppercase"><i className="fa-solid fa-hourglass-half mr-1"></i>Chờ: {w.assigned_to || 'N/A'}</span>
                          <span className="truncate">{w.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* SECTION 2: CÔNG VIỆC TRONG NGÀY (NEXT ACTIONS / THẢ NỔI / ĐÓNG BĂNG / SOMEDAY) */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      
                      {/* Next Actions ⚡ */}
                      {dayNext.map(a => (
                        <div key={a.action_id} className="p-2 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold shadow-2xs flex items-center justify-between gap-2 group">
                          <button onClick={() => handleToggleAction(a)} className="w-4 h-4 rounded border border-blue-400 flex items-center justify-center shrink-0 hover:bg-blue-500 hover:text-white">
                            {a.status === 'Done' && <i className="fa-solid fa-check text-[9px]"></i>}
                          </button>
                          <span className="truncate flex-1 text-slate-800">{a.name}</span>
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded shrink-0">⚡</span>
                        </div>
                      ))}

                      {/* Thả Nổi 🎈 */}
                      {dayFloating.map(a => (
                        <div key={a.action_id} className="p-1.5 rounded-xl bg-cyan-50 text-cyan-900 border border-cyan-200 text-[11px] font-bold shadow-2xs flex items-center justify-between gap-1">
                          <span className="truncate"><i className="fa-solid fa-parachute-box text-cyan-600 mr-1"></i>{a.name}</span>
                        </div>
                      ))}

                      {/* Đóng Băng 🔒 */}
                      {dayDeferred.map(a => (
                        <div key={a.action_id} className="p-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-bold shadow-2xs flex items-center justify-between gap-1">
                          <span className="truncate"><i className="fa-solid fa-lock text-slate-500 mr-1"></i>{a.name}</span>
                        </div>
                      ))}

                      {/* Someday 💤 */}
                      {daySomeday.map(a => (
                        <div key={a.action_id} className="p-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-bold shadow-2xs flex items-center justify-between gap-1">
                          <span className="truncate"><i className="fa-solid fa-cloud-moon text-purple-500 mr-1"></i>{a.name}</span>
                        </div>
                      ))}

                    </div>

                    {/* Empty Day Indicator */}
                    {dayCalendar.length === 0 && dayRoutines.length === 0 && dayWaiting.length === 0 && dayNext.length === 0 && dayFloating.length === 0 && dayDeferred.length === 0 && daySomeday.length === 0 && (
                      <div className="text-center py-8 text-slate-300 text-[11px] italic">
                        Trống lịch
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SECTION 3: WEEKLY BACKLOG POOL (CÁC CÔNG VIỆC THUỘC TUẦN NÀY NHƯNG CHƯA GÁN NGÀY CỤ THỂ) */}
          <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm mt-4">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-boxes-packing text-indigo-600"></i> Danh Sách Chờ Trong Tuần ({selectedWeek} - Chưa Gán Ngày Cụ Thể)
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border">
                Tự động gom từ Next Actions, Thả nổi, Đóng băng, Someday...
              </span>
            </div>

            {/* List of Unassigned Actions for this Week */}
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
                    const project = data.projects.find(p => p.project_id === a.project_id);
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
