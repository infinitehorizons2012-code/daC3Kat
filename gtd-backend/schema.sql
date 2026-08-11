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
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tab_30K_Goals
CREATE TABLE IF NOT EXISTS Goals (
    goal_id TEXT PRIMARY KEY,
    vision_id TEXT REFERENCES Vision(vision_id) ON DELETE SET NULL, -- Quy tắc 4: Cho phép NULL khi Pended/Someday
    statement TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Strategic' / 'Maintenance'
    milestone TEXT,
    status TEXT DEFAULT 'Active', -- 'Active' / 'Pended' / 'Completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tab_20K_Areas (Các Nan xe Cố định - BẮT BUỘC 100%)
CREATE TABLE IF NOT EXISTS Areas (
    area_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tab_10K_Projects (Phân loại Strategic / Maintenance)
CREATE TABLE IF NOT EXISTS Projects (
    project_id TEXT PRIMARY KEY,
    area_id TEXT NOT NULL REFERENCES Areas(area_id),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Strategic', 'Maintenance')),
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG CẦU NỐI 1: Nối 1 Dự án với NHIỀU Mục tiêu (Project_Goals)
CREATE TABLE IF NOT EXISTS Project_Goals (
    project_id TEXT REFERENCES Projects(project_id) ON DELETE CASCADE,
    goal_id TEXT REFERENCES Goals(goal_id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, goal_id)
);

-- BẢNG CẦU NỐI 2: Nối 1 Dự án với NHIỀU Tầm nhìn (Project_Visions)
CREATE TABLE IF NOT EXISTS Project_Visions (
    project_id TEXT REFERENCES Projects(project_id) ON DELETE CASCADE,
    vision_id TEXT REFERENCES Vision(vision_id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, vision_id)
);

-- BẢNG CẦU NỐI 3: Nối 1 Dự án với NHIỀU Sứ mệnh (Project_Missions)
CREATE TABLE IF NOT EXISTS Project_Missions (
    project_id TEXT REFERENCES Projects(project_id) ON DELETE CASCADE,
    mission_id TEXT REFERENCES Mission(mission_id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, mission_id)
);


-- 6. Tab_Runway_Actions (Bảng Thực thi Tích hợp 5 Hệ thống Lưu trữ)
CREATE TABLE IF NOT EXISTS Actions (
    action_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    area_id TEXT NOT NULL REFERENCES Areas(area_id),
    
    project_id TEXT REFERENCES Projects(project_id) ON DELETE SET NULL,
    goal_id TEXT REFERENCES Goals(goal_id) ON DELETE SET NULL,
    vision_id TEXT REFERENCES Vision(vision_id) ON DELETE SET NULL,
    mission_id TEXT REFERENCES Mission(mission_id) ON DELETE SET NULL,
    
    storage_system TEXT NOT NULL CHECK (
        storage_system IN (
            'Do_It_Now',
            'Next_Actions',
            'Floating_Backlog',
            'Calendar',
            'Waiting_For',
            'Deferred',
            'Someday_Maybe',
            'Project_Backlog'
        )
    ),
    assigned_to TEXT,
    scheduled_datetime DATETIME,
    scheduled_end_datetime DATETIME,
    defer_until_date DATE,
    depends_on_action_id TEXT REFERENCES Actions(action_id) ON DELETE SET NULL,
    recurrence_rule TEXT,
    deadline_date DATE,
    
    category TEXT NOT NULL CHECK (category IN ('Strategic', 'Maintenance')),
    context TEXT,
    time_needed_mins INTEGER,
    energy_level TEXT,
    work_type TEXT NOT NULL,
    
    reference_link TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
