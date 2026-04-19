import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function GalaxyMap({ planets, routes }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!planets.length) return

    const width = 800, height = 500
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background', '#050510')
      .style('borderRadius', '12px')

    // Stars background
    for (let i = 0; i < 200; i++) {
      svg.append('circle')
        .attr('cx', Math.random() * width)
        .attr('cy', Math.random() * height)
        .attr('r', Math.random() * 1.5)
        .attr('fill', 'white')
        .attr('opacity', Math.random())
    }

    // Scale planets to fit
    const xExtent = d3.extent(planets, d => d.x)
    const yExtent = d3.extent(planets, d => d.y)
    const xScale = d3.scaleLinear().domain(xExtent).range([60, width - 60])
    const yScale = d3.scaleLinear().domain(yExtent).range([60, height - 60])

    const planetMap = {}
    planets.forEach(p => { planetMap[p.id] = p })

    // Draw routes
    routes.forEach(r => {
      const origin = planetMap[r.origin_planet_id]
      const dest = planetMap[r.destination_planet_id]
      if (!origin || !dest) return

      svg.append('line')
        .attr('x1', xScale(origin.x)).attr('y1', yScale(origin.y))
        .attr('x2', xScale(dest.x)).attr('y2', yScale(dest.y))
        .attr('stroke', `hsl(${(10 - r.danger_level) * 12}, 80%, 50%)`)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 3')
        .attr('opacity', 0.6)
    })

    // Draw planets
    const planetGroups = svg.selectAll('.planet')
      .data(planets)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${xScale(d.x)}, ${yScale(d.y)})`)

    planetGroups.append('circle')
      .attr('r', 14)
      .attr('fill', (d, i) => d3.schemeTableau10[i % 10])
      .attr('stroke', '#00d4ff')
      .attr('stroke-width', 2)

    planetGroups.append('text')
      .text(d => d.name)
      .attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '11px')

    // Animated ship
    if (routes.length > 0) {
      const r = routes[0]
      const origin = planetMap[r.origin_planet_id]
      const dest = planetMap[r.destination_planet_id]
      if (origin && dest) {
        const ship = svg.append('text')
          .text('🚀')
          .attr('font-size', '16px')
          .attr('x', xScale(origin.x))
          .attr('y', yScale(origin.y))

        function animate() {
          ship.transition().duration(4000).ease(d3.easeLinear)
            .attr('x', xScale(dest.x)).attr('y', yScale(dest.y))
            .on('end', () => {
              ship.attr('x', xScale(origin.x)).attr('y', yScale(origin.y))
              animate()
            })
        }
        animate()
      }
    }

  }, [planets, routes])

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg ref={svgRef} />
    </div>
  )
}