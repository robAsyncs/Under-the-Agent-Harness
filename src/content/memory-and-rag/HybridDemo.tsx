import { useState } from 'react'

const QUERY = 'Checkout fails with ERR_PAYMENT_402 when the card is declined'

/** Passages, with whether they actually help answer the query. */
const CHUNKS: Record<string, { text: string; useful: boolean }> = {
  A: { text: 'ERR_PAYMENT_402 means the issuing bank declined the charge. Ask the customer to contact their bank.', useful: true },
  B: { text: 'If a card payment is rejected by the bank, suggest another card or a different payment method.', useful: true },
  C: { text: 'Error code list: ERR_PAYMENT_401, ERR_PAYMENT_402, ERR_PAYMENT_403, ERR_PAYMENT_404.', useful: false },
  D: { text: 'Why cards get declined: insufficient funds, an expired card, or the bank’s fraud checks.', useful: true },
  E: { text: 'Retrying failed payments: wait before retrying, and never retry a declined card automatically.', useful: false },
  F: { text: 'Release notes 4.2: the ERR_PAYMENT_402 log field was renamed to decline_reason.', useful: false },
}

/** BM25 matches the exact code; the vector search matches the meaning. */
const BM25 = ['A', 'C', 'F', 'B', 'E', 'D']
const VECTOR = ['D', 'B', 'E', 'A', 'C', 'F']
const K = 60
const TOP = 3

function fuse(rankings: string[][]) {
  const scores: Record<string, number> = {}
  for (const ranking of rankings) {
    ranking.forEach((id, i) => {
      scores[id] = (scores[id] ?? 0) + 1 / (K + i + 1)
    })
  }
  return Object.keys(scores)
    .sort((a, b) => scores[b] - scores[a])
    .map((id) => ({ id, score: scores[id] }))
}

const FUSED = fuse([BM25, VECTOR])

const MODES = {
  bm25: 'Keyword (BM25)',
  vector: 'Vector',
  hybrid: 'Hybrid (RRF)',
} as const
type Mode = keyof typeof MODES

function Ranking({ title, ids, on, scores }: { title: string; ids: string[]; on: boolean; scores?: Record<string, number> }) {
  return (
    <div className={`mem-hy-col ${on ? 'on' : ''}`}>
      <h4>{title}</h4>
      <ol>
        {ids.map((id, i) => (
          <li key={id} className={`${CHUNKS[id].useful ? 'useful' : ''} ${on && i < TOP ? 'kept' : ''}`}>
            <span className="mem-hy-id">{id}</span>
            <span className="mem-hy-text">{CHUNKS[id].text}</span>
            {scores ? (
              <span className="mem-score" title={`1/(60+${BM25.indexOf(id) + 1}) + 1/(60+${VECTOR.indexOf(id) + 1})`}>
                {scores[id].toFixed(4)}
              </span>
            ) : (
              <span className="mem-score">#{i + 1}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

export function HybridDemo() {
  const [mode, setMode] = useState<Mode>('hybrid')
  const scores = Object.fromEntries(FUSED.map((f) => [f.id, f.score]))
  const shown = mode === 'bm25' ? BM25 : mode === 'vector' ? VECTOR : FUSED.map((f) => f.id)
  const useful = shown.slice(0, TOP).filter((id) => CHUNKS[id].useful).length

  return (
    <div className="demo">
      <div className="demo-controls mem-demo-head">
        <div className="speed" role="group" aria-label="Which ranking goes into the prompt">
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <button key={m} type="button" className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {MODES[m]}
            </button>
          ))}
        </div>
      </div>
      <p className="mem-hy-query">
        <span>Query</span> {QUERY}
      </p>

      <div className="mem-hy">
        <Ranking title="Keyword (BM25)" ids={BM25} on={mode === 'bm25'} />
        <Ranking title="Vector" ids={VECTOR} on={mode === 'vector'} />
        <Ranking title="Fused with RRF, k = 60" ids={FUSED.map((f) => f.id)} on={mode === 'hybrid'} scores={scores} />
      </div>

      <p className={`mem-chunk-verdict ${useful === TOP ? 'ok' : 'bad'}`}>
        {mode === 'bm25' &&
          'Keyword search finds the passage that explains ERR_PAYMENT_402, then fills the rest with other passages that merely contain the string.'}
        {mode === 'vector' &&
          'Vector search finds passages about declined cards, but ranks the one that names the exact error code only fourth, so it misses the top 3.'}
        {mode === 'hybrid' &&
          'Each passage scores 1/(60 + rank) in each list, summed. A passage near the top of either list rises, so the exact match and both paraphrases make the top 3.'}{' '}
        {useful} of the top {TOP} passages help.
      </p>
      <p className="demo-note">
        Green marks passages that help answer the query; the highlighted rows are the top {TOP} that go into the prompt.
        Hover a fused score to see its sum. Rankings are illustrative; the fused scores are computed.
      </p>
    </div>
  )
}
