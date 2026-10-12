import { useEffect, useRef, useState } from 'react'
import { AgentScene } from './AgentScene'
import { FutureScene } from './FutureScene'
import { HarnessScene } from './HarnessScene'
import { MultiScene } from './MultiScene'
import { VectorScene } from './VectorScene'
import './evolution.css'

/** Scroll-driven story on the home page: language model → LLM → chatbot → harness → agent → multi-agent → what's next. */

const STAGES = [
  {
    short: 'LM',
    year: '2000s',
    when: '2000s–2010s',
    title: 'Language model',
    body: 'It does one thing: guess the next word. During training it builds a map of word meanings, where words used in similar ways sit close together. When a sentence comes in, the model places it on that map and picks a word from nearby.',
  },
  {
    short: 'LLM',
    year: '2018',
    when: '2018–2020',
    title: 'Large language model',
    body: 'Scale the same trick up to billions of parameters and trillions of words of text. Guessing the next word that well starts to look like knowledge, grammar, and reasoning.',
  },
  {
    short: 'Chatbot',
    year: '2022',
    when: '2022',
    title: 'Chatbot',
    body: 'Wrap the model in a conversation. A system prompt and the chat history go in with every message, so it can answer questions and follow up, but it can only talk.',
  },
  {
    short: 'Harness',
    year: '2023',
    when: '2023–24',
    title: 'Harness',
    body: 'On its own, a model can only produce text. The harness is the software wrapped around it: tools it can call, memory and databases, connections to other apps, a sandbox to run code safely, and rules for what it may do without asking. A model plus a harness is an agent.',
  },
  {
    short: 'Agent',
    year: '2024',
    when: '2024–25',
    title: 'Agent',
    body: 'Now put the harness to work. Given a task, the model runs in a loop: it thinks about what it needs, calls a tool, reads the result, and goes around again until it can answer.',
  },
  {
    short: 'Multi-agent',
    year: '2025',
    when: '2025–',
    title: 'Multi-agent system',
    body: 'Some jobs are too big for one agent. A lead agent splits the work, hands each piece to a sub-agent with its own tools and context, lets them run in parallel, and combines what they send back.',
  },
  {
    short: 'Next?',
    year: '2026+',
    when: '2026 and beyond',
    title: 'What’s next?',
    body: 'Nobody knows for sure, but the direction is visible: agents that run for days instead of minutes, learn skills as they go, work with other companies’ agents, and check in with people only for the decisions that matter. Every step so far added a layer around the same next-word predictor. The next one is time and trust.',
  },
]

const LAST = STAGES.length - 1
const MULTI = 5
const CX = 240
const CY = 200

// Where the model sits, and how big it is, at each stage.
const CORE = [
  { x: 300, y: 42, r: 26 },
  { x: CX, y: CY, r: 112 },
  { x: 108, y: CY, r: 46 },
  { x: CX, y: 200, r: 36 },
  { x: 112, y: 214, r: 42 },
  { x: CX, y: 128, r: 30 },
  { x: 180, y: 180, r: 30 },
]
const CORE_LABEL = ['LM', 'LLM', 'LLM', 'LLM', 'LLM', 'LEAD', 'TEAM']

const SUBAGENTS = [
  { x: 96, y: 272, label: 'Tokyo' },
  { x: CX, y: 292, label: 'Paris' },
  { x: 384, y: 272, label: 'Rome' },
]

// A small fully connected network, drawn at radius 100 and scaled with the model.
const NET_COLS = [-66, -33, 0, 33, 66].map((x, i) => {
  const n = [3, 5, 6, 5, 3][i]
  return Array.from({ length: n }, (_, j) => ({ x, y: (j - (n - 1) / 2) * 24 }))
})
const NET_EDGES = NET_COLS.slice(1).flatMap((col, i) =>
  col.flatMap((b) => NET_COLS[i].map((a) => ({ a, b }))),
)

const SOURCES = [
  { label: 'books', x: 46, y: 64 },
  { label: 'web pages', x: 434, y: 64 },
  { label: 'code', x: 46, y: 340 },
  { label: 'papers', x: 434, y: 340 },
]

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (v: number) => v * v * (3 - 2 * v)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Turns raw scroll position (0…LAST) into an eased stage value that rests on each stage before moving on. */
function easeStage(p: number) {
  const i = Math.min(Math.floor(p), LAST - 1)
  const f = p - i
  return i + smooth(clamp01((f - 0.5) / 0.5))
}

export function Evolution() {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<SVGGElement>(null)
  const layerRefs = useRef<(SVGGElement | null)[]>([])
  const subRefs = useRef<(SVGGElement | null)[]>([])
  const subsRef = useRef<SVGGElement>(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const track = trackRef.current!
      const rect = track.getBoundingClientRect()
      const span = track.offsetHeight - window.innerHeight
      const progress = span > 0 ? clamp01(-rect.top / span) : 0
      // A little dwell at both ends, so the first and last stage can be read before anything moves.
      const p = Math.min(LAST, Math.max(0, progress * (LAST + 0.6) - 0.25))
      const e = easeStage(p)

      // Each transition runs in three beats, so a picture is never on screen while the model is out of place:
      // the old picture fades out, then the model moves, then the new picture fades in.
      const i = Math.min(Math.floor(e), LAST - 1)
      const t = e - i
      const fadeOut = 1 - smooth(clamp01(t / 0.3))
      const move = smooth(clamp01((t - 0.3) / 0.4))
      const fadeIn = smooth(clamp01((t - 0.7) / 0.3))
      const a = CORE[i]
      const b = CORE[i + 1]
      const r = lerp(a.r, b.r, move)
      const x = lerp(a.x, b.x, move)
      const y = lerp(a.y, b.y, move)
      coreRef.current?.setAttribute('transform', `translate(${x} ${y})`)
      coreRef.current?.style.setProperty('--s', String(r / 100))

      layerRefs.current.forEach((el, j) => {
        if (!el) return
        const o = j === i ? fadeOut : j === i + 1 ? fadeIn : 0
        el.style.opacity = String(o)
        el.style.visibility = o === 0 ? 'hidden' : 'visible'
      })

      // Sub-agents split off from the agent while it moves into the lead position, and leave with the multi-agent picture.
      const splitting = i === MULTI - 1
      const k = splitting ? move : 1
      const subsO = splitting ? smooth(clamp01(t / 0.3)) : i === MULTI ? fadeOut : 0
      const subs = subsRef.current
      if (subs) {
        subs.style.opacity = String(subsO)
        subs.style.visibility = subsO > 0 ? 'visible' : 'hidden'
      }
      subRefs.current.forEach((el, j) => {
        if (!el) return
        const s = SUBAGENTS[j]
        el.setAttribute('transform', `translate(${lerp(CORE[MULTI - 1].x, s.x, k)} ${lerp(CORE[MULTI - 1].y, s.y, k)}) scale(${lerp(0.4, 1, k)})`)
      })

      rootRef.current?.style.setProperty('--progress', String(p / LAST))
      setActive(t < 0.5 ? i : i + 1)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const goTo = (j: number) => {
    const track = trackRef.current!
    const span = track.offsetHeight - window.innerHeight
    // Inverse of the mapping in update(), landing in the middle of the stage's resting zone.
    const progress = (j + 0.25 + (j === LAST ? 0 : 0.2)) / (LAST + 0.6)
    window.scrollTo({ top: track.offsetTop + progress * span })
  }

  const layer = (j: number) => ({
    ref: (el: SVGGElement | null) => {
      layerRefs.current[j] = el
    },
    className: `evo-layer${active === j ? ' on' : ''}`,
  })

  return (
    <section id="evolution" className="evo" ref={trackRef} aria-label="How language models became agents">
      <div className="evo-sticky" ref={rootRef}>
        <div className="evo-copy">
          <ol className="evo-rail">
            {STAGES.map((s, j) => (
              <li key={s.short}>
                <button
                  type="button"
                  className={j === active ? 'on' : j < active ? 'past' : ''}
                  aria-current={j === active ? 'step' : undefined}
                  onClick={() => goTo(j)}
                >
                  {s.short}
                </button>
                <span className="evo-when">{s.year}</span>
              </li>
            ))}
            <span className="evo-rail-fill" aria-hidden="true" />
          </ol>
          <div className="evo-texts" aria-live="polite">
            {STAGES.map((s, j) => (
              <div key={s.short} className={`evo-text${j === active ? ' on' : ''}`} aria-hidden={j !== active}>
                <span className="evo-num">
                  {String(j + 1).padStart(2, '0')} · {s.when}
                </span>
                <h2>{s.title}</h2>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="evo-stage">
          <svg viewBox="0 0 480 400" role="img" aria-label={`Illustration: ${STAGES[active].title}`}>
            {/* 1 · Language model: words as points in a vector space. */}
            <g {...layer(0)}>
              <VectorScene on={active === 0} model={CORE[0]} />
            </g>

            {/* 2 · LLM: the same model, scaled up and fed the internet. */}
            <g {...layer(1)}>
              {SOURCES.map((s) => {
                const dx = CX - s.x
                const dy = CY - s.y
                const d = Math.hypot(dx, dy)
                return (
                  <g key={s.label}>
                    <line
                      className="evo-feed"
                      x1={s.x + (dx / d) * 30}
                      y1={s.y + (dy / d) * 16}
                      x2={CX - (dx / d) * 118}
                      y2={CY - (dy / d) * 118}
                    />
                    <text className="evo-source" x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central">
                      {s.label}
                    </text>
                  </g>
                )
              })}
              <text className="evo-caption" x={CX} y={384} textAnchor="middle">
                ~10¹¹ parameters · ~10¹³ words of training text
              </text>
            </g>

            {/* 3 · Chatbot: a conversation around the model. */}
            <g {...layer(2)}>
              <line className="evo-flow" x1={160} y1={CY} x2={196} y2={CY} />
              <rect className="evo-window" x={200} y={66} width={260} height={268} rx={18} />
              <text className="evo-window-title" x={220} y={92}>
                system prompt + history
              </text>
              <Bubble x={440} y={110} side="user" text="What's the capital of France?" delay={0} />
              <Bubble x={220} y={152} side="bot" text="Paris." delay={0.5} />
              <Bubble x={440} y={194} side="user" text="How many people live there?" delay={1} />
              <Bubble x={220} y={236} side="bot" text="About 2.1 million in the city." delay={1.5} />
              <g className="evo-typing" style={{ animationDelay: '2s' }}>
                <rect className="evo-bubble bot" x={220} y={278} width={58} height={30} rx={15} />
                {[0, 1, 2].map((d) => (
                  <circle key={d} className="evo-dot" cx={237 + d * 12} cy={293} r={3} style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </g>
            </g>

            {/* 4 · Harness: the model wrapped in tools, memory, data, apps, and rules. */}
            <g {...layer(3)}>
              <HarnessScene model={CORE[3]} />
            </g>

            {/* 6 · Multi-agent: a lead agent and its sub-agents. */}
            <g {...layer(MULTI)}>
              {SUBAGENTS.map((s) => (
                <line key={s.label} className="evo-spoke" x1={CX} y1={CORE[MULTI].y + CORE[MULTI].r + 4} x2={s.x} y2={s.y - 40} />
              ))}
              <MultiScene on={active === MULTI} lead={CORE[MULTI]} subs={SUBAGENTS} />
            </g>

            {/* 7 · What's next: a sketch of where this is heading. */}
            <g {...layer(6)}>
              <FutureScene on={active === 6} model={CORE[6]} />
            </g>

            {/* The sub-agents sit outside the layer so they can be seen splitting off from the agent. */}
            <g ref={subsRef} className="evo-subs">
              {SUBAGENTS.map((s, j) => (
                <g
                  key={s.label}
                  ref={(el) => {
                    subRefs.current[j] = el
                  }}
                >
                  <circle className="evo-sub-ring" r={38} style={{ animationDelay: `${-j * 4}s` }} />
                  {[0, 120, 240].map((deg) => {
                    const a = ((deg + j * 40) * Math.PI) / 180
                    return <circle key={deg} className="evo-sub-tool" cx={38 * Math.cos(a)} cy={38 * Math.sin(a)} r={3} />
                  })}
                  <circle className="evo-sub" r={24} />
                  <text className="evo-sub-label" textAnchor="middle" dominantBaseline="central">
                    agent
                  </text>
                  <text className="evo-tool-label" y={56} textAnchor="middle">
                    {s.label}
                  </text>
                </g>
              ))}
            </g>

            {/* The model itself, carried through every stage. */}
            <g ref={coreRef} className={`evo-core stage-${active}`}>
              <g className="evo-core-scaled">
                <circle className="evo-core-halo" r={100} />
                <circle className="evo-core-body" r={100} />
                <g className="evo-net">
                  {NET_EDGES.map(({ a, b }, j) => (
                    <line
                      key={j}
                      className="evo-net-edge"
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      style={{ animationDelay: `${((a.x + 66) / 132) * 1.2 + (j % 7) * 0.05}s` }}
                    />
                  ))}
                  {NET_COLS.flat().map((n, j) => (
                    <circle key={j} className="evo-net-node" cx={n.x} cy={n.y} r={4.5} />
                  ))}
                </g>
              </g>
              <text className="evo-core-label" textAnchor="middle" dominantBaseline="central">
                {CORE_LABEL[active]}
              </text>
            </g>

            {/* 5 · Agent: one task, played out through the loop. Drawn above the model so messages can pass over it. */}
            <g {...layer(4)}>
              <AgentScene on={active === 4} model={CORE[4]} />
            </g>
          </svg>
        </div>
      </div>
    </section>
  )
}

/** A single chat bubble; `x` is its left edge for the bot and its right edge for the user. */
function Bubble({ x, y, side, text, delay }: { x: number; y: number; side: 'user' | 'bot'; text: string; delay: number }) {
  const w = text.length * 6.1 + 28
  const left = side === 'user' ? x - w : x
  return (
    <g className="evo-msg" style={{ animationDelay: `${delay}s` }}>
      <rect className={`evo-bubble ${side}`} x={left} y={y} width={w} height={30} rx={15} />
      <text className={`evo-bubble-text ${side}`} x={left + 14} y={y + 15} dominantBaseline="central">
        {text}
      </text>
    </g>
  )
}
