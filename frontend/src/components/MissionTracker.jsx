import { useState, useEffect } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

export default function MissionTracker({ token, user, ships, planets }) {
  const [missions, setMissions] = useState([])
  const [alerts, setAlerts] = useState([])
  const [shipId, setShipId] = useState('')
  const [startPlanet, setStartPlanet] = useState('')
  const [endPlanet, setEndPlanet] = useState('')
  const [error, setError] = useState('')

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { Authorization: `Bearer ${token}` }
  })

  useEffect(() => {
    api.get('/missions').then(r => setMissions(r.data))

    const socket = io('http://localhost:3000')

    socket.on('mission_alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5))
      api.get('/missions').then(r => setMissions(r.data))
    })

    socket.on('ship_positions', (positions) => {
      console.log('Ship positions updated:', positions)
    })

    return () => socket.disconnect()
  }, [])

  async function launchMission() {
    if (!shipId || !startPlanet || !endPlanet) return setError('Please fill all fields')
    if (startPlanet === endPlanet) return setError('Start and end must be different')
    setError('')
    try {
      const res = await api.post('/missions', {
        ship_id: shipId,
        start_planet: startPlanet,
        end_planet: endPlanet
      })
      setMissions(prev => [res.data, ...prev])
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to launch mission')
    }
  }

  const selectStyle = {
    width: '100%', padding: '0.5rem', borderRadius: '6px',
    border: '1px solid #333', background: '#0a0a1a', color: 'white'
  }

  const planetName = (id) => planets.find(p => p.id === id)?.name || id
  const shipName = (id) => ships.find(s => s.id === id)?.name || id

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          {alerts.map((alert, i) => (
            <div key={i} style={{ background: '#1a2e1a', border: '1px solid #00ff88', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.5rem', color: '#00ff88' }}>
              📡 {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Launch Mission */}
      {(user?.role === 'admin' || user?.role === 'pilot') && (
        <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', color: '#00d4ff' }}>🚀 Launch Mission</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Ship</label>
              <select value={shipId} onChange={e => setShipId(e.target.value)} style={selectStyle}>
                <option value=''>Select ship...</option>
                {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Origin</label>
              <select value={startPlanet} onChange={e => setStartPlanet(e.target.value)} style={selectStyle}>
                <option value=''>Select origin...</option>
                {planets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Destination</label>
              <select value={endPlanet} onChange={e => setEndPlanet(e.target.value)} style={selectStyle}>
                <option value=''>Select destination...</option>
                {planets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {error && <p style={{ color: '#ff4444', margin: '0 0 1rem' }}>{error}</p>}
          <button
            onClick={launchMission}
            style={{ padding: '0.75rem 2rem', background: '#00ff88', color: '#0a0a1a', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🚀 Launch Mission
          </button>
        </div>
      )}

      {/* Mission List */}
      <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', color: '#00d4ff' }}>📡 Active Missions</h2>
        {missions.length === 0 && <p style={{ color: '#888' }}>No missions yet.</p>}
        {missions.map(m => (
          <div key={m.id} style={{ background: '#0a0a1a', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>🚀 {shipName(m.ship_id)}</div>
              <div style={{ color: '#888', fontSize: '0.9rem' }}>
                {planetName(m.start_planet)} → {planetName(m.end_planet)}
              </div>
            </div>
            <div style={{
              padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold',
              background: m.status === 'active' ? '#1a2e1a' : '#2e1a1a',
              color: m.status === 'active' ? '#00ff88' : '#ff8800'
            }}>
              {m.status === 'active' ? '🟢 Active' : '✅ Completed'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}