// Cloudflare Worker API URL (User needs to replace this with their actual deployed worker URL)
const CLOUDFLARE_API_URL = ''; 

// Khởi tạo state (Kiến trúc Master Task List)
let state = {
    stars: 0,
    tasks: [] // Một mảng duy nhất chứa toàn bộ task
};

let currentActiveTab = 'predefined';

// DOM Elements
const syncStatusEl = document.getElementById('sync-status');
const starCountEl = document.getElementById('star-count');
const celebrationEl = document.getElementById('celebration');
const masterListEl = document.getElementById('master-task-list');
const taskModal = document.getElementById('task-modal');
const quickAddInput = document.getElementById('quick-add-input');
const headerTitle = document.getElementById('header-title');
const headerDesc = document.getElementById('header-desc');

// Cấu hình Tabs
const tabConfigs = {
    'action': { title: 'Hành Động', desc: 'Bảng tổng hợp toàn bộ dữ liệu (Giao diện Excel).', icon: 'fa-table-list', color: '#10b981', defaultWorkCat: 'Pre-defined Work', defaultSysCat: 'Next Actions' },
    'vision': { title: 'Tầm Nhìn', desc: 'Mục tiêu lớn và ước mơ của con.', icon: 'fa-eye', color: 'var(--secondary-color)', defaultWorkCat: 'Vision', defaultSysCat: 'N/A' },
    'project': { title: 'Dự Án', desc: 'Mục tiêu cần nhiều bước để hoàn thành.', icon: 'fa-layer-group', color: 'var(--primary-color)', defaultWorkCat: 'Project', defaultSysCat: 'N/A' },
    'unplanned': { title: 'Đột Xuất', desc: 'Những việc bất ngờ nhảy vào! Làm ngay.', icon: 'fa-bolt', color: 'var(--warning-color)', defaultWorkCat: 'Unplanned Work', defaultSysCat: 'Next Actions' },
    'predefined': { title: 'Định Trước', desc: 'Những việc đã lên kế hoạch!', icon: 'fa-bullseye', color: 'var(--success-color)', defaultWorkCat: 'Pre-defined Work', defaultSysCat: 'Next Actions' },
    'defining': { title: 'Định Hình', desc: 'Ghi chép ý tưởng, dọn dẹp hòm thư.', icon: 'fa-box-archive', color: '#6366f1', defaultWorkCat: 'Defining Work', defaultSysCat: 'Inbox (Stuff)' }
};

// --- Khởi động ứng dụng ---
document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    await loadData();
    updateHeader();
    window.renderTasks();
    updateStarsUI();
});

// --- Quản lý Tab ---
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentActiveTab = btn.getAttribute('data-tab');
            updateHeader();
            window.renderTasks();
        });
    });
}

function updateHeader() {
    const conf = tabConfigs[currentActiveTab];
    headerTitle.innerHTML = `<i class="fa-solid ${conf.icon}" style="color: ${conf.color}"></i> ${conf.title}`;
    headerDesc.textContent = conf.desc;
    
    // Đổi placeholder input
    quickAddInput.placeholder = `Nhập ${conf.title.toLowerCase()} mới...`;
}

// --- Dữ liệu (Cloudflare + LocalStorage Fallback) ---
async function loadData() {
    const localData = localStorage.getItem('timeManagementStatePro');
    if (localData) {
        state = JSON.parse(localData);
    } else {
        // Thử migrate từ bản cũ nếu có
        const oldData = localStorage.getItem('timeManagementState');
        if (oldData) {
            const parsed = JSON.parse(oldData);
            state.stars = parsed.stars || 0;
            if (parsed.tasks && !Array.isArray(parsed.tasks)) {
                // Chuyển object tasks thành flat array
                for (let key in parsed.tasks) {
                    parsed.tasks[key].forEach(t => {
                        t.workCategory = tabConfigs[key]?.defaultWorkCat || 'Pre-defined Work';
                        t.systemCategory = tabConfigs[key]?.defaultSysCat || 'Next Actions';
                        t.context = ''; t.time = ''; t.energy = ''; t.projectRef = '';
                        state.tasks.push(t);
                    });
                }
            }
            saveToLocal();
        }
    }

    if (CLOUDFLARE_API_URL) {
        setSyncStatus('syncing');
        try {
            const response = await fetch(`${CLOUDFLARE_API_URL}/data`);
            if (response.ok) {
                const cloudData = await response.json();
                if (cloudData && Array.isArray(cloudData.tasks)) {
                    state = cloudData;
                    saveToLocal();
                }
                setSyncStatus('synced');
            } else {
                setSyncStatus('error');
            }
        } catch (error) {
            console.error('Lỗi khi load từ Cloudflare:', error);
            setSyncStatus('error');
        }
    } else {
        syncStatusEl.style.display = 'none';
    }
}

async function saveData() {
    saveToLocal();
    if (CLOUDFLARE_API_URL) {
        setSyncStatus('syncing');
        try {
            const response = await fetch(`${CLOUDFLARE_API_URL}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });
            if (response.ok) {
                setSyncStatus('synced');
            } else {
                setSyncStatus('error');
            }
        } catch (error) {
            console.error('Lỗi khi lưu lên Cloudflare:', error);
            setSyncStatus('error');
        }
    }
}

function saveToLocal() {
    localStorage.setItem('timeManagementStatePro', JSON.stringify(state));
}

function setSyncStatus(status) {
    syncStatusEl.className = 'sync-status ' + status;
    if (status === 'synced') {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-cloud-check"></i>';
        syncStatusEl.title = 'Đã đồng bộ';
    } else if (status === 'syncing') {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-rotate"></i>';
        syncStatusEl.title = 'Đang đồng bộ...';
    } else {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-cloud-xmark"></i>';
        syncStatusEl.title = 'Lỗi đồng bộ';
    }
}

// --- Quick Add Task ---
window.handleQuickAdd = async function(event) {
    event.preventDefault();
    const text = quickAddInput.value.trim();
    if (!text) return;

    const conf = tabConfigs[currentActiveTab];
    const newTask = {
        id: Date.now().toString(),
        text: text,
        done: false,
        workCategory: conf.defaultWorkCat,
        systemCategory: conf.defaultSysCat,
        context: "",
        time: "",
        energy: "",
        taskGroup: "Maintenance",
        area: "",
        projectRef: "",
        goalRef: "",
        visionRef: "",
        missionRef: "",
        createdAt: new Date().toISOString()
    };

    state.tasks.unshift(newTask);
    quickAddInput.value = '';
    
    window.renderTasks();
    await saveData();
};

window.toggleTask = async function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const wasDone = task.done;
    task.done = !task.done;

    if (task.workCategory === 'Pre-defined Work' && !wasDone && task.done) {
        awardStar();
    }
    
    window.renderTasks();
    await saveData();
};

window.deleteTask = async function(taskId) {
    if (confirm("Bạn có chắc chắn muốn xóa công việc này không?")) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        window.renderTasks();
        await saveData();
    }
};

// --- Modal Chỉnh sửa chi tiết ---
window.openTaskModal = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('modal-task-id').value = task.id;
    document.getElementById('modal-task-name').value = task.text;
    document.getElementById('modal-task-workcat').value = task.workCategory;
    document.getElementById('modal-task-syscat').value = task.systemCategory;
    document.getElementById('modal-task-context').value = task.context || "";
    document.getElementById('modal-task-time').value = task.time || "";
    document.getElementById('modal-task-energy').value = task.energy || "";
    document.getElementById('modal-task-group').value = task.taskGroup || "Maintenance";
    document.getElementById('modal-task-area').value = task.area || "";
    document.getElementById('modal-task-project').value = task.projectRef || "";
    document.getElementById('modal-task-goal').value = task.goalRef || "";
    document.getElementById('modal-task-vision').value = task.visionRef || "";
    document.getElementById('modal-task-mission').value = task.missionRef || "";

    window.toggleGroupFields();
    taskModal.classList.add('show');
};

window.toggleGroupFields = function() {
    const group = document.getElementById('modal-task-group').value;
    document.getElementById('strategic-fields').style.display = group === 'Strategic' ? 'block' : 'none';
};

window.closeTaskModal = function() {
    taskModal.classList.remove('show');
};

window.saveTaskDetails = async function() {
    const id = document.getElementById('modal-task-id').value;
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.text = document.getElementById('modal-task-name').value;
    task.workCategory = document.getElementById('modal-task-workcat').value;
    task.systemCategory = document.getElementById('modal-task-syscat').value;
    task.context = document.getElementById('modal-task-context').value;
    task.time = document.getElementById('modal-task-time').value;
    task.energy = document.getElementById('modal-task-energy').value;
    task.taskGroup = document.getElementById('modal-task-group').value;
    task.area = document.getElementById('modal-task-area').value;
    task.projectRef = document.getElementById('modal-task-project').value;
    task.goalRef = document.getElementById('modal-task-goal').value;
    task.visionRef = document.getElementById('modal-task-vision').value;
    task.missionRef = document.getElementById('modal-task-mission').value;

    if (task.taskGroup === 'Maintenance') {
        task.projectRef = "";
        task.goalRef = "";
        task.visionRef = "";
        task.missionRef = "";
    }

    // Logic GTD: Nếu thêm Context/Time mà đang ở Defining -> Tự động chuyển qua Pre-defined
    if (task.workCategory === 'Defining Work' && (task.context || task.time)) {
        task.workCategory = 'Pre-defined Work';
        if (task.systemCategory === 'Inbox (Stuff)') {
            task.systemCategory = 'Next Actions';
        }
    }

    closeTaskModal();
    window.renderTasks();
    await saveData();
};

// --- Filters & Render ---
window.clearFilters = function() {
    document.getElementById('filter-context').value = "";
    document.getElementById('filter-time').value = "";
    document.getElementById('filter-energy').value = "";
    window.renderTasks();
};

window.renderTasks = function() {
    const filterContext = document.getElementById('filter-context').value;
    const filterTime = document.getElementById('filter-time').value;
    const filterEnergy = document.getElementById('filter-energy').value;

    const conf = tabConfigs[currentActiveTab];
    const expectedWorkCat = conf.defaultWorkCat;

    // Lọc theo Tab (Nếu không phải tab Hành Động) và Filter Bar
    let filteredTasks = state.tasks;
    if (currentActiveTab !== 'action') {
        filteredTasks = filteredTasks.filter(t => t.workCategory === expectedWorkCat);
    }

    if (filterContext) filteredTasks = filteredTasks.filter(t => t.context === filterContext);
    if (filterTime) filteredTasks = filteredTasks.filter(t => t.time === filterTime);
    if (filterEnergy) filteredTasks = filteredTasks.filter(t => t.energy === filterEnergy);

    if (filteredTasks.length === 0) {
        masterListEl.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-style:italic; padding:20px 0;">Không có công việc nào khớp với điều kiện lọc!</p>';
        return;
    }

    if (currentActiveTab === 'action') {
        // Render dạng bảng Excel
        masterListEl.innerHTML = `
            <div class="table-responsive">
                <table class="excel-table">
                    <thead>
                        <tr>
                            <th>Xong</th>
                            <th>Tên Hành Động</th>
                            <th>Nhóm</th>
                            <th>Lĩnh Vực</th>
                            <th>Phân Loại CV</th>
                            <th>Hệ Thống</th>
                            <th>Bối Cảnh</th>
                            <th>Thời Gian</th>
                            <th>Năng Lượng</th>
                            <th>Dự Án</th>
                            <th>Mục Tiêu</th>
                            <th>Tầm Nhìn</th>
                            <th>Sứ Mệnh</th>
                            <th>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredTasks.map(task => `
                            <tr class="${task.done ? 'done' : ''}">
                                <td class="checkbox-cell">
                                    <div class="checkbox" style="margin:0 auto;" onclick="toggleTask('${task.id}')">
                                        <i class="fa-solid fa-check"></i>
                                    </div>
                                </td>
                                <td><strong>${escapeHTML(task.text)}</strong></td>
                                <td>${escapeHTML(task.taskGroup || 'Maintenance')}</td>
                                <td>${escapeHTML(task.area || '')}</td>
                                <td>${escapeHTML(task.workCategory)}</td>
                                <td>${escapeHTML(task.systemCategory)}</td>
                                <td>${escapeHTML(task.context || '')}</td>
                                <td>${escapeHTML(task.time || '')}</td>
                                <td>${escapeHTML(task.energy || '')}</td>
                                <td>${escapeHTML(task.projectRef || '')}</td>
                                <td>${escapeHTML(task.goalRef || '')}</td>
                                <td>${escapeHTML(task.visionRef || '')}</td>
                                <td>${escapeHTML(task.missionRef || '')}</td>
                                <td class="actions-cell">
                                    <button class="btn-details" onclick="openTaskModal('${task.id}')" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                                    <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        // Render dạng Card chuẩn
        masterListEl.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.done ? 'done' : ''}">
                <div class="task-main">
                    <div class="task-info">
                        <div class="checkbox" onclick="toggleTask('${task.id}')">
                            <i class="fa-solid fa-check"></i>
                        </div>
                        <span class="task-text">${escapeHTML(task.text)}</span>
                    </div>
                    <div class="task-actions">
                        <button class="btn-details" onclick="openTaskModal('${task.id}')" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                        <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
                <div class="task-tags">
                    ${task.taskGroup ? `<span class="tag tag-sys" style="background:#dcfce3;color:#166534;"><i class="fa-solid fa-layer-group"></i> ${escapeHTML(task.taskGroup)}</span>` : ''}
                    ${task.area ? `<span class="tag tag-sys" style="background:#f3e8ff;color:#6b21a8;">${escapeHTML(task.area)}</span>` : ''}
                    ${task.systemCategory && task.systemCategory !== 'N/A' ? `<span class="tag tag-sys">${escapeHTML(task.systemCategory)}</span>` : ''}
                    ${task.projectRef ? `<span class="tag tag-sys" style="background:#e0f2fe;color:#0369a1;"><i class="fa-solid fa-rocket"></i> Dự án: ${escapeHTML(task.projectRef)}</span>` : ''}
                    ${task.goalRef ? `<span class="tag tag-sys" style="background:#ffedd5;color:#c2410c;"><i class="fa-solid fa-bullseye"></i> MT: ${escapeHTML(task.goalRef)}</span>` : ''}
                    ${task.visionRef ? `<span class="tag tag-sys" style="background:#fef08a;color:#854d0e;"><i class="fa-solid fa-eye"></i> TN: ${escapeHTML(task.visionRef)}</span>` : ''}
                    ${task.missionRef ? `<span class="tag tag-sys" style="background:#fee2e2;color:#b91c1c;"><i class="fa-solid fa-fire"></i> SM: ${escapeHTML(task.missionRef)}</span>` : ''}
                    ${task.context ? `<span class="tag tag-context">${escapeHTML(task.context)}</span>` : ''}
                    ${task.time ? `<span class="tag tag-time"><i class="fa-regular fa-clock"></i> ${escapeHTML(task.time)}</span>` : ''}
                    ${task.energy ? `<span class="tag tag-energy"><i class="fa-solid fa-bolt"></i> ${escapeHTML(task.energy)}</span>` : ''}
                </div>
            </div>
        `).join('');
    }
};

// --- Gamification ---
function awardStar() {
    state.stars += 1;
    updateStarsUI();
    showCelebration();
}
function updateStarsUI() { starCountEl.textContent = state.stars; }
function showCelebration() {
    celebrationEl.classList.add('show');
    setTimeout(() => { celebrationEl.classList.remove('show'); }, 2500);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
