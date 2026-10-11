import { useState } from 'react'

type Fate = 'kept' | 'partial' | 'lost'
type EventId = 'compact' | 'session' | 'crash' | 'machine'

const EVENTS: Record<EventId, { name: string; note: string }> = {
  compact: {
    name: 'Context compacted',
    note: 'The window filled up, so the harness replaced the older turns with a summary. The run continues.',
  },
  session: {
    name: 'New session',
    note: 'The user closed the session and started a new one the next day. The harness starts with an empty context.',
  },
  crash: {
    name: 'Process crashes',
    note: 'The harness was killed halfway through a turn. Everything held only in its memory is gone.',
  },
  machine: {
    name: 'Fresh machine',
    note: 'The run continues in a new container or on a teammate’s laptop. Only what was stored off the machine comes along.',
  },
}

/** What each store looks like after each event, and why. */
const STORES: { name: string; fates: Record<EventId, [Fate, string]> }[] = [
  {
    name: 'Context window',
    fates: {
      compact: ['partial', 'Only the summary and the recent turns remain.'],
      session: ['lost', 'Starts empty.'],
      crash: ['lost', 'It only ever existed in the request being built.'],
      machine: ['lost', 'Starts empty.'],
    },
  },
  {
    name: 'Transcript on disk',
    fates: {
      compact: ['kept', 'The full history is still on disk, even though the model no longer sees it.'],
      session: ['kept', 'Can be resumed, if the harness saved it.'],
      crash: ['partial', 'Up to the last turn that was saved.'],
      machine: ['lost', 'It was a local file.'],
    },
  },
  {
    name: 'Memory files (CLAUDE.md, MEMORY.md)',
    fates: {
      compact: ['kept', 'Reloaded with the system prompt.'],
      session: ['kept', 'Loaded at session start.'],
      crash: ['kept', 'Already on disk.'],
      machine: ['partial', 'Only the ones committed to the repo.'],
    },
  },
  {
    name: 'Plan and progress files',
    fates: {
      compact: ['kept', 'The agent re-reads them to get its bearings.'],
      session: ['kept', 'The first thing a new session reads.'],
      crash: ['partial', 'The last write may be half done, unless it was written atomically.'],
      machine: ['partial', 'Only what was committed and pushed.'],
    },
  },
  {
    name: 'In-process harness state',
    fates: {
      compact: ['kept', 'The process is still running.'],
      session: ['lost', 'Unless the harness saved it to disk.'],
      crash: ['lost', 'It lived in memory.'],
      machine: ['lost', 'It lived in memory.'],
    },
  },
  {
    name: 'Database or vector index',
    fates: {
      compact: ['kept', 'Retrieved again when needed.'],
      session: ['kept', 'Retrieved again when needed.'],
      crash: ['kept', 'Committed writes survive.'],
      machine: ['kept', 'It is a separate service.'],
    },
  },
]

const LABEL: Record<Fate, string> = { kept: 'Kept', partial: 'Partly', lost: 'Lost' }

export function SurvivalDemo() {
  const [event, setEvent] = useState<EventId>('compact')

  return (
    <div className="demo">
      <div className="demo-controls mem-demo-head">
        <div className="speed" role="group" aria-label="What happens">
          {(Object.keys(EVENTS) as EventId[]).map((e) => (
            <button key={e} type="button" className={event === e ? 'on' : ''} onClick={() => setEvent(e)}>
              {EVENTS[e].name}
            </button>
          ))}
        </div>
      </div>
      <p className="small muted mem-event-note">{EVENTS[event].note}</p>

      <ul className="mem-stores" key={event}>
        {STORES.map((s) => {
          const [fate, why] = s.fates[event]
          return (
            <li key={s.name} className={`mem-store ${fate}`}>
              <strong>{s.name}</strong>
              <span className="mem-fate">{LABEL[fate]}</span>
              <span className="mem-why">{why}</span>
            </li>
          )
        })}
      </ul>
      <p className="demo-note">
        “Durable” always means durable against something. A local file survives compaction and crashes but not a fresh
        machine; only a separate service survives all four. Pick stores by the failures your agent will actually meet.
      </p>
    </div>
  )
}
