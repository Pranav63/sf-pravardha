import { useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import './Corridors.css'

const perspectives = [
  {
    name: 'The GCC', short: 'GCC', code: '01', label: 'Regional roots. A wider outlook.',
    text: 'A Gulf-based perspective on corporate structuring, cross-border trade and business expansion. Built around the commercial context of your next move.',
    point: [349, 179], camera: { x: 15, y: 4, scale: 1 },
    focus: 'CORPORATE STRUCTURING · TRADE ADVISORY',
  },
  {
    name: 'India', short: 'India', code: '02', label: 'Relationships that cross borders.',
    text: 'Long-standing commercial and strategic advisory experience in India informs a considered approach to opportunities connecting South Asia and the Gulf.',
    point: [433, 206], camera: { x: -22, y: -10, scale: 1.16 },
    focus: 'COMMERCIAL STRATEGY · CROSS-BORDER GROWTH',
  },
  {
    name: 'Southeast Asia', short: 'SEA', code: '03', label: 'An international point of view.',
    text: 'Experience developing trade finance opportunities across Southeast Asia brings an international perspective to working capital, commercial relationships and business growth.',
    point: [560, 275], camera: { x: -100, y: -28, scale: 1.2 },
    focus: 'TRADE FINANCE · WORKING CAPITAL',
  },
]

const routes = ['M349 179 Q395 91 433 206', 'M349 179 Q507 71 560 275', 'M433 206 Q520 176 560 275']

// An original, simplified geographic drawing; points are longitude and latitude.
const land = [
  [[-10,36],[-9,43],[-2,44],[0,49],[8,54],[9,58],[5,59],[7,62],[20,70],[29,71],[32,65],[42,67],[55,70],[70,72],[93,77],[111,75],[130,68],[143,61],[140,54],[135,48],[130,42],[126,40],[129,35],[126,34],[122,39],[120,37],[121,31],[119,25],[113,22],[109,21],[106,18],[108,13],[109,11],[105,9],[103,10],[101,14],[100,13],[100,7],[104,2],[103,1],[100,4],[98,9],[98,16],[94,18],[92,22],[90,22],[87,21],[85,18],[81,15],[80,10],[77,8],[75,13],[73,17],[72,21],[68,23],[67,25],[61,25],[57,25],[54,27],[51,29],[48,30],[50,26],[54,25],[57,22],[55,18],[51,15],[48,13],[43,13],[41,17],[39,21],[36,28],[34,29],[36,33],[36,36],[30,36],[27,38],[26,41],[23,40],[24,37],[21,37],[19,41],[18,40],[16,38],[15,38],[16,41],[12,44],[9,44],[7,43],[4,43],[2,41],[-1,39],[-5,36]],
  [[-17,21],[-17,28],[-12,29],[-9,33],[-6,36],[2,37],[10,37],[11,33],[20,32],[25,32],[32,31],[34,28],[36,23],[38,18],[43,12],[51,12],[49,8],[44,2],[41,-2],[40,-10],[36,-18],[35,-23],[32,-26],[31,-30],[26,-34],[19,-35],[17,-29],[14,-22],[12,-17],[13,-8],[10,-2],[9,4],[5,5],[1,5],[-5,5],[-10,7],[-15,11],[-17,16]],
  [[-8,50],[-5,50],[-3,54],[-2,57],[-5,59],[-7,57],[-6,54]],
  [[-10,51],[-7,52],[-6,55],[-8,56],[-10,54]],
  [[80,9],[82,7],[81,6],[80,7]],
  [[96,5],[100,1],[105,-5],[104,-6],[100,-3],[96,2]],
  [[106,-6],[114,-7],[115,-9],[109,-8]],
  [[109,2],[113,4],[117,7],[119,5],[118,0],[115,-4],[110,-3]],
  [[121,19],[123,17],[123,14],[120,14]],
  [[122,12],[125,12],[126,7],[124,6],[122,9]],
  [[130,32],[134,34],[137,36],[140,40],[142,43],[141,39],[137,34],[132,31]],
  [[47,-13],[50,-15],[49,-23],[45,-26],[44,-21]],
]
const outlines = land.map((points) => points.map(([longitude, latitude], i) => `${i ? 'L' : 'M'}${((longitude + 25) * 4.35).toFixed(1)},${((60 - latitude) * 4 + 40).toFixed(1)}`).join(' ') + 'Z')

export default function Corridors({ reducedMotion }: { reducedMotion?: boolean }) {
  const [selected, setSelected] = useState(0)
  const section = useRef<HTMLElement>(null)
  const inView = useInView(section, { amount: 0.15 })
  const systemReducedMotion = useReducedMotion()
  const quiet = reducedMotion ?? !!systemReducedMotion
  const running = inView && !quiet
  const { scrollYProgress } = useScroll({ target: section, offset: ['start end', 'center center'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1])
  const rotateX = useTransform(scrollYProgress, [0, 1], [17, 0])
  const y = useTransform(scrollYProgress, [0, 1], [100, 0])
  const perspective = perspectives[selected]
  const transition = { duration: quiet ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <section ref={section} className="corridor-section" id="perspective" aria-labelledby="corridor-title" data-motion={running ? 'running' : 'paused'}>
      <div className="corridor-topline"><span>02 / A wider perspective</span></div>
      <div className="corridor-heading">
        <h2 id="corridor-title">Opportunity has<br /><em>no borders.</em></h2>
        <p>Rooted in the Gulf. Connected to the commercial possibilities beyond it.<span>Explore the perspectives behind our advice.</span></p>
      </div>
      <motion.div className="corridor-atlas" data-testid="route-map" data-region={perspective.short} style={quiet ? undefined : { scale, rotateX, y }}>
        <div className="corridor-atlas-glow" aria-hidden="true" />
        <div className="corridor-atlas-top">
          <div className="corridor-atlas-kicker"><span className="corridor-status-dot" />A CONNECTED OUTLOOK</div>
          <div className="corridor-controls" role="group" aria-label="Explore our regional perspective">
            {perspectives.map((item, index) => (
              <button key={item.name} type="button" className="corridor-control" aria-pressed={selected === index} onClick={() => setSelected(index)}>
                {selected === index && <motion.span className="corridor-control-active" layoutId="atlas-active-region" transition={transition} />}
                <span>{item.short}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="corridor-region-title" aria-hidden="true">
          <span>PERSPECTIVE / {perspective.code}</span>
          <motion.p key={selected} initial={quiet ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={transition}>{perspective.name}</motion.p>
        </div>
        <div className="corridor-geography">
          <svg className="corridor-map" viewBox="200 40 440 320" aria-label="Explore our commercial perspective across the GCC, India and Southeast Asia" role="group">
            <defs>
              <pattern id="corridor-dots" width="4.8" height="4.8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.05" fill="#96bba6" /></pattern>
              <clipPath id="corridor-land">{outlines.map((d, i) => <path d={d} key={i} />)}</clipPath>
              <radialGradient id="corridor-map-glow"><stop stopColor="#a0d1b1" stopOpacity=".22" /><stop offset="1" stopColor="#a0d1b1" stopOpacity="0" /></radialGradient>
              <linearGradient id="corridor-route-light" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b7bc91" /><stop offset=".5" stopColor="#fff3c9" /><stop offset="1" stopColor="#c2a975" /></linearGradient>
              <filter id="corridor-route-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.5" /></filter>
            </defs>
            <motion.g data-testid="route-camera" animate={perspective.camera} initial={false} transition={transition} style={{ transformOrigin: '400px 230px' }}>
              <circle cx="415" cy="210" r="220" fill="url(#corridor-map-glow)" />
              <g className="corridor-grid" fill="none">{[80, 160, 240, 320, 400].map(row => <path key={row} d={`M20 ${row}H740`} />)}{[100, 180, 260, 340, 420, 500, 580, 660].map(col => <path key={col} d={`M${col} -20V450`} />)}</g>
              <g className="corridor-orbits" fill="none"><ellipse cx="410" cy="220" rx="245" ry="165" /><ellipse cx="410" cy="220" rx="190" ry="126" /><ellipse cx="410" cy="220" rx="290" ry="200" /></g>
              <rect x="0" y="-60" width="760" height="530" fill="url(#corridor-dots)" clipPath="url(#corridor-land)" opacity=".66" />
              <g className="corridor-route-lines" fill="none">
                {routes.map((route, index) => <path key={`glow-${index}`} d={route} stroke="#e4d49e" strokeWidth="4" opacity=".17" filter="url(#corridor-route-glow)" />)}
                {routes.map((route, index) => <motion.path key={route} d={route} stroke="url(#corridor-route-light)" initial={{ pathLength: quiet ? 1 : 0 }} animate={{ strokeWidth: index === selected - 1 || selected === 0 ? 1.3 : 0.75, pathLength: inView || quiet ? 1 : 0, opacity: selected === 0 || index === selected - 1 ? 0.95 : 0.35 }} transition={transition} />)}
              </g>
              {running && routes.map((route, index) => <g key={`traveler-${index}`} aria-hidden="true"><circle r="4" fill="#f4dfaa" opacity=".7" filter="url(#corridor-route-glow)"><animateMotion dur={`${4 + index}s`} repeatCount="indefinite" path={route} /></circle><circle r="2" fill="#fff9dc"><animateMotion dur={`${4 + index}s`} repeatCount="indefinite" path={route} /></circle></g>)}
              {perspectives.map((item, index) => (
                <g key={item.name} className={`corridor-location${selected === index ? ' corridor-location-selected' : ''}`} transform={`translate(${item.point.join(' ')})`} role="button" tabIndex={0} aria-label={`Explore ${item.name}`} aria-pressed={selected === index} onClick={() => setSelected(index)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(index) } }}>
                  <circle r="20" fill="transparent" />
                  <circle className="corridor-location-pulse" r="15" fill="none" stroke="#dbcca1" strokeWidth=".65" />
                  <circle className="corridor-location-halo" r="10" fill="#d6c596" fillOpacity=".09" stroke="#e9d5a4" strokeWidth=".5" />
                  <circle r="3" fill="#f8e7bb" />
                  <text className="corridor-map-label" x="0" y={index === 0 ? 32 : 30} textAnchor="middle">{index === 0 ? 'THE GULF' : item.short.toUpperCase()}</text>
                </g>
              ))}
            </motion.g>
          </svg>
        </div>
        <div className="corridor-atlas-bottom">
          <div className="corridor-detail" aria-live="polite" aria-atomic="true">
            {perspectives.map((item, index) => (
              <motion.div key={item.name} aria-hidden={selected !== index} initial={false} animate={{ opacity: selected === index ? 1 : 0, y: quiet || selected === index ? 0 : 8 }} transition={transition}>
                <span className="corridor-detail-label">THE PERSPECTIVE</span>
                <h3>{item.label}</h3>
                <p>{item.text}</p>
                <span className="corridor-detail-focus">{item.focus}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
