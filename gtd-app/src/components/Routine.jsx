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

const DAYS_OF_WEEK = [
  { id: 'all', label: 'Tất cả các ngày' },
  { id: 'Mon', label: 'Thứ 2' },
  { id: 'Tue', label: 'Thứ 3' },
  { id: 'Wed', label: 'Thứ 4' },
  { id: 'Thu', label: 'Thứ 5' },
  { id: 'Fri', label: 'Thứ 6' },
  { id: 'Sat', label: 'Thứ 7' },
  { id: 'Sun', label: 'Chủ Nhật' },
];

export default function Routine() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('all');
  const [weekOffset, setWeekOffset] = useState(0);

  const selectedWeek = getWeekString(weekOffset);

  // Form State
  const [form, setForm] = useState({
    name: '',
    start_time: '06:00',
    end_time: '07:00',
    session: 'morning',
    day_of_week: 'all',
    habit_note: ''
  });
  const [editId, setEditId] = useState(null);

  const fetchRoutines = async () => {
    try {
      const res = await fetch(`${API_URL}/routines`);
      const data = await res.json();
      setRoutines(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.start_time || !form.end_time) return alert("Vui lòng nhập đầy đủ tên và khung giờ!");

    const payload = {
      ...form,
      week_id: selectedWeek
    };

    try {
      if (editId) {
        await fetch(`${API_URL}/routines/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_URL}/routines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      setForm({ name: '', start_time: '06:00', end_time: '07:00', session: 'morning', day_of_week: 'all', habit_note: '' });
      setEditId(null);
      fetchRoutines();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (r) => {
    setEditId(r.routine_id);
    setForm({
      name: r.name,
      start_time: r.start_time,
      end_time: r.end_time,
      session: r.session || 'morning',
      day_of_week: r.day_of_week || 'all',
      habit_note: r.habit_note || ''
    });
    setTimeout(() => {
      document.getElementById('routine-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa routine này?")) return;
    try {
      await fetch(`${API_URL}/routines/${id}`, { method: 'DELETE' });
      fetchRoutines();
    } catch (e) { console.error(e); }
  };

  // Helper to convert HH:MM to decimal hours (0 to 24)
  const timeToHours = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  // Filter routines by selected day & week
  const filteredRoutines = routines.filter(r => {
    const matchDay = selectedDay === 'all' || r.day_of_week === 'all' || r.day_of_week === selectedDay;
    const matchWeek = !r.week_id || r.week_id === selectedWeek;
    return matchDay && matchWeek;
  });

  // Calculate routine duration in minutes/hours
  const calcDurationHrs = (start, end) => {
    let s = timeToHours(start);
    let e = timeToHours(end);
    if (e < s) e += 24; // overnight
    return Math.max(0, e - s);
  };

  const totalDailyRoutineHrs = filteredRoutines.reduce((sum, r) => sum + calcDurationHrs(r.start_time, r.end_time), 0);
  const totalWeeklyRoutineHrs = Math.round(totalDailyRoutineHrs * 7 * 10) / 10;
  const available168Hrs = Math.max(0, Math.round((168 - totalWeeklyRoutineHrs) * 10) / 10);

  // Split into Morning (00:00 - 12:00) and Evening (12:00 - 24:00) with Cross-Noon support
  const morningRoutines = filteredRoutines.filter(r => {
    const sH = timeToHours(r.start_time);
    return r.session === 'morning' || r.session === 'both' || sH < 12;
  });

  const eveningRoutines = filteredRoutines.filter(r => {
    const sH = timeToHours(r.start_time);
    const eH = timeToHours(r.end_time);
    return r.session === 'evening' || r.session === 'both' || eH > 12 || sH >= 12;
  });

  // SVG Clock Donut Generator
  const renderClockCircle = (sessionRoutines, isMorning) => {
    const radius = 100;
    const strokeWidth = 32;
    const center = 140;
    const circumference = 2 * Math.PI * radius;

    const baseStartHour = isMorning ? 0 : 12; // Morning 0-12, Evening 12-24

    const colors = [
      '#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', 
      '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#eab308'
    ];

    return (
      <div className="relative flex flex-col items-center justify-center p-4">
        <svg width="280" height="280" className="transform -rotate-90">
          {/* Base background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Hour markers ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const x1 = center + (radius - 16) * Math.cos(angle);
            const y1 = center + (radius - 16) * Math.sin(angle);
            const x2 = center + (radius + 16) * Math.cos(angle);
            const y2 = center + (radius + 16) * Math.sin(angle);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" />
            );
          })}

          {/* Routine Sectors Arcs with Precise Clamping for Cross-Noon (e.g. 11:00 - 13:30) */}
          {sessionRoutines.map((r, idx) => {
            const rawStart = timeToHours(r.start_time);
            let rawEnd = timeToHours(r.end_time);
            if (rawEnd < rawStart) rawEnd += 24; // overnight

            const minHour = isMorning ? 0 : 12;
            const maxHour = isMorning ? 12 : 24;

            const clampedStart = Math.max(minHour, Math.min(maxHour, rawStart)) - minHour;
            const clampedEnd = Math.max(minHour, Math.min(maxHour, rawEnd)) - minHour;
            const duration = Math.max(0, clampedEnd - clampedStart);

            if (duration <= 0) return null;

            const dashLength = (duration / 12) * circumference;
            const dashOffset = -((clampedStart / 12) * circumference);
            const color = colors[idx % colors.length];

            return (
              <circle
                key={r.routine_id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all hover:opacity-80 cursor-pointer"
              />
            );
          })}
        </svg>

        {/* Hour Labels on Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <i className={`fa-solid ${isMorning ? 'fa-sun text-amber-500' : 'fa-moon text-indigo-500'} text-3xl mb-1`}></i>
          <span className="font-black text-slate-800 text-base">{isMorning ? 'BUỔI SÁNG' : 'BUỔI TỐI'}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{isMorning ? '00:00 - 12:00' : '12:00 - 24:00'}</span>
          <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full mt-1">
            {sessionRoutines.length} thói quen
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 text-pink-100 text-xs font-black uppercase tracking-widest mb-1">
            <i className="fa-solid fa-arrows-spin"></i> Routine & Habit Clock Matrix
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-clock text-yellow-200"></i> Quản Lý Routine & Thói Quen Cố Định
          </h2>
          <p className="text-xs text-pink-100 mt-1 font-medium max-w-2xl">
            Biểu diễn 2 Vòng tròn Phân giờ (Sáng/Tối) và tự động trừ số giờ Routine khỏi quỹ 168h để nạp vào Dạ Dày Tuần!
          </p>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center gap-2 bg-white/20 p-2 rounded-2xl backdrop-blur-md self-start md:self-auto">
          <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/40 text-white flex items-center justify-center font-bold transition-colors">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <span className="font-black text-sm px-2 text-yellow-200 tracking-wider">{selectedWeek}</span>
          <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/40 text-white flex items-center justify-center font-bold transition-colors">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-[10px] font-bold bg-white text-rose-600 px-2.5 py-1 rounded-lg ml-1 shadow-sm">Về tuần này</button>
          )}
        </div>
      </div>

      {/* 168H Deducted Capacity Card */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200 bg-white shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-pink-50 rounded-2xl border border-pink-100">
          <div className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">Giờ Routine Ngày</div>
          <div className="text-2xl font-black text-pink-700">{Math.round(totalDailyRoutineHrs * 10) / 10}h <span className="text-xs text-pink-400 font-normal">/ ngày</span></div>
        </div>
        <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
          <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Tổng Routine Tuần (7 Ngày)</div>
          <div className="text-2xl font-black text-rose-700">{totalWeeklyRoutineHrs}h <span className="text-xs text-rose-400 font-normal">/ 168h</span></div>
        </div>
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Sức Chứa Nạp Vào Dạ Dày</div>
          <div className="text-2xl font-black text-emerald-700">{available168Hrs}h <span className="text-xs text-emerald-500 font-normal">Rảnh thực tế</span></div>
        </div>
      </div>

      {/* Day Filter Bar */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto custom-scrollbar gap-1">
        {DAYS_OF_WEEK.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDay(d.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedDay === d.id ? 'bg-white text-rose-600 shadow-sm border border-slate-200 font-black' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* 2 CLOCK CIRCLES DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Morning Circle */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col items-center">
          <h3 className="font-black text-amber-800 text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
            <i className="fa-solid fa-sun text-amber-500"></i> Vòng Tròn Phân Giờ Buổi Sáng
          </h3>
          {renderClockCircle(morningRoutines, true)}

          {/* List legend */}
          <div className="w-full space-y-2 mt-4">
            {morningRoutines.map(r => (
              <div key={r.routine_id} className="p-2.5 bg-white border border-amber-100 rounded-xl flex justify-between items-center text-xs shadow-2xs hover:border-amber-300">
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{r.start_time} - {r.end_time}</span>
                  <span className="font-bold text-slate-800">{r.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.habit_note && <span className="text-[10px] text-slate-400 italic">💡 {r.habit_note}</span>}
                  <button onClick={() => handleEdit(r)} className="text-slate-400 hover:text-blue-600 p-1" title="Chỉnh sửa"><i className="fa-solid fa-pen text-xs"></i></button>
                </div>
              </div>
            ))}
            {morningRoutines.length === 0 && <p className="text-center text-slate-400 py-4 text-xs italic">Chưa có routine buổi sáng nào.</p>}
          </div>
        </div>

        {/* Evening Circle */}
        <div className="glass-panel p-6 rounded-3xl border border-indigo-200 bg-indigo-50/20 shadow-sm flex flex-col items-center">
          <h3 className="font-black text-indigo-800 text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
            <i className="fa-solid fa-moon text-indigo-500"></i> Vòng Tròn Phân Giờ Buổi Tối
          </h3>
          {renderClockCircle(eveningRoutines, false)}

          {/* List legend */}
          <div className="w-full space-y-2 mt-4">
            {eveningRoutines.map(r => (
              <div key={r.routine_id} className="p-2.5 bg-white border border-indigo-100 rounded-xl flex justify-between items-center text-xs shadow-2xs hover:border-indigo-300">
                <div className="flex items-center gap-2">
                  <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{r.start_time} - {r.end_time}</span>
                  <span className="font-bold text-slate-800">{r.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.habit_note && <span className="text-[10px] text-slate-400 italic">💡 {r.habit_note}</span>}
                  <button onClick={() => handleEdit(r)} className="text-slate-400 hover:text-blue-600 p-1" title="Chỉnh sửa"><i className="fa-solid fa-pen text-xs"></i></button>
                </div>
              </div>
            ))}
            {eveningRoutines.length === 0 && <p className="text-center text-slate-400 py-4 text-xs italic">Chưa có routine buổi tối nào.</p>}
          </div>
        </div>
      </div>

      {/* FORM & ROUTINE MANAGEMENT TABLE */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-2">
          <i className="fa-solid fa-pen-to-square text-rose-500"></i> {editId ? 'Chỉnh Sửa Routine' : 'Thêm Routine Mới'}
        </h3>

        {/* Add/Edit Form */}
        <form onSubmit={handleSubmit} id="routine-form" className={`grid grid-cols-1 md:grid-cols-6 gap-3 mb-6 p-4 rounded-2xl border transition-all ${editId ? 'bg-rose-50 border-rose-400 ring-4 ring-rose-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tên hoạt động / Habit</label>
            <input 
              type="text" 
              required 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              placeholder="VD: Thiền & Tập thể thao..." 
              className="w-full p-2 text-xs border rounded-xl outline-none focus:border-rose-400 font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bắt đầu</label>
            <input 
              type="time" 
              required 
              value={form.start_time} 
              onChange={e => setForm({ ...form, start_time: e.target.value })} 
              className="w-full p-2 text-xs border rounded-xl outline-none focus:border-rose-400 font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kết thúc</label>
            <input 
              type="time" 
              required 
              value={form.end_time} 
              onChange={e => setForm({ ...form, end_time: e.target.value })} 
              className="w-full p-2 text-xs border rounded-xl outline-none focus:border-rose-400 font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Buổi / Phân Khung</label>
            <select 
              value={form.session} 
              onChange={e => setForm({ ...form, session: e.target.value })} 
              className="w-full p-2 text-xs border rounded-xl outline-none focus:border-rose-400 font-bold"
            >
              <option value="morning">Sáng (00:00 - 12:00)</option>
              <option value="evening">Tối (12:00 - 24:00)</option>
              <option value="both">Bắc cầu Sáng & Tối (vd: 11:00 - 13:30)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lặp lại</label>
            <select 
              value={form.day_of_week} 
              onChange={e => setForm({ ...form, day_of_week: e.target.value })} 
              className="w-full p-2 text-xs border rounded-xl outline-none focus:border-rose-400 font-bold"
            >
              {DAYS_OF_WEEK.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>

          <div className="md:col-span-5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ghi chú Habit (Mẹo/Quy tắc thực hiện)</label>
            <input 
              type="text" 
              value={form.habit_note} 
              onChange={e => setForm({ ...form, habit_note: e.target.value })} 
              placeholder="VD: Uống 500ml nước ấm + không bật điện thoại trong 30m đầu..." 
              className="w-full p-2 text-xs border rounded-xl outline-none focus:border-rose-400"
            />
          </div>

          <div className="flex items-end gap-2">
            <button type="submit" className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs transition-all shadow-md">
              {editId ? 'Lưu Sửa' : 'Thêm Routine'}
            </button>
            {editId && (
              <button 
                type="button" 
                onClick={() => { setEditId(null); setForm({ name: '', start_time: '06:00', end_time: '07:00', session: 'morning', day_of_week: 'all', habit_note: '' }); }} 
                className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Hủy
              </button>
            )}
          </div>
        </form>

        {/* Routine Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[650px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider">
                <th className="p-3 w-32">Khung Giờ</th>
                <th className="p-3">Hoạt Động Routine</th>
                <th className="p-3 w-24">Buổi</th>
                <th className="p-3 w-32">Áp Dụng</th>
                <th className="p-3">Ghi Chú Habit</th>
                <th className="p-3 w-24 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRoutines.map(r => (
                <tr key={r.routine_id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-black text-rose-600">
                    <span className="bg-rose-50 px-2 py-1 rounded border border-rose-100">{r.start_time} - {r.end_time}</span>
                  </td>
                  <td className="p-3 font-bold text-slate-800">{r.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.session === 'evening' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.session === 'evening' ? 'Tối' : 'Sáng'}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-600">
                    {DAYS_OF_WEEK.find(d => d.id === r.day_of_week)?.label || r.day_of_week}
                  </td>
                  <td className="p-3 text-slate-500 italic">
                    {r.habit_note ? `💡 ${r.habit_note}` : '—'}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleEdit(r)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded" title="Sửa"><i className="fa-solid fa-pen"></i></button>
                      <button onClick={() => handleDelete(r.routine_id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded" title="Xóa"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRoutines.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">Chưa có routine nào được thiết lập. Hãy nhập ở form trên!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
