import React, { useState, useEffect, useMemo } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function Runway() {
  const [data, setData] = useState({ actions: [], areas: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null); // 'create', 'edit'
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', category: 'Strategic', area_id: '', project_id: '',
    context: '@Máy_tính', time_needed_mins: 30, energy_level: 'Medium',
    work_type: 'Defined Work', reference_link: '', status: 'Next'
  });

  // Filters
  const [filters, setFilters] = useState({
    context: 'All', time: 'All', energy: 'All', work_type: 'All'
  });

  const fetchData = async () => {
    try {
      const [actionsRes, horizonsRes, areasRes] = await Promise.all([
        fetch(`${API_URL}/actions`),
        fetch(`${API_URL}/horizons`),
        fetch(`${API_URL}/areas`)
      ]);
      const acData = await actionsRes.json();
      const hData = await horizonsRes.json();
      const arData = await areasRes.json();
      setData({ actions: acData, areas: arData, projects: hData.projects || [] });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.area_id) return alert("Vui lòng nhập tên hành động và Khu vực!");
    
    let endpoint = '/actions';
    let method = 'POST';
    if (modalType === 'edit') {
      endpoint = `/actions/${editId}`;
      method = 'PATCH';
    }

    try {
      await fetch(`${API_URL}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setModalType(null); setEditId(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (action) => {
    const newStatus = action.status === 'Done' ? 'Next' : 'Done';
    try {
      await fetch(`${API_URL}/actions/${action.action_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...action, status: newStatus })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa hành động này?")) return;
    try {
      await fetch(`${API_URL}/actions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const openCreateModal = () => {
    setModalType('create');
    setFormData({
      name: '', category: 'Strategic', area_id: '', project_id: '',
      context: '@Máy_tính', time_needed_mins: 30, energy_level: 'Medium',
      work_type: 'Defined Work', reference_link: '', status: 'Next'
    });
  };

  const openEditModal = (a) => {
    setModalType('edit'); setEditId(a.action_id);
    setFormData({
      name: a.name, category: a.category, area_id: a.area_id || '', project_id: a.project_id || '',
      context: a.context, time_needed_mins: a.time_needed_mins, energy_level: a.energy_level,
      work_type: a.work_type, reference_link: a.reference_link || '', status: a.status
    });
  };

  // Lọc dữ liệu
  const unplannedActions = data.actions.filter(a => a.work_type === 'Unplanned Work' && a.status !== 'Done');
  
  const filteredActions = data.actions.filter(a => {
    if (a.status === 'Done') return false; // Hide done tasks by default (can add a tab later if needed)
    if (filters.work_type !== 'All' && a.work_type !== filters.work_type) return false;
    if (filters.context !== 'All' && a.context !== filters.context) return false;
    if (filters.time !== 'All' && a.time_needed_mins !== parseInt(filters.time)) return false;
    if (filters.energy !== 'All' && a.energy_level !== filters.energy) return false;
    return true;
  });

  // Extract unique contexts for the filter buttons
  const uniqueContexts = [...new Set(data.actions.map(a => a.context))];
  const timeOptions = [5, 10, 15, 30, 45, 60, 90, 120];

  return (
    <div className="flex flex-col gap-6 min-h-[500px]">
      <div className="glass-panel p-6 rounded-2xl flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-blue-700"><i className="fa-solid fa-plane-departure mr-2"></i> Runway (Bảng Thực Thi)</h2>
          <p className="text-sm text-slate-500 mt-1">Nơi mọi kế hoạch chạm đất và cất cánh thành hành động.</p>
        </div>
        <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors font-bold shadow-md">
          <i className="fa-solid fa-bolt mr-2"></i> Thêm Hành động
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Cột 1: Thuật toán lọc (Bộ lọc 3 Bước) */}
          <div className="glass-panel w-full md:w-80 p-5 rounded-2xl flex-shrink-0 flex flex-col gap-5 sticky top-24">
            <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wide text-sm">Thuật toán Lọc (3 Bước)</h3>
            
            {/* Bước 1 */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Bước 1: Loại công việc</p>
              {unplannedActions.length > 0 && (
                <div 
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all mb-3 ${filters.work_type === 'Unplanned Work' ? 'bg-red-50 border-red-500 shadow-md' : 'bg-red-50/50 border-red-200 hover:border-red-400'}`}
                  onClick={() => setFilters({...filters, work_type: filters.work_type === 'Unplanned Work' ? 'All' : 'Unplanned Work'})}
                >
                  <h4 className="text-red-700 font-bold text-sm flex items-center justify-between">
                    <span><i className="fa-solid fa-triangle-exclamation mr-1.5 animate-pulse"></i> Việc Khẩn Cấp!</span>
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unplannedActions.length}</span>
                  </h4>
                  <p className="text-[11px] text-red-600 mt-1">Xử lý ngay lập tức (In-the-moment)</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setFilters({...filters, work_type: 'All'})}
                  className={`text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filters.work_type === 'All' ? 'bg-slate-200 text-slate-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >Tất cả công việc</button>
                <button 
                  onClick={() => setFilters({...filters, work_type: 'Defined Work'})}
                  className={`text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filters.work_type === 'Defined Work' ? 'bg-blue-100 text-blue-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >Việc đã lên kế hoạch (Defined)</button>
                <button 
                  onClick={() => setFilters({...filters, work_type: 'Defining Work'})}
                  className={`text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filters.work_type === 'Defining Work' ? 'bg-orange-100 text-orange-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >Dọn dẹp hệ thống (Defining)</button>
              </div>
            </div>

            {/* Bước 2 */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Bước 2: Lọc Bối cảnh</p>
              
              <div className="mb-3">
                <label className="text-[11px] text-slate-400 block mb-1">@Context (Nơi chốn/Công cụ)</label>
                <div className="flex flex-wrap gap-1.5">
                  <span onClick={() => setFilters({...filters, context: 'All'})} className={`cursor-pointer px-2 py-1 rounded text-xs border ${filters.context === 'All' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>Tất cả</span>
                  {uniqueContexts.map(ctx => (
                    <span key={ctx} onClick={() => setFilters({...filters, context: ctx})} className={`cursor-pointer px-2 py-1 rounded text-xs border ${filters.context === ctx ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{ctx}</span>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <label className="text-[11px] text-slate-400 block mb-1">Thời gian rảnh</label>
                <div className="flex flex-wrap gap-1.5">
                  <span onClick={() => setFilters({...filters, time: 'All'})} className={`cursor-pointer px-2 py-1 rounded text-xs border ${filters.time === 'All' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>Mọi mốc</span>
                  {timeOptions.map(t => (
                    <span key={t} onClick={() => setFilters({...filters, time: t})} className={`cursor-pointer px-2 py-1 rounded text-xs border ${filters.time === t ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{t}m</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Năng lượng não bộ</label>
                <div className="flex flex-wrap gap-1.5">
                  <span onClick={() => setFilters({...filters, energy: 'All'})} className={`cursor-pointer px-2 py-1 rounded text-xs border ${filters.energy === 'All' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>Tất cả</span>
                  <span onClick={() => setFilters({...filters, energy: 'High'})} className={`cursor-pointer px-2 py-1 rounded text-xs border ${filters.energy === 'High' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-rose-600 border-rose-200 hover:border-rose-400'}`}>High (Deep Work)</span>
                  <span onClick={() => setFilters({...filters, energy: 'Medium'})} className={`cursor-pointer px-2 py-1 rounded text-xs border ${filters.energy === 'Medium' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-600 border-amber-200 hover:border-amber-400'}`}>Medium</span>
                  <span onClick={() => setFilters({...filters, energy: 'Low'})} className={`cursor-pointer px-2 py-1 rounded text-xs border ${filters.energy === 'Low' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-green-600 border-green-200 hover:border-green-400'}`}>Low (Routine)</span>
                </div>
              </div>
            </div>
            
            {/* Nút reset */}
            <button 
              onClick={() => setFilters({context: 'All', time: 'All', energy: 'All', work_type: 'All'})}
              className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline text-center"
            >Xóa tất cả bộ lọc</button>
          </div>

          {/* Cột 2: Danh sách Actions */}
          <div className="flex-1 flex flex-col gap-4">
            {filteredActions.length === 0 ? (
              <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center text-slate-400">
                <i className="fa-solid fa-mug-hot text-4xl mb-4 opacity-50"></i>
                <p>Không có công việc nào khớp với bộ lọc hiện tại.</p>
              </div>
            ) : (
              filteredActions.map(a => (
                <ActionCard 
                  key={a.action_id} 
                  action={a} 
                  area={data.areas.find(ar => ar.area_id === a.area_id)}
                  project={data.projects.find(p => p.project_id === a.project_id)}
                  onToggle={() => handleToggleStatus(a)}
                  onEdit={() => openEditModal(a)}
                  onDelete={() => handleDelete(a.action_id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL */}
      {modalType && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl w-[700px] max-h-[95vh] overflow-y-auto">
            <h3 className="text-xl font-black text-slate-800 mb-4">{modalType === 'create' ? 'Tạo Hành động mới' : 'Sửa Hành động'}</h3>
            
            <div className="flex flex-col gap-4 mb-6">
              {/* Định danh */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tên Hành động</label>
                <input 
                  type="text" required autoFocus
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-lg font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Khu vực (Bắt buộc)</label>
                  <select required value={formData.area_id} onChange={e => setFormData({...formData, area_id: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none">
                    <option value="" disabled>-- Chọn Khu vực --</option>
                    {data.areas.map(a => <option key={a.area_id} value={a.area_id}>{a.icon || '🎯'} {a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Dự án (Tùy chọn)</label>
                  <select value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none">
                    <option value="">[Không thuộc dự án nào]</option>
                    {data.projects.filter(p => p.status === 'Active').map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Phân loại</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none">
                    <option value="Strategic">Strategic (Bứt phá)</option>
                    <option value="Maintenance">Maintenance (Duy trì)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Loại công việc (3 Types)</label>
                  <select value={formData.work_type} onChange={e => setFormData({...formData, work_type: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none">
                    <option value="Defined Work">Defined Work (Đã lên lịch)</option>
                    <option value="Defining Work">Defining Work (Dọn dẹp Inbox)</option>
                    <option value="Unplanned Work">Unplanned Work (Việc khẩn cấp)</option>
                  </select>
                </div>
              </div>

              {/* Bối cảnh */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                <h4 className="text-sm font-bold text-slate-700 mb-3"><i className="fa-solid fa-filter mr-1"></i> Bối cảnh & Điều kiện</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">@Context</label>
                    <input type="text" placeholder="@Máy_tính, @Gọi_điện..." required value={formData.context} onChange={e => setFormData({...formData, context: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Thời gian cần (Phút)</label>
                    <select required value={formData.time_needed_mins} onChange={e => setFormData({...formData, time_needed_mins: parseInt(e.target.value)})} className="w-full border border-slate-300 rounded-lg p-2 outline-none">
                      {timeOptions.map(t => <option key={t} value={t}>{t} phút</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Năng lượng</label>
                    <select required value={formData.energy_level} onChange={e => setFormData({...formData, energy_level: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 outline-none">
                      <option value="High">Cao (Deep Work)</option>
                      <option value="Medium">Trung bình</option>
                      <option value="Low">Thấp (Routine)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Link Hệ thống lưu trữ (Reference/Archive)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <i className="fa-solid fa-link"></i>
                  </div>
                  <input 
                    type="text" placeholder="https://docs.google.com/... hoặc [Ref: Book_Chap1]"
                    value={formData.reference_link} onChange={e => setFormData({...formData, reference_link: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 pl-9 outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Dán link tài liệu để mở nhanh ở Bước 3. Phân biệt rõ giữa việc cần làm và kho lưu trữ.</p>
              </div>

            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100">Hủy</button>
              <button type="submit" className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md">Lưu Hành động</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ActionCard({ action, area, project, onToggle, onEdit, onDelete }) {
  const isUrl = action.reference_link && (action.reference_link.startsWith('http://') || action.reference_link.startsWith('https://'));
  const isUnplanned = action.work_type === 'Unplanned Work';
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 flex gap-4 transition-all hover:shadow-md group ${isUnplanned ? 'border-red-300' : 'border-slate-200'}`}>
      {/* Checkbox */}
      <div className="pt-1">
        <button 
          onClick={onToggle}
          className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${action.status === 'Done' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent hover:border-blue-400'}`}
        >
          <i className="fa-solid fa-check text-xs"></i>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${action.category === 'Strategic' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
              {action.category}
            </span>
            {isUnplanned && <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded animate-pulse">Unplanned</span>}
            {action.work_type === 'Defining Work' && <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Defining</span>}
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="text-slate-400 hover:text-blue-600 text-sm"><i className="fa-solid fa-pen"></i></button>
            <button onClick={onDelete} className="text-slate-400 hover:text-red-600 text-sm"><i className="fa-solid fa-trash"></i></button>
          </div>
        </div>
        
        <h4 className={`text-lg font-bold ${action.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-800'} mb-2`}>{action.name}</h4>
        
        {/* Meta tags */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
          {area && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>{area.icon || '🎯'}</span> <span className="font-semibold">{area.name}</span>
            </div>
          )}
          {project && (
            <div className="text-[11px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <i className="fa-solid fa-layer-group"></i> <span>{project.name}</span>
            </div>
          )}
        </div>
        
        {/* Context Filters */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium border border-slate-200">
            <i className="fa-solid fa-location-dot mr-1 text-slate-400"></i>{action.context}
          </span>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium border border-slate-200">
            <i className="fa-regular fa-clock mr-1 text-slate-400"></i>{action.time_needed_mins}m
          </span>
          <span className={`text-[11px] px-2 py-1 rounded font-medium border ${action.energy_level === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : action.energy_level === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            <i className="fa-solid fa-bolt mr-1 opacity-70"></i>{action.energy_level}
          </span>
        </div>
        
        {/* Reference Link */}
        {action.reference_link && (
          <div className="mt-3">
            {isUrl ? (
              <a href={action.reference_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                <i className="fa-solid fa-arrow-up-right-from-square"></i> Mở Tài Liệu
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <i className="fa-solid fa-box-archive text-slate-400"></i> {action.reference_link}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
