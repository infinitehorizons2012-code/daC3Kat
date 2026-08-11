import React, { useState } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function ProjectDetailModalWrapper(props) {
  try {
    return <ProjectDetailModal {...props} />;
  } catch (err) {
    console.error("ProjectDetailModal CRASH:", err);
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

function ProjectDetailModal({ project, data, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('backlog');
  const [newAction, setNewAction] = useState({
    name: '',
    recurrence_rule: '',
    deadline_date: '',
    depends_on_action_id: ''
  });

  const projectActions = (data?.actions || []).filter(a => a.project_id === project.project_id);
  const backlogActions = (projectActions || []).filter(a => a.status !== 'Done' && a.storage_system === 'Project_Backlog');
  const activeActions = (projectActions || []).filter(a => a.status !== 'Done' && (a.storage_system === 'Next_Actions' || a.storage_system === 'Calendar' || a.storage_system === 'Floating_Backlog'));
  const doneActions = (projectActions || []).filter(a => a.status === 'Done');

  const handleAddAction = async (e) => {
    e.preventDefault();
    if (!newAction.name.trim()) return;

    const payload = {
      name: newAction.name,
      area_id: project.area_id,
      project_id: project.project_id,
      storage_system: 'Project_Backlog',
      category: 'Strategic',
      context: '@Máy_tính',
      time_needed_mins: 30,
      energy_level: 'Medium',
      work_type: 'Defined Work',
      recurrence_rule: newAction.recurrence_rule || null,
      deadline_date: newAction.deadline_date || null,
      depends_on_action_id: newAction.depends_on_action_id || null
    };

    try {
      await fetch(`${API_URL}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setNewAction({ name: '', recurrence_rule: '', deadline_date: '', depends_on_action_id: '' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleDone = async (action) => {
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action.status === 'Done' ? 'Pending' : 'Done' })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAction = async (id) => {
    if (!window.confirm("Xóa hành động này?")) return;
    try {
      await fetch(`${API_URL}/actions/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-slate-800 p-4 sm:p-6 flex justify-between items-start text-white">
          <div>
            <div className="flex gap-2 items-center mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${project.category === 'Strategic' ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'}`}>
                {project.category}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${project.status === 'Active' ? 'bg-green-500/20 text-green-300' : project.status === 'Completed' ? 'bg-slate-500/20 text-slate-300' : 'bg-orange-500/20 text-orange-300'}`}>
                {project.status}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">{project.name}</h2>
            <p className="text-sm text-slate-400 mt-1">
              <i className="fa-solid fa-map-location-dot mr-1"></i> {(data?.areas || []).find(a => a.area_id === project.area_id)?.name}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-700 text-slate-300 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* LEO PANEL: Thêm việc mới */}
          <div className="lg:w-1/3 bg-slate-50 p-6 border-r border-slate-200 overflow-y-auto">
            <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4"><i className="fa-solid fa-bolt text-yellow-500 mr-2"></i> Thêm việc vào Dự án</h3>
            
            <form onSubmit={handleAddAction} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Hành Động</label>
                <textarea required value={newAction.name} onChange={e => setNewAction({...newAction, name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-500 min-h-[80px]" placeholder="VD: Lên danh sách khách mời..."></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"><i className="fa-solid fa-calendar-check mr-1"></i> Hạn chót (Deadline)</label>
                <input type="date" value={newAction.deadline_date} onChange={e => setNewAction({...newAction, deadline_date: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"><i className="fa-solid fa-rotate mr-1"></i> Lặp lại định kỳ</label>
                <select value={newAction.recurrence_rule} onChange={e => setNewAction({...newAction, recurrence_rule: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-500">
                  <option value="">Không lặp lại</option>
                  <option value="Daily">Hàng ngày</option>
                  <option value="Weekly">Hàng tuần</option>
                  <option value="Monthly">Hàng tháng</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"><i className="fa-solid fa-link mr-1"></i> Phụ thuộc việc khác</label>
                <select value={newAction.depends_on_action_id} onChange={e => setNewAction({...newAction, depends_on_action_id: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-500">
                  <option value="">Không phụ thuộc (Độc lập)</option>
                  {projectActions.filter(a => a.status !== 'Done').map(a => (
                    <option key={a.action_id} value={a.action_id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-md mt-2">
                <i className="fa-solid fa-plus mr-2"></i> Lưu vào Hồ Sơ Dự Án
              </button>
            </form>
          </div>

          {/* RIGHT PANEL: List of Actions */}
          <div className="lg:w-2/3 flex flex-col bg-white">
            <div className="flex border-b border-slate-200">
              <button onClick={() => setActiveTab('backlog')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'backlog' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                📥 Backlog Dự án ({backlogActions.length})
              </button>
              <button onClick={() => setActiveTab('active')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'active' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                ⚡ Đang Thực Thi ({activeActions.length})
              </button>
              <button onClick={() => setActiveTab('done')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'done' ? 'border-green-500 text-green-700 bg-green-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                ✅ Đã Xong ({doneActions.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-3">
              {activeTab === 'backlog' && backlogActions.map(a => <ActionItem key={a.action_id} action={a} data={data} onToggle={() => handleToggleDone(a)} onDelete={() => handleDeleteAction(a.action_id)} />)}
              {activeTab === 'active' && activeActions.map(a => <ActionItem key={a.action_id} action={a} data={data} onToggle={() => handleToggleDone(a)} onDelete={() => handleDeleteAction(a.action_id)} />)}
              {activeTab === 'done' && doneActions.map(a => <ActionItem key={a.action_id} action={a} data={data} onToggle={() => handleToggleDone(a)} onDelete={() => handleDeleteAction(a.action_id)} />)}
              
              {activeTab === 'backlog' && backlogActions.length === 0 && <EmptyState text="Chưa có việc nào nằm chờ trong dự án này." />}
              {activeTab === 'active' && activeActions.length === 0 && <EmptyState text="Chưa có việc nào được rút ra để làm trong tuần này." />}
              {activeTab === 'done' && doneActions.length === 0 && <EmptyState text="Chưa có việc nào hoàn thành." />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionItem({ action, data, onToggle, onDelete }) {
  const isDone = action.status === 'Done';
  return (
    <div className={`p-4 bg-white border ${isDone ? 'border-green-200' : 'border-slate-200'} rounded-xl shadow-sm flex items-start gap-4 group transition-all hover:shadow-md`}>
      <button onClick={onToggle} className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border ${isDone ? 'bg-green-500 border-green-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500'} transition-colors`}>
        {isDone && <i className="fa-solid fa-check text-xs"></i>}
      </button>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-sm ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{action.name}</h4>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {action.storage_system && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-1 rounded">
              {action.storage_system.replace('_', ' ')}
            </span>
          )}
          {action.deadline_date && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border flex items-center ${new Date(action.deadline_date) < new Date() && !isDone ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
              <i className="fa-solid fa-clock mr-1"></i> Hạn: {new Date(action.deadline_date).toLocaleDateString('vi-VN')}
            </span>
          )}
          {action.recurrence_rule && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200 flex items-center">
              <i className="fa-solid fa-rotate mr-1"></i> {action.recurrence_rule}
            </span>
          )}
          {action.depends_on_action_id && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-200 flex items-center truncate max-w-[200px]">
              <i className="fa-solid fa-link mr-1"></i> Chờ: {(data?.actions || []).find(a => a.action_id === action.depends_on_action_id)?.name || 'Việc đã xóa'}
            </span>
          )}
        </div>
      </div>
      <button onClick={onDelete} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 flex-shrink-0">
        <i className="fa-solid fa-trash text-xs"></i>
      </button>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <i className="fa-regular fa-folder-open text-4xl mb-3 opacity-30"></i>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
