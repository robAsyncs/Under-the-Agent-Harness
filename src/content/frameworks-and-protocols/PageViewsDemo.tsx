import { useState } from 'react'

/** Screenshot pixels per SVG unit: the mock page stands in for a 1280×800 screenshot. */
const SCALE = 3.2

type El = {
  id: string
  label: string
  /** Centre of the element on the mock page, in SVG units. */
  x: number
  y: number
  tree: string
  ref: string
  /** Text to type after clicking, for fields. */
  typed?: string
  byRef: string
}

const ELEMENTS: El[] = [
  {
    id: 'field',
    label: 'Order number field',
    x: 150,
    y: 128,
    tree: 'textbox "Order number"',
    ref: 'e4',
    typed: '48213',
    byRef: 'browser_type(element="Order number field", ref="e4", text="48213")',
  },
  {
    id: 'button',
    label: 'Search button',
    x: 322,
    y: 128,
    tree: 'button "Search"',
    ref: 'e5',
    byRef: 'browser_click(element="Search button", ref="e5")',
  },
  {
    id: 'link',
    label: 'Help link',
    x: 72,
    y: 196,
    tree: 'link "Need help?"',
    ref: 'e6',
    byRef: 'browser_click(element="Help link", ref="e6")',
  },
]

export function PageViewsDemo() {
  const [sel, setSel] = useState('button')
  const el = ELEMENTS.find((e) => e.id === sel) ?? ELEMENTS[0]
  const px = [Math.round(el.x * SCALE), Math.round(el.y * SCALE)]

  return (
    <div className="demo">
      <div className="demo-controls agl-tabs-head">
        <div className="speed" role="group" aria-label="Element to act on">
          {ELEMENTS.map((e) => (
            <button key={e.id} type="button" className={sel === e.id ? 'on' : ''} onClick={() => setSel(e.id)}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="fp-views">
        <div className="fp-view">
          <span className="api-pane-label">Screenshot: the model sees pixels</span>
          <svg viewBox="0 0 400 250" className="fp-page" role="img" aria-label={`Mock page; ${el.label} is at ${px[0]}, ${px[1]}`}>
            <rect x="0" y="0" width="400" height="250" className="fp-page-bg" />
            <rect x="0" y="0" width="400" height="34" className="fp-page-bar" />
            <circle cx="16" cy="17" r="4" className="fp-page-dot" />
            <circle cx="30" cy="17" r="4" className="fp-page-dot" />
            <circle cx="44" cy="17" r="4" className="fp-page-dot" />
            <text x="36" y="80" className="fp-page-h">
              Track your order
            </text>
            <rect x="36" y="112" width="228" height="32" rx="5" className={`fp-page-field ${sel === 'field' ? 'hit' : ''}`} />
            <text x="48" y="133" className="fp-page-ph">
              Order number
            </text>
            <rect x="276" y="112" width="92" height="32" rx="5" className={`fp-page-btn ${sel === 'button' ? 'hit' : ''}`} />
            <text x="322" y="133" textAnchor="middle" className="fp-page-btn-text">
              Search
            </text>
            <text x="36" y="200" className={`fp-page-link ${sel === 'link' ? 'hit' : ''}`}>
              Need help?
            </text>
            <g className="fp-target" style={{ transform: `translate(${el.x}px, ${el.y}px)` }}>
              <circle r="9" />
              <line x1="-14" y1="0" x2="14" y2="0" />
              <line x1="0" y1="-14" x2="0" y2="14" />
            </g>
          </svg>
          <code className="fp-action">
            {`{"action": "left_click", "coordinate": [${px[0]}, ${px[1]}]}`}
            {el.typed && `\n{"action": "type", "text": "${el.typed}"}`}
          </code>
        </div>

        <div className="fp-view">
          <span className="api-pane-label">Accessibility tree: the model reads structure</span>
          <pre className="fp-tree">
            {'- heading "Track your order" [level=1]\n'}
            {ELEMENTS.map((e) => (
              <span key={e.id} className={sel === e.id ? 'hit' : ''}>
                {`- ${e.tree} [ref=${e.ref}]\n`}
              </span>
            ))}
          </pre>
          <code className="fp-action">{el.byRef}</code>
        </div>
      </div>

      <p className="demo-note">
        From pixels, the model has to find the element and estimate where to click, and a moved button means a missed
        click. From the tree, it names the element, and the browser finds it wherever it is. The page and the tool calls
        are simplified.
      </p>
    </div>
  )
}
