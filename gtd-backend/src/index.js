import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

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
      await db.prepare(`INSERT OR IGNORE INTO Areas (area_id, name, type) VALUES ('AREA-DEFAULT', 'Default Area', 'Maintenance')`).run()
    }
    
    await db.prepare(`
      INSERT INTO Projects (project_id, area_id, goal_id, vision_id, name, category, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      body.area_id || 'AREA-DEFAULT',
      body.goal_id || null,
      body.vision_id || null,
      body.name,
      body.category || 'Strategic',
      'Active'
    ).run()
    return c.json({ success: true, project_id: id }, 201)
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/horizons', async (c) => {
  const db = c.env.DB
  // Fetch missions, visions, goals, and projects (to check if goals have projects)
  const { results: missions } = await db.prepare(`SELECT * FROM Mission`).all()
  const { results: visions } = await db.prepare(`SELECT * FROM Vision`).all()
  const { results: goals } = await db.prepare(`SELECT * FROM Goals`).all()
  const { results: projects } = await db.prepare(`SELECT * FROM Projects`).all()
  return c.json({ missions, visions, goals, projects })
})

app.post('/api/missions', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = `mis-${Date.now()}`
  
  try {
    await db.prepare(`INSERT INTO Mission (mission_id, statement) VALUES (?, ?)`).bind(id, body.statement).run()
    return c.json({ success: true, id })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.patch('/api/missions/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { statement, status } = await c.req.json()
  try {
    await db.prepare(`UPDATE Mission SET statement = ?, status = ? WHERE mission_id = ?`).bind(statement, status, id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.delete('/api/missions/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  try {
    // Delete mission, cascading normally handled by foreign keys or manually here
    await db.prepare(`DELETE FROM Mission WHERE mission_id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/visions', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = `vis-${Date.now()}`
  
  try {
    await db.prepare(`
      INSERT INTO Vision (vision_id, mission_id, statement, category)
      VALUES (?, ?, ?, ?)
    `).bind(id, body.mission_id, body.statement, body.category || 'Strategic').run()
    return c.json({ success: true, id })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.patch('/api/visions/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { statement, category, status, mission_id } = await c.req.json()
  try {
    if (mission_id !== undefined) {
      await db.prepare(`UPDATE Vision SET statement = ?, category = ?, status = ?, mission_id = ? WHERE vision_id = ?`).bind(statement, category, status, mission_id, id).run()
    } else {
      await db.prepare(`UPDATE Vision SET statement = ?, category = ?, status = ? WHERE vision_id = ?`).bind(statement, category, status, id).run()
    }
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
  const { vision_id, statement, category, status, milestone } = await c.req.json()
  
  try {
    await db.prepare(`INSERT INTO Goals (goal_id, vision_id, statement, category, status, milestone) VALUES (?, ?, ?, ?, ?, ?)`).bind(id, vision_id || null, statement, category, status || 'Active', milestone || null).run()
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
    if (body.vision_id !== undefined) {
      await db.prepare(`UPDATE Goals SET statement = ?, category = ?, status = ?, milestone = ?, vision_id = ? WHERE goal_id = ?`).bind(body.statement, body.category, body.status, body.milestone || null, body.vision_id, id).run()
    } else {
      await db.prepare(`UPDATE Goals SET statement = ?, category = ?, status = ?, milestone = ? WHERE goal_id = ?`).bind(body.statement, body.category, body.status, body.milestone || null, id).run()
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

app.post('/api/actions', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  
  const id = `act-${Date.now()}`
  
  try {
    // Ensure default area exists to satisfy foreign key
    if (body.area_id === 'AREA-DEFAULT') {
      await db.prepare(`INSERT OR IGNORE INTO Areas (area_id, name, type) VALUES ('AREA-DEFAULT', 'Default Area', 'Maintenance')`).run()
    }
    
    await db.prepare(`
      INSERT INTO Actions (action_id, area_id, project_id, name, context, time_needed_mins, energy_level, work_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      body.area_id, 
      body.project_id || null, 
      body.name, 
      body.context || 'None', 
      body.time_needed_mins || 15, 
      body.energy_level || 'Medium', 
      body.work_type || 'Defined Work'
    ).run()
    
    return c.json({ success: true, action_id: id }, 201)
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

// Cập nhật trạng thái Action
app.patch('/api/actions/:id/status', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { status } = await c.req.json()
  
  try {
    await db.prepare(`UPDATE Actions SET status = ? WHERE action_id = ?`).bind(status, id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

export default app
