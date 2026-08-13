import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function PCTrackerView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('summary'); // 'summary', 'detail', 'rules'

  // Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Log Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    app_name: '',
    category: 'Học tập & Deep Work', // 'Học tập & Deep Work', 'Giải trí / Game', 'Ngoại ngữ & Kỹ năng', 'Khác'
    start_time: '',
    end_time: '',
    duration_mins: 45,
    details: ''
  });

  // Edit Log Modal
  const [editingLog, setEditingLog] = useState(null);
  const [editForm, setEditForm] = useState({
    app_name: '',
    category: 'Học tập & Deep Work',
    start_time: '',
    end_time: '',
    duration_mins: 45,
    details: ''
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pc-logs`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        // Fallback default sample data if table is new
        setLogs([
          { log_id: 'pc-1', app_name: 'VS Code (Python Data Science)', category: 'Học tập & Deep Work', start_time: '2026-08-13 14:00', end_time: '2026-08-13 15:30', duration_mins: 90, details: 'Lập trình xử lý dữ liệu với Pandas & Matplotlib' },
          { log_id: 'pc-2', app_name: 'Chrome - Prinberk High School', category: 'Học tập & Deep Work', start_time: '2026-08-13 15:45', end_time: '2026-08-13 17:15', duration_mins: 90, details: 'Giải bài tập Algebra 1 W33' },
          { log_id: 'pc-3', app_name: 'Youtube (Học Drum & Nhạc cụ)', category: 'Ngoại ngữ & Kỹ năng', start_time: '2026-08-13 17:30', end_time: '2026-08-13 18:30', duration_mins: 60, details: 'Xem video hướng dẫn đánh trống Drum T5' },
          { log_id: 'pc-4', app_name: 'Minecraft / Giải trí', category: 'Giải trí / Game', start_time: '2026-08-13 20:00', end_time: '2026-08-13 20:30', duration_mins: 30, details: 'Giải trí sau giờ học' }
        ]);
      }
    } catch (e) {
      console.error(e);
      // Fallback initial state
      setLogs([
        { log_id: 'pc-1', app_name: 'VS Code (Python Data Science)', category: 'Học tập & Deep Work', start_time: '2026-08-13 14:00', end_time: '2026-08-13 15:30', duration_mins: 90, details: 'Lập trình xử lý dữ liệu với Pandas & Matplotlib' },
        { log_id: 'pc-2', app_name: 'Chrome - Prinberk High School', category: 'Học tập & Deep Work', start_time: '2026-08-13 15:45', end_time: '2026-08-13 17:15', duration_mins: 90, details: 'Giải bài tập Algebra 1 W33' },
        { log_id: 'pc-3', app_name: 'Youtube (Học Drum & Nhạc cụ)', category: 'Ngoại ngữ & Kỹ năng', start_time: '2026-08-13 17:30', end_time: '2026-08-13 18:30', duration_mins: 60, details: 'Xem video hướng dẫn đánh trống Drum T5' },
        { log_id: 'pc-4', app_name: 'Minecraft / Giải trí', category: 'Giải trí / Game', start_time: '2026-08-13 20:00', end_time: '2026-08-13 20:30', duration_mins: 30, details: 'Giải trí sau giờ học' }
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!addForm.app_name.trim()) return alert("Vui lòng nhập tên ứng dụng!");

    const newLog = {
      log_id: `pc-${Date.now()}`,
      app_name: addForm.app_name,
      category: addForm.category,
      start_time: addForm.start_time || new Date().toLocaleString(),
      end_time: addForm.end_time || new Date().toLocaleString(),
      duration_mins: Number(addForm.duration_mins) || 30,
      details: addForm.details
    };

    try {
      await fetch(`${API_URL}/pc-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
    } catch (err) {}

    setLogs(prev => [newLog, ...prev]);
    setShowAddModal(false);
    setAddForm({ app_name: '', category: 'Học tập & Deep Work', start_time: '', end_time: '', duration_mins: 45, details: '' });
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    setLogs(prev => prev.map(item => item.log_id === editingLog.log_id ? { ...item, ...editForm } : item));
    
    try {
      await fetch(`${API_URL}/pc-logs/${editingLog.log_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
    } catch (e) {}

    setEditingLog(null);
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Xóa nhật ký sử dụng máy tính này?")) return;
    setLogs(prev => prev.filter(item => item.log_id !== logId));
    try {
      await fetch(`${API_URL}/pc-logs/${logId}`, { method: 'DELETE' });
    } catch (e) {}
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;
  }

  // Statistics calculation
  const totalMins = logs.reduce((sum, item) => sum + (Number(item.duration_mins) || 0), 0);
  const totalHours = Math.round((totalMins / 60) * 10) / 10;

  const academicMins = logs.filter(l => l.category === 'Học tập & Deep Work').reduce((sum, l) => sum + (Number(l.duration_mins) || 0), 0);
  const skillMins = logs.filter(l => l.category === 'Ngoại ngữ & Kỹ năng').reduce((sum, l) => sum + (Number(l.duration_mins) || 0), 0);
  const playMins = logs.filter(l => l.category === 'Giải trí / Game').reduce((sum, l) => sum + (Number(l.duration_mins) || 0), 0);
  const otherMins = totalMins - academicMins - skillMins - playMins;

  const academicPct = totalMins > 0 ? Math.round(((academicMins + skillMins) / totalMins) * 100) : 0;
  const playPct = totalMins > 0 ? Math.round((playMins / totalMins) * 100) : 0;

  const filteredLogs = logs.filter(l => {
    if (filterCategory !== 'all' && l.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const app = (l.app_name || '').toLowerCase();
      const det = (l.details || '').toLowerCase();
      if (!app.includes(q) && !det.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in max-w-5xl mx-auto w-full">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-teal-500/30">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-xs font-black uppercase tracking-widest mb-1">
            <i className="fa-solid fa-desktop"></i> PC Time Tracking & Screen Time Monitor
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-laptop-code text-teal-400"></i> Nhật Ký Máy Tính Của Bé
          </h2>
          <p className="text-xs text-teal-100 mt-1 font-medium max-w-2xl">
            Theo dõi chi tiết bé làm gì trên máy tính, lúc mấy giờ, bao lâu, phân loại Học tập vs Giải trí & tổng hợp báo cáo.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-md flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> + Ghi Nhật Ký Máy Tính Mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-display"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Tổng Thời Gian Màn Hình</span>
            <span className="text-2xl font-black text-slate-800">{totalHours}h <span className="text-xs text-slate-400 font-bold">({totalMins}m)</span></span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-brain"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Học Tập & Kỹ Năng</span>
            <span className="text-2xl font-black text-indigo-600">{Math.round(((academicMins + skillMins) / 60) * 10) / 10}h <span className="text-xs text-slate-400 font-bold">({academicPct}%)</span></span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-gamepad"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Giải Trí / Game</span>
            <span className="text-2xl font-black text-rose-600">{Math.round((playMins / 60) * 10) / 10}h <span className="text-xs text-slate-400 font-bold">({playPct}%)</span></span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Trạng Thái Sức Khỏe</span>
            <span className="text-base font-black text-emerald-600">
              {academicPct >= 70 ? '🟢 Rất Lành Mạnh' : '🟡 Cần Cân Bằng'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button 
          onClick={() => setActiveSubTab('summary')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${activeSubTab === 'summary' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <i className="fa-solid fa-chart-pie"></i> 📊 Báo Cáo Tổng Hợp
        </button>

        <button 
          onClick={() => setActiveSubTab('detail')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${activeSubTab === 'detail' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <i className="fa-solid fa-list-ul"></i> 📋 Nhật Ký Chi Tiết & Chỉnh Sửa
        </button>

        <button 
          onClick={() => setActiveSubTab('rules')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${activeSubTab === 'rules' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <i className="fa-solid fa-shield-halved"></i> ⚙️ Quy Tắc & Giới Hạn Màn Hình
        </button>
      </div>

      {/* TAB 1: BÁO CÁO TỔNG HỢP */}
      {activeSubTab === 'summary' && (
        <div className="space-y-6">
          
          {/* Visual Progress Breakdown Bar */}
          <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-chart-bar text-teal-600"></i> Phân Bổ Thời Gian Sử Dụng Máy Tính
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">Tỷ lệ sử dụng giữa các nhóm hoạt động trên máy tính của bé.</p>

            <div className="w-full bg-slate-100 h-6 rounded-2xl overflow-hidden flex shadow-inner border border-slate-200 p-1 gap-1">
              <div className="bg-indigo-500 h-full rounded-xl transition-all" style={{ width: `${academicPct}%` }} title={`Học tập & Deep Work: ${academicPct}%`}></div>
              <div className="bg-rose-500 h-full rounded-xl transition-all" style={{ width: `${playPct}%` }} title={`Giải trí / Game: ${playPct}%`}></div>
            </div>

            <div className="flex flex-wrap justify-between items-center mt-4 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span> 📘 Học tập & Deep Work ({Math.round(((academicMins + skillMins) / 60) * 10) / 10}h - {academicPct}%)
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> 🎮 Giải trí / Game ({Math.round((playMins / 60) * 10) / 10}h - {playPct}%)
              </span>
            </div>
          </div>

          {/* Activity Breakdown List */}
          <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-cubes text-indigo-600"></i> Chi Tiết Sử Dụng Theo Ứng Dụng & Website
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.map(item => (
                <div key={item.log_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border text-slate-600 mb-1 inline-block">
                      {item.category}
                    </span>
                    <h4 className="font-black text-slate-800 text-sm">{item.app_name}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{item.details}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block font-bold">Khung giờ: {item.start_time} - {item.end_time}</span>
                  </div>
                  <span className="text-sm font-black bg-teal-100 text-teal-800 px-3 py-1 rounded-full shrink-0 border border-teal-300">
                    ⏱️ {item.duration_mins}m
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: NHẬT KÝ CHI TIẾT */}
      {activeSubTab === 'detail' && (
        <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Tất Cả
              </button>
              <button 
                onClick={() => setFilterCategory('Học tập & Deep Work')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCategory === 'Học tập & Deep Work' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Học Tập
              </button>
              <button 
                onClick={() => setFilterCategory('Giải trí / Game')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCategory === 'Giải trí / Game' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Giải Trí
              </button>
            </div>

            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm tên ứng dụng hoặc chi tiết..."
              className="p-2 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-xs font-bold w-full sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-wider bg-slate-50/50">
                  <th className="p-3">Khung Giờ</th>
                  <th className="p-3">Ứng Dụng / Trình Duyệt</th>
                  <th className="p-3">Phân Loại</th>
                  <th className="p-3 text-center">Thời Lượng</th>
                  <th className="p-3">Chi Tiết Hoạt Động</th>
                  <th className="p-3 text-right">Điều Chỉnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {filteredLogs.map(item => (
                  <tr key={item.log_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      <span className="font-black text-slate-800 text-xs block">{item.start_time}</span>
                      <span className="text-[10px] text-slate-400">đến {item.end_time}</span>
                    </td>

                    <td className="p-3 font-black text-slate-800">
                      {item.app_name}
                    </td>

                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] border ${
                        item.category === 'Học tập & Deep Work' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        item.category === 'Giải trí / Game' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {item.category}
                      </span>
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      <span className="bg-teal-100 text-teal-900 px-2.5 py-1 rounded-full font-black text-[11px] border border-teal-300">
                        ⏱️ {item.duration_mins}m
                      </span>
                    </td>

                    <td className="p-3 text-slate-600 max-w-xs truncate">
                      {item.details || <span className="text-slate-300 italic">Không có chi tiết</span>}
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setEditingLog(item); setEditForm(item); }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 font-bold text-[11px] rounded-lg transition-all"
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteLog(item.log_id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-[11px] rounded-lg transition-all"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUY TẮC MÀN HÌNH */}
      {activeSubTab === 'rules' && (
        <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-shield-halved text-emerald-600"></i> Quy Tắc Giới Hạn Màn Hình Cho Bé (Screen Time Health)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <h4 className="font-black text-emerald-900 text-sm">✅ Khuyến khích Học tập & Deep Work</h4>
              <p className="text-xs text-emerald-700 mt-1">Không giới hạn thời gian khi bé lập trình Python, làm bài tập Algebra 1 hoặc học nhạc cụ.</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <h4 className="font-black text-amber-900 text-sm">⚠️ Giới hạn Giải trí & Game</h4>
              <p className="text-xs text-amber-700 mt-1">Khuyên dùng tối đa 60 phút/ngày sau khi hoàn thành 3 Big Rocks trong ngày.</p>
            </div>
          </div>
        </div>
      )}

      {/* ADD LOG MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl bg-white max-w-md w-full shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-desktop text-teal-600"></i> Ghi Nhật Ký Sử Dụng Máy Tính
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleAddLog} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Tên Ứng Dụng / Trình Duyệt / Nội Dung:</label>
                <input 
                  type="text" 
                  value={addForm.app_name}
                  onChange={e => setAddForm({ ...addForm, app_name: e.target.value })}
                  placeholder="Ví dụ: VS Code (Python), Chrome (Algebra 1)..."
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Phân Loại Hoạt Động:</label>
                <select 
                  value={addForm.category}
                  onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500 bg-white"
                >
                  <option value="Học tập & Deep Work">📘 Học tập & Deep Work</option>
                  <option value="Ngoại ngữ & Kỹ năng">🎸 Ngoại ngữ & Kỹ năng</option>
                  <option value="Giải trí / Game">🎮 Giải trí / Game</option>
                  <option value="Khác">⚙️ Khác</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Khung Giờ Bắt Đầu:</label>
                  <input 
                    type="text" 
                    value={addForm.start_time}
                    onChange={e => setAddForm({ ...addForm, start_time: e.target.value })}
                    placeholder="14:00"
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block mb-1">Thời Lượng (Phút):</label>
                  <input 
                    type="number" 
                    value={addForm.duration_mins}
                    onChange={e => setAddForm({ ...addForm, duration_mins: e.target.value })}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Chi Tiết Hoạt Động:</label>
                <textarea 
                  value={addForm.details}
                  onChange={e => setAddForm({ ...addForm, details: e.target.value })}
                  rows="3"
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500"
                  placeholder="Bé đã làm gì cụ thể trên máy tính..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-slate-950 font-black rounded-xl">
                  + Thêm Nhật Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LOG MODAL */}
      {editingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl bg-white max-w-md w-full shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-teal-600"></i> Điều Chỉnh Nhật Ký Máy Tính
              </h3>
              <button onClick={() => setEditingLog(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Tên Ứng Dụng / Nội Dung:</label>
                <input 
                  type="text" 
                  value={editForm.app_name}
                  onChange={e => setEditForm({ ...editForm, app_name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block mb-1">Phân Loại:</label>
                <select 
                  value={editForm.category}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500 bg-white"
                >
                  <option value="Học tập & Deep Work">📘 Học tập & Deep Work</option>
                  <option value="Ngoại ngữ & Kỹ năng">🎸 Ngoại ngữ & Kỹ năng</option>
                  <option value="Giải trí / Game">🎮 Giải trí / Game</option>
                  <option value="Khác">⚙️ Khác</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Khung Giờ Bắt Đầu:</label>
                  <input 
                    type="text" 
                    value={editForm.start_time}
                    onChange={e => setEditForm({ ...editForm, start_time: e.target.value })}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block mb-1">Thời Lượng (Phút):</label>
                  <input 
                    type="number" 
                    value={editForm.duration_mins}
                    onChange={e => setEditForm({ ...editForm, duration_mins: e.target.value })}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Chi Tiết Hoạt Động:</label>
                <textarea 
                  value={editForm.details}
                  onChange={e => setEditForm({ ...editForm, details: e.target.value })}
                  rows="3"
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button onClick={() => setEditingLog(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">
                  Hủy
                </button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-teal-600 text-slate-950 font-black rounded-xl">
                  Lưu Điều Chỉnh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
