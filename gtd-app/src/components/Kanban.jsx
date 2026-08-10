import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function Kanban() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', category: 'Strategic' });

  const fetchProjects = () => {
    fetch(`${API_URL}/projects`)
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    try {
      await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      setShowModal(false);
      setNewProject({ name: '', category: 'Strategic' });
      fetchProjects();
    } catch (e) {
      console.error(e);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'Active');
  const onHoldProjects = projects.filter(p => p.status === 'On-Hold');
  const completedProjects = projects.filter(p => p.status === 'Completed');

  return (
    <div className="flex flex-col gap-6 min-h-[500px] relative">
      <div className="glass-panel p-6 rounded-2xl flex justify-between items-center">
        <h2 className="text-2xl font-bold text-purple-700"><i className="fa-solid fa-layer-group mr-2"></i> Kanban Dự án (10,000 ft)</h2>
        <button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-md">
          <i className="fa-solid fa-plus mr-2"></i> Thêm dự án
        </button>
      </div>

      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
          <form onSubmit={handleAddProject} className="bg-white p-6 rounded-2xl shadow-xl w-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Thêm Dự án mới</h3>
            <div className="flex flex-col gap-3 mb-6">
              <input 
                type="text" 
                placeholder="Tên dự án..." 
                value={newProject.name}
                onChange={e => setNewProject({...newProject, name: e.target.value})}
                className="border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-400"
                autoFocus
              />
              <select 
                value={newProject.category}
                onChange={e => setNewProject({...newProject, category: e.target.value})}
                className="border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="Strategic">Strategic (Chiến lược)</option>
                <option value="Maintenance">Maintenance (Bảo trì)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100">Hủy</button>
              <button type="submit" className="px-4 py-2 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md">Lưu</button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-20 text-slate-500"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 items-start">
          
          {/* Cột 1: Active */}
          <div className="glass-panel w-80 rounded-2xl p-4 flex-shrink-0 flex flex-col gap-4">
            <h3 className="font-bold text-slate-700 border-b border-slate-300/50 pb-2 flex justify-between">
              <span>Đang thực hiện</span>
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">{activeProjects.length}</span>
            </h3>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Trống</p>
            ) : (
              activeProjects.map(p => (
                <div key={p.project_id} className="bg-white/80 p-4 rounded-xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-shadow cursor-grab">
                  <h4 className="font-bold text-slate-800">{p.name}</h4>
                  <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-100 inline-block px-2 py-1 rounded">{p.category}</p>
                </div>
              ))
            )}
          </div>

          {/* Cột 2: On-Hold */}
          <div className="glass-panel w-80 rounded-2xl p-4 flex-shrink-0 flex flex-col gap-4">
            <h3 className="font-bold text-slate-700 border-b border-slate-300/50 pb-2 flex justify-between">
              <span>Đóng băng (On-Hold)</span>
              <span className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-full">{onHoldProjects.length}</span>
            </h3>
            {onHoldProjects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Trống</p>
            ) : (
              onHoldProjects.map(p => (
                <div key={p.project_id} className="bg-white/50 p-4 rounded-xl shadow-sm border-l-4 border-slate-400 opacity-80">
                  <h4 className="font-bold text-slate-700">{p.name}</h4>
                  <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-100/50 inline-block px-2 py-1 rounded">{p.category}</p>
                </div>
              ))
            )}
          </div>

          {/* Cột 3: Completed */}
          <div className="glass-panel w-80 rounded-2xl p-4 flex-shrink-0 flex flex-col gap-4">
            <h3 className="font-bold text-slate-700 border-b border-slate-300/50 pb-2 flex justify-between">
              <span>Đã hoàn thành</span>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">{completedProjects.length}</span>
            </h3>
            {completedProjects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Trống</p>
            ) : (
              completedProjects.map(p => (
                <div key={p.project_id} className="bg-white/40 p-4 rounded-xl shadow-sm border-l-4 border-green-500 opacity-60">
                  <h4 className="font-medium text-slate-600 line-through">{p.name}</h4>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}
