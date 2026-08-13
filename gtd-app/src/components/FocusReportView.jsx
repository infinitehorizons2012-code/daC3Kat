import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function FocusReportView() {
  const [sessions, setSessions] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [timeRange, setTimeRange] = useState('all'); // 'today', 'week', 'month', 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Modal State
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState({
    action_name: '',
    start_time: '',
    end_time: '',
    duration_mins: 25,
    notes: ''
  });

  // Manual Create Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    action_name: '',
    start_time: '',
    end_time: '',
    duration_mins: 25,
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fsRes, acRes] = await Promise.all([
        fetch(`${API_URL}/focus-sessions`),
        fetch(`${API_URL}/actions`)
      ]);
      const fsData = await fsRes.json();
      const acData = await acRes.json();
      setSessions(Array.isArray(fsData) ? fsData : []);
      setActions(Array.isArray(acData) ? acData : []);
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu Focus Report:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (session) => {
    setEditingSession(session);
    setEditForm({
      action_name: session.action_name || '',
      start_time: session.start_time || session.created_at || '',
      end_time: session.end_time || '',
      duration_mins: session.duration_mins || 25,
      notes: session.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSession) return;
    try {
      await fetch(`${API_URL}/focus-sessions/${editingSession.session_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      setEditingSession(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Lỗi khi cập nhật nhật ký!");
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhật ký thời gian này?")) return;
    try {
      await fetch(`${API_URL}/focus-sessions/${sessionId}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateManualSession = async (e) => {
    e.preventDefault();
    if (!addForm.action_name.trim()) return alert("Vui lòng nhập tên công việc!");

    try {
      await fetch(`${API_URL}/focus-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_name: addForm.action_name,
          start_time: addForm.start_time || new Date().toISOString(),
          end_time: addForm.end_time || new Date().toISOString(),
          duration_mins: Number(addForm.duration_mins) || 25,
          notes: addForm.notes,
          session_type: 'work'
        })
      });
      setShowAddModal(false);
      setAddForm({ action_name: '', start_time: '', end_time: '', duration_mins: 25, notes: '' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;
  }

  // Filter sessions by range
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const filteredSessions = sessions.filter(s => {
    const sDate = s.created_at || s.start_time || '';
    if (timeRange === 'today' && !sDate.startsWith(todayStr)) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (s.action_name || '').toLowerCase();
      const notes = (s.notes || '').toLowerCase();
      if (!name.includes(q) && !notes.includes(q)) return false;
    }
    return true;
  });

  const totalMins = filteredSessions.reduce((sum, s) => sum + (Number(s.duration_mins) || 0), 0);
  const totalHours = Math.round((totalMins / 60) * 10) / 10;
  const totalPoms = filteredSessions.length;

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in max-w-5xl mx-auto w-full">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-black uppercase tracking-widest mb-1">
            <i className="fa-solid fa-chart-pie"></i> Dedicated Pomodoro Analytics & Log Engine
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-amber-400"></i> Nhật Ký & Báo Cáo Thời Gian Pomodoro
          </h2>
          <p className="text-xs text-purple-200 mt-1 font-medium max-w-2xl">
            Lưu trữ chi tiết từng khung giờ tập trung, số phút thực hiện và cho phép điều chỉnh nhật ký độc lập.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> + Nhập Nhật Ký Thủ Công
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-hourglass-start"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Tổng Giờ Tập Trung</span>
            <span className="text-2xl font-black text-slate-800">{totalHours}h <span className="text-xs text-slate-400 font-bold">({totalMins}m)</span></span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-stopwatch"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Số Hiệp Pomodoro</span>
            <span className="text-2xl font-black text-amber-600">{totalPoms} <span className="text-xs text-slate-400 font-bold">Hiệp</span></span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-square-check"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Trung Bình Mỗi Hiệp</span>
            <span className="text-2xl font-black text-emerald-600">{totalPoms > 0 ? Math.round(totalMins / totalPoms) : 25}m</span>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
        
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${timeRange === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Tất Cả
            </button>
            <button 
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${timeRange === 'today' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Hôm Nay
            </button>
          </div>

          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Tìm kiếm công việc trong nhật ký..."
            className="p-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-xs font-bold w-full sm:w-64"
          />
        </div>

        {/* Sessions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-wider bg-slate-50/50">
                <th className="p-3">Thời Gian Thực Hiện</th>
                <th className="p-3">Hành Động / Công Việc</th>
                <th className="p-3 text-center">Thời Lượng</th>
                <th className="p-3">Ghi Chú Kết Quả</th>
                <th className="p-3 text-right">Điều Chỉnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {filteredSessions.map(s => {
                const dateStr = s.created_at || s.start_time || 'N/A';
                const timeOnly = dateStr.length >= 16 ? dateStr.slice(11, 16) : dateStr;
                const fullDate = dateStr.length >= 10 ? dateStr.slice(0, 10) : dateStr;

                return (
                  <tr key={s.session_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-500">
                      <span className="font-black text-slate-800 text-xs block">{timeOnly}</span>
                      <span className="text-[10px] text-slate-400">{fullDate}</span>
                    </td>

                    <td className="p-3 font-black text-slate-800">
                      {s.action_name || 'Hiệp Tập Trung'}
                    </td>

                    <td className="p-3 text-center">
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-black text-[11px] border border-amber-300">
                        ⏱️ {s.duration_mins || 25}m
                      </span>
                    </td>

                    <td className="p-3 text-slate-500 max-w-xs truncate">
                      {s.notes || <span className="text-slate-300 italic">Không có ghi chú</span>}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(s)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold text-[11px] rounded-lg transition-all"
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteSession(s.session_id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-[11px] rounded-lg transition-all"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400 font-medium">
                    Chưa có dữ liệu nhật ký Pomodoro nào trong khoảng thời gian này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT SESSION MODAL */}
      {editingSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl bg-white max-w-md w-full shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-indigo-600"></i> Điều Chỉnh Nhật Ký Pomodoro
              </h3>
              <button onClick={() => setEditingSession(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Tên hành động / công việc:</label>
                <input 
                  type="text" 
                  value={editForm.action_name}
                  onChange={e => setEditForm({ ...editForm, action_name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Thời gian bắt đầu / Ngày:</label>
                  <input 
                    type="text" 
                    value={editForm.start_time}
                    onChange={e => setEditForm({ ...editForm, start_time: e.target.value })}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-indigo-500"
                    placeholder="2026-08-13 19:15"
                  />
                </div>

                <div>
                  <label className="block mb-1">Thời lượng (Phút):</label>
                  <input 
                    type="number" 
                    value={editForm.duration_mins}
                    onChange={e => setEditForm({ ...editForm, duration_mins: e.target.value })}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Ghi chú kết quả:</label>
                <textarea 
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  rows="3"
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-indigo-500"
                  placeholder="Ghi chú kết quả hoàn thành..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button onClick={() => setEditingSession(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">
                  Hủy
                </button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black">
                  Lưu Điều Chỉnh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD MANUAL SESSION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl bg-white max-w-md w-full shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-plus-circle text-emerald-600"></i> Thêm Nhật Ký Thủ Công
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateManualSession} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Tên hành động / công việc:</label>
                <input 
                  type="text" 
                  value={addForm.action_name}
                  onChange={e => setAddForm({ ...addForm, action_name: e.target.value })}
                  placeholder="Ví dụ: Giải đề Toán SAT..."
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Thời gian (YYYY-MM-DD HH:MM):</label>
                  <input 
                    type="text" 
                    value={addForm.start_time}
                    onChange={e => setAddForm({ ...addForm, start_time: e.target.value })}
                    placeholder="2026-08-13 19:15"
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block mb-1">Thời lượng (Phút):</label>
                  <input 
                    type="number" 
                    value={addForm.duration_mins}
                    onChange={e => setAddForm({ ...addForm, duration_mins: e.target.value })}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Ghi chú kết quả:</label>
                <textarea 
                  value={addForm.notes}
                  onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                  rows="3"
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-emerald-500"
                  placeholder="Ghi chú kết quả công việc..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black">
                  + Thêm Nhật Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
