import React, { useState } from 'react';
import ProjectDetailModal from './ProjectDetailModal';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function HorizonProfileModalWrapper(props) {
  try {
    return <HorizonProfileModal {...props} />;
  } catch (err) {
    console.error("HorizonProfileModal CRASH:", err);
    return (
      <div className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-center">
        <div className="bg-white p-10 rounded-xl text-center">
          <h2 className="text-red-500 font-bold text-2xl mb-4">Lỗi giao diện!</h2>
          <p className="text-slate-600 mb-4">{err.toString()}</p>
          <button onClick={props.onClose} className="bg-slate-200 px-4 py-2 rounded">Đóng</button>
        </div>
      </div>
    );
  }
}

function HorizonProfileModal({ horizonType, horizonData, data, onClose, onRefresh }) {
  const [activeRightTab, setActiveRightTab] = useState('projects'); // 'projects' or 'actions'
  const [activeLeftTab, setActiveLeftTab] = useState('action'); // 'action' or 'project'
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Forms state
  const [newActionName, setNewActionName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');

  const getProjectNotes = (project_id, defaultNotes) => {
    try {
      const notesMap = JSON.parse(localStorage.getItem('gtd_project_notes') || '{}');
      return notesMap[project_id] !== undefined ? notesMap[project_id] : (defaultNotes || '');
    } catch (e) { return defaultNotes || ''; }
  };

  // 1. Lọc dữ liệu liên kết
  let linkedProjects = [];
  let linkedActions = [];
  let horizonTitle = '';
  let horizonBadge = '';
  let horizonId = '';

  if (horizonType === 'mission') {
    horizonTitle = horizonData.statement;
    horizonBadge = '50,000 ft - SỨ MỆNH';
    horizonId = horizonData.mission_id;
    linkedProjects = (data.projects || []).filter(p => p.mission_ids && p.mission_ids.includes(horizonId));
    linkedActions = (data.actions || []).filter(a => a.mission_id === horizonId && !a.project_id);
  } else if (horizonType === 'vision') {
    horizonTitle = horizonData.statement;
    horizonBadge = '40,000 ft - TẦM NHÌN';
    horizonId = horizonData.vision_id;
    linkedProjects = (data.projects || []).filter(p => p.vision_ids && p.vision_ids.includes(horizonId));
    linkedActions = (data.actions || []).filter(a => a.vision_id === horizonId && !a.project_id);
  } else if (horizonType === 'goal') {
    horizonTitle = horizonData.statement;
    horizonBadge = '30,000 ft - MỤC TIÊU';
    horizonId = horizonData.goal_id;
    linkedProjects = (data.projects || []).filter(p => p.goal_ids && p.goal_ids.includes(horizonId));
    linkedActions = (data.actions || []).filter(a => a.goal_id === horizonId && !a.project_id);
  }

  const handleAddAction = async (e) => {
    e.preventDefault();
    if (!newActionName.trim()) return;

    const payload = {
      name: newActionName,
      storage_system: 'Inbox', // Theo yêu cầu: Nhập nhanh vào Inbox để Defining Work sau
      category: 'Strategic',
      context: '@Máy_tính',
      time_needed_mins: 30,
      energy_level: 'Medium',
      work_type: 'Unplanned Work',
      mission_id: horizonType === 'mission' ? horizonId : null,
      vision_id: horizonType === 'vision' ? horizonId : null,
      goal_id: horizonType === 'goal' ? horizonId : null,
    };

    try {
      await fetch(`${API_URL}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setNewActionName('');
      setActiveRightTab('actions');
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const payload = {
      name: newProjectName,
      category: 'Strategic',
      status: 'Active',
      mission_ids: horizonType === 'mission' ? [horizonId] : [],
      vision_ids: horizonType === 'vision' ? [horizonId] : [],
      goal_ids: horizonType === 'goal' ? [horizonId] : [],
    };

    try {
      await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setNewProjectName('');
      setActiveRightTab('projects');
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleDeleteAction = async (id) => {
    if (!window.confirm("Xóa hành động này?")) return;
    try {
      await fetch(`${API_URL}/actions/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) { console.error(e); }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Xóa dự án này? Toàn bộ các công việc bên trong dự án (nếu có) sẽ mồ côi dự án.")) return;
    try {
      await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-4 sm:p-6 flex justify-between items-start text-white">
          <div>
            <div className="flex gap-2 items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                {horizonBadge}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${horizonData.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-300'}`}>
                {horizonData.status || 'Active'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">{horizonTitle}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-rose-500 transition-colors flex items-center justify-center backdrop-blur-md">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* LEFT PANEL: Thêm việc mới */}
          <div className="lg:w-1/3 bg-slate-50 p-6 border-r border-slate-200 flex flex-col gap-6 overflow-y-auto">
            
            {/* Tabs Thêm mới */}
            <div className="flex bg-slate-200/50 p-1 rounded-xl">
              <button 
                onClick={() => setActiveLeftTab('action')} 
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeLeftTab === 'action' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
              >
                + Hành Động (1 Bước)
              </button>
              <button 
                onClick={() => setActiveLeftTab('project')} 
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeLeftTab === 'project' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
              >
                + Dự Án (Nhiều Bước)
              </button>
            </div>

            {activeLeftTab === 'action' && (
              <form onSubmit={handleAddAction} className="flex flex-col gap-4 animate-fade-in-up">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <h4 className="text-blue-800 font-bold text-xs uppercase tracking-widest mb-2"><i className="fa-solid fa-bolt mr-1"></i> Hành động trực tiếp</h4>
                  <p className="text-xs text-blue-600/70 mb-4">Dành cho những việc làm được ngay hoặc chỉ tốn 1 bước. Nó sẽ được ném thẳng vào <b>Inbox</b> để bạn điều phối sau.</p>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Hành Động</label>
                  <textarea autoFocus required value={newActionName} onChange={e => setNewActionName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500 min-h-[80px]" placeholder="VD: Gửi email đăng ký..."></textarea>
                  <button type="submit" className="w-full mt-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-md">
                    <i className="fa-solid fa-plus mr-2"></i> Lưu vào Inbox
                  </button>
                </div>
              </form>
            )}

            {activeLeftTab === 'project' && (
              <form onSubmit={handleAddProject} className="flex flex-col gap-4 animate-fade-in-up">
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                  <h4 className="text-purple-800 font-bold text-xs uppercase tracking-widest mb-2"><i className="fa-solid fa-layer-group mr-1"></i> Khởi tạo Dự Án (10k)</h4>
                  <p className="text-xs text-purple-600/70 mb-4">Dành cho những kết quả đòi hỏi <b>Nhiều bước</b>. Bạn sẽ thiết lập các bước con bên trong Hồ sơ Dự án riêng.</p>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Dự Án</label>
                  <textarea autoFocus required value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-purple-500 min-h-[80px]" placeholder="VD: Ôn thi lấy chứng chỉ IELTS 7.0..."></textarea>
                  <button type="submit" className="w-full mt-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors shadow-md">
                    <i className="fa-solid fa-plus mr-2"></i> Tạo Dự Án Mới
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* RIGHT PANEL: List of items */}
          <div className="lg:w-2/3 flex flex-col bg-white">
            <div className="flex border-b border-slate-200">
              <button onClick={() => setActiveRightTab('projects')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex justify-center items-center gap-2 ${activeRightTab === 'projects' ? 'border-purple-600 text-purple-700 bg-purple-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                <i className="fa-solid fa-layer-group"></i> Dự Án Liên Kết ({linkedProjects.length})
              </button>
              <button onClick={() => setActiveRightTab('actions')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex justify-center items-center gap-2 ${activeRightTab === 'actions' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                <i className="fa-solid fa-bolt"></i> Hành Động Trực Tiếp ({linkedActions.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-3">
              
              {activeRightTab === 'projects' && (
                linkedProjects.length === 0 ? (
                  <EmptyState icon="fa-layer-group" text="Chưa có Dự án nào phục vụ cho mục tiêu/tầm nhìn này." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {linkedProjects.map(p => (
                      <div 
                        key={p.project_id} 
                        onClick={() => setSelectedProject(p)}
                        className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer hover:border-purple-300"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${p.status === 'Active' ? 'bg-green-100 text-green-700' : p.status === 'Completed' ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700'}`}>
                            {p.status}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.project_id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fa-solid fa-trash text-xs"></i>
                          </button>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm flex-1">{p.name}</h4>
                        
                        {getProjectNotes(p.project_id, p.notes) && (
                          <div className="mt-2 text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200/80 flex items-start gap-1.5 shadow-2xs">
                            <i className="fa-solid fa-note-sticky text-amber-600 mt-0.5 shrink-0 text-xs"></i>
                            <span className="line-clamp-2 italic font-medium">{getProjectNotes(p.project_id, p.notes)}</span>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium"><i className="fa-solid fa-list-check mr-1"></i> {(data.actions || []).filter(a => a.project_id === p.project_id).length} việc con</span>
                          <span className="text-purple-600 font-bold hover:underline flex items-center gap-1">
                            Hồ Sơ <i className="fa-solid fa-arrow-right text-[10px]"></i>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeRightTab === 'actions' && (
                linkedActions.length === 0 ? (
                  <EmptyState icon="fa-bolt" text="Chưa có Hành động đơn lẻ trực tiếp nào." />
                ) : (
                  linkedActions.map(a => (
                    <div key={a.action_id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group flex justify-between items-center">
                      <div>
                        <h4 className={`font-bold text-sm ${a.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{a.name}</h4>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded">
                            {a.storage_system.replace('_', ' ')}
                          </span>
                          {a.status === 'Done' && (
                            <span className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded">
                              HOÀN THÀNH
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteAction(a.action_id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  ))
                )
              )}

            </div>
          </div>
        </div>
      </div>
      {selectedProject && (
        <ProjectDetailModal 
          project={selectedProject} 
          data={data} 
          onClose={() => setSelectedProject(null)} 
          onRefresh={onRefresh} 
        />
      )}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <i className={`fa-solid ${icon} text-4xl mb-4 opacity-30`}></i>
      <p className="text-sm font-medium text-center max-w-xs">{text}</p>
      {selectedProject && (
        <ProjectDetailModal 
          project={selectedProject} 
          data={data} 
          onClose={() => setSelectedProject(null)} 
          onRefresh={onRefresh} 
        />
      )}
    </div>
  );
}
