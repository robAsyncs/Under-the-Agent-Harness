import { type ReactNode, useState } from 'react'

type Numbers = { start: number; given: number; bags: number; perBag: number }

const ORIGINAL = { name: 'Sophie', pronoun: 'She', subject: 'she', possessive: 'her', sibling: 'brother', n: { start: 31, given: 8, bags: 3, perBag: 5 } }
const VARIANT = { name: 'Ravi', pronoun: 'He', subject: 'he', possessive: 'his', sibling: 'sister', n: { start: 47, given: 19, bags: 4, perBag: 6 } }
const NOOP_EXTRA = 5

const answer = (n: Numbers) => n.start - n.given + n.bags * n.perBag

/** A changed part of the problem, highlighted. */
function Part({ changed, children }: { changed: boolean; children: ReactNode }) {
  return changed ? <mark className="llm-changed">{children}</mark> : <>{children}</>
}

/** One grade-school problem with GSM-Symbolic-style changes switched on and off. */
export function GsmDemo() {
  const [names, setNames] = useState(false)
  const [numbers, setNumbers] = useState(false)
  const [noop, setNoop] = useState(false)

  const who = names ? VARIANT : ORIGINAL
  const n = numbers ? VARIANT.n : ORIGINAL.n
  const correct = answer(n)

  const toggles: [string, boolean, (v: boolean) => void][] = [
    ['Change names', names, setNames],
    ['Change numbers', numbers, setNumbers],
    ['Add an irrelevant clause', noop, setNoop],
  ]

  return (
    <div className="demo">
      <div className="demo-controls">
        {toggles.map(([label, on, set]) => (
          <button key={label} type="button" className={`pill ${on ? 'primary' : ''}`} aria-pressed={on} onClick={() => set(!on)}>
            {label}
          </button>
        ))}
      </div>

      <p className="llm-problem">
        <Part changed={names}>{who.name}</Part> has <Part changed={numbers}>{n.start}</Part> marbles.{' '}
        <Part changed={names}>{who.pronoun}</Part> gives <Part changed={numbers}>{n.given}</Part> to{' '}
        <Part changed={names}>{who.possessive}</Part> <Part changed={names}>{who.sibling}</Part>, then buys{' '}
        <Part changed={numbers}>{n.bags}</Part> bags of <Part changed={numbers}>{n.perBag}</Part> marbles each.{' '}
        {noop && (
          <mark className="llm-changed noop">Five of the marbles are slightly smaller than the others. </mark>
        )}
        How many marbles does <Part changed={names}>{who.subject}</Part> have now?
      </p>

      <dl className="llm-stats llm-gsm">
        <div>
          <dt>Correct answer</dt>
          <dd>
            {n.start} − {n.given} + {n.bags} × {n.perBag} = <strong>{correct}</strong>
          </dd>
        </div>
        {noop && (
          <div className="llm-wrong">
            <dt>A typical wrong answer</dt>
            <dd>
              <strong>{correct - NOOP_EXTRA}</strong>: subtracts the {NOOP_EXTRA} smaller marbles, which changes nothing
            </dd>
          </div>
        )}
      </dl>
      <p className="demo-note">
        None of these changes alter the reasoning the problem needs. Mirzadeh et al. (2024) found that models’ accuracy
        dropped when only the names and numbers changed, and dropped far more, by up to 65% for some models, when a
        single irrelevant clause was added. The problem here is written in the style of their benchmark, not taken from it.
      </p>
    </div>
  )
}
