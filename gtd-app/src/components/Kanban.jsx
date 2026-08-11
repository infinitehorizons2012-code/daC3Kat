import React, { useState, useEffect } from 'react';
import ProjectDetailModal from './ProjectDetailModal';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function Kanban() {
  const [data, setData] = useState({ areas: [], visions: [], goals: [], missions: [], projects: [], actions: [] });
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null); // 'create', 'edit'
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', category: 'Strategic', area_id: '', goal_ids: [], vision_ids: [], mission_ids: [], status: 'Active' 
  });

  const fetchData = async () => {
    try {
      const [horizonsRes, areasRes] = await Promise.all([
        fetch(`${API_URL}/horizons`),
        fetch(`${API_URL}/areas`)
      ]);
      const hData = await horizonsRes.json();
      const aData = await areasRes.json();
      setData({ ...hData, areas: aData });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.area_id) {
      alert("Vui lòng nhập tên dự án và chọn Khu vực (Area)!");
      return;
    }

    let endpoint = '/projects';
    let method = 'POST';
    
    if (modalType === 'edit') {
      endpoint = `/projects/${editId}`;
      method = 'PATCH';
    }

    const payload = { ...formData };

    try {
      await fetch(`${API_URL}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setModalType(null);
      setEditId(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa dự án này?")) return;
    try {
      await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMove = async (id, currentStatus, direction) => {
    const statusMap = ['Active', 'On-Hold', 'Completed'];
    const idx = statusMap.indexOf(currentStatus);
    if (idx === -1) return;
    let newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= statusMap.length) return;
    
    const project = data.projects.find(p => p.project_id === id);
    if(!project) return;

    try {
      await fetch(`${API_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, status: statusMap[newIdx] })
      });
      fetchData();
    } catch(e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    setModalType('create');
    setFormData({ name: '', category: 'Strategic', area_id: '', goal_ids: [], vision_ids: [], mission_ids: [], status: 'Active' });
  };

  const openEditModal = (project) => {
    setModalType('edit');
    setEditId(project.project_id);
    setFormData({
      name: project.name,
      category: project.category,
      area_id: project.area_id || '',
      goal_ids: project.goal_ids || [],
      vision_ids: project.vision_ids || [],
      mission_ids: project.mission_ids || [],
      status: project.status || 'Active'
    });
  };

  const activeProjects = data.projects.filter(p => p.status === 'Active');
  const onHoldProjects = data.projects.filter(p => p.status === 'On-Hold');
  const completedProjects = data.projects.filter(p => p.status === 'Completed');

  // Helpers to get names
  const getArea = (id) => data.areas.find(a => a.area_id === id);
  const getGoals = (ids) => (ids || []).map(id => data.goals.find(g => g.goal_id === id)).filter(Boolean);
  const getVisions = (ids) => (ids || []).map(id => data.visions.find(v => v.vision_id === id)).filter(Boolean);
  const getMissions = (ids) => (ids || []).map(id => data.missions.find(m => m.mission_id === id)).filter(Boolean);

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) return array.filter(i => i !== item);
    return [...array, item];
  };

  return (
    <div className="flex flex-col gap-6 min-h-[500px] relative">
      <div className="glass-panel p-6 rounded-2xl flex justify-between items-center">
        <h2 className="text-2xl font-bold text-purple-700"><i className="fa-solid fa-layer-group mr-2"></i> Kanban Dự án (10,000 ft)</h2>
        <button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-md">
          <i className="fa-solid fa-plus mr-2"></i> Thêm dự án
        </button>
      </div>

      {modalType && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl p-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl w-[700px] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{modalType === 'create' ? 'Thêm Dự án mới' : 'Sửa Dự án'}</h3>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên dự án (bắt buộc)</label>
                <input 
                  type="text" 
                  placeholder="Tên dự án..." 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-400"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Khu vực / Area (bắt buộc)</label>
                  <select 
                    value={formData.area_id}
                    onChange={e => setFormData({...formData, area_id: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  >
                    <option value="" disabled>-- Chọn Khu vực --</option>
                    {data.areas.map(a => (
                      <option key={a.area_id} value={a.area_id}>{a.icon || '🎯'} {a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phân loại</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="Strategic">Strategic (Chiến lược)</option>
                    <option value="Maintenance">Maintenance (Bảo trì)</option>
                  </select>
                </div>
              </div>

              {modalType === 'edit' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái Kanban</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-400 font-bold"
                  >
                    <option value="Active">Đang thực hiện (Active)</option>
                    <option value="On-Hold">Đóng băng (On-Hold)</option>
                    <option value="Completed">Đã hoàn thành (Completed)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                {/* Missions */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide border-b border-slate-200 pb-1"><i className="fa-solid fa-flag text-red-500 mr-1"></i> Sứ mệnh liên quan</label>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {data.missions.map(m => (
                      <label key={m.mission_id} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded">
                        <input 
                          type="checkbox" 
                          checked={formData.mission_ids.includes(m.mission_id)}
                          onChange={() => setFormData({...formData, mission_ids: toggleArrayItem(formData.mission_ids, m.mission_id)})}
                          className="mt-1"
                        />
                        <span className="leading-tight">{m.statement}</span>
                      </label>
                    ))}
                    {data.missions.length === 0 && <span className="text-xs text-slate-400 italic">Chưa có sứ mệnh</span>}
                  </div>
                </div>

                {/* Visions */}
                <div className={`border border-slate-200 rounded-lg p-3 ${formData.category === 'Maintenance' ? 'bg-slate-100 opacity-60' : 'bg-slate-50'}`}>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide border-b border-slate-200 pb-1"><i className="fa-solid fa-eye text-blue-500 mr-1"></i> Tầm nhìn liên quan</label>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {data.visions.map(v => (
                      <label key={v.vision_id} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded">
                        <input 
                          type="checkbox" 
                          disabled={formData.category === 'Maintenance'}
                          checked={formData.vision_ids.includes(v.vision_id)}
                          onChange={() => setFormData({...formData, vision_ids: toggleArrayItem(formData.vision_ids, v.vision_id)})}
                          className="mt-1"
                        />
                        <span className="leading-tight">{v.statement}</span>
                      </label>
                    ))}
                    {data.visions.length === 0 && <span className="text-xs text-slate-400 italic">Chưa có tầm nhìn</span>}
                  </div>
                </div>

                {/* Goals */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide border-b border-slate-200 pb-1"><i className="fa-solid fa-bullseye text-orange-500 mr-1"></i> Mục tiêu liên quan</label>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {data.goals.filter(g => formData.category === 'Maintenance' ? g.category === 'Maintenance' : g.category === 'Strategic').map(g => (
                      <label key={g.goal_id} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded">
                        <input 
                          type="checkbox" 
                          checked={formData.goal_ids.includes(g.goal_id)}
                          onChange={() => setFormData({...formData, goal_ids: toggleArrayItem(formData.goal_ids, g.goal_id)})}
                          className="mt-1"
                        />
                        <span className="leading-tight">{g.statement}</span>
                      </label>
                    ))}
                    {data.goals.length === 0 && <span className="text-xs text-slate-400 italic">Chưa có mục tiêu phù hợp</span>}
                  </div>
                </div>
              </div>

            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100">Hủy</button>
              <button type="submit" className="px-4 py-2 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md">Lưu Dự án</button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-20 text-slate-500"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 items-start">
          
          {/* Cột 1: Active */}
          <div className="glass-panel w-80 sm:w-96 rounded-2xl p-4 flex-shrink-0 flex flex-col gap-4 min-h-[400px]">
            <h3 className="font-bold text-slate-700 border-b border-slate-300/50 pb-2 flex justify-between">
              <span>Đang thực hiện</span>
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">{activeProjects.length}</span>
            </h3>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Trống</p>
            ) : (
              activeProjects.map(p => (
                <ProjectCard 
                  key={p.project_id} 
                  project={p} 
                  onEdit={() => openEditModal(p)} 
                  onDelete={() => handleDelete(p.project_id)}
                  onOpenDetail={() => setSelectedDetailProject(p)}
                  onMoveLeft={null}
                  onMoveRight={() => handleMove(p.project_id, 'Active', 1)}
                  area={getArea(p.area_id)}
                  goals={getGoals(p.goal_ids)}
                  visions={getVisions(p.vision_ids)}
                  missions={getMissions(p.mission_ids)}
                />
              ))
            )}
          </div>

          {/* Cột 2: On-Hold */}
          <div className="glass-panel w-80 sm:w-96 rounded-2xl p-4 flex-shrink-0 flex flex-col gap-4 min-h-[400px]">
            <h3 className="font-bold text-slate-700 border-b border-slate-300/50 pb-2 flex justify-between">
              <span>Đóng băng (On-Hold)</span>
              <span className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-full">{onHoldProjects.length}</span>
            </h3>
            {onHoldProjects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Trống</p>
            ) : (
              onHoldProjects.map(p => (
                <ProjectCard 
                  key={p.project_id} 
                  project={p} 
                  onEdit={() => openEditModal(p)} 
                  onDelete={() => handleDelete(p.project_id)}
                  onOpenDetail={() => setSelectedDetailProject(p)}
                  onMoveLeft={() => handleMove(p.project_id, 'On-Hold', -1)}
                  onMoveRight={() => handleMove(p.project_id, 'On-Hold', 1)}
                  area={getArea(p.area_id)}
                  goals={getGoals(p.goal_ids)}
                  visions={getVisions(p.vision_ids)}
                  missions={getMissions(p.mission_ids)}
                  muted={true}
                />
              ))
            )}
          </div>

          {/* Cột 3: Completed */}
          <div className="glass-panel w-80 sm:w-96 rounded-2xl p-4 flex-shrink-0 flex flex-col gap-4 min-h-[400px]">
            <h3 className="font-bold text-slate-700 border-b border-slate-300/50 pb-2 flex justify-between">
              <span>Đã hoàn thành</span>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">{completedProjects.length}</span>
            </h3>
            {completedProjects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Trống</p>
            ) : (
              completedProjects.map(p => (
                <ProjectCard 
                  key={p.project_id} 
                  project={p} 
                  onEdit={() => openEditModal(p)} 
                  onDelete={() => handleDelete(p.project_id)}
                  onOpenDetail={() => setSelectedDetailProject(p)}
                  onMoveLeft={() => handleMove(p.project_id, 'Completed', -1)}
                  onMoveRight={null}
                  area={getArea(p.area_id)}
                  goals={getGoals(p.goal_ids)}
                  visions={getVisions(p.vision_ids)}
                  missions={getMissions(p.mission_ids)}
                  completed={true}
                />
              ))
            )}
          </div>

        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete, onMoveLeft, onMoveRight, area, goals, visions, missions, muted, completed, onOpenDetail }) {
  return (
    <div onClick={(e) => { if (e.target.closest('button')) return; onOpenDetail(); }} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 cursor-pointer ${completed ? 'border-green-500 opacity-60' : muted ? 'border-slate-400 opacity-80' : 'border-purple-500'} hover:shadow-md hover:scale-[1.02] transition-all group`}>
      <div className="flex justify-between items-start mb-2">
        <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${project.category === 'Strategic' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
          {project.category}
        </p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onOpenDetail} className="text-xs text-slate-400 hover:text-indigo-600 px-1" title="Mở Hồ Sơ Dự Án"><i className="fa-solid fa-folder-open"></i></button>
          <button onClick={onEdit} className="text-xs text-slate-400 hover:text-blue-600 px-1" title="Sửa tên Dự Án"><i className="fa-solid fa-pen"></i></button>
          <button onClick={onDelete} className="text-xs text-slate-400 hover:text-red-600 px-1" title="Xóa Dự Án"><i className="fa-solid fa-trash"></i></button>
        </div>
      </div>
      
      <h4 className={`font-bold ${completed ? 'text-slate-500 line-through' : 'text-slate-800'} mb-3`}>{project.name}</h4>
      
      <div className="flex flex-col gap-2 mt-2">
        {area && (
          <div className="text-[11px] bg-teal-50 text-teal-800 px-2 py-1 rounded inline-flex items-center w-fit border border-teal-100">
            <span className="mr-1.5">{area.icon || '🎯'}</span>
            <span className="font-semibold">{area.name}</span>
          </div>
        )}
        
        {missions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {missions.map((m, i) => (
              <span key={i} className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded truncate max-w-[200px]" title={m.statement}>
                <i className="fa-solid fa-flag mr-1 opacity-70"></i>{m.statement}
              </span>
            ))}
          </div>
        )}
        
        {visions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visions.map((v, i) => (
              <span key={i} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded truncate max-w-[200px]" title={v.statement}>
                <i className="fa-solid fa-eye mr-1 opacity-70"></i>{v.statement}
              </span>
            ))}
          </div>
        )}
        
        {goals.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {goals.map((g, i) => (
              <span key={i} className="text-[10px] bg-orange-50 text-orange-700 border border-orange-100 px-1.5 py-0.5 rounded truncate max-w-[200px]" title={g.statement}>
                <i className="fa-solid fa-bullseye mr-1 opacity-70"></i>{g.statement}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-3 pt-2 border-t border-slate-100">
        <button 
          onClick={onMoveLeft} 
          disabled={!onMoveLeft}
          className={`text-xs p-1 rounded hover:bg-slate-100 ${!onMoveLeft ? 'invisible' : 'text-slate-400 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <button 
          onClick={onMoveRight} 
          disabled={!onMoveRight}
          className={`text-xs p-1 rounded hover:bg-slate-100 ${!onMoveRight ? 'invisible' : 'text-slate-400 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}
