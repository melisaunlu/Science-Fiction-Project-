import { useState } from 'react'
import axios from 'axios'

export default function RouteFinder({ planets, ships, token }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [shipId, setShipId] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function findRoutes() {
    if (!start || !end) return setError('Please select start and destination planets')
    if (start === end) return setError('Start and destination must be different')
    setError('')
    setLoading(true)
    try {
      const res = await axios.get('http://localhost:3000/all-routes', {
        params: { start, end, ship_id: shipId || undefined },
        headers: { Authorization: `Bearer ${token}` }
      })
      setResults(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'No route found')
    }
    setLoading(false)
  }

  const selectStyle = {
    width: '100%', padding: '0.5rem', borderRadius: '6px',
    border: '1px solid #333', background: '#0a0a1a', color: 'white'
  }

  function RouteCard({ route, color, icon, label }) {
    if (!route) return null
    return (
      <div style={{ background: '#1a1a2e', borderRadius: '10px', padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
        <h3 style={{ color, margin: '0 0 1rem' }}>{icon} {label} Route</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Distance', value: `${route.totalDistance} ly` },
            { label: 'Avg Danger', value: `${route.avgDanger}/10` },
            { label: 'Fuel Needed', value: `${route.fuelNeeded} units` },
            { label: 'Travel Time', value: route.travelTime ? `${route.travelTime} hrs` : 'N/A' },
            { label: 'Hops', value: route.hops },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#0a0a1a', padding: '0.5rem 1rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '0.75rem' }}>{stat.label}</div>
              <div style={{ color, fontWeight: 'bold' }}>{stat.value}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ color: '#888', marginBottom: '0.5rem' }}>Path:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {route.path.map((step, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: '#0a0a1a', padding: '0.25rem 0.75rem', borderRadius: '20px', color: 'white' }}>
                  🪐 {step.planet?.name}
                </span>
                {i < route.path.length - 1 && <span style={{ color: '#444' }}>→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', color: '#00d4ff' }}>🛸 Route Finder</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Origin Planet</label>
            <select value={start} onChange={e => setStart(e.target.value)} style={selectStyle}>
              <option value=''>Select origin...</option>
              {planets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Destination Planet</label>
            <select value={end} onChange={e => setEnd(e.target.value)} style={selectStyle}>
              <option value=''>Select destination...</option>
              {planets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Ship (optional)</label>
            <select value={shipId} onChange={e => setShipId(e.target.value)} style={selectStyle}>
              <option value=''>Select ship...</option>
              {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        {error && <p style={{ color: '#ff4444', margin: '0 0 1rem' }}>{error}</p>}
        <button
          onClick={findRoutes}
          disabled={loading}
          style={{ padding: '0.75rem 2rem', background: '#00d4ff', color: '#0a0a1a', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
        >
          {loading ? 'Calculating...' : '🔍 Find Best Routes'}
        </button>
      </div>

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <RouteCard route={results.fastest} color='#00d4ff' icon='⚡' label='Fastest' />
          <RouteCard route={results.safest} color='#00ff88' icon='🛡' label='Safest' />
          <RouteCard route={results.cheapest} color='#ffaa00' icon='💰' label='Cheapest' />
        </div>
      )}
    </div>
  )
}