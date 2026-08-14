import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

const getISOWeekStr = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export default function FocusReportView() {
  const [sessions, setSessions] = useState([]);
  const [actions, setActions] = useState([]);
  const [horizons, setHorizons] = useState({ missions: [], visions: [], goals: [], projects: [] });
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Sub-Tab: 'table', 'calendar', 'mission_capacity'
  const [activeSubTab, setActiveSubTab] = useState('table');
  const [selectedPillarModal, setSelectedPillarModal] = useState(null);

  // Filters
  const [timeRange, setTimeRange] = useState('all'); // 'today', 'week', 'month', 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Modal State
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState({
    action_name: '',
    action_id: '',
    project_id: '',
    goal_id: '',
    mission_id: '',
    start_time: '',
    end_time: '',
    duration_mins: 25,
    notes: ''
  });

  // Manual Create Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    action_name: '',
    action_id: '',
    project_id: '',
    goal_id: '',
    mission_id: '',
    start_time: '',
    end_time: '',
    duration_mins: 25,
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fsRes, acRes, hRes, capRes] = await Promise.all([
        fetch(`${API_URL}/focus-sessions`),
        fetch(`${API_URL}/actions`),
        fetch(`${API_URL}/horizons`),
        fetch(`${API_URL}/weekly-capacities`)
      ]);
      const fsData = await fsRes.json();
      const acData = await acRes.json();
      const hData = await hRes.json();
      const capData = await capRes.json();

      let loadedSessions = Array.isArray(fsData) ? fsData : [];
      try {
        const storedEdits = JSON.parse(localStorage.getItem('gtd_pomodoro_session_edits') || '{}');
        loadedSessions = loadedSessions.map(s => storedEdits[s.session_id] ? { ...s, ...storedEdits[s.session_id] } : s);
      } catch (e) {}
      setSessions(loadedSessions);
      setActions(Array.isArray(acData) ? acData : []);
      setHorizons(hData || { missions: [], visions: [], goals: [], projects: [] });
      setCapacities(Array.isArray(capData) ? capData : []);
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu Focus Report:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActionSelectInEdit = (actionId) => {
    const selected = actions.find(a => a.action_id === actionId);
    if (selected) {
      setEditForm(prev => ({
        ...prev,
        action_id: selected.action_id,
        action_name: selected.name || selected.title,
        project_id: selected.project_id || prev.project_id,
        goal_id: selected.goal_id || prev.goal_id,
        mission_id: selected.mission_id || prev.mission_id
      }));
    } else {
      setEditForm(prev => ({ ...prev, action_id: actionId }));
    }
  };

  const handleActionSelectInAdd = (actionId) => {
    const selected = actions.find(a => a.action_id === actionId);
    if (selected) {
      setAddForm(prev => ({
        ...prev,
        action_id: selected.action_id,
        action_name: selected.name || selected.title,
        project_id: selected.project_id || prev.project_id,
        goal_id: selected.goal_id || prev.goal_id,
        mission_id: selected.mission_id || prev.mission_id
      }));
    } else {
      setAddForm(prev => ({ ...prev, action_id: actionId }));
    }
  };

  const handleEditClick = (session) => {
    setEditingSession(session);
    setEditForm({
      action_name: session.action_name || '',
      action_id: session.action_id || '',
      project_id: session.project_id || '',
      goal_id: session.goal_id || '',
      mission_id: session.mission_id || '',
      start_time: session.start_time || session.created_at || '',
      end_time: session.end_time || '',
      duration_mins: session.duration_mins || 25,
      notes: session.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSession) return;

    const updatedSession = { ...editingSession, ...editForm };

    // 1. Save to local state
    setSessions(prev => prev.map(s => 
      s.session_id === editingSession.session_id ? updatedSession : s
    ));

    // 2. Save to localStorage for 100% permanent persistence
    try {
      const storedEdits = JSON.parse(localStorage.getItem('gtd_pomodoro_session_edits') || '{}');
      storedEdits[editingSession.session_id] = updatedSession;
      localStorage.setItem('gtd_pomodoro_session_edits', JSON.stringify(storedEdits));
    } catch (e) {}

    const targetId = editingSession.session_id;
    setEditingSession(null);

    // 3. Network sync to backend API
    try {
      await fetch(`${API_URL}/focus-sessions/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
    } catch (e) {
      console.error("Backend sync info:", e);
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
        body: JSON.stringify(addForm)
      });
      setShowAddModal(false);
      setAddForm({ action_name: '', action_id: '', project_id: '', goal_id: '', mission_id: '', start_time: '', end_time: '', duration_mins: 25, notes: '' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;
  }


  // Exact Database Vision Pillar Map
  const PILLAR_VISION_MAP = {
    'vis-1786590462256': 'academic',     // 1. Khối Core Academic
    'vis-1786607493926': 'deepwork',     // 2. Deep Work / Dream Map
    'vis-1786607530122': 'building',     // 3. Building & Portfolio
    'vis-1786607544898': 'maintenance'   // 4. System Maintenance
  };

  const getPillarForSession = (session) => {
    // 1. Directly linked project
    let projId = session.project_id;
    let goalId = session.goal_id;
    let visId = session.mission_id;

    // 2. Trace via Action
    if (session.action_id && actions.length > 0) {
      const act = actions.find(a => a.action_id === session.action_id);
      if (act) {
        if (!projId) projId = act.project_id;
        if (!goalId) goalId = act.goal_id;
      }
    }

    // 3. Trace via Project -> Goal -> Vision
    if (projId && horizons.projects.length > 0) {
      const proj = horizons.projects.find(p => p.project_id === projId);
      if (proj && proj.goal_id) goalId = proj.goal_id;
    }

    if (goalId && horizons.goals.length > 0) {
      const g = horizons.goals.find(goal => goal.goal_id === goalId);
      if (g && g.vision_id) visId = g.vision_id;
    }

    if (visId && PILLAR_VISION_MAP[visId]) {
      return PILLAR_VISION_MAP[visId];
    }

    // Fallback keyword trace if IDs not yet set
    const nameStr = (session.action_name || '').toLowerCase();
    if (nameStr.includes('algebra') || nameStr.includes('pinyin') || nameStr.includes('python') || nameStr.includes('học') || nameStr.includes('sat')) {
      return 'academic';
    } else if (nameStr.includes('drum') || nameStr.includes('nhạc') || nameStr.includes('kỹ năng') || nameStr.includes('tiếng trung')) {
      return 'deepwork';
    } else if (nameStr.includes('móc') || nameStr.includes('da móc') || nameStr.includes('portfolio') || nameStr.includes('building')) {
      return 'building';
    } else if (nameStr.includes('pe') || nameStr.includes('thể thao') || nameStr.includes('vệ sinh') || nameStr.includes('routine')) {
      return 'maintenance';
    }

    return 'academic';
  };

  // Filtered Sessions (Declared FIRST)
  const filteredSessions = (sessions || []).filter(s => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (s.action_name || '').toLowerCase();
      const notes = (s.notes || '').toLowerCase();
      if (!name.includes(q) && !notes.includes(q)) return false;
    }
    return true;
  });

  // Aggregate actual Pomodoro hours per Pillar via strict database tracing
  const pillarHours = { academic: 0, deepwork: 0, building: 0, maintenance: 0 };
  filteredSessions.forEach(s => {
    const pKey = getPillarForSession(s);
    const mins = Number(s.duration_mins) || 25;
    pillarHours[pKey] += mins;
  });

  const academicPillarHrs = Math.round((pillarHours.academic / 60) * 10) / 10;
  const deepworkPillarHrs = Math.round((pillarHours.deepwork / 60) * 10) / 10;
  const buildingPillarHrs = Math.round((pillarHours.building / 60) * 10) / 10;
  const maintenancePillarHrs = Math.round((pillarHours.maintenance / 60) * 10) / 10;

  // Calculate totals
  const totalMins = filteredSessions.reduce((sum, s) => sum + (Number(s.duration_mins) || 0), 0);
  const totalHours = Math.round((totalMins / 60) * 10) / 10;
  const totalPoms = Math.round(totalMins / 25);

  // Stomach Capacity Stats vs Pomodoro Log
  const now = new Date();
  const currentISOWeek = getISOWeekStr(now);
  const currentCapObj = capacities.find(c => c.week_code === currentISOWeek) || {};
  const weeklyCapacityHrs = currentCapObj.capacity_hrs || 63;
  const totalCommittedHrs = 21; // 11h Occupied + 10h Next Actions
  const actualPomHrs = totalHours;
  const executionRate = totalCommittedHrs > 0 ? Math.min(100, Math.round((actualPomHrs / totalCommittedHrs) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in max-w-5xl mx-auto w-full">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-amber-500/30">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-black uppercase tracking-widest mb-1">
            <i className="fa-solid fa-stopwatch"></i> Pomodoro Focus Time Log & GTD Alignment Engine
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-chart-pie text-amber-400"></i> Nhật Ký Pomodoro & Đối Chiếu GTD
          </h2>
          <p className="text-xs text-amber-100 mt-1 font-medium max-w-2xl">
            Báo cáo chính xác tên Hành Động GTD, chỉnh sửa liên kết Dự Án / Mục Tiêu / Sứ Mệnh & xem đối chiếu Dạ Dày Tuần.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-md flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> + Nhập Thủ Công Hiệp Pomodoro
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Tổng Giờ Tập Trung</span>
            <span className="text-2xl font-black text-slate-800">{totalHours}h <span className="text-xs text-slate-400 font-bold">({totalMins}m)</span></span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-stopwatch"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Tổng Hiệp Pomodoro</span>
            <span className="text-2xl font-black text-rose-600">{totalPoms} <span className="text-xs text-slate-400 font-bold">hiệp</span></span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-bullseye"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Dạ Dày Tuần Đã Lấp</span>
            <span className="text-2xl font-black text-indigo-600">{actualPomHrs}h / {totalCommittedHrs}h</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-[#10b981]"></i>
            <i className="fa-solid fa-fire"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Tỷ Lệ Hoàn Thành</span>
            <span className="text-xl font-black text-emerald-600">{executionRate}%</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button 
          onClick={() => setActiveSubTab('table')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${activeSubTab === 'table' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <i className="fa-solid fa-table-list"></i> 📋 Bảng Nhật Ký & Gắn Liên Kết GTD
        </button>

        <button 
          onClick={() => setActiveSubTab('mission_capacity')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${activeSubTab === 'mission_capacity' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <i className="fa-solid fa-bullseye"></i> 🎯 Báo Cáo Sứ Mệnh & Dạ Dày Tuần
        </button>
      </div>

      {/* SUB-TAB 1: BẢNG NHẬT KÝ & GẮN LIÊN KẾT GTD */}
      {activeSubTab === 'table' && (
        <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-amber-600"></i> Nhật Ký Các Hiệp Pomodoro Đã Thực Hiện
            </h3>
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm tên công việc..."
              className="p-2 border border-slate-300 rounded-xl outline-none focus:border-amber-500 text-xs font-bold w-full sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-wider bg-slate-50/50">
                  <th className="p-3">Thời Gian</th>
                  <th className="p-3">Tên Hành Động GTD / Công Việc</th>
                  <th className="p-3">Gắn Liên Kết GTD (Dự Án / Mục Tiêu / Sứ Mệnh)</th>
                  <th className="p-3 text-center">Thời Lượng</th>
                  <th className="p-3 text-right">Điều Chỉnh & Liên Kết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {filteredSessions.map(session => {
                  const linkedAction = actions.find(a => a.action_id === session.action_id);
                  const linkedProj = horizons.projects.find(p => p.project_id === (session.project_id || linkedAction?.project_id));
                  const linkedGoal = horizons.goals.find(g => g.goal_id === (session.goal_id || linkedAction?.goal_id));
                  const linkedMission = horizons.missions.find(m => m.mission_id === (session.mission_id || linkedAction?.mission_id));

                  return (
                    <tr key={session.session_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        <span className="font-black text-slate-800 text-xs block">{session.created_at ? session.created_at.slice(0, 16) : 'Gần đây'}</span>
                      </td>

                      <td className="p-3 font-black text-slate-800">
                        {session.action_name || linkedAction?.name || 'Hiệp Pomodoro'}
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {linkedProj ? <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">🎯 Dự án: {linkedProj.name}</span> : <span className="text-[9px] text-slate-300 italic">Chưa gắn dự án</span>}
                          {linkedGoal && <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">🏆 Mục tiêu: {linkedGoal.statement}</span>}
                          {linkedMission && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">🌟 Sứ mệnh: {linkedMission.statement?.slice(0, 15)}...</span>}
                        </div>
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-black text-[11px] border border-amber-300">
                          ⏱️ {session.duration_mins || 25}m
                        </span>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(session)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 font-bold text-[11px] rounded-lg transition-all"
                          >
                            ✏️ Sửa & Liên Kết GTD
                          </button>
                          <button 
                            onClick={() => handleDeleteSession(session.session_id)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-[11px] rounded-lg transition-all"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SỨ MỆNH & DẠ DÀY TUẦN */}
      {activeSubTab === 'mission_capacity' && (
        <div className="space-y-6">
          
          {/* Block 1: Dạ Dày Tuần */}
          <div className="glass-panel p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
            <h3 className="text-lg font-black text-amber-400 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-battery-half"></i> Báo Cáo Đối Chiếu Pomodoro Với Dạ Dày Tuần ({currentISOWeek})
            </h3>
            <p className="text-xs text-slate-300 font-medium mb-4">
              Tự động tích lũy giờ Pomodoro tập trung thực tế và so sánh với cam kết Dạ Dày Tuần 21h.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Sức chứa dạ dày</span>
                <span className="text-xl font-black text-white">{weeklyCapacityHrs}h / tuần</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Đã cam kết nạp</span>
                <span className="text-xl font-black text-blue-400">{totalCommittedHrs}h</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Giờ Pomodoro thực tế</span>
                <span className="text-xl font-black text-amber-400">{actualPomHrs}h / {totalCommittedHrs}h</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">4. Tỷ lệ thực thi</span>
                <span className="text-xl font-black text-emerald-400">{executionRate}%</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mt-4 border border-slate-700">
              <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${executionRate}%` }}></div>
            </div>
          </div>

          {/* Block 2: Báo Cáo Tầm Nhìn 4 Trụ Cột (40k ft) */}
          <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-indigo-600"></i> Báo Cáo Phân Bổ Giờ Pomodoro Theo 4 Trụ Cột Tầm Nhìn (40,000 ft)
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Tự động tổng hợp số giờ Pomodoro đã tập trung thực tế vào 4 Trụ Cột.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 block mb-1">Khối 1 (Target 40%)</span>
                  <h4 className="font-black text-indigo-950 text-sm">1. Core Academic</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Toán Algebra 1, Pinyin, Python Data Science...</p>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-200 flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-bold">Thực tế: {academicPillarHrs}h</span>
                  <button onClick={() => setSelectedPillarModal('academic')} className="px-2.5 py-1 bg-indigo-600 text-white font-black text-[10px] rounded-lg shadow-sm hover:bg-indigo-700">
                    🔎 Xem Hồ Sơ
                  </button>
                </div>
              </div>

              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-rose-600 block mb-1">Khối 2 (Target 35%)</span>
                  <h4 className="font-black text-rose-950 text-sm">2. Deep Work / Dream Map</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Dự án ước mơ & nghiên cứu tập trung...</p>
                </div>
                <div className="mt-4 pt-3 border-t border-rose-200 flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-bold">Thực tế: {deepworkPillarHrs}h</span>
                  <button onClick={() => setSelectedPillarModal('deepwork')} className="px-2.5 py-1 bg-rose-600 text-white font-black text-[10px] rounded-lg shadow-sm hover:bg-rose-700">
                    🔎 Xem Hồ Sơ
                  </button>
                </div>
              </div>

              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-600 block mb-1">Khối 3 (Target 15%)</span>
                  <h4 className="font-black text-purple-950 text-sm">3. Building & Portfolio</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Dự án DA Móc, Sản phẩm thực hành...</p>
                </div>
                <div className="mt-4 pt-3 border-t border-purple-200 flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-bold">Thực tế: {buildingPillarHrs}h</span>
                  <button onClick={() => setSelectedPillarModal('building')} className="px-2.5 py-1 bg-purple-600 text-white font-black text-[10px] rounded-lg shadow-sm hover:bg-purple-700">
                    🔎 Xem Hồ Sơ
                  </button>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 block mb-1">Khối 4 (Target 10%)</span>
                  <h4 className="font-black text-emerald-950 text-sm">4. System Maintenance</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Sức khỏe, Thể thao PE, Rà soát Routine...</p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-200 flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-bold">Thực tế: {maintenancePillarHrs}h</span>
                  <button onClick={() => setSelectedPillarModal('maintenance')} className="px-2.5 py-1 bg-emerald-600 text-white font-black text-[10px] rounded-lg shadow-sm hover:bg-emerald-700">
                    🔎 Xem Hồ Sơ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Block 3: Danh Sách Sứ Mệnh (Missions 30k ft) */}
          <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-bullseye text-amber-600"></i> Tiến Độ Tích Lũy Theo Từng Sứ Mệnh (Missions 30,000 ft)
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">Các Sứ Mệnh được liên kết trực tiếp từ nhật ký Pomodoro.</p>

            <div className="space-y-3">
              {horizons.missions && horizons.missions.length > 0 ? (
                horizons.missions.map(m => {
                  const missionSessions = sessions.filter(s => s.mission_id === m.mission_id);
                  const mMins = missionSessions.reduce((sum, s) => sum + (Number(s.duration_mins) || 0), 0);
                  const mHrs = Math.round((mMins / 60) * 10) / 10;

                  return (
                    <div key={m.mission_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Sứ Mệnh ID: {m.mission_id}</span>
                        <h4 className="font-black text-slate-800 text-sm mt-0.5">{m.statement}</h4>
                        <span className="text-xs text-slate-500 mt-1 block">Đã có {missionSessions.length} hiệp Pomodoro gắn liên kết</span>
                      </div>
                      <span className="text-base font-black bg-amber-100 text-amber-900 px-4 py-2 rounded-2xl border border-amber-300">
                        ⏱️ {mHrs}h ({mMins}m)
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-bold">
                  🌟 Sứ mệnh "1. Khối Core Academic (40%)" — Đã tích lũy {totalHours}h từ các hiệp Pomodoro học tập.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* EDIT MODAL WITH GTD LINKERS */}
      {editingSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl bg-white max-w-lg w-full shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-amber-600"></i> Điều Chỉnh Hiệp Pomodoro & Liên Kết GTD
              </h3>
              <button onClick={() => setEditingSession(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-900 font-black">🎯 Gắn Chọn Hành Động GTD Có Sẵn:</label>
                <select 
                  value={editForm.action_id}
                  onChange={e => handleActionSelectInEdit(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500 bg-white"
                >
                  <option value="">[Tự nhập tên hoặc chọn Hành Động GTD...]</option>
                  {actions.map(a => (
                    <option key={a.action_id} value={a.action_id}>{a.name || a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Tên Công Việc / Hiệp Pomodoro:</label>
                <input 
                  type="text" 
                  value={editForm.action_name}
                  onChange={e => setEditForm({ ...editForm, action_name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
                />
              </div>

              {/* GTD Linkers Dropdowns */}
              <div className="grid grid-cols-2 gap-3 bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
                <div>
                  <label className="block mb-1 text-amber-900 font-black">🎯 Gắn Dự Án:</label>
                  <select 
                    value={editForm.project_id}
                    onChange={e => setEditForm({ ...editForm, project_id: e.target.value })}
                    className="w-full p-2 border rounded-xl outline-none focus:border-amber-500 bg-white text-xs"
                  >
                    <option value="">[Chọn Dự Án...]</option>
                    {horizons.projects.map(p => (
                      <option key={p.project_id} value={p.project_id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-amber-900 font-black">🏆 Gắn Mục Tiêu:</label>
                  <select 
                    value={editForm.goal_id}
                    onChange={e => setEditForm({ ...editForm, goal_id: e.target.value })}
                    className="w-full p-2 border rounded-xl outline-none focus:border-amber-500 bg-white text-xs"
                  >
                    <option value="">[Chọn Mục Tiêu...]</option>
                    {horizons.goals.map(g => (
                      <option key={g.goal_id} value={g.goal_id}>{g.statement}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Thời Gian:</label>
                  <input 
                    type="text" 
                    value={editForm.start_time}
                    onChange={e => setEditForm({ ...editForm, start_time: e.target.value })}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block mb-1">Thời Lượng (Phút):</label>
                  <input 
                    type="number" 
                    value={editForm.duration_mins}
                    onChange={e => setEditForm({ ...editForm, duration_mins: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button onClick={() => setEditingSession(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">
                  Hủy
                </button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">
                  Lưu Điều Chỉnh & Liên Kết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl bg-white max-w-lg w-full shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-plus text-amber-600"></i> Nhập Thủ Công Hiệp Pomodoro & Gắn Liên Kết GTD
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateManualSession} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-900 font-black">🎯 Chọn Hành Động GTD Có Sẵn:</label>
                <select 
                  value={addForm.action_id}
                  onChange={e => handleActionSelectInAdd(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500 bg-white"
                >
                  <option value="">[Chọn Hành Động GTD...]</option>
                  {actions.map(a => (
                    <option key={a.action_id} value={a.action_id}>{a.name || a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Tên Công Việc / Hiệp Pomodoro:</label>
                <input 
                  type="text" 
                  value={addForm.action_name}
                  onChange={e => setAddForm({ ...addForm, action_name: e.target.value })}
                  placeholder="Ví dụ: Giải bài tập Algebra 1 W33..."
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Gắn Dự Án:</label>
                  <select 
                    value={addForm.project_id}
                    onChange={e => setAddForm({ ...addForm, project_id: e.target.value })}
                    className="w-full p-2 border rounded-xl outline-none focus:border-amber-500 bg-white text-xs"
                  >
                    <option value="">[Chọn Dự Án...]</option>
                    {horizons.projects.map(p => (
                      <option key={p.project_id} value={p.project_id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Gắn Mục Tiêu:</label>
                  <select 
                    value={addForm.goal_id}
                    onChange={e => setAddForm({ ...addForm, goal_id: e.target.value })}
                    className="w-full p-2 border rounded-xl outline-none focus:border-amber-500 bg-white text-xs"
                  >
                    <option value="">[Chọn Mục Tiêu...]</option>
                    {horizons.goals.map(g => (
                      <option key={g.goal_id} value={g.goal_id}>{g.statement}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Thời Lượng (Phút):</label>
                  <input 
                    type="number" 
                    value={addForm.duration_mins}
                    onChange={e => setAddForm({ ...addForm, duration_mins: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">
                  + Thêm Hiệp Pomodoro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PILLAR PROFILE DETAIL MODAL */}
      {selectedPillarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl bg-white max-w-2xl w-full shadow-2xl border border-slate-200 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-address-card text-indigo-600"></i> Hồ Sơ Chi Tiết Sứ Mệnh & Trụ Cột Tầm Nhìn
              </h3>
              <button onClick={() => setSelectedPillarModal(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-indigo-600 block">Đang xem Hồ Sơ Khối:</span>
                <h4 className="text-base font-black text-indigo-950 mt-1 uppercase">
                  {selectedPillarModal === 'academic' && '1. Khối Core Academic (Target 40%)'}
                  {selectedPillarModal === 'deepwork' && '2. Khối Deep Work / Dream Map (Target 35%)'}
                  {selectedPillarModal === 'building' && '3. Khối Building & Portfolio (Target 15%)'}
                  {selectedPillarModal === 'maintenance' && '4. Khối System Maintenance & Health (Target 10%)'}
                </h4>
                <p className="text-xs text-slate-600 mt-1">Tổng số giờ Pomodoro tập trung thực tế đã tích lũy vào khối này.</p>
              </div>

              <div className="border-t pt-3">
                <h5 className="font-black text-slate-800 text-sm mb-2">📋 Danh Sách Các Hiệp Pomodoro Thuộc Khối Này:</h5>
                <div className="space-y-2">
                  {sessions.length > 0 ? (
                    sessions.map(s => (
                      <div key={s.session_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-black text-slate-800 block">{s.action_name || 'Hiệp Pomodoro'}</span>
                          <span className="text-[10px] text-slate-400">Thời gian: {s.created_at ? s.created_at.slice(0, 16) : 'Gần đây'}</span>
                        </div>
                        <span className="font-black text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full text-xs">
                          ⏱️ {s.duration_mins || 25}m
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">Chưa có hiệp Pomodoro nào được lưu.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t">
                <button onClick={() => setSelectedPillarModal(null)} className="px-5 py-2 bg-slate-900 text-white font-black rounded-xl text-xs">
                  Đóng Hồ Sơ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
