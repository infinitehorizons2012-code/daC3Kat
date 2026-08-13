import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

let migrationsRun = false;
app.use('*', async (c, next) => {
  // We run migrations lazily on first request. In production, this should be a scheduled task or deploy script.
  if (!migrationsRun) {
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS WeeklyCapacities (
            week_id TEXT PRIMARY KEY,
            capacity_hrs INTEGER NOT NULL,
            notes TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch (e) { console.error("Migration 1 error", e); }
    
    try {
      await c.env.DB.prepare(`ALTER TABLE Actions ADD COLUMN is_big_rock BOOLEAN DEFAULT 0;`).run();
    } catch (e) {}

    try {
      await c.env.DB.prepare(`ALTER TABLE Actions ADD COLUMN target_week TEXT;`).run();
    } catch (e) {}

    try {
      await c.env.DB.prepare(`ALTER TABLE WeeklyCapacities ADD COLUMN notes TEXT;`).run();
    } catch (e) {}
    
    
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS Routines (
            routine_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            session TEXT NOT NULL DEFAULT 'morning',
            day_of_week TEXT DEFAULT 'all',
            week_id TEXT,
            habit_note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch (e) { console.error("Migration Routines error", e); }

    
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS FocusSessions (
            session_id TEXT PRIMARY KEY,
            action_id TEXT,
            action_name TEXT,
            duration_mins INTEGER NOT NULL,
            session_type TEXT DEFAULT 'work',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch (e) { console.error("Migration FocusSessions error", e); }

    
    try {
      await c.env.DB.prepare(`ALTER TABLE Actions ADD COLUMN estimated_poms INTEGER DEFAULT 1;`).run();
    } catch (e) {}

    try {
      await c.env.DB.prepare(`ALTER TABLE Actions ADD COLUMN completed_poms INTEGER DEFAULT 0;`).run();
    } catch (e) {}

    
    try { await c.env.DB.prepare(`ALTER TABLE Mission ADD COLUMN notes TEXT;`).run(); } catch (e) {}
    try { await c.env.DB.prepare(`ALTER TABLE Vision ADD COLUMN notes TEXT;`).run(); } catch (e) {}
    try { await c.env.DB.prepare(`ALTER TABLE Goals ADD COLUMN notes TEXT;`).run(); } catch (e) {}

    
    try {
      // Auto seed Mission 'Vào MIT kiến tạo' and 4 Visions if not existing
      const { results: existingMissions } = await c.env.DB.prepare(`SELECT * FROM Mission WHERE statement LIKE '%MIT%'`).all();
      if (!existingMissions || existingMissions.length === 0) {
        const mId = 'mis-mit-kientao';
        await c.env.DB.prepare(`INSERT OR IGNORE INTO Mission (mission_id, statement, category, status) VALUES (?, ?, ?, ?)`).bind(mId, 'Vào MIT kiến tạo', 'Strategic', 'Active').run();

        await c.env.DB.prepare(`INSERT OR IGNORE INTO Vision (vision_id, mission_id, statement, category, status) VALUES (?, ?, ?, ?, ?)`).bind('vis-mit-academic', mId, '1. Khối Core Academic (40% - Tích lũy Tín chỉ & SAT)', 'Strategic', 'Active').run();
        await c.env.DB.prepare(`INSERT OR IGNORE INTO Vision (vision_id, mission_id, statement, category, status) VALUES (?, ?, ?, ?, ?)`).bind('vis-mit-deepwork', mId, '2. Deep Work / Dream Map (35% - Mechatronics, Python & Data Science)', 'Strategic', 'Active').run();
        await c.env.DB.prepare(`INSERT OR IGNORE INTO Vision (vision_id, mission_id, statement, category, status) VALUES (?, ?, ?, ?, ?)`).bind('vis-mit-building', mId, '3. Building & Portfolio (15% - Tạo Sản phẩm & Cold Email)', 'Strategic', 'Active').run();
        await c.env.DB.prepare(`INSERT OR IGNORE INTO Vision (vision_id, mission_id, statement, category, status) VALUES (?, ?, ?, ?, ?)`).bind('vis-mit-maintenance', mId, '4. System Maintenance (10% - Rèn luyện Thể chất & Review)', 'Strategic', 'Active').run();
      }
    } catch (e) { console.error("MIT Seed Error", e); }

    migrationsRun = true;
  }
  await next();
});


// --- ACTIONS API ---

// Lấy danh sách hành động tiếp theo dựa trên bộ lọc
app.get('/api/actions/next', async (c) => {
  const db = c.env.DB
  
  const ctxParam = c.req.query('context')
  const timeParam = parseInt(c.req.query('time') || '60')
  const energyParam = c.req.query('energy')
  
  try {
    // Ưu tiên 1: Lấy các việc đột xuất khẩn cấp chưa hoàn thành
    const { results: unplanned } = await db.prepare(`
      SELECT * FROM Actions 
      WHERE work_type = 'Unplanned Work' AND status != 'Done'
    `).all()

    if (unplanned && unplanned.length > 0) {
      return c.json({ type: 'UNPLANNED_ALERT', data: unplanned })
    }

    // Ưu tiên 2: Lọc theo Context, Time, Energy
    if (ctxParam && energyParam) {
      const { results: nextActions } = await db.prepare(`
        SELECT * FROM Actions 
        WHERE status = 'Next' 
          AND context = ? 
          AND time_needed_mins <= ? 
          AND energy_level = ?
      `).bind(ctxParam, timeParam, energyParam).all()
      
      return c.json({ type: 'MATCHED_ACTIONS', data: nextActions })
    }

    return c.json({ type: 'NO_FILTERS', message: 'Missing filters for Next Actions' }, 400)
    
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// Các API CRUD khác (Mission, Vision, Goals, Areas, Projects, Actions)

app.get('/api/stats', async (c) => {
  const db = c.env.DB
  const { results: allActions } = await db.prepare(`SELECT * FROM Actions`).all()
  const total = allActions.length
  const unplanned = allActions.filter(a => a.type === 'Unplanned').length
  const completed = allActions.filter(a => a.status === 'Completed').length
  
  return c.json({
    total,
    unplanned,
    unplannedRatio: total ? Math.round((unplanned / total) * 100) : 0,
    completed,
    completedRatio: total ? Math.round((completed / total) * 100) : 0
  })
})

app.get('/api/areas', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare(`SELECT * FROM Areas`).all()
  return c.json(results)
})

app.post('/api/areas', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = body.area_id || `area-${Date.now()}`
  
  try {
    await db.prepare(`INSERT INTO Areas (area_id, name, description, icon) VALUES (?, ?, ?, ?)`).bind(
      id, body.name, body.description || '', body.icon || '🎯'
    ).run()
    return c.json({ success: true, area_id: id }, 201)
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.patch('/api/areas/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { name, description, icon } = await c.req.json()
  try {
    await db.prepare(`UPDATE Areas SET name = ?, description = ?, icon = ? WHERE area_id = ?`).bind(name, description, icon, id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.delete('/api/areas/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  try {
    await db.prepare(`DELETE FROM Areas WHERE area_id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/projects', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare(`SELECT * FROM Projects`).all()
  return c.json(results)
})

app.post('/api/projects', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = `prj-${Date.now()}`
  
  try {
    const areaId = body.area_id || 'AREA-DEFAULT';
    
    // Ensure default area exists to satisfy foreign key
    if (areaId === 'AREA-DEFAULT') {
      await db.prepare(`INSERT OR IGNORE INTO Areas (area_id, name, description, icon) VALUES ('AREA-DEFAULT', 'Default Area', '', '🎯')`).run()
    }
    
    await db.prepare(`
      INSERT INTO Projects (project_id, area_id, name, category, status)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      id, 
      body.area_id || 'AREA-DEFAULT',
      body.name,
      body.category || 'Strategic',
      'Active'
    ).run()
    
    if (body.goal_ids && body.goal_ids.length > 0) {
      for (const gid of body.goal_ids) {
        await db.prepare(`INSERT INTO Project_Goals (project_id, goal_id) VALUES (?, ?)`).bind(id, gid).run();
      }
    }
    if (body.vision_ids && body.vision_ids.length > 0) {
      for (const vid of body.vision_ids) {
        await db.prepare(`INSERT INTO Project_Visions (project_id, vision_id) VALUES (?, ?)`).bind(id, vid).run();
      }
    }
    if (body.mission_ids && body.mission_ids.length > 0) {
      for (const mid of body.mission_ids) {
        await db.prepare(`INSERT INTO Project_Missions (project_id, mission_id) VALUES (?, ?)`).bind(id, mid).run();
      }
    }
    
    return c.json({ success: true, project_id: id }, 201)
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.patch('/api/projects/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { area_id, name, category, status, goal_ids, vision_ids, mission_ids } = await c.req.json()
  try {
    await db.prepare(`
      UPDATE Projects 
      SET area_id = ?, name = ?, category = ?, status = ?
      WHERE project_id = ?
    `).bind(
      area_id || 'AREA-DEFAULT',
      name,
      category,
      status || 'Active',
      id
    ).run()
    
    if (goal_ids !== undefined) {
      await db.prepare(`DELETE FROM Project_Goals WHERE project_id = ?`).bind(id).run();
      for (const gid of goal_ids) {
        await db.prepare(`INSERT INTO Project_Goals (project_id, goal_id) VALUES (?, ?)`).bind(id, gid).run();
      }
    }
    if (vision_ids !== undefined) {
      await db.prepare(`DELETE FROM Project_Visions WHERE project_id = ?`).bind(id).run();
      for (const vid of vision_ids) {
        await db.prepare(`INSERT INTO Project_Visions (project_id, vision_id) VALUES (?, ?)`).bind(id, vid).run();
      }
    }
    if (mission_ids !== undefined) {
      await db.prepare(`DELETE FROM Project_Missions WHERE project_id = ?`).bind(id).run();
      for (const mid of mission_ids) {
        await db.prepare(`INSERT INTO Project_Missions (project_id, mission_id) VALUES (?, ?)`).bind(id, mid).run();
      }
    }

    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.delete('/api/projects/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  try {
    await db.prepare(`DELETE FROM Project_Goals WHERE project_id = ?`).bind(id).run();
    await db.prepare(`DELETE FROM Project_Visions WHERE project_id = ?`).bind(id).run();
    await db.prepare(`DELETE FROM Project_Missions WHERE project_id = ?`).bind(id).run();
    await db.prepare(`DELETE FROM Projects WHERE project_id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/horizons', async (c) => {
  const db = c.env.DB
  const { results: missions } = await db.prepare(`SELECT * FROM Mission`).all()
  const { results: visions } = await db.prepare(`SELECT * FROM Vision`).all()
  const { results: goals } = await db.prepare(`SELECT * FROM Goals`).all()
  const { results: projects } = await db.prepare(`SELECT * FROM Projects`).all()
  
  const { results: pg } = await db.prepare(`SELECT * FROM Project_Goals`).all()
  const { results: pv } = await db.prepare(`SELECT * FROM Project_Visions`).all()
  const { results: pm } = await db.prepare(`SELECT * FROM Project_Missions`).all()
  
  projects.forEach(p => {
    p.goal_ids = pg.filter(x => x.project_id === p.project_id).map(x => x.goal_id);
    p.vision_ids = pv.filter(x => x.project_id === p.project_id).map(x => x.vision_id);
    p.mission_ids = pm.filter(x => x.project_id === p.project_id).map(x => x.mission_id);
  });
  
  return c.json({ missions, visions, goals, projects })
})

app.post('/api/missions', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = body.mission_id || `mis-${Date.now()}`
  
  try {
    await db.prepare(`INSERT INTO Mission (mission_id, statement, category, status, notes) VALUES (?, ?, ?, ?, ?)`).bind(
      id, body.statement, body.category || 'Strategic', body.status || 'Active', body.notes || null
    ).run()
    return c.json({ success: true, id })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.patch('/api/missions/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  try {
    await db.prepare(`UPDATE Mission SET statement = COALESCE(?, statement), status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE mission_id = ?`).bind(
      body.statement !== undefined ? body.statement : null,
      body.status !== undefined ? body.status : null,
      body.notes !== undefined ? body.notes : null,
      id
    ).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.delete('/api/missions/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  try {
    await db.prepare(`DELETE FROM Mission WHERE mission_id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/visions', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = body.vision_id || `vis-${Date.now()}`
  
  try {
    await db.prepare(`
      INSERT INTO Vision (vision_id, mission_id, statement, category, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, body.mission_id || null, body.statement, body.category || 'Strategic', body.status || 'Active', body.notes || null).run()
    return c.json({ success: true, id })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.patch('/api/visions/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  try {
    await db.prepare(`
      UPDATE Vision 
      SET statement = COALESCE(?, statement), 
          category = COALESCE(?, category), 
          status = COALESCE(?, status), 
          mission_id = COALESCE(?, mission_id), 
          notes = COALESCE(?, notes) 
      WHERE vision_id = ?
    `).bind(
      body.statement !== undefined ? body.statement : null,
      body.category !== undefined ? body.category : null,
      body.status !== undefined ? body.status : null,
      body.mission_id !== undefined ? body.mission_id : null,
      body.notes !== undefined ? body.notes : null,
      id
    ).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.delete('/api/visions/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  try {
    await db.prepare(`DELETE FROM Vision WHERE vision_id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/goals', async (c) => {
  const db = c.env.DB
  const id = `goal-${Date.now()}`
  const body = await c.req.json()
  
  try {
    await db.prepare(`INSERT INTO Goals (goal_id, vision_id, statement, category, status, milestone, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
      id, 
      body.vision_id || null, 
      body.statement, 
      body.category || 'Strategic', 
      body.status || 'Active', 
      body.milestone || null, 
      body.notes || null
    ).run()
    return c.json({ id, success: true }, 201)
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.patch('/api/goals/:id/status', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { status } = await c.req.json()
  
  try {
    await db.prepare(`UPDATE Goals SET status = ? WHERE goal_id = ?`).bind(status, id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.patch('/api/goals/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    const category = body.category || 'Strategic';
    const status = body.status || 'Active';
    const notes = body.notes || null;
    const milestone = body.milestone || null;
    const statement = body.statement;
    const vision_id = body.vision_id || null;

    if (body.vision_id !== undefined) {
      await db.prepare(`UPDATE Goals SET statement = ?, category = ?, status = ?, milestone = ?, vision_id = ?, notes = ? WHERE goal_id = ?`).bind(statement, category, status, milestone, vision_id, notes, id).run()
    } else {
      await db.prepare(`UPDATE Goals SET statement = ?, category = ?, status = ?, milestone = ?, notes = ? WHERE goal_id = ?`).bind(statement, category, status, milestone, notes, id).run()
    }
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.delete('/api/goals/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  try {
    await db.prepare(`DELETE FROM Goals WHERE goal_id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/actions', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare(`SELECT * FROM Actions ORDER BY created_at DESC`).all()
  return c.json(results)
})

app.post('/api/actions', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = `act-${Date.now()}`
  
  try {
    const areaId = body.area_id || 'AREA-DEFAULT';
    if (areaId === 'AREA-DEFAULT') {
      await db.prepare(`INSERT OR IGNORE INTO Areas (area_id, name, description, icon) VALUES ('AREA-DEFAULT', 'Default Area', '', '🎯')`).run()
    }
    
    await db.prepare(`
      INSERT INTO Actions (
        action_id, area_id, project_id, goal_id, vision_id, mission_id, 
        name, storage_system, assigned_to, scheduled_datetime, scheduled_end_datetime, defer_until_date, depends_on_action_id, recurrence_rule, deadline_date, 
        category, context, time_needed_mins, energy_level, work_type, reference_link, status, is_big_rock, notes, target_week, estimated_poms, completed_poms
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      areaId,
      body.project_id || null,
      body.goal_id || null,
      body.vision_id || null,
      body.mission_id || null,
      body.name,
      body.storage_system || 'Next_Actions',
      body.assigned_to || null,
      body.scheduled_datetime || null,
      body.scheduled_end_datetime || null,
      body.defer_until_date || null,
      body.depends_on_action_id || null,
      body.recurrence_rule || null,
      body.deadline_date || null,
      body.category || 'Strategic',
      body.context || null,
      body.time_needed_mins || null,
      body.energy_level || null,
      body.work_type || 'Defined Work',
      body.reference_link || '',
      body.status || 'Pending',
      body.is_big_rock ? 1 : 0,
      body.notes || null,
      body.target_week || null,
      body.estimated_poms || 1,
      body.completed_poms || 0
    ).run()
    
    return c.json({ success: true, action_id: id }, 201)
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.patch('/api/actions/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    const updates = [];
    const values = [];
    
    const fields = [
      'area_id', 'project_id', 'goal_id', 'vision_id', 'mission_id',
      'name', 'storage_system', 'assigned_to', 'scheduled_datetime', 'scheduled_end_datetime',
      'defer_until_date', 'depends_on_action_id', 'recurrence_rule', 'deadline_date',
      'category', 'context', 'time_needed_mins', 'energy_level', 'work_type', 'reference_link', 'status', 'is_big_rock', 'notes', 'target_week', 'estimated_poms', 'completed_poms'
    ];
    
    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        // Convert empty string to null to avoid SQLite FOREIGN KEY and type constraint errors
        values.push(body[field] === '' ? null : body[field]);
      }
    }
    
    if (updates.length > 0) {
      values.push(id);
      const sql = `UPDATE Actions SET ${updates.join(', ')} WHERE action_id = ?`;
      await db.prepare(sql).bind(...values).run();
    }
    
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.delete('/api/actions/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  try {
    await db.prepare(`DELETE FROM Actions WHERE action_id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})


// --- WEEKLY CAPACITIES API ---
app.get('/api/weekly-capacities', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM WeeklyCapacities').all();
  return c.json(results || []);
});

app.post('/api/weekly-capacities', async (c) => {
  const body = await c.req.json();
  const capacities = Array.isArray(body) ? body : [body];
  
  for (const cap of capacities) {
    if (!cap.week_id || cap.capacity_hrs === undefined) continue;
    
    const notesValue = cap.notes !== undefined ? cap.notes : null;
    
    const existing = await c.env.DB.prepare('SELECT * FROM WeeklyCapacities WHERE week_id = ?').bind(cap.week_id).first();
    if (existing) {
      const updateNotesStr = cap.notes !== undefined ? ', notes = ?' : '';
      const params = cap.notes !== undefined ? [cap.capacity_hrs, notesValue, cap.week_id] : [cap.capacity_hrs, cap.week_id];
      await c.env.DB.prepare(`UPDATE WeeklyCapacities SET capacity_hrs = ?${updateNotesStr}, updated_at = CURRENT_TIMESTAMP WHERE week_id = ?`)
        .bind(...params).run();
    } else {
      await c.env.DB.prepare('INSERT INTO WeeklyCapacities (week_id, capacity_hrs, notes) VALUES (?, ?, ?)')
        .bind(cap.week_id, cap.capacity_hrs, notesValue).run();
    }
  }
  return c.json({ success: true });
});


// --- ROUTINES API ---
app.get('/api/routines', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM Routines ORDER BY start_time ASC').all();
    return c.json(results || []);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});


app.post('/api/routines/copy', async (c) => {
  try {
    const { source_week_id, target_week_id } = await c.req.json();
    if (!source_week_id || !target_week_id) {
      return c.json({ error: 'source_week_id and target_week_id are required' }, 400);
    }

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM Routines WHERE week_id = ? OR week_id IS NULL OR week_id = ""'
    ).bind(source_week_id).all();

    if (!results || results.length === 0) {
      return c.json({ success: true, count: 0 });
    }

    let copyCount = 0;
    for (const r of results) {
      const newId = `ROUTINE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      await c.env.DB.prepare(`
        INSERT INTO Routines (routine_id, name, start_time, end_time, session, day_of_week, week_id, habit_note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        newId,
        r.name,
        r.start_time,
        r.end_time,
        r.session || 'morning',
        r.day_of_week || 'all',
        target_week_id,
        r.habit_note || null
      ).run();
      copyCount++;
    }

    return c.json({ success: true, count: copyCount }, 201);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/api/routines', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.routine_id || `ROUTINE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO Routines (routine_id, name, start_time, end_time, session, day_of_week, week_id, habit_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.name,
      body.start_time,
      body.end_time,
      body.session || 'morning',
      body.day_of_week || 'all',
      body.week_id || null,
      body.habit_note || null
    ).run();

    return c.json({ success: true, routine_id: id }, 201);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.patch('/api/routines/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updates = [];
    const values = [];

    const fields = ['name', 'start_time', 'end_time', 'session', 'day_of_week', 'week_id', 'habit_note'];
    for (const f of fields) {
      if (body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(body[f] === '' ? null : body[f]);
      }
    }

    if (updates.length > 0) {
      values.push(id);
      await c.env.DB.prepare(`UPDATE Routines SET ${updates.join(', ')} WHERE routine_id = ?`).bind(...values).run();
    }

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.delete('/api/routines/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM Routines WHERE routine_id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});


// --- FOCUS SESSIONS API ---
app.get('/api/focus-sessions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM FocusSessions ORDER BY created_at DESC LIMIT 100').all();
    return c.json(results || []);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/api/focus-sessions', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.session_id || `FOCUS-${Date.now()}`;
    
    await c.env.DB.prepare(`
      INSERT INTO FocusSessions (session_id, action_id, action_name, duration_mins, session_type)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      id,
      body.action_id || null,
      body.action_name || 'Học tập / Tập trung',
      body.duration_mins || 25,
      body.session_type || 'work'
    ).run();

    return c.json({ success: true, session_id: id }, 201);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

export default app
