import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function FocusMode() {
  const [context, setContext] = useState('@Máy_tính');
  const [time, setTime] = useState('60');
  const [energy, setEnergy] = useState('High');
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unplannedInput, setUnplannedInput] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    work_type: 'Defined Work',
    context: '@Máy_tính',
    time_needed_mins: 15,
    energy_level: 'Medium'
  });

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
          area_id: 'AREA-DEFAULT',
          work_type: 'Unplanned Work',
          context: context,
          time_needed_mins: parseInt(time),
          energy_level: energy
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
      <div className="flex gap-4 items-center">
        <form onSubmit={handleAddUnplanned} className="glass-panel p-4 rounded-2xl flex gap-4 items-center flex-1">
          <input 
            type="text" 
            value={unplannedInput}
            onChange={(e) => setUnplannedInput(e.target.value)}
            placeholder="Nhập nhanh việc Đột Xuất (Unplanned Work)..."
            className="flex-1 bg-white/50 border border-white/60 rounded-xl px-4 py-2 outline-none focus:ring-2 ring-pink-400"
          />
          <button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-lg whitespace-nowrap">
            <i className="fa-solid fa-bolt mr-2"></i> Thêm đột xuất
          </button>
        </form>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-colors shadow-lg whitespace-nowrap">
          <i className="fa-solid fa-plus mr-2"></i> Thêm việc chuẩn
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[500px]">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Thêm công việc mới</h3>
            <div className="flex flex-col gap-4 mb-6">
              <input 
                type="text" placeholder="Tên công việc..." 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Loại công việc</label>
                  <select value={formData.work_type} onChange={e => setFormData({...formData, work_type: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2">
                    <option value="Defined Work">Defined Work (Đã xác định)</option>
                    <option value="Defining Work">Defining Work (Đang xác định)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Bối cảnh</label>
                  <select value={formData.context} onChange={e => setFormData({...formData, context: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2">
                    <option value="@Máy_tính">@Máy_tính</option>
                    <option value="@Bàn_học">@Bàn_học</option>
                    <option value="@Điện_thoại">@Điện_thoại</option>
                    <option value="@Bất_kỳ">@Bất_kỳ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Thời gian (phút)</label>
                  <select value={formData.time_needed_mins} onChange={e => setFormData({...formData, time_needed_mins: parseInt(e.target.value)})} className="w-full border border-slate-300 rounded-lg p-2">
                    <option value="15">15 phút</option>
                    <option value="30">30 phút</option>
                    <option value="60">60 phút</option>
                    <option value="120">120 phút</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Năng lượng</label>
                  <select value={formData.energy_level} onChange={e => setFormData({...formData, energy_level: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2">
                    <option value="High">Cao</option>
                    <option value="Medium">Trung bình</option>
                    <option value="Low">Thấp</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100">Hủy</button>
              <button onClick={async () => {
                if(!formData.name.trim()) return;
                await fetch(`${API_URL}/actions`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...formData, area_id: 'AREA-DEFAULT' })
                });
                setShowAddModal(false);
                setFormData({...formData, name: ''});
                fetchActions();
              }} className="px-4 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700">Thêm việc</button>
            </div>
          </div>
        </div>
      )}

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
