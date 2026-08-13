import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function Runway() {
  const [data, setData] = useState({ actions: [], areas: [], projects: [], goals: [], visions: [], missions: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Next_Actions'); // Next_Actions, Calendar, Waiting_For, Someday_Maybe
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showQuickInbox, setShowQuickInbox] = useState(false);
  const [quickInboxName, setQuickInboxName] = useState('');
  
  const initialFormData = {
    name: '', area_id: '', project_id: '', goal_id: '', vision_id: '', mission_id: '', reference_link: '', category: 'Strategic',
    // Routing flow
    step1_twomins: null, // true/false
    step2_who: null, // 'me' / 'other'
    step3_when: null, // 'fixed' / 'asap' / 'someday'
    // Specific fields
    assigned_to: '',
    scheduled_datetime: '', scheduled_end_datetime: '', notes: '', defer_until_date: '', depends_on_action_id: '',
    context: '@Máy_tính', time_needed_mins: 30, energy_level: 'Medium', work_type: 'Defined Work'
  };
  const [formData, setFormData] = useState(initialFormData);

  // Filters for Next Actions
  const [filters, setFilters] = useState({ context: 'All', time: 'All', energy: 'All', work_type: 'All' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const portalTarget = document.getElementById('runway-dropdown-portal-target');

  const fetchData = async () => {
    try {
      const [actionsRes, horizonsRes, areasRes] = await Promise.all([
        fetch(`${API_URL}/actions`), fetch(`${API_URL}/horizons`), fetch(`${API_URL}/areas`)
      ]);
      const acData = await actionsRes.json();
      const hData = await horizonsRes.json();
      const arData = await areasRes.json();
      setData({ 
        actions: acData, areas: arData, projects: hData.projects || [],
        goals: hData.goals || [], visions: hData.visions || [], missions: hData.missions || []
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.area_id) return alert("Vui lòng nhập tên hành động và Bánh xe cuộc đời!");
    
    let storage_system = 'Next_Actions';
    let status = 'Pending';
    
    if (formData.step1_twomins) {
      storage_system = 'Do_It_Now';
      status = 'Done';
    } else {
      if (formData.step2_who === 'other') {
        storage_system = 'Waiting_For';
      } else {
        if (formData.step3_when === 'fixed') storage_system = 'Calendar';
        else if (formData.step3_when === 'deferred') storage_system = 'Deferred';
        else if (formData.step3_when === 'floating') storage_system = 'Floating_Backlog';
        else if (formData.step3_when === 'dependent') storage_system = 'Project_Backlog';
        else if (formData.step3_when === 'someday') storage_system = 'Someday_Maybe';
        else storage_system = 'Next_Actions';
      }
    }

        if (storage_system === 'Calendar') {
      if (!formData.scheduled_datetime || !formData.scheduled_end_datetime) {
        return alert("Vui lòng chọn Giờ Bắt đầu và Giờ Kết thúc cho Lịch Hẹn!");
      }
      const newStart = new Date(formData.scheduled_datetime);
      const newEnd = new Date(formData.scheduled_end_datetime);
      if (newEnd <= newStart) {
        return alert("Giờ kết thúc phải lớn hơn Giờ bắt đầu!");
      }
      
      // Conflict check
      const conflicts = data.actions.filter(a => 
        a.storage_system === 'Calendar' && 
        a.status !== 'Done' && 
        a.action_id !== editId &&
        new Date(a.scheduled_datetime) < newEnd &&
        new Date(a.scheduled_end_datetime) > newStart
      );
      
      if (conflicts.length > 0) {
        const conflictNames = conflicts.map(c => `• ${c.name}`).join('\n');
        if (!window.confirm(`⚠️ Cảnh báo Trùng Lịch!\nThời gian bạn chọn bị trùng với:\n${conflictNames}\n\nBạn có chắc chắn muốn chèn lịch không?`)) {
          return; // User cancelled
        }
      }
    }

    const payload = {
      ...formData,
      storage_system,
      status,
      // Clear irrelevant fields based on system
      assigned_to: storage_system === 'Waiting_For' ? formData.assigned_to : null,
      scheduled_datetime: formData.scheduled_datetime || null,
        scheduled_end_datetime: formData.scheduled_end_datetime || null,
      scheduled_end_datetime: storage_system === 'Calendar' ? formData.scheduled_end_datetime : null,
      defer_until_date: storage_system === 'Deferred' ? formData.defer_until_date : null,
      depends_on_action_id: storage_system === 'Project_Backlog' ? formData.depends_on_action_id : null,
      context: (storage_system === 'Next_Actions' || storage_system === 'Floating_Backlog' || storage_system === 'Project_Backlog' || storage_system === 'Inbox') ? formData.context : null,
      notes: formData.notes,
        time_needed_mins: (storage_system === 'Next_Actions' || storage_system === 'Floating_Backlog' || storage_system === 'Project_Backlog' || storage_system === 'Inbox') ? formData.time_needed_mins : null,
      energy_level: (storage_system === 'Next_Actions' || storage_system === 'Floating_Backlog' || storage_system === 'Project_Backlog' || storage_system === 'Inbox') ? formData.energy_level : null,
      work_type: (storage_system === 'Next_Actions' || storage_system === 'Floating_Backlog' || storage_system === 'Project_Backlog' || storage_system === 'Inbox') ? formData.work_type : 'Defined Work',
    };

    let endpoint = '/actions';
    let method = 'POST';
    if (editId) {
      endpoint = `/actions/${editId}`;
      method = 'PATCH';
      // if we are editing and user didn't change routing, preserve status unless it was Do_It_Now recalculation
      if (!formData.step1_twomins && payload.status === 'Pending') {
         const existingAction = data.actions.find(a => a.action_id === editId);
         if (existingAction) payload.status = existingAction.status;
      }
    }

    try {
      await fetch(`${API_URL}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setModalOpen(false); setEditId(null);
      setActiveTab(storage_system);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (action) => {
    const newStatus = action.status === 'Done' ? 'Pending' : 'Done';
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePullToActive = async (a) => {
    try {
      await fetch(`${API_URL}/actions/${a.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_system: 'Next_Actions' })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa hành động này?")) return;
    try {
      await fetch(`${API_URL}/actions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  
  const handleQuickInboxSubmit = async (e) => {
    e.preventDefault();
    if (!quickInboxName.trim()) return;

    try {
      await fetch(`${API_URL}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickInboxName,
          storage_system: 'Inbox',
          work_type: 'Unplanned Work',
          status: 'Pending',
          category: 'Strategic',
          context: '',
          time_needed_mins: null,
          energy_level: null
        })
      });
      setShowQuickInbox(false);
      setQuickInboxName('');
      fetchData();
    } catch (error) {
      console.error('Lỗi khi lưu Inbox:', error);
    }
  };

  const openCreateModal = () => {
    setEditId(null);
    setFormData({ ...initialFormData });
    setModalOpen(true);
  };

  const openEditModal = (a) => {
    setEditId(a.action_id);
    setFormData({
      ...initialFormData,
      name: a.name, area_id: a.area_id || '', project_id: a.project_id || '', 
      goal_id: a.goal_id || '', vision_id: a.vision_id || '', mission_id: a.mission_id || '',
      category: a.category, reference_link: a.reference_link || '',
      step1_twomins: a.storage_system === 'Do_It_Now',
      step2_who: a.storage_system === 'Waiting_For' ? 'other' : 'me',
      step3_when: a.storage_system === 'Calendar' ? 'fixed' : (a.storage_system === 'Deferred' ? 'deferred' : (a.storage_system === 'Floating_Backlog' ? 'floating' : (a.storage_system === 'Project_Backlog' ? 'dependent' : (a.storage_system === 'Someday_Maybe' ? 'someday' : (a.storage_system === 'Inbox' ? 'inbox' : 'asap'))))),
      assigned_to: a.assigned_to || '',
      scheduled_datetime: a.scheduled_datetime || '', scheduled_end_datetime: a.scheduled_end_datetime || '', notes: a.notes || '', defer_until_date: a.defer_until_date || '', depends_on_action_id: a.depends_on_action_id || '',
      context: a.context || '@Máy_tính', time_needed_mins: a.time_needed_mins || 30, energy_level: a.energy_level || 'Medium', work_type: a.work_type || 'Defined Work'
    });
    setModalOpen(true);
  };

  // Lọc dữ liệu theo Hệ thống lưu trữ
  const actionsList = data?.actions || [];
  const tabActions = activeTab === 'All_Actions' ? actionsList.filter(a => a && a.status !== 'Done') : actionsList.filter(a => a && a.storage_system === activeTab);
  
  // Áp dụng bộ lọc cho Next Actions
  const filteredNextActions = tabActions.filter(a => {
    if (a.status === 'Done') return false; 
    if (filters.work_type !== 'All' && a.work_type !== filters.work_type) return false;
    if (filters.context !== 'All' && a.context !== filters.context) return false;
    if (filters.time !== 'All' && a.time_needed_mins !== parseInt(filters.time)) return false;
    if (filters.energy !== 'All' && a.energy_level !== filters.energy) return false;
    return true;
  });

  const unplannedActions = actionsList.filter(a => a && a.storage_system === 'Next_Actions' && a.work_type === 'Unplanned Work' && a.status !== 'Done');
  const uniqueContexts = [...new Set(actionsList.filter(a => a && a.storage_system === 'Next_Actions').map(a => a.context))].filter(Boolean);
  const timeOptions = [5, 10, 15, 30, 45, 60, 90, 120];

  
  const runwayTabsDef = {
    'All_Actions': { label: 'Tất cả Hành động', icon: 'fa-solid fa-layer-group', color: 'text-rose-600', bg: 'bg-rose-100' },
    'Inbox': { label: 'Inbox', icon: 'fa-solid fa-inbox', color: 'text-gray-800', bg: 'bg-gray-100' },
    'Next_Actions': { label: '⚡ Next Actions', icon: 'fa-solid fa-list-check', color: 'text-blue-600', bg: 'bg-blue-100' },
    'Floating_Backlog': { label: '🎈 Thả nổi', icon: 'fa-solid fa-parachute-box', color: 'text-cyan-600', bg: 'bg-cyan-100' },
    'Calendar': { label: '📅 Lịch Hẹn', icon: 'fa-regular fa-calendar', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    'Project_Backlog': { label: '📁 Project Backlog', icon: 'fa-solid fa-folder-open', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    'Deferred': { label: '🔒 Đóng băng', icon: 'fa-solid fa-lock', color: 'text-slate-700', bg: 'bg-slate-200' },
    'Waiting_For': { label: '⏳ Chờ Phản Hồi', icon: 'fa-solid fa-hourglass-half', color: 'text-amber-600', bg: 'bg-amber-100' },
    'Someday_Maybe': { label: 'Someday', icon: 'fa-solid fa-cloud-moon', color: 'text-purple-600', bg: 'bg-purple-100' }
  };

  return (
    <div className="flex flex-col gap-6 min-h-[500px]">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div>
          <h2 className="text-2xl font-black text-slate-800"><i className="fa-solid fa-plane-departure text-blue-600 mr-2"></i> Runway (Trạm Điều Khiển) v1.0.8</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Trung tâm phân luồng và thực thi 5 Hệ thống Lưu trữ Hành động GTD.</p>
        </div>
        <button onClick={() => setShowQuickInbox(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 font-bold flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <i className="fa-solid fa-bolt mr-2 relative z-10"></i> <span className="relative z-10">Thêm Hành động</span>
        </button>
      </div>

      {/* PORTAL TO HEADER FOR DROPDOWN TABS */}
      {portalTarget && createPortal(
        <div className="relative group" onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
          <button className={`glass-panel px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm ${runwayTabsDef[activeTab].color} ${runwayTabsDef[activeTab].bg}`}>
            <i className={runwayTabsDef[activeTab].icon}></i> {runwayTabsDef[activeTab].label} 
            <span className="ml-1 bg-white/50 px-1.5 py-0.5 rounded-full text-[10px]">
              {activeTab === 'All_Actions' 
                ? (data?.actions || []).filter(a => a && a.status !== 'Done').length 
                : (data?.actions || []).filter(a => a && a.storage_system === activeTab && a.status !== 'Done').length}
            </span>
            <i className="fa-solid fa-chevron-down text-[10px] ml-1 opacity-50"></i>
          </button>
          
          <div className={`absolute top-full left-0 mt-2 w-56 glass-panel rounded-xl p-2 transition-all flex flex-col gap-1 shadow-xl border border-slate-200/50 z-[110] ${isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
            {Object.entries(runwayTabsDef).map(([key, tab]) => {
              let count = key === 'All_Actions' 
                ? (data?.actions || []).filter(a => a && a.status !== 'Done').length 
                : (data?.actions || []).filter(a => a && a.storage_system === key && a.status !== 'Done').length;
              return (
                <button 
                  key={key}
                  onClick={() => { setActiveTab(key); setIsDropdownOpen(false); }} 
                  className={`text-left px-3 py-2 rounded-lg font-bold transition-colors text-sm flex items-center justify-between ${activeTab === key ? `${tab.bg} ${tab.color}` : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <span><i className={`${tab.icon} w-6 text-center ${activeTab === key ? '' : 'opacity-70'}`}></i> {tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === key ? 'bg-white/50' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>,
        portalTarget
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* CỘT LỌC (Chỉ hiện khi ở tab Next Actions) */}
          {activeTab === 'Next_Actions' && (
            <div className="glass-panel w-full md:w-80 p-5 rounded-2xl flex-shrink-0 flex flex-col gap-5 sticky top-24 shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wide text-sm flex items-center justify-between">
                <span>Thuật toán Lọc (3 Bước)</span>
                <i className="fa-solid fa-filter text-blue-500"></i>
              </h3>
              
              <div>
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">Bước 1: Loại công việc</p>
                {unplannedActions.length > 0 && (
                  <div 
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all mb-3 ${filters.work_type === 'Unplanned Work' ? 'bg-red-50 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-red-50/50 border-red-200 hover:border-red-400'}`}
                    onClick={() => setFilters({...filters, work_type: filters.work_type === 'Unplanned Work' ? 'All' : 'Unplanned Work'})}
                  >
                    <h4 className="text-red-700 font-bold text-sm flex items-center justify-between">
                      <span><i className="fa-solid fa-triangle-exclamation mr-1.5 animate-pulse"></i> Khẩn Cấp (Unplanned)!</span>
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unplannedActions.length}</span>
                    </h4>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => setFilters({...filters, work_type: 'All'})} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-all border ${filters.work_type === 'All' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>Tất cả công việc</button>
                  <button onClick={() => setFilters({...filters, work_type: 'Defined Work'})} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-all border ${filters.work_type === 'Defined Work' ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>Đã lên kế hoạch (Defined)</button>
                  <button onClick={() => setFilters({...filters, work_type: 'Defining Work'})} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-all border ${filters.work_type === 'Defining Work' ? 'bg-orange-100 text-orange-800 border-orange-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>Dọn dẹp hệ thống (Defining)</button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">Bước 2 & 3: Lọc Bối cảnh</p>
                <div className="mb-3">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">@Context (Nơi chốn)</label>
                  <div className="flex flex-wrap gap-1.5">
                    <span onClick={() => setFilters({...filters, context: 'All'})} className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${filters.context === 'All' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>Tất cả</span>
                    {uniqueContexts.map(ctx => (
                      <span key={ctx} onClick={() => setFilters({...filters, context: ctx})} className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${filters.context === ctx ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{ctx}</span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Thời gian rảnh</label>
                  <div className="flex flex-wrap gap-1.5">
                    <span onClick={() => setFilters({...filters, time: 'All'})} className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${filters.time === 'All' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>Mọi mốc</span>
                    {timeOptions.map(t => (
                      <span key={t} onClick={() => setFilters({...filters, time: t})} className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${filters.time === t ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{t}m</span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Năng lượng não bộ</label>
                  <div className="flex flex-wrap gap-1.5">
                    <span onClick={() => setFilters({...filters, energy: 'All'})} className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${filters.energy === 'All' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>Tất cả</span>
                    <span onClick={() => setFilters({...filters, energy: 'High'})} className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${filters.energy === 'High' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-rose-500 border-rose-200 hover:border-rose-400'}`}>High (Deep Work)</span>
                    <span onClick={() => setFilters({...filters, energy: 'Medium'})} className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${filters.energy === 'Medium' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-600 border-amber-200 hover:border-amber-400'}`}>Medium</span>
                    <span onClick={() => setFilters({...filters, energy: 'Low'})} className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${filters.energy === 'Low' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-green-600 border-green-200 hover:border-green-400'}`}>Low (Routine)</span>
                  </div>
                </div>
              </div>
              
              <button onClick={() => setFilters({context: 'All', time: 'All', energy: 'All', work_type: 'All'})} className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline text-center font-bold">Xóa tất cả bộ lọc</button>
            </div>
          )}

          {/* CỘT 2: Danh sách Actions */}
          <div className="flex-1 flex flex-col gap-4">
            {activeTab === 'Next_Actions' ? (
              filteredNextActions.length === 0 ? (
                <EmptyState icon="fa-mug-hot" text="Không có công việc nào khớp với bộ lọc hiện tại." />
              ) : filteredNextActions.map(a => <ActionCard key={a.action_id} action={a} data={data} onToggle={() => handleToggleStatus(a)} onEdit={() => openEditModal(a)} onDelete={() => handleDelete(a.action_id)} onCopy={() => handleCopyAction(a)} onPull={() => handlePullToActive(a)} />)
            ) : activeTab === 'Calendar' ? (
              <CalendarView data={data} onEdit={openEditModal} onDelete={handleDelete} onToggle={handleToggleStatus} />
            ) : (
              tabActions.length === 0 ? (
                <EmptyState icon="fa-folder-open" text={`Chưa có dữ liệu trong kho ${activeTab.replace('_', ' ')}.`} />
              ) : tabActions.map(a => <ActionCard key={a.action_id} action={a} data={data} onToggle={() => handleToggleStatus(a)} onEdit={() => openEditModal(a)} onDelete={() => handleDelete(a.action_id)} onCopy={() => handleCopyAction(a)} onPull={() => handlePullToActive(a)} />)
            )}
          </div>
        </div>
      )}

      {/* QUICK INBOX MODAL */}
      {showQuickInbox && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-black text-white flex items-center">
                <i className="fa-solid fa-inbox mr-2"></i> Nhập Nhanh (Inbox)
              </h3>
              <button onClick={() => setShowQuickInbox(false)} className="text-white/60 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleQuickInboxSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên công việc / Ý tưởng</label>
                <input 
                  autoFocus
                  type="text" 
                  value={quickInboxName} 
                  onChange={e => setQuickInboxName(e.target.value)} 
                  className="w-full p-4 rounded-xl border-2 border-gray-200 text-lg outline-none focus:border-gray-500 transition-colors" 
                  placeholder="Nhập bất cứ thứ gì đang lởn vởn trong đầu..."
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mb-6 italic"><i className="fa-solid fa-circle-info mr-1"></i> Không cần phân loại ngay. Cứ ném vào Inbox rồi cuối tuần xử lý sau (Defining Work).</p>
              
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowQuickInbox(false)} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors">
                  Hủy
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-gray-700 hover:bg-gray-800 shadow-md transition-all flex items-center">
                  <i className="fa-solid fa-download mr-2"></i> Lưu vào Inbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PHÂN LUỒNG GTD */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[24px]">
              <h3 className="text-xl font-black text-slate-800"><i className="fa-solid fa-sitemap text-blue-600 mr-2"></i> {editId ? 'Sửa Hành động' : 'Phễu Xử lý Hành động (Inbox Routing)'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* KHỐI 1: THÔNG TIN CƠ BẢN & ĐA TẦNG */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 relative">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-white px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Định danh & Liên kết</div>
                
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Tên Hành động <span className="text-red-500">*</span></label>
                  <input type="text" required autoFocus value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 text-lg font-bold text-slate-800 transition-colors" placeholder="Ví dụ: Gọi điện cho thợ sửa ống nước..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Bánh xe cuộc đời (Nan xe - 20k ft) <span className="text-red-500">*</span></label>
                    <select required value={formData.area_id} onChange={e => setFormData({...formData, area_id: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 font-bold text-slate-700 bg-slate-50">
                      <option value="" disabled>-- Chọn --</option>
                      {data.areas.map(a => <option key={a.area_id} value={a.area_id}>{a.icon || '🎯'} {a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Phân loại tính chất</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 font-bold text-slate-700">
                      <option value="Strategic">Strategic (Chiến lược)</option>
                      <option value="Maintenance">Maintenance (Bảo trì)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Ghi chú chi tiết</label>
                  <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 text-sm text-slate-700 transition-colors custom-scrollbar" rows="2" placeholder="Ghi chú thêm thông tin, checklist, v.v..."></textarea>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3"><i className="fa-solid fa-link"></i> Liên Kết Vượt Tầng (Tùy chọn)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-bold text-purple-600 mb-1"><i className="fa-solid fa-layer-group"></i> Dự án (10k)</div>
                      <select value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-xs font-medium">
                        <option value="">[Không liên kết]</option>
                        {data.projects.filter(p => p.status === 'Active').map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-blue-600 mb-1"><i className="fa-solid fa-bullseye"></i> Mục tiêu (30k)</div>
                      <select value={formData.goal_id} onChange={e => setFormData({...formData, goal_id: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-xs font-medium">
                        <option value="">[Không liên kết]</option>
                        {data.goals.filter(g => g.status === 'Active').map(g => <option key={g.goal_id} value={g.goal_id}>{g.statement}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-teal-600 mb-1"><i className="fa-solid fa-telescope"></i> Tầm nhìn (40k)</div>
                      <select value={formData.vision_id} onChange={e => setFormData({...formData, vision_id: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-xs font-medium">
                        <option value="">[Không liên kết]</option>
                        {data.visions.filter(v => v.status === 'Active').map(v => <option key={v.vision_id} value={v.vision_id}>{v.statement}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-red-600 mb-1"><i className="fa-solid fa-rocket"></i> Sứ mệnh (50k)</div>
                      <select value={formData.mission_id} onChange={e => setFormData({...formData, mission_id: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none text-xs font-medium">
                        <option value="">[Không liên kết]</option>
                        {data.missions.map(m => <option key={m.mission_id} value={m.mission_id}>{m.statement}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider"><i className="fa-solid fa-box-archive"></i> Link Tài liệu / Lưu trữ</label>
                  <input type="text" placeholder="https://docs.google.com/... hoặc [Ref: Folder_A]" value={formData.reference_link} onChange={e => setFormData({...formData, reference_link: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500 text-sm" />
                </div>
              </div>

              {/* KHỐI 2: PHỄU ĐIỀU HƯỚNG (ROUTING FUNNEL) */}
              <div className="relative">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-white px-2 text-[10px] font-black text-blue-500 uppercase tracking-widest z-10">Phễu Điều Hướng GTD</div>
                
                {/* Bước 1 */}
                <div className="bg-slate-100 p-5 rounded-2xl border-2 border-slate-200 mb-4 transition-all">
                  <h4 className="font-black text-slate-700 mb-3 text-sm"><span className="bg-slate-800 text-white w-6 h-6 inline-flex justify-center items-center rounded-full mr-2 text-xs">1</span> Quy tắc 2 phút: Việc này làm mất dưới 2 phút không?</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setFormData({...formData, step1_twomins: true})} className={`p-3 rounded-xl border-2 font-bold transition-all ${formData.step1_twomins === true ? 'bg-green-100 border-green-500 text-green-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-600'}`}>
                      <i className="fa-solid fa-bolt text-lg mb-1 block"></i> Có, Tôi vừa làm luôn!
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, step1_twomins: false, step2_who: formData.step2_who || 'me'})} className={`p-3 rounded-xl border-2 font-bold transition-all ${formData.step1_twomins === false ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}`}>
                      <i className="fa-solid fa-box-open text-lg mb-1 block"></i> Không, Cần lưu lại
                    </button>
                  </div>
                </div>

                {/* Bước 2 */}
                {formData.step1_twomins === false && (
                  <div className="bg-slate-100 p-5 rounded-2xl border-2 border-slate-200 mb-4 transition-all animate-fade-in-up">
                    <h4 className="font-black text-slate-700 mb-3 text-sm"><span className="bg-slate-800 text-white w-6 h-6 inline-flex justify-center items-center rounded-full mr-2 text-xs">2</span> Phân quyền: Ai là người làm việc này?</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button type="button" onClick={() => setFormData({...formData, step2_who: 'me', step3_when: formData.step3_when || 'asap'})} className={`p-3 rounded-xl border-2 font-bold transition-all ${formData.step2_who === 'me' ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}`}>
                        <i className="fa-solid fa-user text-lg mb-1 block"></i> Chính tôi
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, step2_who: 'other'})} className={`p-3 rounded-xl border-2 font-bold transition-all ${formData.step2_who === 'other' ? 'bg-amber-100 border-amber-500 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'}`}>
                        <i className="fa-solid fa-users text-lg mb-1 block"></i> Người khác (Giao việc)
                      </button>
                    </div>
                    {formData.step2_who === 'other' && (
                      <div className="animate-fade-in-up mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <label className="block text-xs font-bold text-amber-800 mb-1">Giao cho ai? / Chờ ai?</label>
                        <input type="text" required value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})} placeholder="Tên người, thợ thầu, mentor..." className="w-full p-2 rounded-lg border border-amber-300 outline-none focus:border-amber-500 text-sm" />
                      </div>
                    )}
                  </div>
                )}

                {/* Bước 3 */}
                {formData.step1_twomins === false && formData.step2_who === 'me' && (
                  <div className="bg-slate-100 p-5 rounded-2xl border-2 border-slate-200 transition-all animate-fade-in-up">
                    <h4 className="font-black text-slate-700 mb-3 text-sm"><span className="bg-slate-800 text-white w-6 h-6 inline-flex justify-center items-center rounded-full mr-2 text-xs">3</span> Quyết định: Khi nào làm?</h4>
                    <div className="grid grid-cols-7 gap-2 mb-3">
                      <button type="button" onClick={() => setFormData({...formData, step3_when: 'fixed'})} className={`p-2 rounded-xl border-2 font-bold text-[10px] text-center transition-all flex flex-col items-center justify-center ${formData.step3_when === 'fixed' ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'}`}>
                        <i className="fa-regular fa-calendar-check text-lg mb-1 block"></i> Lịch Hẹn
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, step3_when: 'deferred'})} className={`p-2 rounded-xl border-2 font-bold text-[10px] text-center transition-all flex flex-col items-center justify-center ${formData.step3_when === 'deferred' ? 'bg-slate-200 border-slate-500 text-slate-800 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-600'}`}>
                        <i className="fa-solid fa-lock text-lg mb-1 block"></i> Đợi Ngày X
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, step3_when: 'asap'})} className={`p-2 rounded-xl border-2 font-bold text-[10px] text-center transition-all flex flex-col items-center justify-center ${formData.step3_when === 'asap' ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}`}>
                        <i className="fa-solid fa-rocket text-lg mb-1 block"></i> Tuần này
                      </button>
                                            <button type="button" onClick={() => setFormData({...formData, step3_when: 'floating'})} className={`p-2 rounded-xl border-2 font-bold text-[10px] text-center transition-all flex flex-col items-center justify-center ${formData.step3_when === 'floating' ? 'bg-cyan-100 border-cyan-500 text-cyan-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-cyan-300 hover:text-cyan-600'}`}>
                        <i className="fa-solid fa-parachute-box text-lg mb-1 block"></i> Rảnh thì làm
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, step3_when: 'dependent'})} className={`p-2 rounded-xl border-2 font-bold text-[10px] text-center transition-all flex flex-col items-center justify-center ${formData.step3_when === 'dependent' ? 'bg-rose-100 border-rose-500 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600'}`}>
                        <i className="fa-solid fa-link text-lg mb-1 block"></i> Việc Chuỗi
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, step3_when: 'someday'})} className={`p-2 rounded-xl border-2 font-bold text-[10px] text-center transition-all flex flex-col items-center justify-center ${formData.step3_when === 'someday' ? 'bg-purple-100 border-purple-500 text-purple-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300 hover:text-purple-600'}`}>
                        <i className="fa-solid fa-cloud-moon text-lg mb-1 block"></i> Ấp ủ
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, step3_when: 'inbox'})} className={`p-2 rounded-xl border-2 font-bold text-[10px] text-center transition-all flex flex-col items-center justify-center ${formData.step3_when === 'inbox' ? 'bg-gray-200 border-gray-600 text-gray-800 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-gray-400 hover:text-gray-700'}`}>
                        <i className="fa-solid fa-inbox text-lg mb-1 block"></i> Inbox
                      </button>
                    </div>

                    {/* Khung Giờ Diễn Ra - Hiện cho mọi trạng thái (trừ Inbox) */}
                    {formData.step3_when !== 'inbox' && (
                      <div className="animate-fade-in-up p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3 mt-3">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest"><i className="fa-regular fa-calendar-check"></i> Khung Giờ Diễn Ra <span className="text-[10px] font-normal lowercase text-slate-500 ml-2">(Bắt buộc nếu là Lịch Hẹn)</span></label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-1">Bắt đầu</label>
                            <input type="datetime-local" required={formData.step3_when === 'fixed'} value={formData.scheduled_datetime} onChange={e => setFormData({...formData, scheduled_datetime: e.target.value})} className="w-full p-2 rounded-lg border border-slate-300 outline-none focus:border-blue-500 text-sm font-medium" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-1">Kết thúc</label>
                            <input type="datetime-local" required={formData.step3_when === 'fixed'} value={formData.scheduled_end_datetime} onChange={e => setFormData({...formData, scheduled_end_datetime: e.target.value})} className="w-full p-2 rounded-lg border border-slate-300 outline-none focus:border-blue-500 text-sm font-medium" />
                          </div>
                        </div>
                      </div>
                    )}

                                        {/* Sub-form for Dependent */}
                    {formData.step3_when === 'dependent' && (
                      <div className="animate-fade-in-up p-4 bg-rose-50 rounded-xl border border-rose-200 flex flex-col gap-3">
                        <label className="block text-xs font-bold text-rose-800 uppercase tracking-widest"><i className="fa-solid fa-link"></i> Chọn việc đi trước (Phải xong việc đó mới làm việc này)</label>
                        {formData.project_id ? (
                          <select value={formData.depends_on_action_id} onChange={e => setFormData({...formData, depends_on_action_id: e.target.value})} className="w-full p-2 rounded-lg border border-rose-200 outline-none focus:border-rose-500 text-sm font-medium">
                            <option value="">-- Không phụ thuộc (Độc lập) --</option>
                            {data.actions.filter(a => a.project_id === formData.project_id && a.action_id !== formData.action_id && a.status !== 'Done').map(a => (
                              <option key={a.action_id} value={a.action_id}>{a.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-rose-600 font-bold bg-white p-3 rounded-lg border border-rose-200">
                            Vui lòng chọn Dự án ở Bước 2 trước khi thiết lập chuỗi công việc.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-form for Deferred */}
                    {formData.step3_when === 'deferred' && (
                      <div className="animate-fade-in-up p-4 bg-slate-100 rounded-xl border border-slate-300 flex flex-col gap-3">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest"><i className="fa-solid fa-lock"></i> Khóa đến ngày</label>
                        <div>
                          <input type="date" required value={formData.defer_until_date} onChange={e => setFormData({...formData, defer_until_date: e.target.value})} className="w-full p-2 rounded-lg border border-slate-300 outline-none focus:border-slate-500 text-sm font-medium" />
                        </div>
                      </div>
                    )}
                    
                    {/* Sub-form for Next Actions & Floating */}
                    {(formData.step3_when === 'asap' || formData.step3_when === 'floating' || formData.step3_when === 'dependent') && (
                      <div className="animate-fade-in-up p-4 bg-blue-50 rounded-xl border border-blue-200 flex flex-col gap-3">
                        <label className="block text-xs font-bold text-blue-800 uppercase tracking-widest"><i className="fa-solid fa-filter"></i> Bối Cảnh Lọc (Context & Resources)</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">@Context</label>
                            <input type="text" required placeholder="@Máy_tính..." value={formData.context} onChange={e => setFormData({...formData, context: e.target.value})} className="w-full p-2 border border-blue-200 rounded-lg outline-none text-sm" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Loại công việc</label>
                            <select required value={formData.work_type} onChange={e => setFormData({...formData, work_type: e.target.value})} className="w-full p-2 border border-blue-200 rounded-lg outline-none text-sm">
                              <option value="Defined Work">Đã lên lịch (Defined)</option>
                              <option value="Defining Work">Dọn dẹp (Defining)</option>
                              <option value="Unplanned Work">Khẩn cấp (Unplanned)</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Thời gian (Phút)</label>
                            <input 
                              type="number" 
                              required 
                              min="1" 
                              max="10000"
                              value={formData.time_needed_mins || ''} 
                              onChange={e => setFormData({...formData, time_needed_mins: parseInt(e.target.value) || 0})} 
                              className="w-full p-2 border border-blue-200 rounded-lg outline-none text-sm"
                              list="time_suggestions"
                              placeholder="Nhập số phút (VD: 45)"
                            />
                            <datalist id="time_suggestions">
                              <option value="5">5 phút (Cực nhanh)</option>
                              <option value="15">15 phút (Nhanh)</option>
                              <option value="30">30 phút (Trung bình)</option>
                              <option value="60">60 phút (1 Tiếng)</option>
                              <option value="120">120 phút (2 Tiếng)</option>
                            </datalist>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Năng lượng</label>
                            <select required value={formData.energy_level} onChange={e => setFormData({...formData, energy_level: e.target.value})} className="w-full p-2 border border-blue-200 rounded-lg outline-none text-sm">
                              <option value="High">Cao (High)</option>
                              <option value="Medium">Trung bình (Med)</option>
                              <option value="Low">Thấp (Low)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-[24px] flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Hủy</button>
              
              {/* Nút Save thông minh theo context */}
              {formData.step1_twomins === true ? (
                 <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-green-500 hover:bg-green-600 shadow-[0_4px_15px_rgba(34,197,94,0.3)] transition-all flex items-center"><i className="fa-solid fa-check-double mr-2"></i> Lưu & Hoàn Thành (Do It Now)</button>
              ) : formData.step2_who === 'other' ? (
                 <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-amber-500 hover:bg-amber-600 shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all flex items-center"><i className="fa-solid fa-paper-plane mr-2"></i> Chuyển vào Waiting For</button>
              ) : formData.step3_when === 'fixed' ? (
                 <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all flex items-center"><i className="fa-regular fa-calendar-plus mr-2"></i> Đặt Lịch Hẹn (Calendar)</button>
              ) : formData.step3_when === 'deferred' ? (
                 <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-slate-700 hover:bg-slate-800 shadow-[0_4px_15px_rgba(51,65,85,0.3)] transition-all flex items-center"><i className="fa-solid fa-lock mr-2"></i> Đóng Băng (Deferred)</button>
              ) : formData.step3_when === 'asap' ? (
                 <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all flex items-center"><i className="fa-solid fa-bolt mr-2"></i> Cài vào Kế Hoạch Tuần (Core)</button>
                            ) : formData.step3_when === 'dependent' ? (
                 <button type="submit" disabled={!formData.project_id} className="px-6 py-2.5 rounded-xl font-black text-white bg-rose-600 hover:bg-rose-700 shadow-[0_4px_15px_rgba(225,29,72,0.3)] transition-all flex items-center disabled:opacity-50"><i className="fa-solid fa-link mr-2"></i> Lưu vào Project Backlog</button>
              ) : formData.step3_when === 'floating' ? (
                 <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-cyan-600 hover:bg-cyan-700 shadow-[0_4px_15px_rgba(8,145,178,0.3)] transition-all flex items-center"><i className="fa-solid fa-parachute-box mr-2"></i> Lưu vào Khay Thả Nổi</button>
              ) : formData.step3_when === 'inbox' ? (
                  <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-gray-600 hover:bg-gray-700 shadow-[0_4px_15px_rgba(75,85,99,0.3)] transition-all flex items-center"><i className="fa-solid fa-inbox mr-2"></i> Lưu vào Inbox</button>
               ) : formData.step3_when === 'someday' ? (
                 <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-white bg-purple-500 hover:bg-purple-600 shadow-[0_4px_15px_rgba(168,85,247,0.3)] transition-all flex items-center"><i className="fa-solid fa-bed mr-2"></i> Đưa vào Kho Ấp ủ</button>
              ) : (
                 <button type="button" disabled className="px-6 py-2.5 rounded-xl font-black text-white bg-slate-300 cursor-not-allowed">Hoàn thiện Phễu để Lưu</button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, text }) {
  
  const runwayTabsDef = {
    'All_Actions': { label: 'Tất cả Hành động', icon: 'fa-solid fa-layer-group', color: 'text-rose-600', bg: 'bg-rose-100' },
    'Inbox': { label: 'Inbox (Chờ xử lý)', icon: 'fa-solid fa-inbox', color: 'text-gray-800', bg: 'bg-gray-100' },
    'Next_Actions': { label: '⚡ Next Actions', icon: 'fa-solid fa-list-check', color: 'text-blue-600', bg: 'bg-blue-100' },
    'Floating_Backlog': { label: '🎈 Thả nổi', icon: 'fa-solid fa-parachute-box', color: 'text-cyan-600', bg: 'bg-cyan-100' },
    'Calendar': { label: '📅 Lịch Hẹn', icon: 'fa-regular fa-calendar', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    'Deferred': { label: '🔒 Đóng băng', icon: 'fa-solid fa-lock', color: 'text-slate-700', bg: 'bg-slate-200' },
    'Waiting_For': { label: '⏳ Chờ Phản Hồi', icon: 'fa-solid fa-hourglass-half', color: 'text-amber-600', bg: 'bg-amber-100' },
    'Someday_Maybe': { label: '💤 Someday / Maybe', icon: 'fa-solid fa-cloud-moon', color: 'text-purple-600', bg: 'bg-purple-100' }
  };

  return (
    <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-slate-400 border border-slate-100 shadow-sm h-full min-h-[300px]">
      <i className={`fa-solid ${icon} text-5xl mb-5 opacity-40 text-blue-300`}></i>
      <p className="font-medium text-slate-500 text-lg">{text}</p>
    </div>
  );
}

function ActionCard({ action, data, onToggle, onEdit, onDelete, onCopy, onPull }) {
  const isUrl = action.reference_link && (action.reference_link.startsWith('http://') || action.reference_link.startsWith('https://'));
  const isUnplanned = action.work_type === 'Unplanned Work';
  
  const areasList = data?.areas || [];
  const projectsList = data?.projects || [];
  const goalsList = data?.goals || [];
  const visionsList = data?.visions || [];
  const missionsList = data?.missions || [];

  const area = areasList.find(ar => ar && ar.area_id === action.area_id);
  const project = projectsList.find(p => p && p.project_id === action.project_id);
  const goal = goalsList.find(g => g && g.goal_id === action.goal_id);
  const vision = visionsList.find(v => v && v.vision_id === action.vision_id);
  const mission = missionsList.find(m => m && m.mission_id === action.mission_id);
  
  
  const runwayTabsDef = {
    'All_Actions': { label: 'Tất cả Hành động', icon: 'fa-solid fa-layer-group', color: 'text-rose-600', bg: 'bg-rose-100' },
    'Inbox': { label: 'Inbox (Chờ xử lý)', icon: 'fa-solid fa-inbox', color: 'text-gray-800', bg: 'bg-gray-100' },
    'Next_Actions': { label: '⚡ Next Actions', icon: 'fa-solid fa-list-check', color: 'text-blue-600', bg: 'bg-blue-100' },
    'Floating_Backlog': { label: '🎈 Thả nổi', icon: 'fa-solid fa-parachute-box', color: 'text-cyan-600', bg: 'bg-cyan-100' },
    'Calendar': { label: '📅 Lịch Hẹn', icon: 'fa-regular fa-calendar', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    'Deferred': { label: '🔒 Đóng băng', icon: 'fa-solid fa-lock', color: 'text-slate-700', bg: 'bg-slate-200' },
    'Waiting_For': { label: '⏳ Chờ Phản Hồi', icon: 'fa-solid fa-hourglass-half', color: 'text-amber-600', bg: 'bg-amber-100' },
    'Someday_Maybe': { label: '💤 Someday / Maybe', icon: 'fa-solid fa-cloud-moon', color: 'text-purple-600', bg: 'bg-purple-100' }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-5 flex gap-4 transition-all hover:shadow-md group ${isUnplanned && action.storage_system==='Next_Actions' ? 'border-red-300 bg-red-50/20' : 'border-slate-200'}`}>
      {/* Checkbox */}
      <div className="pt-1">
        <button 
          onClick={onToggle}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all shadow-sm ${action.status === 'Done' ? 'bg-green-500 border-green-500 text-white' : 'bg-slate-50 border-slate-300 text-transparent hover:border-blue-400 hover:bg-blue-50'}`}
        >
          <i className="fa-solid fa-check text-sm"></i>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1.5">
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${action.category === 'Strategic' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
              {action.category}
            </span>
            
            {/* System specific badges */}
            {action.storage_system === 'Inbox' && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-800 px-2 py-1 rounded-md flex items-center border border-gray-200">
                <i className="fa-solid fa-inbox mr-1"></i> Chưa Xử Lý
              </span>
            )}
            {action.storage_system === 'Waiting_For' && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-2 py-1 rounded-md flex items-center border border-amber-200">
                <i className="fa-solid fa-user-clock mr-1"></i> Chờ: {action.assigned_to}
              </span>
            )}
            {action.storage_system === 'Floating_Backlog' && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-100 text-cyan-800 px-2 py-1 rounded-md flex items-center border border-cyan-200">
                <i className="fa-solid fa-parachute-box mr-1"></i> Dự Phòng
              </span>
            )}
            {action.storage_system === 'Deferred' && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-800 px-2 py-1 rounded-md flex items-center border border-slate-300">
                <i className="fa-solid fa-lock mr-1"></i> Mở khóa: {formatDateSafe(action.defer_until_date)}
              </span>
            )}
            {action.storage_system === 'Calendar' && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md flex items-center border border-emerald-200 shadow-sm">
                <i className="fa-regular fa-calendar-check mr-1.5 text-emerald-600"></i> {formatTimeSafe(action.scheduled_datetime)} - {formatTimeSafe(action.scheduled_end_datetime)} ({formatDateSafe(action.scheduled_datetime)})
              </span>
            )}
            
            {isUnplanned && action.storage_system==='Next_Actions' && <span className="text-[10px] font-black uppercase tracking-widest bg-red-500 text-white px-2 py-1 rounded-md shadow-sm shadow-red-500/30 animate-pulse">Unplanned</span>}
            {action.work_type === 'Defining Work' && action.storage_system==='Next_Actions' && <span className="text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 px-2 py-1 rounded-md">Defining</span>}
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {action.storage_system === 'Floating_Backlog' && (
              <button onClick={onPull} className="px-3 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center font-bold text-[10px] uppercase tracking-widest shadow-sm border border-blue-200"><i className="fa-solid fa-arrow-turn-up mr-1 rotate-90"></i> Kéo vào Tuần Này</button>
            )}
            {onCopy && (
              <button onClick={onCopy} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600 transition-colors flex items-center justify-center" title="Sao chép hành động (sang tuần sau / nhân bản)"><i className="fa-solid fa-copy text-xs"></i></button>
            )}
            <button onClick={onEdit} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-colors flex items-center justify-center" title="Sửa"><i className="fa-solid fa-pen text-xs"></i></button>
            <button onClick={onDelete} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors flex items-center justify-center" title="Xóa"><i className="fa-solid fa-trash text-xs"></i></button>
          </div>
        </div>
        
        <h4 className={`text-xl font-black ${action.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-800'} mb-3`}>{action.name}</h4>
        
        {/* Multi-Level Links */}
        <div className="flex flex-wrap gap-x-2.5 gap-y-2 mt-2">
          {area && (
            <div className="text-[11px] text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-slate-200">
              <span>{area.icon || '🎯'}</span> <span className="font-bold">{area.name}</span>
            </div>
          )}
          {project && (
            <div className="text-[11px] text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-purple-200">
              <i className="fa-solid fa-layer-group opacity-60"></i> <span className="font-bold truncate max-w-[150px]">{project.name}</span>
            </div>
          )}
          {goal && (
            <div className="text-[11px] text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-blue-200">
              <i className="fa-solid fa-bullseye opacity-60"></i> <span className="font-bold truncate max-w-[150px]">{goal.statement}</span>
            </div>
          )}
          {vision && (
            <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-teal-200">
              <i className="fa-solid fa-telescope opacity-60"></i> <span className="font-bold truncate max-w-[150px]">{vision.statement}</span>
            </div>
          )}
          {mission && (
            <div className="text-[11px] text-red-800 bg-red-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-red-200">
              <i className="fa-solid fa-rocket animate-pulse text-red-600"></i> <span className="font-bold truncate max-w-[150px]">{mission.statement}</span>
            </div>
          )}
        </div>
        
        {/* Context Filters (Only for Next Actions) */}
        { (action.storage_system === 'Next_Actions' || action.storage_system === 'Inbox') && action.context && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 border-dashed">
            <span className="text-[11px] bg-white text-slate-600 px-2.5 py-1 rounded-md font-bold border border-slate-200 shadow-sm">
              <i className="fa-solid fa-location-dot mr-1.5 text-blue-400"></i>{action.context}
            </span>
            <span className="text-[11px] bg-white text-slate-600 px-2.5 py-1 rounded-md font-bold border border-slate-200 shadow-sm">
              <i className="fa-regular fa-clock mr-1.5 text-teal-400"></i>{action.time_needed_mins} phút
            </span>
            <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold border shadow-sm ${action.energy_level === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : action.energy_level === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              <i className="fa-solid fa-bolt mr-1.5 opacity-70"></i>Năng lượng: {action.energy_level}
            </span>
          </div>
        )}
        
        {/* Reference Link */}
        {action.reference_link && (
          <div className="mt-3">
            {isUrl ? (
              <a href={action.reference_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-black text-white bg-slate-800 hover:bg-black px-3.5 py-1.5 rounded-lg transition-colors shadow-md hover:-translate-y-0.5">
                <i className="fa-solid fa-arrow-up-right-from-square"></i> MỞ TÀI LIỆU
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200">
                <i className="fa-solid fa-box-archive text-slate-400"></i> Ref: {action.reference_link}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


function CalendarView({ data, onEdit, onDelete, onToggle, openCreateModalWithDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'agenda'

  const allActions = data?.actions || [];
  const calendarActions = allActions.filter(a => a && a.status !== 'Done' && (a.storage_system === 'Calendar' || a.scheduled_datetime));

  // Month navigation helpers
  
  const calcActionDurationText = (ev) => {
    if (ev.scheduled_datetime && ev.scheduled_end_datetime) {
      const diffMs = new Date(ev.scheduled_end_datetime) - new Date(ev.scheduled_datetime);
      if (diffMs > 0) {
        const mins = Math.round(diffMs / 60000);
        if (mins >= 60) {
          const hrs = Math.round(mins / 60 * 10) / 10;
          return `${hrs}h`;
        }
        return `${mins}m`;
      }
    }
    return ev.time_needed_mins ? `${ev.time_needed_mins}m` : '30m';
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const goToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days calculation for Month Grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Starting day of week (0 = Sun, 1 = Mon... convert so Mon = 0, Sun = 6)
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastDayOfMonth.getDate();

  const monthName = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  // Map actions by date YYYY-MM-DD
  const actionsByDate = {};
  calendarActions.forEach(a => {
    if (!a.scheduled_datetime) return;
    const d = new Date(a.scheduled_datetime);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!actionsByDate[key]) actionsByDate[key] = [];
    actionsByDate[key].push(a);
  });

  // Sort events in each date by start time
  Object.keys(actionsByDate).forEach(k => {
    actionsByDate[k].sort((a, b) => new Date(a.scheduled_datetime) - new Date(b.scheduled_datetime));
  });

  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  // Sorted dates for Agenda View
  const sortedDateKeys = Object.keys(actionsByDate).sort();

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3 border border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-black text-slate-800 capitalize flex items-center gap-2">
            <i className="fa-regular fa-calendar-days text-emerald-600"></i> {monthName}
          </h3>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-white text-slate-600 font-bold transition-colors flex items-center justify-center">
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <button onClick={goToday} className="px-3 py-1 rounded-lg hover:bg-white text-slate-700 font-bold text-xs transition-colors">
              Hôm nay
            </button>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-white text-slate-600 font-bold transition-colors flex items-center justify-center">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('grid')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <i className="fa-solid fa-table-cells"></i> Lưới Lịch
          </button>
          <button 
            onClick={() => setViewMode('agenda')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'agenda' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <i className="fa-solid fa-list-ul"></i> Lịch Biểu (Timeline)
          </button>
        </div>
      </div>

      {/* MONTH GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-black text-xs text-slate-400 uppercase tracking-widest mb-2 pb-2 border-b border-slate-100">
            <div className="py-1">Thứ 2</div>
            <div className="py-1">Thứ 3</div>
            <div className="py-1">Thứ 4</div>
            <div className="py-1">Thứ 5</div>
            <div className="py-1">Thứ 6</div>
            <div className="py-1 text-emerald-600">Thứ 7</div>
            <div className="py-1 text-rose-500">Chủ Nhật</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 auto-rows-fr">
            {/* Empty padding cells for previous month */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] bg-slate-50/50 rounded-xl border border-slate-100/50 opacity-30"></div>
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateKey === todayKey;
              const dayEvents = actionsByDate[dateKey] || [];

              return (
                <div 
                  key={dateKey}
                  className={`min-h-[100px] p-2 rounded-xl border transition-all flex flex-col justify-start group relative ${isToday ? 'bg-emerald-50/60 border-emerald-300 shadow-sm' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-sm'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-black rounded-full w-6 h-6 flex items-center justify-center ${isToday ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700'}`}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full">
                        {dayEvents.length} việc
                      </span>
                    )}
                  </div>

                  {/* Events inside day cell */}
                  <div className="space-y-1 overflow-y-auto custom-scrollbar max-h-[80px]">
                    {dayEvents.map(ev => {
                      const startTime = formatTimeSafe(ev.scheduled_datetime) || '00:00';
                      return (
                        <div 
                          key={ev.action_id}
                          onClick={(e) => { e.stopPropagation(); onEdit(ev); }}
                          className="p-1.5 rounded-lg bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 border border-emerald-200/80 text-[11px] font-bold cursor-pointer truncate transition-colors flex items-center gap-1 shadow-2xs"
                          title={`${startTime} - ${ev.name}`}
                        >
                          <span className="text-[9px] bg-emerald-700 text-white px-1 rounded font-black shrink-0">{startTime}</span>
                          <span className="truncate">{ev.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA TIMELINE VIEW */}
      {viewMode === 'agenda' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <h4 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4 border-b border-slate-100 pb-2">
            <i className="fa-solid fa-list-check text-emerald-600 mr-2"></i> Lịch Trình Chi Tiết ({calendarActions.length} Lịch hẹn)
          </h4>

          <div className="space-y-6">
            {sortedDateKeys.map(dateKey => {
              const events = actionsByDate[dateKey];
              const dateObj = new Date(events[0].scheduled_datetime);
              const dateLabel = dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' }) : dateKey;
              const isToday = dateKey === todayKey;

              return (
                <div key={dateKey} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                    <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg ${isToday ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {dateLabel} {isToday && '(HÔM NAY)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pl-2">
                    {events.map(ev => {
                      const startTime = formatTimeSafe(ev.scheduled_datetime) || '00:00';
                      const endTime = formatTimeSafe(ev.scheduled_end_datetime);
                      const projectsList = data?.projects || [];
                      const project = projectsList.find(p => p && p.project_id === ev.project_id);

                      return (
                        <div key={ev.action_id} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 flex justify-between items-center group transition-colors">
                          <div className="flex items-start gap-4">
                            {(() => {
                              const durText = calcActionDurationText(ev);
                              return (
                                <div className="bg-emerald-600 text-white font-black text-xs px-3 py-2 rounded-xl flex flex-col items-center justify-center min-w-[80px] shadow-sm text-center">
                                  <span>{startTime}</span>
                                  {endTime && <span className="text-[9px] opacity-80 mt-0.5">đến {endTime}</span>}
                                  <span className="text-[9px] font-black bg-yellow-300 text-slate-950 px-1.5 py-0.2 rounded mt-1 shadow-2xs">⏱️ {durText}</span>
                                </div>
                              );
                            })()}

                            <div>
                              <h5 className="font-bold text-slate-800 text-sm mb-1">{ev.name}</h5>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 flex-wrap">
                                {project && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{project.name}</span>}
                                {ev.context && <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{ev.context}</span>}
                                {ev.time_needed_mins && <span className="text-emerald-700"><i className="fa-regular fa-clock"></i> {ev.time_needed_mins} phút</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(ev)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Chỉnh sửa">
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button onClick={() => onDelete(ev.action_id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Xóa">
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {sortedDateKeys.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">
                <i className="fa-regular fa-calendar-xmark text-4xl mb-3 opacity-30 block"></i>
                Chưa có lịch hẹn nào được lên thời gian.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
