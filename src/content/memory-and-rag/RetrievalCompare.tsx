const QUESTION = 'Who manages the team that owns the billing service?'

type Step = { kind: 'think' | 'search' | 'found' | 'answer'; text: string; bad?: boolean }

const ONE_SHOT: Step[] = [
  { kind: 'search', text: 'search("Who manages the team that owns the billing service?")' },
  { kind: 'found', text: 'billing-service/README: “Owned by the Payments Platform team.”' },
  { kind: 'found', text: 'Billing on-call rota: “This week: Sam Ito.”' },
  { kind: 'found', text: 'Managers’ handbook: “Managers hold weekly 1:1s with their reports.”' },
  {
    kind: 'answer',
    text: 'The billing service is owned by Payments Platform. The documents I was given don’t say who manages that team.',
    bad: true,
  },
]

const AGENTIC: Step[] = [
  { kind: 'think', text: 'First find the owning team, then its manager.' },
  { kind: 'search', text: 'search_docs("billing service owner")' },
  { kind: 'found', text: 'billing-service/README: “Owned by the Payments Platform team.”' },
  { kind: 'think', text: 'Now look up that team.' },
  { kind: 'search', text: 'search_docs("Payments Platform team manager")' },
  { kind: 'found', text: 'teams/payments-platform: “Manager: Dana Okafor.”' },
  { kind: 'answer', text: 'Dana Okafor manages Payments Platform, which owns the billing service. [README, teams page]' },
]

const KIND_LABEL = { think: 'Model', search: 'Tool call', found: 'Result', answer: 'Answer' }

function Trace({ title, steps, cost }: { title: string; steps: Step[]; cost: string }) {
  return (
    <div className="mem-rt-col">
      <h4>{title}</h4>
      <ol className="mem-rt">
        {steps.map((s, i) => (
          <li key={i} className={`${s.kind} ${s.bad ? 'bad' : ''}`}>
            <span className="mem-rt-kind">{KIND_LABEL[s.kind]}</span>
            <span className={s.kind === 'search' ? 'mem-rt-code' : ''}>{s.text}</span>
          </li>
        ))}
      </ol>
      <p className="mem-rt-cost">{cost}</p>
    </div>
  )
}

/** The same two-hop question, retrieved once up front vs. by an agent with a search tool. */
export function RetrievalCompare() {
  return (
    <div className="demo">
      <p className="mem-hy-query">
        <span>Question</span> {QUESTION}
      </p>
      <div className="mem-rt-grid">
        <Trace title="One-shot RAG" steps={ONE_SHOT} cost="1 search, 1 model call. The second hop never happens." />
        <Trace
          title="Agentic retrieval"
          steps={AGENTIC}
          cost="2 searches, 3 model calls. The second query uses what the first one found."
        />
      </div>
      <p className="demo-note">
        The one-shot pipeline searches with the user’s words, so it can only find passages that resemble the whole
        question. The manager’s name is on a page that never mentions billing. Documents and names are made up.
      </p>
    </div>
  )
}
