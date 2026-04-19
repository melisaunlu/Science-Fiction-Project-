const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'galaxy-secret';

// ── Auth Middleware ──
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ── Dijkstra ──
function dijkstra(graph, start, end) {
  const dist = {}, prev = {}, visited = new Set();
  for (const n of Object.keys(graph)) { dist[n] = Infinity; prev[n] = null; }
  dist[start] = 0;
  const queue = new Map([[start, 0]]);
  while (queue.size > 0) {
    let u = null, minD = Infinity;
    for (const [n, d] of queue) if (d < minD) { minD = d; u = n; }
    queue.delete(u);
    if (u === end) break;
    if (visited.has(u)) continue;
    visited.add(u);
    for (const edge of (graph[u] || [])) {
      const alt = dist[u] + edge.weight;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = { node: u, edge };
        queue.set(edge.to, alt);
      }
    }
  }
  if (dist[end] === Infinity) return null;
  const path = [];
  let cur = end;
  while (cur) { path.unshift({ node: cur, edge: prev[cur]?.edge }); cur = prev[cur]?.node; }
  return { path, totalCost: dist[end] };
}

function findRoute(routes, planets, startId, endId, mode, ship) {
  const graph = {};
  for (const p of planets) graph[String(p.id)] = [];
  for (const r of routes) {
    const o = String(r.origin_planet_id), d = String(r.destination_planet_id);
    let weight;
    if (mode === 'fastest') weight = r.distance / (ship?.speed || 100);
    else if (mode === 'safest') weight = r.danger_level;
    else weight = r.distance / (ship?.fuel_efficiency || 10);
    const edge = { distance: r.distance, danger_level: r.danger_level, route_id: r.id };
    graph[o].push({ to: d, weight, ...edge });
    graph[d].push({ to: o, weight, ...edge });
  }
  const result = dijkstra(graph, String(startId), String(endId));
  if (!result) return null;
  const pm = {};
  for (const p of planets) pm[String(p.id)] = p;
  let totalDistance = 0, totalDanger = 0, hops = 0;
  for (const s of result.path) {
    if (s.edge) { totalDistance += s.edge.distance; totalDanger += s.edge.danger_level; hops++; }
  }
  return {
    mode, path: result.path.map(s => ({ planet: pm[s.node], via_route: s.edge })),
    totalDistance, avgDanger: hops ? +(totalDanger / hops).toFixed(1) : 0,
    fuelNeeded: +(totalDistance / (ship?.fuel_efficiency || 10)).toFixed(2),
    travelTime: ship ? +(totalDistance / ship.speed).toFixed(2) : null,
    hops
  };
}

// ── Auth Routes ──
app.post('/auth/register', async (req, res) => {
  const { username, password, role = 'viewer' } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1,$2,$3) RETURNING id,username,role',
      [username, hash, role]
    );
    res.json({ token: jwt.sign(r.rows[0], JWT_SECRET, { expiresIn: '24h' }), user: r.rows[0] });
  } catch (e) { res.status(409).json({ error: e.message }); }
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const r = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
  const user = r.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid credentials' });
  const { id, role } = user;
  res.json({ token: jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn: '24h' }), user: { id, username, role } });
});

// ── Planets ──
app.get('/planets', verifyToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM planets ORDER BY name');
  res.json(r.rows);
});
app.post('/planets', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, galaxy, x, y } = req.body;
  const r = await pool.query('INSERT INTO planets (name,galaxy,x,y) VALUES ($1,$2,$3,$4) RETURNING *', [name, galaxy, x, y]);
  res.json(r.rows[0]);
});

// ── Ships ──
app.get('/ships', verifyToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM ships ORDER BY name');
  res.json(r.rows);
});
app.post('/ships', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, speed, fuel_capacity, fuel_efficiency } = req.body;
  const r = await pool.query('INSERT INTO ships (name,speed,fuel_capacity,fuel_efficiency) VALUES ($1,$2,$3,$4) RETURNING *', [name, speed, fuel_capacity, fuel_efficiency]);
  res.json(r.rows[0]);
});

// ── Routes ──
app.get('/routes', verifyToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM routes');
  res.json(r.rows);
});
app.post('/routes', verifyToken, requireRole('admin'), async (req, res) => {
  const { origin_planet_id, destination_planet_id, distance, danger_level } = req.body;
  const r = await pool.query('INSERT INTO routes (origin_planet_id,destination_planet_id,distance,danger_level) VALUES ($1,$2,$3,$4) RETURNING *', [origin_planet_id, destination_planet_id, distance, danger_level]);
  res.json(r.rows[0]);
});

// ── Missions ──
app.get('/missions', verifyToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM missions ORDER BY created_at DESC');
  res.json(r.rows);
});
app.post('/missions', verifyToken, requireRole('admin', 'pilot'), async (req, res) => {
  const { ship_id, start_planet, end_planet } = req.body;
  const r = await pool.query('INSERT INTO missions (ship_id,start_planet,end_planet,status) VALUES ($1,$2,$3,$4) RETURNING *', [ship_id, start_planet, end_planet, 'active']);
  io.emit('mission_alert', { type: 'launched', message: `New mission launched!`, mission: r.rows[0] });
  res.json(r.rows[0]);
});

// ── Best Route ──
app.get('/best-route', verifyToken, async (req, res) => {
  const { start, end, mode = 'fastest', ship_id } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end required' });
  const [planets, routes] = await Promise.all([
    pool.query('SELECT * FROM planets'),
    pool.query('SELECT * FROM routes')
  ]);
  let ship = null;
  if (ship_id) { const s = await pool.query('SELECT * FROM ships WHERE id=$1', [ship_id]); ship = s.rows[0]; }
  const result = findRoute(routes.rows, planets.rows, start, end, mode, ship);
  if (!result) return res.status(404).json({ error: 'No route found' });
  res.json(result);
});

app.get('/all-routes', verifyToken, async (req, res) => {
  const { start, end, ship_id } = req.query;
  const [planets, routes] = await Promise.all([
    pool.query('SELECT * FROM planets'),
    pool.query('SELECT * FROM routes')
  ]);
  let ship = null;
  if (ship_id) { const s = await pool.query('SELECT * FROM ships WHERE id=$1', [ship_id]); ship = s.rows[0]; }
  const p = { routes: routes.rows, planets: planets.rows, startId: start, endId: end, ship };
  res.json({
    fastest: findRoute(p.routes, p.planets, start, end, 'fastest', ship),
    safest: findRoute(p.routes, p.planets, start, end, 'safest', ship),
    cheapest: findRoute(p.routes, p.planets, start, end, 'cheapest', ship),
  });
});

// ── Socket.IO ──
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('watch_mission', (id) => socket.join(`mission:${id}`));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

setInterval(async () => {
  const r = await pool.query("SELECT * FROM missions WHERE status='active'");
  io.emit('ship_positions', r.rows);
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));