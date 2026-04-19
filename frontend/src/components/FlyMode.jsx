import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function FlyMode({ planets }) {
  const mountRef = useRef()
  const keysRef = useRef({})
  const [landed, setLanded] = useState(null)
  const [nearPlanet, setNearPlanet] = useState(null)
  const [fuel, setFuel] = useState(100)
  const [speed, setSpeed] = useState(0)
  const landedRef = useRef(false)

  useEffect(() => {
    if (!planets.length) return

    const width = mountRef.current.clientWidth
    const height = 500

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020208, 0.006)

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 2, 20)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setClearColor(0x020208)
    mountRef.current.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x334466, 0.5))
    const sun = new THREE.PointLight(0xffffff, 3, 200)
    sun.position.set(0, 50, 0)
    scene.add(sun)

    const starGeo = new THREE.BufferGeometry()
    const starVerts = []
    for (let i = 0; i < 6000; i++) {
      starVerts.push((Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 })))

    const planetColors = [0x4488ff, 0xff6622, 0x44ff88, 0xffaa33, 0xaaaaff, 0xff4444]
    function getColor(planet) {
      const hash = planet.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      return planetColors[hash % planetColors.length]
    }

    const xs = planets.map(p => p.x)
    const ys = planets.map(p => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    const scaleV = (val, min, range) => ((val - min) / range) * 80 - 40

    const planetMeshes = []

    planets.forEach((p, i) => {
      const x = scaleV(p.x, minX, rangeX)
      const y = scaleV(p.y, minY, rangeY)
      const z = (i % 5) * 15 - 30
      const hash = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const radius = 3 + (hash % 4)
      const color = getColor(p)

      const group = new THREE.Group()
      group.position.set(x, y, z)

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 64, 64),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2, roughness: 0.8 })
      )
      group.add(mesh)

      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.12, 32, 32),
        new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.15, side: THREE.FrontSide })
      )
      group.add(atmo)

      if (hash % 3 === 0) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(radius * 1.5, radius * 2.2, 64),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
        )
        ring.rotation.x = Math.PI / 4
        group.add(ring)
      }

      scene.add(group)
      planetMeshes.push({ mesh, group, planet: p, radius, position: new THREE.Vector3(x, y, z) })
    })

    const shipGroup = new THREE.Group()
    const shipBody = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff6600, emissiveIntensity: 0.5 })
    )
    shipBody.rotation.x = Math.PI / 2
    shipGroup.add(shipBody)

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.1, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    )
    wings.position.z = 0.3
    shipGroup.add(wings)

    const exhaustGeo = new THREE.BufferGeometry()
    const exhaustVerts = new Float32Array(80 * 3)
    exhaustGeo.setAttribute('position', new THREE.Float32BufferAttribute(exhaustVerts, 3))
    const exhaustTrail = new THREE.Points(exhaustGeo, new THREE.PointsMaterial({ color: 0xff6600, size: 0.12, transparent: true, opacity: 0.8 }))
    scene.add(exhaustTrail)
    scene.add(shipGroup)

    const shipPos = new THREE.Vector3(0, 2, 20)
    const shipRot = new THREE.Euler(0, 0, 0, 'YXZ')
    let currentSpeed = 0
    let currentFuel = 100
    const trailHistory = []

    function onKeyDown(e) { keysRef.current[e.code] = true }
    function onKeyUp(e) { keysRef.current[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    let animId
    let elapsed = 0
    let lastTime = performance.now()

    function animate() {
      animId = requestAnimationFrame(animate)
      const now = performance.now()
      elapsed += (now - lastTime) / 1000
      lastTime = now

      if (!landedRef.current) {
        const keys = keysRef.current

        if (keys['ArrowLeft'] || keys['KeyA']) shipRot.y += 0.03
        if (keys['ArrowRight'] || keys['KeyD']) shipRot.y -= 0.03
        if (keys['ArrowUp'] || keys['KeyW']) shipRot.x = Math.max(shipRot.x - 0.02, -0.8)
        if (keys['ArrowDown'] || keys['KeyS']) shipRot.x = Math.min(shipRot.x + 0.02, 0.8)

        if (keys['Space'] && currentFuel > 0) {
          currentSpeed = Math.min(currentSpeed + 0.08, 0.8)
          currentFuel = Math.max(0, currentFuel - 0.15)
          setFuel(Math.round(currentFuel))
        } else {
          currentSpeed = Math.max(currentSpeed - 0.02, 0)
        }

        if (keys['ShiftLeft']) currentSpeed = Math.max(currentSpeed - 0.05, 0)

        setSpeed(Math.round(currentSpeed * 100))

        const direction = new THREE.Vector3(0, 0, -1)
        direction.applyEuler(shipRot)
        shipPos.addScaledVector(direction, currentSpeed)

        shipGroup.position.copy(shipPos)
        shipGroup.rotation.copy(shipRot)

        const camOffset = new THREE.Vector3(0, 1.5, 5)
        camOffset.applyEuler(shipRot)
        camera.position.copy(shipPos).add(camOffset)
        const lookTarget = shipPos.clone().add(direction.clone().multiplyScalar(10))
        camera.lookAt(lookTarget)

        trailHistory.unshift(shipPos.clone())
        if (trailHistory.length > 80) trailHistory.pop()
        const exhaustPositions = exhaustTrail.geometry.attributes.position.array
        trailHistory.forEach((p, i) => {
          exhaustPositions[i * 3] = p.x + (Math.random() - 0.5) * 0.2
          exhaustPositions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.2
          exhaustPositions[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.2
        })
        exhaustTrail.geometry.attributes.position.needsUpdate = true
        exhaustTrail.material.opacity = currentSpeed > 0 ? 0.7 + Math.sin(elapsed * 10) * 0.2 : 0

        let nearest = null
        let nearestDist = Infinity
        planetMeshes.forEach(({ planet, position, radius }) => {
          const dist = shipPos.distanceTo(position)
          if (dist < radius + 8 && dist < nearestDist) {
            nearestDist = dist
            nearest = { planet, dist, radius }
          }
        })
        setNearPlanet(nearest ? nearest.planet : null)

        if (nearest && nearest.dist < nearest.radius + 2) {
          landedRef.current = true
          setLanded(nearest.planet)
          currentSpeed = 0
        }
      }

      planetMeshes.forEach(({ group }) => { group.rotation.y += 0.003 })
      sun.intensity = 2.5 + Math.sin(elapsed * 1.5) * 0.5
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [planets])

  function handleLaunch() {
    landedRef.current = false
    setLanded(null)
    setFuel(100)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }} />

      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', padding: '1rem', borderRadius: '8px', color: 'white', fontSize: '0.85rem', minWidth: '160px' }}>
        <div style={{ color: '#00d4ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>🚀 Ship HUD</div>
        <div>Speed: <span style={{ color: '#ffaa00' }}>{speed} kms</span></div>
        <div style={{ margin: '0.5rem 0' }}>
          Fuel:
          <div style={{ background: '#333', borderRadius: '4px', height: '8px', marginTop: '4px' }}>
            <div style={{ background: fuel > 30 ? '#00ff88' : '#ff4444', width: `${fuel}%`, height: '100%', borderRadius: '4px', transition: 'width 0.3s' }} />
          </div>
        </div>
        {nearPlanet && !landed && (
          <div style={{ color: '#ffaa00', marginTop: '0.5rem' }}>
            📡 Near: {nearPlanet.name}<br />
            <span style={{ color: '#888', fontSize: '0.75rem' }}>Fly closer to land</span>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', padding: '0.75rem', borderRadius: '8px', color: '#888', fontSize: '0.75rem' }}>
        WASD / Arrows: Steer &nbsp;|&nbsp; Space: Thrust &nbsp;|&nbsp; Shift: Brake
      </div>

      {landed && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪐</div>
          <h2 style={{ color: '#00d4ff', margin: '0 0 0.5rem' }}>Landed on {landed.name}</h2>
          <p style={{ color: '#888', margin: '0 0 0.5rem' }}>Galaxy: {landed.galaxy}</p>
          <p style={{ color: '#888', margin: '0 0 2rem' }}>Coordinates: ({landed.x}, {landed.y})</p>
          <button
            onClick={handleLaunch}
            style={{ padding: '0.75rem 2rem', background: '#ffaa00', color: '#0a0a1a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
          >
            🚀 Launch Back Into Space
          </button>
        </div>
      )}

      {fuel === 0 && !landed && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(255,0,0,0.2)', border: '1px solid #ff4444', padding: '1rem 2rem', borderRadius: '8px', color: '#ff4444', fontWeight: 'bold', textAlign: 'center' }}>
          ⚠️ OUT OF FUEL<br />
          <span style={{ fontSize: '0.8rem', color: '#888' }}>You are drifting...</span>
        </div>
      )}
    </div>
  )
}