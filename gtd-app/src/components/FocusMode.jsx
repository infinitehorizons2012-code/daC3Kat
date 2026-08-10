import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function FocusMode() {
  const [context, setContext] = useState('@Máy_tính');
  const [time, setTime] = useState('60');
  const [energy, setEnergy] = useState('High');
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unplannedInput, setUnplannedInput] = useState('');

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/actions/next?context=${encodeURIComponent(context)}&time=${time}&energy=${energy}`);
      const data = await res.json();
      if (data.data) {
        setActions(data.data);
      } else {
        setActions([]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActions();
  }, [context, time, energy]);

  const handleAddUnplanned = async (e) => {
    e.preventDefault();
    if (!unplannedInput.trim()) return;
    
    try {
      await fetch(`${API_URL}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: unplannedInput,
          area_id: 'AREA-DEFAULT', // Dummy for now
          work_type: 'Unplanned Work',
          context: '@Bất_kỳ',
          time_needed_mins: 15,
          energy_level: 'Medium'
        })
      });
      setUnplannedInput('');
      fetchActions();
    } catch (e) {
      console.error(e);
    }
  };

  const markComplete = async (actionId) => {
    try {
      await fetch(`${API_URL}/actions/${actionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Done' })
      });
      fetchActions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Quick Add Unplanned */}
      <form onSubmit={handleAddUnplanned} className="glass-panel p-4 rounded-2xl flex gap-4 items-center">
        <input 
          type="text" 
          value={unplannedInput}
          onChange={(e) => setUnplannedInput(e.target.value)}
          placeholder="Nhập nhanh việc Đột Xuất (Unplanned Work)..."
          className="flex-1 bg-white/50 border border-white/60 rounded-xl px-4 py-2 outline-none focus:ring-2 ring-pink-400"
        />
        <button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-lg">
          <i className="fa-solid fa-bolt mr-2"></i> Thêm việc
        </button>
      </form>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
        <h2 className="font-bold text-lg text-slate-800"><i className="fa-solid fa-filter text-primary"></i> Bộ lọc thực thi</h2>
        <div className="flex gap-4">
          <select value={context} onChange={e => setContext(e.target.value)} className="bg-white/70 border-white/50 rounded-lg p-2 outline-none">
            <option value="@Máy_tính">@Máy_tính</option>
            <option value="@Bàn_học">@Bàn_học</option>
            <option value="@Điện_thoại">@Điện_thoại</option>
            <option value="@Bất_kỳ">@Bất_kỳ</option>
          </select>
          <select value={time} onChange={e => setTime(e.target.value)} className="bg-white/70 border-white/50 rounded-lg p-2 outline-none">
            <option value="15">Dưới 15 phút</option>
            <option value="30">Dưới 30 phút</option>
            <option value="60">Dưới 60 phút</option>
            <option value="120">Dưới 120 phút</option>
          </select>
          <select value={energy} onChange={e => setEnergy(e.target.value)} className="bg-white/70 border-white/50 rounded-lg p-2 outline-none">
            <option value="High">Năng lượng Cao</option>
            <option value="Medium">Năng lượng Trung bình</option>
            <option value="Low">Năng lượng Thấp</option>
          </select>
        </div>
      </div>

      {/* Action List */}
      <div className="glass-panel p-6 rounded-2xl min-h-[300px]">
        {loading ? (
          <div className="text-center text-slate-500 py-10"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>
        ) : actions.length === 0 ? (
          <div className="text-center text-slate-500 py-10 italic">Không có công việc nào phù hợp với bối cảnh này. Bạn có thể nghỉ ngơi! 🎉</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {actions.map(action => (
              <li key={action.action_id} className={`p-4 rounded-xl flex items-center justify-between border ${action.work_type === 'Unplanned Work' ? 'bg-pink-50 border-pink-200' : 'bg-white/60 border-white/80'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => markComplete(action.action_id)} className="w-6 h-6 rounded border-2 border-slate-300 hover:border-green-500 flex items-center justify-center transition-colors">
                    <i className="fa-solid fa-check text-transparent hover:text-green-500 text-sm"></i>
                  </button>
                  <span className={`font-medium ${action.work_type === 'Unplanned Work' ? 'text-pink-800' : 'text-slate-800'}`}>{action.name}</span>
                  {action.work_type === 'Unplanned Work' && <span className="text-xs bg-pink-200 text-pink-700 px-2 py-1 rounded font-bold">Đột xuất</span>}
                </div>
                <div className="flex gap-2 text-xs text-slate-500 font-medium">
                  <span className="bg-slate-100 px-2 py-1 rounded">{action.context}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded"><i className="fa-regular fa-clock"></i> {action.time_needed_mins}m</span>
                  <span className="bg-slate-100 px-2 py-1 rounded"><i className="fa-solid fa-bolt"></i> {action.energy_level}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
