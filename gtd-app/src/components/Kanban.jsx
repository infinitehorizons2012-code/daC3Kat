import React from 'react';

export default function Kanban() {
  return (
    <div className="glass-panel p-8 rounded-2xl min-h-[500px]">
      <h2 className="text-2xl font-bold text-purple-700 mb-4"><i className="fa-solid fa-layer-group"></i> Kanban Dự án (10,000 ft)</h2>
      <p className="text-slate-600 mb-6">Màn hình này sẽ hiển thị các dự án theo từng lĩnh vực dưới dạng cột Kanban (Active / On-Hold / Completed).</p>
      
      <div className="flex gap-6 overflow-x-auto pb-4">
        {/* Placeholder Column 1 */}
        <div className="bg-white/40 w-80 rounded-xl p-4 flex-shrink-0 border border-white/60">
          <h3 className="font-bold text-slate-700 mb-3 border-b border-slate-300 pb-2">Đang thực hiện (Active)</h3>
          <div className="flex flex-col gap-3">
            <div className="bg-white p-3 rounded shadow-sm border-l-4 border-purple-500">
              <h4 className="font-medium text-slate-800">Dự án Alpha</h4>
              <p className="text-xs text-slate-500 mt-1">Lĩnh vực: Kỹ thuật</p>
            </div>
          </div>
        </div>

        {/* Placeholder Column 2 */}
        <div className="bg-white/40 w-80 rounded-xl p-4 flex-shrink-0 border border-white/60">
          <h3 className="font-bold text-slate-700 mb-3 border-b border-slate-300 pb-2">Đóng băng (On-Hold)</h3>
          <div className="flex flex-col gap-3">
            <div className="bg-white p-3 rounded shadow-sm border-l-4 border-slate-400 opacity-70">
              <h4 className="font-medium text-slate-800">Dự án Beta</h4>
              <p className="text-xs text-slate-500 mt-1">Lĩnh vực: Ngoại ngữ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
