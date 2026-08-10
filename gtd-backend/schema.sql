-- 1. Tab_50K_Mission (Bắt buộc 1-2 dòng)
CREATE TABLE IF NOT EXISTS Mission (
    mission_id TEXT PRIMARY KEY,
    statement TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tab_40K_Vision
CREATE TABLE IF NOT EXISTS Vision (
    vision_id TEXT PRIMARY KEY,
    mission_id TEXT REFERENCES Mission(mission_id),
    statement TEXT NOT NULL,
    category TEXT DEFAULT 'Strategic', -- 'Strategic' / 'Maintenance'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tab_30K_Goals
CREATE TABLE IF NOT EXISTS Goals (
    goal_id TEXT PRIMARY KEY,
    vision_id TEXT REFERENCES Vision(vision_id) ON DELETE SET NULL, -- Quy tắc 4: Cho phép NULL khi Pended/Someday
    statement TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Strategic' / 'Maintenance'
    status TEXT DEFAULT 'Active', -- 'Active' / 'Pended' / 'Completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tab_20K_Areas (BẮT BUỘC 100%)
CREATE TABLE IF NOT EXISTS Areas (
    area_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Strategic' / 'Maintenance'
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tab_10K_Projects (Xử lý linh hoạt)
CREATE TABLE IF NOT EXISTS Projects (
    project_id TEXT PRIMARY KEY,
    area_id TEXT NOT NULL REFERENCES Areas(area_id), -- Quy tắc 1: BẮT BUỘC NOT NULL
    goal_id TEXT REFERENCES Goals(goal_id) ON DELETE SET NULL, -- Quy tắc 3 & 4: Cho phép NULL
    vision_id TEXT REFERENCES Vision(vision_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'Active', -- 'Active' / 'On-Hold' / 'Completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tab_Runway_Actions (Bảng Thực thi Chuẩn)
CREATE TABLE IF NOT EXISTS Actions (
    action_id TEXT PRIMARY KEY,
    area_id TEXT NOT NULL REFERENCES Areas(area_id), -- BẮT BUỘC NOT NULL
    project_id TEXT REFERENCES Projects(project_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    
    -- Context & Filter Attributes (Bắt buộc cho Next Actions)
    context TEXT NOT NULL, -- '@Máy_tính', '@Bàn_học', '@Điện_thoại'...
    time_needed_mins INTEGER NOT NULL, -- 15, 30, 60, 90...
    energy_level TEXT NOT NULL, -- 'High', 'Medium', 'Low'
    
    -- GTD 3 Types of Work
    work_type TEXT NOT NULL, -- 'Defined Work', 'Defining Work', 'Unplanned Work'
    
    -- System Archive (Reference Link)
    reference_link TEXT,
    
    status TEXT DEFAULT 'Next', -- 'Next', 'Waiting', 'Done'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
