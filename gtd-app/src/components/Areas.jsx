import React, { useState, useEffect } from 'react';

const API_URL = 'https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api';

const SLICE_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', 
  '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#eab308'
];

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null); // 'create', 'edit'
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', icon: '🎯', description: '' });

  // Score state for each life aspect (1 to 10)
  const [scoresMap, setScoresMap] = useState(() => {
    try {
      const saved = localStorage.getItem('wheel_of_life_scores');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [activeAreaId, setActiveAreaId] = useState(null);

  const fetchAreas = () => {
    fetch(`${API_URL}/areas`)
      .then(res => res.json())
      .then(data => {
        setAreas(Array.isArray(data) ? data : []);
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

  const handleScoreChange = (areaId, score) => {
    const newScores = { ...scoresMap, [areaId]: score };
    setScoresMap(newScores);
    try {
      localStorage.setItem('wheel_of_life_scores', JSON.stringify(newScores));
    } catch (e) { console.error(e); }
  };

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
    if (!window.confirm("Bạn có chắc chắn muốn xóa khía cạnh này không?")) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchAreas();
    } catch (e) { console.error(e); }
  };

  // SVG Wheel Rendering Math
  const renderWheelOfLifeSVG = () => {
    if (areas.length === 0) return null;

    const size = 440;
    const center = size / 2;
    const maxRadius = 150;
    const minRadius = 30;
    const N = areas.length;
    const sliceAngle = 360 / N;

    // Calculate overall average balance score
    const totalScore = areas.reduce((sum, a) => sum + (scoresMap[a.area_id] || 8), 0);
    const avgScore = Math.round((totalScore / N) * 10) / 10;

    return (
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-teal-900/5 to-slate-900/5 rounded-3xl border border-teal-200/60 shadow-sm relative mb-8">
        <div className="text-center mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 bg-teal-100 px-3 py-1 rounded-full border border-teal-200">
            ☸️ Vòng Tròn Biểu Diễn Cân Bằng Bánh Xe Cuộc Đời
          </span>
        </div>

        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="overflow-visible">
            {/* Background concentric level rings (levels 2, 4, 6, 8, 10) */}
            {[2, 4, 6, 8, 10].map(lvl => {
              const r = minRadius + (lvl / 10) * (maxRadius - minRadius);
              return (
                <circle
                  key={lvl}
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray={lvl === 10 ? "none" : "3 3"}
                  opacity="0.6"
                />
              );
            })}

            {/* Spoke axis lines for each aspect */}
            {areas.map((_, i) => {
              const angleDeg = i * sliceAngle - 90;
              const rad = (angleDeg * Math.PI) / 180;
              const x2 = center + maxRadius * Math.cos(rad);
              const y2 = center + maxRadius * Math.sin(rad);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  opacity="0.5"
                />
              );
            })}

            {/* Render interactive filled slices for each area */}
            {areas.map((area, i) => {
              const score = scoresMap[area.area_id] || 8;
              const startDeg = i * sliceAngle - 90;
              const endDeg = (i + 1) * sliceAngle - 90;

              const startRad = (startDeg * Math.PI) / 180;
              const endRad = (endDeg * Math.PI) / 180;
              const midRad = ((startDeg + sliceAngle / 2) * Math.PI) / 180;

              const rScore = minRadius + (score / 10) * (maxRadius - minRadius);

              // Coordinates
              const x1_in = center + minRadius * Math.cos(startRad);
              const y1_in = center + minRadius * Math.sin(startRad);
              const x1_out = center + rScore * Math.cos(startRad);
              const y1_out = center + rScore * Math.sin(startRad);

              const x2_out = center + rScore * Math.cos(endRad);
              const y2_out = center + rScore * Math.sin(endRad);
              const x2_in = center + minRadius * Math.cos(endRad);
              const y2_in = center + minRadius * Math.sin(endRad);

              const largeArc = sliceAngle > 180 ? 1 : 0;
              const pathData = `
                M ${x1_in} ${y1_in}
                L ${x1_out} ${y1_out}
                A ${rScore} ${rScore} 0 ${largeArc} 1 ${x2_out} ${y2_out}
                L ${x2_in} ${y2_in}
                A ${minRadius} ${minRadius} 0 ${largeArc} 0 ${x1_in} ${y1_in}
                Z
              `;

              const color = SLICE_COLORS[i % SLICE_COLORS.length];
              const isHovered = activeAreaId === area.area_id;

              // Label Position
              const labelRadius = maxRadius + 32;
              const lx = center + labelRadius * Math.cos(midRad);
              const ly = center + labelRadius * Math.sin(midRad);

              return (
                <g 
                  key={area.area_id}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setActiveAreaId(area.area_id)}
                  onMouseLeave={() => setActiveAreaId(null)}
                >
                  {/* Filled Slice Arc */}
                  <path
                    d={pathData}
                    fill={color}
                    fillOpacity={isHovered ? 0.95 : 0.75}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-300 hover:scale-105"
                  />

                  {/* Outer Label with Icon, Name & Score */}
                  <foreignObject
                    x={lx - 60}
                    y={ly - 20}
                    width="120"
                    height="45"
                    className="overflow-visible pointer-events-none"
                  >
                    <div className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all border shadow-2xs ${isHovered ? 'bg-slate-900 text-white border-teal-400 scale-110 z-20' : 'bg-white/95 text-slate-800 border-slate-200'}`}>
                      <div className="flex items-center gap-1 text-[10px] font-black truncate max-w-[110px]">
                        <span>{area.icon || '🎯'}</span>
                        <span className="truncate">{area.name}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-1.5 rounded ${isHovered ? 'bg-teal-400 text-slate-950' : 'bg-teal-50 text-teal-700'}`}>
                        {score}/10
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {/* Center Circle with Average Harmony Score */}
            <circle cx={center} cy={center} r={minRadius - 2} fill="#ffffff" stroke="#0d9488" strokeWidth="3" />
          </svg>

          {/* Central Score Text Overlay */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[9px] font-black text-teal-600 uppercase tracking-tighter">Độ Cân Bằng</span>
            <span className="text-sm font-black text-slate-900">{avgScore}</span>
            <span className="text-[8px] font-bold text-slate-400">/10</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel p-8 rounded-2xl min-h-[500px] relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-teal-700 flex items-center gap-2">
          <i className="fa-solid fa-compass text-teal-600"></i> Bánh xe cuộc đời
        </h2>
        <button 
          onClick={() => { setModalType('create'); setFormData({ name: '', icon: '🎯', description: '' }); }} 
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-md text-xs flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Thêm Khía Cạnh Cuộc Đời
        </button>
      </div>

      {/* Modal */}
      {modalType && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl w-[500px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{modalType === 'create' ? 'Thêm Khía Cạnh Cuộc Đời mới' : 'Sửa Lĩnh vực'}</h3>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Khía Cạnh (bắt buộc)</label>
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
        <>
          {/* INTERACTIVE SVG WHEEL OF LIFE CIRCLE */}
          {renderWheelOfLifeSVG()}

          {/* Life Aspect Cards with Score Rating Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {areas.length === 0 ? (
              <div className="col-span-full bg-teal-50 border border-dashed border-teal-300 p-8 rounded-xl shadow-sm text-center">
                <h3 className="font-bold text-teal-700 mb-2">Chưa có khía cạnh nào</h3>
                <p className="text-sm text-slate-500">Bánh xe cuộc đời quản lý 20,000 ft đại diện cho các trọng tâm bạn phải duy trì. Hãy định nghĩa lĩnh vực đầu tiên của bạn.</p>
              </div>
            ) : (
              areas.map((area, idx) => {
                const currentScore = scoresMap[area.area_id] || 8;
                const cardColor = SLICE_COLORS[idx % SLICE_COLORS.length];
                const isHovered = activeAreaId === area.area_id;

                return (
                  <div 
                    key={area.area_id} 
                    onMouseEnter={() => setActiveAreaId(area.area_id)}
                    onMouseLeave={() => setActiveAreaId(null)}
                    className={`bg-white border-l-4 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${isHovered ? 'ring-2 ring-teal-400 border-l-8' : ''}`}
                    style={{ borderLeftColor: cardColor }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{area.icon || '🎯'}</span>
                          <h3 className="font-bold text-base text-slate-800">{area.name}</h3>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setModalType('edit'); setEditId(area.area_id); setFormData({ name: area.name, icon: area.icon, description: area.description || '' }); }} className="text-sm text-slate-400 hover:text-blue-600"><i className="fa-solid fa-pen"></i></button>
                          <button onClick={() => handleDelete(area.area_id)} className="text-sm text-slate-400 hover:text-red-600"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-4">{area.description || <span className="italic text-slate-400">Không có mô tả</span>}</p>
                    </div>

                    {/* Satisfaction Rating Slider (1 to 10) */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Đánh giá Mức độ Cân bằng / Hài lòng:</span>
                        <span className="font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{currentScore} / 10</span>
                      </div>
                      
                      <div className="flex gap-1 overflow-x-auto custom-scrollbar py-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleScoreChange(area.area_id, s)}
                            className={`flex-1 min-w-[24px] py-1 rounded-lg text-[10px] font-black transition-all ${currentScore === s ? 'bg-teal-600 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
