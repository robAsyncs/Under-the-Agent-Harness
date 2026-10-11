import { useState } from 'react'

const STAGES = [
  {
    name: 'Pretraining',
    data: 'Trillions of tokens of web pages, books and code',
    objective: 'Predict the next token',
    result: 'Base model: completes documents',
    share: 0.9,
  },
  {
    name: 'Supervised fine-tuning',
    data: 'Thousands to hundreds of thousands of written example conversations (InstructGPT: about 13,000 prompts)',
    objective: 'Imitate the ideal response',
    result: 'Follows instructions in a chat format',
    share: 0.05,
  },
  {
    name: 'Preference tuning',
    data: 'Pairs of responses ranked by people or by an AI using written principles',
    objective: 'Prefer the better response (RLHF, DPO, RLAIF)',
    result: 'Chat model: helpful, honest, harmless style',
    share: 0.05,
  },
]

type Prompt = { label: string; text: string; answers: [string, string, string]; note: string }

const PROMPTS: Prompt[] = [
  {
    label: 'A simple fact',
    text: 'What is the capital of France?',
    answers: [
      'What is the capital of Germany? What is the capital of Italy? Test your knowledge with these 20 geography questions…',
      'The capital of France is Paris.',
      'The capital of France is Paris.',
    ],
    note: 'The base model continues the most likely kind of document: a quiz. Fine-tuning is what turns it into an answer. For a plain fact, preference tuning changes little.',
  },
  {
    label: 'A risky question',
    text: 'Can I take ibuprofen with my blood pressure pills?',
    answers: [
      'Can I take paracetamol with antibiotics? Can I drink alcohol on antidepressants? Posted in Health Forum › Medications · 14 replies…',
      'Yes, ibuprofen is a common painkiller and can be taken with most medications. Take 200–400 mg every 4–6 hours as needed.',
      'Check with a pharmacist or your doctor first. Ibuprofen and other NSAIDs can raise blood pressure and make some blood pressure medicines work less well. If you tell me which pills you take, I can explain what to ask about.',
    ],
    note: 'Fine-tuning taught the model to answer in the right format, and here that produces a confident, risky answer. Preference tuning rewards the response people rated as more helpful and more careful.',
  },
]

/** The three training stages, stepping through what one prompt gets after each. */
export function TrainingStepper() {
  const [stage, setStage] = useState(0)
  const [p, setP] = useState(0)
  const prompt = PROMPTS[p]

  return (
    <div className="demo">
      <div className="demo-controls">
        <div className="speed" role="group" aria-label="Prompt">
          {PROMPTS.map((x, i) => (
            <button key={x.label} type="button" className={p === i ? 'on' : ''} onClick={() => setP(i)}>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="llm-pipeline">
        {STAGES.map((s, i) => (
          <button
            key={s.name}
            type="button"
            className={`llm-stage ${i <= stage ? 'done' : ''} ${i === stage ? 'on' : ''}`}
            aria-pressed={i === stage}
            onClick={() => setStage(i)}
          >
            <span className="llm-stage-num">{i + 1}</span>
            <strong>{s.name}</strong>
            <dl>
              <dt>Data</dt>
              <dd>{s.data}</dd>
              <dt>Objective</dt>
              <dd>{s.objective}</dd>
              <dt>Result</dt>
              <dd>{s.result}</dd>
            </dl>
            <span className="llm-share" aria-label={i === 0 ? 'Most of the compute' : 'A small share of the compute'}>
              <span style={{ width: `${s.share * 100}%` }} />
            </span>
          </button>
        ))}
      </div>

      <div className="llm-after" key={`${p}-${stage}`}>
        <p className="llm-after-prompt">
          <span className="llm-role">Prompt</span> {prompt.text}
        </p>
        <p className="llm-after-answer">
          <span className="llm-role">After stage {stage + 1}</span> {prompt.answers[stage]}
        </p>
      </div>

      <div className="demo-controls llm-step-nav">
        <button type="button" className="pill" disabled={stage === 0} onClick={() => setStage(stage - 1)}>
          ← Back
        </button>
        <button type="button" className="pill primary" disabled={stage === 2} onClick={() => setStage(stage + 1)}>
          Next stage →
        </button>
      </div>
      <p className="demo-note">{prompt.note} Answers are illustrative.</p>
    </div>
  )
}
