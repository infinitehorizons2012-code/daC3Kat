import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null); // 'create', 'edit'
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', icon: '🎯', description: '' });

  const fetchAreas = () => {
    fetch(`${API_URL}/areas`)
      .then(res => res.json())
      .then(data => {
        setAreas(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let endpoint = '/areas';
    let method = 'POST';
    
    if (modalType === 'edit') {
      endpoint = `/areas/${editId}`;
      method = 'PATCH';
    }

    try {
      await fetch(`${API_URL}${endpoint}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setModalType(null);
      setEditId(null);
      setFormData({ name: '', icon: '🎯', description: '' });
      fetchAreas();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Lĩnh vực này không? Lưu ý: Các Dự án và Hành động thuộc Khu vực này có thể bị ảnh hưởng.")) return;
    try {
      await fetch(`${API_URL}/areas/${id}`, {
        method: 'DELETE'
      });
      fetchAreas();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-2xl min-h-[500px] relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-teal-700"><i className="fa-solid fa-map-location-dot mr-2"></i> Khu vực (20,000 ft)</h2>
        <button onClick={() => { setModalType('create'); setFormData({ name: '', icon: '🎯', description: '' }); }} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-md">
          <i className="fa-solid fa-plus mr-2"></i> Thêm Lĩnh vực
        </button>
      </div>

      {modalType && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl w-[500px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{modalType === 'create' ? 'Thêm Lĩnh vực mới' : 'Sửa Lĩnh vực'}</h3>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Lĩnh vực (bắt buộc)</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Học thuật Core & SAT..." 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-400"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Biểu tượng (Icon)</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: 🎯, 🎓, 💼, 🏠..." 
                  value={formData.icon}
                  onChange={e => setFormData({...formData, icon: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả chi tiết</label>
                <textarea 
                  placeholder="Mô tả các tiêu chuẩn, trách nhiệm, hoặc phạm vi quản lý..." 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-400 min-h-[80px]"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100">Hủy</button>
              <button type="submit" className="px-4 py-2 rounded-lg font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md">Lưu</button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-20 text-slate-500"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas.length === 0 ? (
            <div className="col-span-full bg-teal-50 border border-dashed border-teal-300 p-8 rounded-xl shadow-sm text-center">
              <h3 className="font-bold text-teal-700 mb-2">Chưa có Lĩnh vực nào</h3>
              <p className="text-sm text-slate-500">Khu vực quản lý 20,000 ft đại diện cho các trọng tâm bạn phải duy trì. Hãy định nghĩa lĩnh vực đầu tiên của bạn.</p>
            </div>
          ) : (
            areas.map(area => (
              <div key={area.area_id} className={`bg-white border-l-4 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border-teal-400`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xl">
                      {area.icon || '🎯'}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => { setModalType('edit'); setEditId(area.area_id); setFormData({ name: area.name, icon: area.icon, description: area.description || '' }); }} className="text-sm text-slate-400 hover:text-blue-600"><i className="fa-solid fa-pen"></i></button>
                      <button onClick={() => handleDelete(area.area_id)} className="text-sm text-slate-400 hover:text-red-600"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">{area.name}</h3>
                  <p className="text-sm text-slate-600">{area.description || <span className="italic text-slate-400">Không có mô tả</span>}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
