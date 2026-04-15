const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Planets
app.get('/planets', async (req, res) => {
  const result = await pool.query('SELECT * FROM planets');
  res.json(result.rows);
});

app.post('/planets', async (req, res) => {
  const { name, galaxy, x, y } = req.body;
  const result = await pool.query(
    'INSERT INTO planets (name, galaxy, x, y) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, galaxy, x, y]
  );
  res.json(result.rows[0]);
});

// Ships
app.get('/ships', async (req, res) => {
  const result = await pool.query('SELECT * FROM ships');
  res.json(result.rows);
});

app.post('/ships', async (req, res) => {
  const { name, speed, fuel_capacity } = req.body;
  const result = await pool.query(
    'INSERT INTO ships (name, speed, fuel_capacity) VALUES ($1, $2, $3) RETURNING *',
    [name, speed, fuel_capacity]
  );
  res.json(result.rows[0]);
});

// Routes
app.get('/routes', async (req, res) => {
  const result = await pool.query('SELECT * FROM routes');
  res.json(result.rows);
});

app.post('/routes', async (req, res) => {
  const { origin_planet_id, destination_planet_id, distance, danger_level } = req.body;
  const result = await pool.query(
    'INSERT INTO routes (origin_planet_id, destination_planet_id, distance, danger_level) VALUES ($1, $2, $3, $4) RETURNING *',
    [origin_planet_id, destination_planet_id, distance, danger_level]
  );
  res.json(result.rows[0]);
});

// Missions
app.get('/missions', async (req, res) => {
  const result = await pool.query('SELECT * FROM missions');
  res.json(result.rows);
});

app.post('/missions', async (req, res) => {
  const { ship_id, start_planet, end_planet } = req.body;
  const result = await pool.query(
    'INSERT INTO missions (ship_id, start_planet, end_planet) VALUES ($1, $2, $3) RETURNING *',
    [ship_id, start_planet, end_planet]
  );
  res.json(result.rows[0]);
});

app.listen(3000, () => console.log('Server running on port 3000'));