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
app.get('/api/areas', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare(`SELECT * FROM Areas`).all()
  return c.json(results)
})

app.post('/api/actions', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  
  const id = `act-${Date.now()}`
  
  try {
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
