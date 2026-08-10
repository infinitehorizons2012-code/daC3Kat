import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function Horizons() {
  const [data, setData] = useState({ missions: [], visions: [], goals: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null); // 'mission', 'vision', 'goal', 'edit-mission', 'edit-vision', 'edit-goal'
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ statement: '', category: 'Strategic', parentId: null });

  const fetchData = () => {
    fetch(`${API_URL}/horizons`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.statement.trim()) return;

    let endpoint = '';
    let payload = { statement: formData.statement, category: formData.category };
    let method = 'POST';
    
    if (modalType === 'mission') endpoint = '/missions';
    if (modalType === 'vision') {
      endpoint = '/visions';
      payload.mission_id = formData.parentId;
    }
    if (modalType === 'goal') {
      endpoint = '/goals';
      payload.vision_id = formData.parentId;
      payload.status = 'Active';
    }
    
    if (modalType === 'edit-mission') {
      endpoint = `/missions/${editId}`;
      method = 'PATCH';
    }
    if (modalType === 'edit-vision') {
      endpoint = `/visions/${editId}`;
      method = 'PATCH';
    }
    if (modalType === 'edit-goal') {
      endpoint = `/goals/${editId}`;
      method = 'PATCH';
    }

    try {
      await fetch(`${API_URL}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setModalType(null);
      setEditId(null);
      setFormData({ statement: '', category: 'Strategic', parentId: null });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleGoalStatus = async (goalId, currentStatus) => {
    const newStatus = currentStatus === 'Pended' ? 'Active' : 'Pended';
    try {
      await fetch(`${API_URL}/goals/${goalId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa không?")) return;
    try {
      await fetch(`${API_URL}/${type}/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-8 rounded-2xl min-h-[500px] flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  // Fallback data if DB is empty
  const mission = data.missions[0] || {};
  const visions = data.visions;
  const goals = data.goals;
  const projects = data.projects || [];

  return (
    <div className="glass-panel p-8 rounded-2xl min-h-[500px] relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-700"><i className="fa-solid fa-tree"></i> Cây Horizons</h2>
        {!mission.mission_id && (
          <button onClick={() => setModalType('mission')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-md">
            <i className="fa-solid fa-plus mr-2"></i> Định nghĩa Sứ mệnh
          </button>
        )}
      </div>

      {modalType && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
          <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-xl w-[500px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {modalType === 'mission' && 'Định nghĩa Sứ mệnh'}
              {modalType === 'vision' && 'Thêm Tầm nhìn 3-5 năm'}
              {modalType === 'goal' && 'Thêm Mục tiêu'}
              {modalType === 'edit-mission' && 'Sửa Sứ mệnh'}
              {modalType === 'edit-vision' && 'Sửa Tầm nhìn'}
              {modalType === 'edit-goal' && 'Sửa Mục tiêu'}
            </h3>
            <div className="flex flex-col gap-3 mb-6">
              {editId && (
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">ID (Tự động tạo)</label>
                  <input type="text" value={editId} disabled className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-slate-500 cursor-not-allowed" />
                </div>
              )}
              <textarea 
                placeholder="Nhập nội dung..." 
                value={formData.statement}
                onChange={e => setFormData({...formData, statement: e.target.value})}
                className="border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-400 min-h-[100px]"
                autoFocus
              />
              {(modalType !== 'mission' && modalType !== 'edit-mission') && (
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="Strategic">Strategic (Chiến lược)</option>
                  <option value="Maintenance">Maintenance (Bảo trì)</option>
                </select>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setModalType(null); setEditId(null); }} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100">Hủy</button>
              <button type="submit" className="px-4 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md">Lưu</button>
            </div>
          </form>
        </div>
      )}
      
      <div className="flex flex-col gap-4 pl-4 border-l-2 border-emerald-300">
        
        {/* Mission Level */}
        <div className="relative">
          <div className="absolute w-4 h-0.5 bg-emerald-300 top-4 -left-4"></div>
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 block">50,000 ft - Sứ mệnh</span>
                <h3 className="font-medium text-slate-800 pr-4">{mission.statement}</h3>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {mission.mission_id && (
                  <button onClick={() => { setModalType('vision'); setFormData({...formData, parentId: mission.mission_id}); }} className="text-xs text-emerald-700 hover:bg-emerald-200 bg-emerald-100 px-2 py-1 rounded font-bold">
                    + Thêm Tầm nhìn
                  </button>
                )}
                {mission.mission_id && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { setModalType('edit-mission'); setEditId(mission.mission_id); setFormData({...formData, statement: mission.statement}); }} className="text-xs text-slate-500 hover:text-blue-600"><i className="fa-solid fa-pen"></i></button>
                    <button onClick={() => handleDelete('missions', mission.mission_id)} className="text-xs text-slate-500 hover:text-red-600"><i className="fa-solid fa-trash"></i></button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Visions */}
          {visions.length === 0 ? (
            <div className="pl-8 mt-4 text-sm text-slate-400 italic">Chưa có tầm nhìn nào.</div>
          ) : (
            visions.map(vision => (
              <div key={vision.vision_id} className="flex flex-col gap-4 pl-8 mt-4 border-l-2 border-emerald-200">
                
                {/* Vision Level */}
                <div className="relative">
                  <div className="absolute w-4 h-0.5 bg-emerald-200 top-4 -left-4"></div>
                  <div className="bg-white/60 border border-slate-200 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">40,000 ft - Tầm nhìn ({vision.category})</span>
                        <h3 className="font-medium text-slate-800 pr-4">{vision.statement}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button onClick={() => { setModalType('goal'); setFormData({...formData, parentId: vision.vision_id}); }} className="text-xs text-blue-600 hover:bg-blue-200 bg-blue-100 px-2 py-1 rounded font-bold">
                          + Thêm Mục tiêu
                        </button>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => { setModalType('edit-vision'); setEditId(vision.vision_id); setFormData({...formData, statement: vision.statement, category: vision.category}); }} className="text-xs text-slate-500 hover:text-blue-600"><i className="fa-solid fa-pen"></i></button>
                          <button onClick={() => handleDelete('visions', vision.vision_id)} className="text-xs text-slate-500 hover:text-red-600"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Goals */}
                  {goals.filter(g => g.vision_id === vision.vision_id).length === 0 ? (
                    <div className="pl-8 mt-4 text-sm text-slate-400 italic">Chưa có mục tiêu nào gắn với tầm nhìn này.</div>
                  ) : (
                    goals.filter(g => g.vision_id === vision.vision_id).map(goal => (
                      <div key={goal.goal_id} className="flex flex-col gap-4 pl-8 mt-4 border-l-2 border-slate-200">
                        <div className="relative">
                          <div className="absolute w-4 h-0.5 bg-slate-200 top-4 -left-4"></div>
                          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex justify-between items-center">
                            <div className="flex-1">
                              <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${goal.status === 'Pended' ? 'text-slate-400' : 'text-blue-500'}`}>
                                30,000 ft - Mục tiêu ({goal.status})
                              </span>
                              <h3 className={`font-medium pr-4 ${goal.status === 'Pended' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                {goal.statement}
                              </h3>
                              {goal.status === 'Active' && projects.filter(p => p.goal_id === goal.goal_id).length === 0 && (
                                <p className="text-xs text-orange-600 mt-2 font-medium bg-orange-50 inline-block px-2 py-1 rounded">
                                  <i className="fa-solid fa-triangle-exclamation mr-1"></i> Cần tạo dự án cho mục tiêu này
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <div className="flex gap-2 justify-end mb-1">
                                <button onClick={() => { setModalType('edit-goal'); setEditId(goal.goal_id); setFormData({...formData, statement: goal.statement, category: goal.category}); }} className="text-xs text-slate-500 hover:text-blue-600"><i className="fa-solid fa-pen"></i></button>
                                <button onClick={() => handleDelete('goals', goal.goal_id)} className="text-xs text-slate-500 hover:text-red-600"><i className="fa-solid fa-trash"></i></button>
                              </div>
                              <button onClick={() => toggleGoalStatus(goal.goal_id, goal.status)} className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${goal.status === 'Pended' ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {goal.status === 'Pended' ? 'Kích hoạt' : 'Đóng băng'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
