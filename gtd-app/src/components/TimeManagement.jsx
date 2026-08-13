import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function TimeManagement() {
  const [selectedPillarModal, setSelectedPillarModal] = useState(null);

  const getPillarActions = (pillarKey) => {
    if (!pillarKey || !data.actions) return [];
    const activeActions = data.actions.filter(a => a.status !== 'Cancelled');

    return activeActions.filter(a => {
      const nameLower = (a.name || '').toLowerCase();
      const projName = (data.projects.find(p => p.project_id === a.project_id)?.name || '').toLowerCase();
      const cat = (a.category || '').toLowerCase();
      const ctx = (a.context || '').toLowerCase();
      const wt = (a.work_type || '').toLowerCase();

      if (wt.includes('academic') || cat.includes('academic')) return pillarKey === 'academic';
      if (wt.includes('deep') || cat.includes('deep')) return pillarKey === 'deepwork';
      if (wt.includes('build') || cat.includes('build')) return pillarKey === 'building';
      if (wt.includes('maint') || cat.includes('maint')) return pillarKey === 'maintenance';

      const isAcademic = ['sat', 'high school', 'tín chỉ', 'toán', 'văn', 'anh', 'lý', 'hóa', 'sinh', 'tự học', 'học', 'study', 'course', 'khóa học', 'bài tập', 'luyện đề', 'giảng'].some(k => nameLower.includes(k) || projName.includes(k));
      const isDeepWork = ['python', 'mechatronics', 'data', 'code', 'nghiên cứu', 'lập trình', 'dự án', 'robot', 'ai', 'lab', 'tech', 'system', 'thuật toán'].some(k => nameLower.includes(k) || projName.includes(k));
      const isBuilding = ['portfolio', 'building', 'sản phẩm', 'web', 'email', 'mentor', 'business', 'btc', 'kết nối', 'outreach', 'startup', 'pitch'].some(k => nameLower.includes(k) || projName.includes(k));
      const isMaintenance = ['bảo trì', 'maintenance', 'review', 'thể thao', 'chạy', 'tập', 'gym', 'thiền', 'dọn', 'gtd', 'ăn', 'ngủ', 'lịch'].some(k => nameLower.includes(k) || projName.includes(k)) || a.storage_system === 'Calendar';

      if (pillarKey === 'academic') return isAcademic;
      if (pillarKey === 'deepwork') return isDeepWork || (!isAcademic && !isBuilding && !isMaintenance && (ctx.includes('máy_tính') || a.project_id));
      if (pillarKey === 'building') return isBuilding;
      if (pillarKey === 'maintenance') return isMaintenance || (!isAcademic && !isDeepWork && !isBuilding);

      return false;
    });
  };

  const [data, setData] = useState({ actions: [], projects: [], goals: [], visions: [], missions: [] });
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('matrix'); // 'matrix', 'template', 'review', 'table'

  // Review Checklist State
  const [reviewStep, setReviewStep] = useState(1);
  const [checkState, setCheckState] = useState({
    step1: false,
    step2_sat: '',
    step2_credits: '',
    step2_btc_step: 1,
    step3_locked: false,
    step4_integrity: 100
  });

  const fetchData = async () => {
    try {
      const [actionsRes, horizonsRes] = await Promise.all([
        fetch(`${API_URL}/actions`),
        fetch(`${API_URL}/horizons`)
      ]);
      const acData = await actionsRes.json();
      const hData = await horizonsRes.json();
      setData({
        actions: acData,
        projects: hData.projects || [],
        goals: hData.goals || [],
        visions: hData.visions || [],
        missions: hData.missions || []
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAction = async (action) => {
    const newStatus = action.status === 'Done' ? 'Pending' : 'Done';
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;

  // Calculate actual hours spent/scheduled in current week for each pillar
  const weekActions = data.actions.filter(a => a.status !== 'Cancelled' && (a.storage_system === 'Next_Actions' || a.storage_system === 'Calendar'));

  const getPillarHours = (pillarKey) => {
    // Include all active actions in Next_Actions, Calendar, Waiting_For, or Done
    const activeActions = data.actions.filter(a => a.status !== 'Cancelled');

    const mins = activeActions.filter(a => {
      const nameLower = (a.name || '').toLowerCase();
      const projName = (data.projects.find(p => p.project_id === a.project_id)?.name || '').toLowerCase();
      const cat = (a.category || '').toLowerCase();
      const ctx = (a.context || '').toLowerCase();
      const wt = (a.work_type || '').toLowerCase();

      // Check explicit work_type / category first
      if (wt.includes('academic') || cat.includes('academic')) return pillarKey === 'academic';
      if (wt.includes('deep') || cat.includes('deep')) return pillarKey === 'deepwork';
      if (wt.includes('build') || cat.includes('build')) return pillarKey === 'building';
      if (wt.includes('maint') || cat.includes('maint')) return pillarKey === 'maintenance';

      const isAcademic = ['sat', 'high school', 'tín chỉ', 'toán', 'văn', 'anh', 'lý', 'hóa', 'sinh', 'tự học', 'học', 'study', 'course', 'khóa học', 'bài tập', 'luyện đề', 'giảng'].some(k => nameLower.includes(k) || projName.includes(k));
      const isDeepWork = ['python', 'mechatronics', 'data', 'code', 'nghiên cứu', 'lập trình', 'dự án', 'robot', 'ai', 'lab', 'tech', 'system', 'thuật toán'].some(k => nameLower.includes(k) || projName.includes(k));
      const isBuilding = ['portfolio', 'building', 'sản phẩm', 'web', 'email', 'mentor', 'business', 'btc', 'kết nối', 'outreach', 'startup', 'pitch'].some(k => nameLower.includes(k) || projName.includes(k));
      const isMaintenance = ['bảo trì', 'maintenance', 'review', 'thể thao', 'chạy', 'tập', 'gym', 'thiền', 'dọn', 'gtd', 'ăn', 'ngủ', 'lịch'].some(k => nameLower.includes(k) || projName.includes(k)) || a.storage_system === 'Calendar';

      if (pillarKey === 'academic') return isAcademic;
      if (pillarKey === 'deepwork') return isDeepWork || (!isAcademic && !isBuilding && !isMaintenance && (ctx.includes('máy_tính') || a.project_id));
      if (pillarKey === 'building') return isBuilding;
      if (pillarKey === 'maintenance') return isMaintenance || (!isAcademic && !isDeepWork && !isBuilding);

      return false;
    }).reduce((sum, a) => sum + (a.time_needed_mins || 30), 0);

    return Math.round(mins / 60 * 10) / 10;
  };

  const academicHours = getPillarHours('academic');
  const deepworkHours = getPillarHours('deepwork');
  const buildingHours = getPillarHours('building');
  const maintenanceHours = getPillarHours('maintenance');

  return (
    <div className="flex flex-col gap-6 min-h-[600px] animate-fade-in">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-1">
            <i className="fa-solid fa-compass"></i> Timeboxing Matrix & Weekly Template
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-amber-400"></i> Quản Lý Thời Gian 168h Thực Chiến
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium max-w-2xl">
            Chuyển hóa Dream Map (Sứ mệnh 50k & Tầm nhìn 40k ft) thành Khối thời gian khóa cứng (Timebox) hàng tuần theo Tỷ Lệ Vàng.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 backdrop-blur-md self-start md:self-auto flex-wrap gap-1">
          <button 
            onClick={() => setActiveSubTab('matrix')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${activeSubTab === 'matrix' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white'}`}
          >
            <i className="fa-solid fa-chart-pie"></i> Ma Trận (Matrix)
          </button>
          <button 
            onClick={() => setActiveSubTab('template')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${activeSubTab === 'template' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
          >
            <i className="fa-solid fa-calendar-days"></i> TKB Mẫu
          </button>
          <button 
            onClick={() => setActiveSubTab('review')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${activeSubTab === 'review' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
          >
            <i className="fa-solid fa-clipboard-check"></i> 4 Bước Review
          </button>
          <button 
            onClick={() => setActiveSubTab('table')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${activeSubTab === 'table' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
          >
            <i className="fa-solid fa-table-list"></i> Bảng Theo Dõi
          </button>
        </div>
      </div>

      {/* 1. TIMEBOXING MATRIX TAB */}
            {/* Guide Banner for Linking Tasks */}
      <div className="glass-panel p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs font-bold text-amber-900 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-lightbulb text-amber-500 text-lg"></i>
          <span>
            <strong>Cách tự động nạp số giờ vào Ma Trận:</strong> Chỉ cần đặt tên việc có từ khóa (vd: <em>'SAT', 'Python', 'Portfolio', 'Review'</em>) hoặc chọn Ngữ cảnh/Dự án tương ứng, số giờ sẽ <strong>tự động liên kết 100%</strong> vào 4 Khối Trụ Cột bên dưới!
          </span>
        </div>
      </div>

      {activeSubTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Pillar 1 */}
          <div className="glass-panel p-5 rounded-2xl border border-blue-100 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">40% Quỹ Giờ</span>
                <i className="fa-solid fa-graduation-cap text-xl text-blue-500"></i>
              </div>
              <h3 className="font-black text-slate-800 text-base mb-1">1. Khối Core Academic</h3>
              <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mb-2 inline-block">
                🎯 40,000 FT Tầm nhìn (Sứ mệnh: Vào MIT kiến tạo)
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">Tích lũy Tín chỉ High School & Ôn luyện SAT (Sub-Project A & B).</p>
            </div>
            <div onClick={() => setSelectedPillarModal('academic')} className="cursor-pointer p-2.5 bg-blue-50/50 hover:bg-blue-100/60 rounded-xl border border-dashed border-blue-300 transition-all group" title="Bấm để xem Hồ sơ chi tiết danh sách công việc">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-black text-slate-700 group-hover:text-blue-700 flex items-center gap-1">
                  <i className="fa-solid fa-folder-open text-blue-500"></i> Đã lên lịch: {academicHours}h
                </span>
                <span className="text-xs font-black text-blue-600">Mục tiêu: 15h/tuần</span>
              </div>
              <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((academicHours / 15) * 100, 100)}%` }}></div>
              </div>
              <span className="text-[9px] font-bold text-blue-600 mt-1 block text-right">🔎 Xem chi tiết hồ sơ</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="glass-panel p-5 rounded-2xl border border-indigo-100 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">35% Quỹ Giờ</span>
                <i className="fa-solid fa-brain text-xl text-indigo-500"></i>
              </div>
              <h3 className="font-black text-slate-800 text-base mb-1">2. Deep Work / Dream Map</h3>
              <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mb-2 inline-block">
                🎯 40,000 FT Tầm nhìn (Sứ mệnh: Vào MIT kiến tạo)
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">3 Credits Tích hợp: Mechatronics + Python / Data Science + Business.</p>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-slate-600">Đã lên lịch: {deepworkHours}h</span>
                <span className="text-xs font-black text-indigo-600">Mục tiêu: 14h/tuần</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((deepworkHours / 14) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-100 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">15% Quỹ Giờ</span>
                <i className="fa-solid fa-rocket text-xl text-amber-500"></i>
              </div>
              <h3 className="font-black text-slate-800 text-base mb-1">3. Building & Portfolio</h3>
              <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mb-2 inline-block">
                🎯 40,000 FT Tầm nhìn (Sứ mệnh: Vào MIT kiến tạo)
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">Khung 5 bước BTC: Tạo sản phẩm, Web Portfolio, Cold Email, Mentor.</p>
            </div>
            <div onClick={() => setSelectedPillarModal('building')} className="cursor-pointer p-2.5 bg-amber-50/50 hover:bg-amber-100/60 rounded-xl border border-dashed border-amber-300 transition-all group" title="Bấm để xem Hồ sơ chi tiết danh sách công việc">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-black text-slate-700 group-hover:text-amber-700 flex items-center gap-1">
                  <i className="fa-solid fa-folder-open text-amber-500"></i> Đã lên lịch: {buildingHours}h
                </span>
                <span className="text-xs font-black text-amber-600">Mục tiêu: 6h/tuần</span>
              </div>
              <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((buildingHours / 6) * 100, 100)}%` }}></div>
              </div>
              <span className="text-[9px] font-bold text-amber-600 mt-1 block text-right">🔎 Xem chi tiết hồ sơ</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-100 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">10% Quỹ Giờ</span>
                <i className="fa-solid fa-heart-pulse text-xl text-emerald-500"></i>
              </div>
              <h3 className="font-black text-slate-800 text-base mb-1">4. System Maintenance</h3>
              <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mb-2 inline-block">
                🎯 40,000 FT Tầm nhìn (Sứ mệnh: Vào MIT kiến tạo)
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">Weekly Review, Dọn dẹp hệ thống & Rèn luyện Thể chất (Physically Strong).</p>
            </div>
            <div onClick={() => setSelectedPillarModal('maintenance')} className="cursor-pointer p-2.5 bg-emerald-50/50 hover:bg-emerald-100/60 rounded-xl border border-dashed border-emerald-300 transition-all group" title="Bấm để xem Hồ sơ chi tiết danh sách công việc">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-black text-slate-700 group-hover:text-emerald-700 flex items-center gap-1">
                  <i className="fa-solid fa-folder-open text-emerald-500"></i> Đã lên lịch: {maintenanceHours}h
                </span>
                <span className="text-xs font-black text-emerald-600">Mục tiêu: 4h/tuần</span>
              </div>
              <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((maintenanceHours / 4) * 100, 100)}%` }}></div>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 mt-1 block text-right">🔎 Xem chi tiết hồ sơ</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. WEEKLY TIMEBLOCK TEMPLATE TAB */}
      {activeSubTab === 'template' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <i className="fa-solid fa-calendar-week text-indigo-600"></i> Thời Khóa Biểu Mẫu Chuẩn Hóa
              </h3>
              <p className="text-xs text-slate-500 font-medium">Chia thành 3 Khối Năng Lượng chính trong ngày (Sáng, Chiều, Cuối chiều, Tối).</p>
            </div>
          </div>

          <table className="w-full border-collapse text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider">
                <th className="p-3 w-36">Khung Giờ</th>
                <th className="p-3 w-44">Bản Chất Hành Động</th>
                <th className="p-3">Thứ 2, 4, 6</th>
                <th className="p-3">Thứ 3, 5, 7</th>
                <th className="p-3 w-32">Chủ Nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* SÁNG */}
              <tr className="hover:bg-indigo-50/30 transition-colors">
                <td className="p-3 font-black text-indigo-700 bg-indigo-50/50 rounded-l-xl">
                  <div className="text-sm">SÁNG</div>
                  <div className="text-[10px] text-slate-500 font-bold">08:00 - 11:30</div>
                </td>
                <td className="p-3">
                  <div className="font-black text-slate-800">DEEP WORK</div>
                  <div className="text-[10px] text-indigo-600 font-bold">10,000 ft (Tín chỉ Tích hợp)</div>
                  <div className="text-[10px] text-slate-400">Năng lượng não cao nhất</div>
                </td>
                <td className="p-3 bg-indigo-50/20">
                  <span className="font-bold text-slate-800">⚙️ Kỹ thuật / Mechatronics</span>
                  <div className="text-[10px] text-slate-500">Đọc & Thực hành phần cứng</div>
                </td>
                <td className="p-3 bg-indigo-50/20">
                  <span className="font-bold text-slate-800">💻 Lập trình Python / Data</span>
                  <div className="text-[10px] text-slate-500">Viết code & Xử lý dữ liệu</div>
                </td>
                <td className="p-3 rounded-r-xl">
                  <span className="font-bold text-slate-500">Tự do / Ôn tập nhẹ</span>
                </td>
              </tr>

              {/* CHIỀU */}
              <tr className="hover:bg-blue-50/30 transition-colors">
                <td className="p-3 font-black text-blue-700 bg-blue-50/50 rounded-l-xl">
                  <div className="text-sm">CHIỀU</div>
                  <div className="text-[10px] text-slate-500 font-bold">14:00 - 16:30</div>
                </td>
                <td className="p-3">
                  <div className="font-black text-slate-800">CORE ACADEMICS</div>
                  <div className="text-[10px] text-blue-600 font-bold">10,000 ft (High School & SAT)</div>
                  <div className="text-[10px] text-slate-400">Năng lượng ổn định, kỷ luật</div>
                </td>
                <td className="p-3 bg-blue-50/20" colSpan="2">
                  <div className="space-y-1">
                    <div><span className="font-bold text-blue-700">14:00 - 15:00:</span> Ôn luyện SAT (20-30 câu Math/Reading Khan Academy)</div>
                    <div><span className="font-bold text-blue-700">15:00 - 16:30:</span> Hoàn thành tín chỉ High School theo tiến độ</div>
                  </div>
                </td>
                <td className="p-3 rounded-r-xl">
                  <span className="font-bold text-emerald-600">Weekly Review (60m)</span>
                </td>
              </tr>

              {/* CUỐI CHIỀU */}
              <tr className="hover:bg-emerald-50/30 transition-colors">
                <td className="p-3 font-black text-emerald-700 bg-emerald-50/50 rounded-l-xl">
                  <div className="text-sm">CUỐI CHIỀU</div>
                  <div className="text-[10px] text-slate-500 font-bold">16:30 - 17:30</div>
                </td>
                <td className="p-3">
                  <div className="font-black text-slate-800">PHYSICAL & MIND</div>
                  <div className="text-[10px] text-emerald-600 font-bold">50,000 ft (Thể chất & Tinh thần)</div>
                  <div className="text-[10px] text-slate-400">Rèn luyện Physically Strong</div>
                </td>
                <td className="p-3 bg-emerald-50/20" colSpan="3">
                  <span className="font-bold text-emerald-800">🏃 Tập thể thao, chạy bộ, vợt cầu lông, dọn dẹp không gian học tập</span>
                </td>
              </tr>

              {/* TỐI */}
              <tr className="hover:bg-amber-50/30 transition-colors">
                <td className="p-3 font-black text-amber-700 bg-amber-50/50 rounded-l-xl">
                  <div className="text-sm">TỐI</div>
                  <div className="text-[10px] text-slate-500 font-bold">20:00 - 21:30</div>
                </td>
                <td className="p-3">
                  <div className="font-black text-slate-800">BUILDING & PORTFOLIO</div>
                  <div className="text-[10px] text-amber-600 font-bold">30,000 ft & 40,000 ft</div>
                  <div className="text-[10px] text-slate-400">Tư duy sáng tạo & Kết nối</div>
                </td>
                <td className="p-3 bg-amber-50/20">
                  <span className="font-bold text-slate-800">📖 T2, T4: Đọc sách Tư duy / Business</span>
                </td>
                <td className="p-3 bg-amber-50/20">
                  <span className="font-bold text-slate-800">🌐 T3, T5: Portfolio Web</span>
                  <div className="text-[10px] text-amber-700 font-bold">✉️ T6: Cold Email & Mentor</div>
                </td>
                <td className="p-3 rounded-r-xl">
                  <span className="font-bold text-slate-500">Nghỉ ngơi / Lập kế hoạch</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 3. 4-STEP WEEKLY REVIEW CHECKLIST TAB */}
      {activeSubTab === 'review' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-sm max-w-4xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <i className="fa-solid fa-clipboard-check text-emerald-600"></i> Quy Trình Rà Soát 4 Bước (Weekly Review)
              </h3>
              <p className="text-xs text-slate-500 font-medium">Thực hiện mỗi Chiều Chủ Nhật (60 phút) để kết nối Sứ mệnh với Lịch hàng tuần.</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(s => (
                <button 
                  key={s} 
                  onClick={() => setReviewStep(s)} 
                  className={`w-8 h-8 rounded-full font-black text-xs transition-all ${reviewStep === s ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1 */}
          {reviewStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <h4 className="font-black text-emerald-900 text-base mb-1">Bước 1: Rà soát Tầng Cao (Horizons Check 50k & 40k ft)</h4>
                <p className="text-xs text-emerald-700">Mở Dream Map ra đọc lại để nhắc nhở tâm thế: "Tuần này mình học là để trở thành Nhà nghiên cứu liên môn, kiến tạo cái mới, chứ không phải học vẹt."</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="chk1" 
                  checked={checkState.step1} 
                  onChange={e => setCheckState({...checkState, step1: e.target.checked})} 
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer" 
                />
                <label htmlFor="chk1" className="text-sm font-bold text-slate-700 cursor-pointer">Tôi đã đọc và ghi nhớ Tầm nhìn & Sứ mệnh cho tuần mới.</label>
              </div>
              <button onClick={() => setReviewStep(2)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition-all shadow-md mt-4">
                Tiếp tục sang Bước 2 <i className="fa-solid fa-arrow-right ml-1"></i>
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {reviewStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-black text-blue-900 text-base mb-1">Bước 2: Kiểm tra Mục tiêu (30k ft) & Tiến độ Dự án (10k ft)</h4>
                <p className="text-xs text-blue-700">Đánh giá tiến độ Tín chỉ High School, kết quả bài thi SAT và Tiến độ 5 bước BTC.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Điểm SAT Tuần này</label>
                  <input type="text" value={checkState.step2_sat} onChange={e => setCheckState({...checkState, step2_sat: e.target.value})} placeholder="VD: 1450 / 1600" className="w-full p-2 text-xs border rounded-lg outline-none" />
                </div>
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tín chỉ tích lũy thêm (%)</label>
                  <input type="text" value={checkState.step2_credits} onChange={e => setCheckState({...checkState, step2_credits: e.target.value})} placeholder="VD: +5% Tín chỉ" className="w-full p-2 text-xs border rounded-lg outline-none" />
                </div>
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bước BTC Hiện tại</label>
                  <select value={checkState.step2_btc_step} onChange={e => setCheckState({...checkState, step2_btc_step: Number(e.target.value)})} className="w-full p-2 text-xs border rounded-lg outline-none font-bold">
                    <option value="1">Bước 1: Tạo Sản phẩm</option>
                    <option value="2">Bước 2: Viết Cold Email</option>
                    <option value="3">Bước 3: Nhắn Mentor</option>
                    <option value="4">Bước 4: Đóng gói Portfolio</option>
                    <option value="5">Bước 5: Thuyết trình / Demo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setReviewStep(1)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all">Quay lại</button>
                <button onClick={() => setReviewStep(3)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm transition-all shadow-md">Tiếp tục sang Bước 3 <i className="fa-solid fa-arrow-right ml-1"></i></button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {reviewStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
                <h4 className="font-black text-indigo-900 text-base mb-1">Bước 3: Khóa khối thời gian (Timeboxing) cho tuần mới</h4>
                <p className="text-xs text-indigo-700">Điền các Hành động kế tiếp (Runway) cụ thể vào đúng các ô thời gian từ Thứ 2 đến Thứ 7. Không ghi mơ hồ "Học Python", mà ghi rõ "Sáng T2 08:30: Viết thuật toán lọc dữ liệu cảm biến (60m)".</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="chk3" 
                  checked={checkState.step3_locked} 
                  onChange={e => setCheckState({...checkState, step3_locked: e.target.checked})} 
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" 
                />
                <label htmlFor="chk3" className="text-sm font-bold text-slate-700 cursor-pointer">Tôi đã khóa cứng toàn bộ các ô thời gian cho tuần mới.</label>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setReviewStep(2)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all">Quay lại</button>
                <button onClick={() => setReviewStep(4)} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm transition-all shadow-md">Tiếp tục sang Bước 4 <i className="fa-solid fa-arrow-right ml-1"></i></button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {reviewStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <h4 className="font-black text-amber-900 text-base mb-1">Bước 4: Kiểm tra Cam kết & Uy tín (Ethos Check)</h4>
                <p className="text-xs text-amber-700">Đánh giá tuần qua có hoàn thành đúng Deadlines đã đặt ra không? Tuân thủ kỷ luật bao nhiêu %?</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                <label className="block text-xs font-bold text-slate-700 mb-2">Mức độ tuân thủ kỷ luật tuần qua: <span className="text-base text-amber-600 font-black">{checkState.step4_integrity}%</span></label>
                <input type="range" min="0" max="100" value={checkState.step4_integrity} onChange={e => setCheckState({...checkState, step4_integrity: Number(e.target.value)})} className="w-full accent-amber-500 cursor-pointer" />
              </div>
              <button onClick={() => alert("🎉 Tuyệt vời! Bạn đã hoàn thành Weekly Review và sẵn sàng cho tuần mới xuất sắc!")} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-base transition-all shadow-lg mt-4 flex items-center justify-center gap-2">
                <i className="fa-solid fa-circle-check"></i> Hoàn Tất Weekly Review
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. TIMEBLOCK EXECUTION TABLE TAB */}
      {activeSubTab === 'table' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <i className="fa-solid fa-list-check text-blue-600"></i> Bảng Theo Dõi Thực Thi Chi Tiết
              </h3>
              <p className="text-xs text-slate-500 font-medium">Danh sách toàn bộ các hành động đã khóa khung giờ theo tiến độ.</p>
            </div>
          </div>

          <table className="w-full border-collapse text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider">
                <th className="p-3 w-28">Khung Giờ</th>
                <th className="p-3 w-32">Tầng GTD</th>
                <th className="p-3 w-40">Dự án (10k ft)</th>
                <th className="p-3">Hành động Runway cụ thể</th>
                <th className="p-3 w-28 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {weekActions.map(a => {
                const project = data.projects.find(p => p.project_id === a.project_id);
                const isDone = a.status === 'Done';
                const timeStr = a.scheduled_datetime 
                  ? (a.scheduled_datetime && !isNaN(new Date(a.scheduled_datetime).getTime()) ? new Date(a.scheduled_datetime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '00:00') 
                  : (a.time_needed_mins ? `${a.time_needed_mins}m` : '30m');

                return (
                  <tr key={a.action_id} className={`hover:bg-slate-50 transition-colors ${isDone ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    <td className="p-3 font-bold text-slate-700">
                      <span className="bg-slate-100 px-2 py-1 rounded text-[11px]"><i className="fa-regular fa-clock mr-1 text-slate-400"></i>{timeStr}</span>
                    </td>
                    <td className="p-3">
                      <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px]">10,000 ft</span>
                    </td>
                    <td className="p-3 font-bold text-purple-700">
                      {project ? project.name : '—'}
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      <span className={isDone ? 'line-through text-slate-400' : ''}>{a.name}</span>
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => handleToggleAction(a)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700 hover:bg-emerald-500 hover:text-white'}`}
                      >
                        {isDone ? <><i className="fa-solid fa-check mr-1"></i> Done</> : 'Pending'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {weekActions.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400 font-medium">Chưa có công việc nào được lên lịch cho tuần này.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Action Profile Modal */}
      {selectedPillarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                  📁 Hồ Sơ Chi Tiết Công Việc
                </span>
                <h3 className="text-xl font-black text-slate-800 mt-1">
                  {selectedPillarModal === 'academic' && '1. Khối Core Academic (40%)'}
                  {selectedPillarModal === 'deepwork' && '2. Deep Work / Dream Map (35%)'}
                  {selectedPillarModal === 'building' && '3. Building & Portfolio (15%)'}
                  {selectedPillarModal === 'maintenance' && '4. System Maintenance (10%)'}
                </h3>
              </div>

              <button 
                onClick={() => setSelectedPillarModal(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Summary Row */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center mb-4 text-xs font-bold">
              <span className="text-slate-600">
                Số lượng công việc: <strong className="text-slate-900">{getPillarActions(selectedPillarModal).length} việc</strong>
              </span>
              <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                ⏱️ Tổng giờ đã nạp: {getPillarHours(selectedPillarModal)}h
              </span>
            </div>

            {/* Action Items List */}
            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 pr-1">
              {getPillarActions(selectedPillarModal).map(a => {
                const project = data.projects.find(p => p.project_id === a.project_id);
                const isDone = a.status === 'Done';
                return (
                  <div key={a.action_id} className={`p-3 rounded-xl border flex justify-between items-center gap-3 ${isDone ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-2xs hover:border-blue-300'}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button 
                        onClick={() => handleToggleAction(a)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 hover:border-emerald-500'}`}
                      >
                        {isDone && <i className="fa-solid fa-check text-xs"></i>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>{a.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          {project && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{project.name}</span>}
                          {a.context && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{a.context}</span>}
                          <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{a.storage_system}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                        {Math.round((a.time_needed_mins || 30) / 60 * 10) / 10}h
                      </span>
                    </div>
                  </div>
                );
              })}

              {getPillarActions(selectedPillarModal).length === 0 && (
                <div className="text-center py-10 text-slate-400 italic text-xs">
                  Chưa có công việc nào thuộc khối này. Hãy thêm từ khóa tương ứng khi tạo việc!
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t flex justify-end">
              <button 
                onClick={() => setSelectedPillarModal(null)} 
                className="px-4 py-2 bg-slate-800 hover:bg-black text-white font-bold rounded-xl text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
