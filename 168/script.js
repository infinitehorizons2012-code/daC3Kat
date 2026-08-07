// Cloudflare Worker API URL (User needs to replace this with their actual deployed worker URL)
// Nếu để trống, dữ liệu sẽ chỉ lưu trên máy (LocalStorage).
const CLOUDFLARE_API_URL = ''; // e.g. "https://my-worker.my-account.workers.dev"

// Khởi tạo state
let state = {
    stars: 0,
    tasks: {
        vision: [],
        project: [],
        unplanned: [],
        predefined: [],
        defining: []
    }
};

// DOM Elements
const syncStatusEl = document.getElementById('sync-status');
const starCountEl = document.getElementById('star-count');
const celebrationEl = document.getElementById('celebration');

// --- Khởi động ứng dụng ---
document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    await loadData();
    renderAllTasks();
    updateStarsUI();
});

// --- Quản lý Tab ---
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// --- Dữ liệu (Cloudflare + LocalStorage Fallback) ---
async function loadData() {
    // 1. Thử load từ LocalStorage trước để ứng dụng khởi động nhanh
    const localData = localStorage.getItem('timeManagementState');
    if (localData) {
        state = JSON.parse(localData);
    }

    // 2. Nếu có Cloudflare API, thử đồng bộ từ server
    if (CLOUDFLARE_API_URL) {
        setSyncStatus('syncing');
        try {
            const response = await fetch(`${CLOUDFLARE_API_URL}/data`);
            if (response.ok) {
                const cloudData = await response.json();
                if (cloudData && cloudData.tasks) {
                    state = cloudData;
                    saveToLocal(); // Cập nhật lại local cho khớp server
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
        // Không dùng Cloudflare
        syncStatusEl.style.display = 'none';
    }
}

async function saveData() {
    // 1. Luôn lưu LocalStorage
    saveToLocal();

    // 2. Gửi lên Cloudflare nếu có cấu hình
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
    localStorage.setItem('timeManagementState', JSON.stringify(state));
}

function setSyncStatus(status) {
    syncStatusEl.className = 'sync-status ' + status;
    if (status === 'synced') {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-cloud-check"></i>';
        syncStatusEl.title = 'Đã đồng bộ với Cloudflare';
    } else if (status === 'syncing') {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-rotate"></i>';
        syncStatusEl.title = 'Đang đồng bộ...';
    } else {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-cloud-xmark"></i>';
        syncStatusEl.title = 'Lỗi đồng bộ Cloudflare';
    }
}

// --- Xử lý Công việc (Tasks) ---
window.handleAddTask = async function(event, category) {
    event.preventDefault();
    const input = event.target.querySelector('input');
    const text = input.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now().toString(),
        text: text,
        done: false,
        createdAt: new Date().toISOString()
    };

    state.tasks[category].unshift(newTask);
    input.value = '';
    
    renderCategory(category);
    await saveData();
};

window.toggleTask = async function(categoryId, taskId) {
    const task = state.tasks[categoryId].find(t => t.id === taskId);
    if (!task) return;

    const wasDone = task.done;
    task.done = !task.done;

    // Gamification: Nếu là task "Pre-defined" và vừa được đánh dấu xong (done)
    if (categoryId === 'predefined' && !wasDone && task.done) {
        awardStar();
    }

    // Nếu un-check thì có thể trừ sao (tuỳ chọn), ở đây cho phép bé giữ sao để khuyến khích
    
    renderCategory(categoryId);
    await saveData();
};

window.deleteTask = async function(categoryId, taskId) {
    state.tasks[categoryId] = state.tasks[categoryId].filter(t => t.id !== taskId);
    renderCategory(categoryId);
    await saveData();
};

// --- Gamification ---
function awardStar() {
    state.stars += 1;
    updateStarsUI();
    showCelebration();
}

function updateStarsUI() {
    starCountEl.textContent = state.stars;
}

function showCelebration() {
    celebrationEl.classList.add('show');
    // Ẩn sau 2.5 giây
    setTimeout(() => {
        celebrationEl.classList.remove('show');
    }, 2500);
}

// --- Render UI ---
function renderAllTasks() {
    renderCategory('vision');
    renderCategory('project');
    renderCategory('unplanned');
    renderCategory('predefined');
    renderCategory('defining');
}

function renderCategory(categoryId) {
    const container = document.getElementById(`${categoryId}-list`);
    const tasks = state.tasks[categoryId] || [];

    if (tasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-style:italic; padding:20px 0;">Chưa có việc nào ở đây cả!</p>';
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="task-item ${task.done ? 'done' : ''}">
            <div class="task-info">
                <div class="checkbox" onclick="toggleTask('${categoryId}', '${task.id}')">
                    <i class="fa-solid fa-check"></i>
                </div>
                <span class="task-text">${escapeHTML(task.text)}</span>
            </div>
            <button class="delete-btn" onclick="deleteTask('${categoryId}', '${task.id}')" title="Xóa">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');
}

// Chống XSS cơ bản
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
