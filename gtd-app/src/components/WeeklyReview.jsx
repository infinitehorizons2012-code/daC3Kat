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

export default function WeeklyReview() {
  const [data, setData] = useState({ actions: [], projects: [], areas: [] });
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [newActionName, setNewActionName] = useState('');
  const [weeklyCapacityHrs, setWeeklyCapacityHrs] = useState(40);

  const [capacities, setCapacities] = useState({});
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const currentWeek = getWeekString(0);


  const fetchData = async () => {
    try {
      const [actionsRes, horizonsRes, areasRes] = await Promise.all([
        fetch(`${API_URL}/actions`), fetch(`${API_URL}/horizons`), fetch(`${API_URL}/areas`), fetch(`${API_URL}/weekly-capacities`)
      ]);
      const acData = await actionsRes.json();
      const hData = await horizonsRes.json();
      const arData = await areasRes.json();
      setData({ 
        actions: acData, projects: hData.projects || [], areas: arData
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePullToWeek = async (action) => {
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_system: 'Next_Actions' })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleCreateAction = async (e) => {
    e.preventDefault();
    if (!newActionName.trim() || !selectedProject) return;
    
    const payload = {
      name: newActionName,
      area_id: selectedProject.area_id,
      project_id: selectedProject.project_id,
      storage_system: 'Project_Backlog', // Add to backlog by default during review
      category: 'Strategic',
      context: '@Máy_tính',
      time_needed_mins: 30,
      energy_level: 'Medium',
      work_type: 'Defined Work'
    };

    try {
      await fetch(`${API_URL}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setNewActionName('');
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;

  const activeProjects = data.projects.filter(p => p.status === 'Active');
  
  // Right Column stats
  const weekActions = data.actions.filter(a => a.status !== 'Done' && (a.storage_system === 'Next_Actions' || a.storage_system === 'Calendar'));
  const nextActions = weekActions.filter(a => a.storage_system === 'Next_Actions');
  const calActions = weekActions.filter(a => a.storage_system === 'Calendar');
  const totalMins = nextActions.reduce((sum, a) => sum + (a.time_needed_mins || 0), 0);

  return (
    <div className="flex flex-col gap-6 min-h-[500px]">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div>
          <h2 className="text-2xl font-black text-slate-800"><i className="fa-solid fa-scale-balanced text-indigo-600 mr-2"></i> Weekly Review (Lên Kế Hoạch)</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Đánh giá Dự án và Rút công việc (Pull) vào kế hoạch tuần 168h.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
        {/* LEFT COLUMN: Projects & Backlog */}
        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-200">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs"><i className="fa-solid fa-layer-group text-purple-500 mr-2"></i> Danh Sách Dự Án</h3>
            <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-full">{activeProjects.length} Active</span>
          </div>
          <div className="flex flex-1 overflow-hidden">
            {/* Project List */}
            <div className="w-1/3 border-r border-slate-100 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-50/30">
              {activeProjects.map(p => (
                <div 
                  key={p.project_id} 
                  onClick={() => setSelectedProject(p)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedProject?.project_id === p.project_id ? 'bg-white border-purple-300 shadow-sm' : 'border-transparent hover:bg-slate-100'}`}
                >
                  <div className="text-xs font-bold text-slate-700 line-clamp-2">{p.name}</div>
                </div>
              ))}
            </div>
            
            {/* Project Details & Backlog */}
            <div className="w-2/3 p-4 overflow-y-auto custom-scrollbar bg-white">
              {selectedProject ? (
                <div>
                  <h4 className="font-black text-slate-800 mb-4">{selectedProject.name}</h4>
                  
                  {/* Quick Add Action for this project */}
                  <form onSubmit={handleCreateAction} className="flex gap-2 mb-6">
                    <input 
                      type="text" 
                      value={newActionName}
                      onChange={e => setNewActionName(e.target.value)}
                      placeholder="Thêm việc cho dự án (vào Backlog)..." 
                      className="flex-1 p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-purple-400"
                    />
                    <button type="submit" className="bg-purple-100 text-purple-600 hover:bg-purple-200 px-3 rounded-lg font-bold transition-colors"><i className="fa-solid fa-plus"></i></button>
                  </form>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Kho chờ Dự Án (Project Backlog)</h5>
                    {data.actions.filter(a => a.project_id === selectedProject.project_id && a.status !== 'Done' && a.storage_system === 'Project_Backlog').map(a => (
                      <div key={a.action_id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center group">
                        <div className="text-sm font-medium text-slate-700">{a.name}
                          {a.depends_on_action_id && <div className="text-[10px] text-orange-500 mt-1"><i className="fa-solid fa-link"></i> Đang chờ: {data.actions.find(x => x.action_id === a.depends_on_action_id)?.name}</div>}
                        </div>
                        <button onClick={() => handlePullToWeek(a)} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-arrow-right"></i> Rút</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <i className="fa-solid fa-hand-pointer text-3xl mb-3 opacity-30"></i>
                  <p className="text-sm font-medium">Chọn một dự án để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Week's Capacity */}
        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-200">
          <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
            <h3 className="font-black uppercase tracking-widest text-xs"><i className="fa-solid fa-battery-three-quarters text-green-400 mr-2"></i> Dạ Dày Tuần Này (Core 168h)</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-700 px-2 py-1 rounded">{currentWeek}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2">Sức chứa (Giờ):</span>
              <input type="number" min="1" max="168" value={weeklyCapacityHrs} onChange={e => setWeeklyCapacityHrs(Number(e.target.value) || 1)} className="w-16 bg-slate-700 text-white border border-slate-600 rounded text-center text-xs font-bold p-1 outline-none focus:border-green-400" />
              <button onClick={() => setIsCapacityModalOpen(true)} className="w-7 h-7 bg-indigo-600 hover:bg-indigo-500 rounded text-white flex items-center justify-center transition-colors ml-1"><i className="fa-solid fa-calendar-week"></i></button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-slate-800 h-1.5 w-full overflow-hidden flex">
            <div 
              className={`h-full transition-all duration-500 ${totalMins > weeklyCapacityHrs * 60 ? 'bg-red-500' : 'bg-green-500'}`} 
              style={{ width: `${Math.min((totalMins / (weeklyCapacityHrs * 60)) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="p-4 bg-slate-700 text-slate-200 grid grid-cols-3 gap-4 border-b border-slate-600">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{nextActions.length}</div>
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">Next Actions</div>
            </div>
            <div className="text-center border-l border-slate-600">
              <div className="text-2xl font-black text-emerald-400">{calActions.length}</div>
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">Lịch Hẹn</div>
            </div>
            <div className="text-center border-l border-slate-600">
              <div className="text-2xl font-black text-amber-400">{Math.round(totalMins/60 * 10)/10}h</div>
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">Khối Lượng</div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-50">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-3">Công việc cam kết tuần này</h5>
            <div className="space-y-2">
              {weekActions.map(a => (
                <div key={a.action_id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${a.storage_system === 'Calendar' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    <i className={a.storage_system === 'Calendar' ? 'fa-regular fa-calendar-check text-xs' : 'fa-solid fa-bolt text-xs'}></i>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{a.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">{data.projects.find(p => p.project_id === a.project_id)?.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {a.storage_system === 'Calendar' ? (
                        <span className="text-emerald-600 font-medium">{new Date(a.scheduled_datetime).toLocaleDateString('vi-VN')}</span>
                      ) : (
                        <span>{a.time_needed_mins}m • {a.energy_level}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {weekActions.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-medium">Chưa có việc nào trong tuần này. Hãy rút từ dự án sang!</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <WeeklyCapacityModal 
        isOpen={isCapacityModalOpen} 
        onClose={() => setIsCapacityModalOpen(false)} 
        capacities={capacities} 
        onRefresh={fetchData} 
      />

    </div>
  );
}



function WeeklyCapacityModal({ isOpen, onClose, capacities, onRefresh }) {
  const [localCaps, setLocalCaps] = useState({});
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (isOpen) setLocalCaps({...capacities});
  }, [isOpen, capacities]);

  if (!isOpen) return null;

  const weeks = Array.from({length: 5}).map((_, i) => getWeekString(i));

  const handleSave = async () => {
    setSaving(true);
    const payload = Object.keys(localCaps).map(w => ({ week_id: w, capacity_hrs: localCaps[w] }));
    try {
      await fetch(`https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api/weekly-capacities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      onRefresh();
      onClose();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex justify-center items-center backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
        <h3 className="text-lg font-black text-slate-800 mb-1"><i className="fa-solid fa-calendar-week text-indigo-500 mr-2"></i> Lập kế hoạch Dạ dày</h3>
        <p className="text-xs text-slate-500 mb-5">Thiết lập số giờ muốn làm việc cho các tuần tới.</p>
        
        <div className="space-y-3 mb-6">
          {weeks.map((week, idx) => (
            <div key={week} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <div className="font-bold text-slate-700 text-sm">{week}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">{idx === 0 ? 'Tuần này' : `Sau ${idx} tuần`}</div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" min="1" max="168"
                  value={localCaps[week] || 40}
                  onChange={(e) => setLocalCaps({...localCaps, [week]: Number(e.target.value) || 0})}
                  className="w-16 bg-white border border-slate-300 rounded-lg text-center font-bold p-1.5 outline-none focus:border-indigo-500 text-sm"
                />
                <span className="text-xs font-bold text-slate-400">giờ</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Hủy</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md">
            {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </div>
  );
}
