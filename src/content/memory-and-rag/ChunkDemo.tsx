import { useState } from 'react'

const TEXT =
  'Returns. We want you to love what you ordered. If something is not right, you can return most items for a full refund. ' +
  'Items can be returned within 30 days of delivery, as long as they are unworn and still have their tags. ' +
  'Sale items are final and cannot be returned. To start a return, open your order and choose Return item. ' +
  'Refunds go back to the original card within 5 to 7 business days of the item reaching our warehouse.'

const WORDS = TEXT.split(' ')

/** The sentence that answers "How long do I have to return something?", as word indices [first, last]. */
const ANSWER_START = WORDS.indexOf('Items')
const ANSWER_END = WORDS.indexOf('tags.')

function chunk(size: number, overlap: number) {
  const step = size - overlap
  const chunks: [number, number][] = []
  for (let start = 0; start < WORDS.length; start += step) {
    chunks.push([start, Math.min(start + size, WORDS.length) - 1])
    if (start + size >= WORDS.length) break
  }
  return chunks
}

export function ChunkDemo() {
  const [size, setSize] = useState(14)
  const [overlap, setOverlap] = useState(0)
  const safeOverlap = Math.min(overlap, size - 2)
  const chunks = chunk(size, safeOverlap)
  const whole = chunks.findIndex(([a, b]) => a <= ANSWER_START && b >= ANSWER_END)

  return (
    <div className="demo">
      <div className="demo-controls mem-demo-head">
        <label className="slider">
          chunk size
          <input type="range" min={6} max={40} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          <output>{size} words</output>
        </label>
        <label className="slider">
          overlap
          <input type="range" min={0} max={12} value={overlap} onChange={(e) => setOverlap(Number(e.target.value))} />
          <output>{safeOverlap} words</output>
        </label>
      </div>

      <ol className="mem-chunks">
        {chunks.map(([a, b], i) => (
          <li key={`${a}-${b}`} className={i === whole ? 'hit' : ''}>
            <span className="mem-chunk-id">#{i + 1}</span>
            <span>
              {WORDS.slice(a, b + 1).map((w, j) => {
                const idx = a + j
                const shared = i > 0 && idx <= chunks[i - 1][1]
                const answer = idx >= ANSWER_START && idx <= ANSWER_END
                return (
                  <span key={idx} className={`${shared ? 'mem-shared' : ''} ${answer ? 'mem-answer' : ''}`}>
                    {w}{' '}
                  </span>
                )
              })}
            </span>
          </li>
        ))}
      </ol>

      <p className={`mem-chunk-verdict ${whole >= 0 ? 'ok' : 'bad'}`}>
        {whole >= 0
          ? `“How long do I have to return something?” The whole answer is in chunk #${whole + 1}, so retrieving one chunk is enough.`
          : '“How long do I have to return something?” The answer is split across chunks. Retrieval may find “within 30 days” without the conditions, or the conditions without the 30 days.'}
      </p>
      <p className="demo-note">
        {chunks.length} chunks. The underlined sentence is the answer; faded words are repeated from the previous chunk
        because of the overlap. Small chunks match a question precisely but cut answers in half; big ones keep answers
        whole but dilute the match and cost more tokens. Overlap is a cheap way to protect sentences at the
        boundaries.
      </p>
    </div>
  )
}
