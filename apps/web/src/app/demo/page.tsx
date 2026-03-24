'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import PassageText from '@/components/PassageText';

// Digital SAT format: short passage (25-150 words) + 1 question each
const DEMO_SETS = [
  // Set 1: Literature + Science
  [
    {
      id: '1-1',
      passage: {
        title: 'The Homecoming',
        text: `Eleanor pressed her forehead against the cold glass of the train window, watching the countryside blur into long streaks of green and gold. She had not spoken to her mother in three years. The letter had arrived on a Tuesday, written in her mother's careful, slanting hand: "I have sold the house. If there is anything you want from your old room, you should come before the fifteenth." No greeting, no signature — just those two sentences and the faint impression of a pen pressed hard against paper. Eleanor had nearly thrown it away, holding it over the waste bin for a full minute, her fingers trembling not from cold but from something she refused to name.`,
        source: 'Adapted from Claire Whitfield, "Small Distances" (2021)',
      },
      question: {
        stem: "Based on the text, Eleanor's response to the letter is best described as:",
        choices: [
          { label: 'A', text: 'Immediate enthusiasm followed by growing doubt' },
          { label: 'B', text: 'Reluctant deliberation that gradually resolved into action' },
          { label: 'C', text: 'Calm acceptance of a long-anticipated invitation' },
          { label: 'D', text: "Anger at her mother's impersonal tone" },
        ],
        correctAnswer: 1,
        explanation: 'Eleanor nearly threw away the letter, held it over the waste bin, and her fingers trembled from "something she refused to name" — all signs of reluctant, conflicted deliberation. There is no initial enthusiasm (A), no calm acceptance (C), and while the tone is impersonal, the text emphasizes internal conflict rather than anger (D).',
        skill: 'Inferences',
      },
    },
    {
      id: '1-2',
      passage: {
        title: 'Coral Reef Decline',
        text: `Scientists estimate that the world has lost approximately 14 percent of its coral reefs between 2009 and 2018. Rising ocean temperatures cause coral bleaching, a stress response in which corals expel the symbiotic algae that provide them with both nutrients and their characteristic colors. Without these algae, corals turn white and, if conditions do not improve within weeks, they die. Projections suggest that 70 to 90 percent of existing reefs could disappear by 2050 if current warming trends continue.`,
        source: 'Adapted from Maria Chen, "Ocean Ecosystems Under Pressure" (2023)',
      },
      question: {
        stem: 'According to the text, what is the relationship between coral bleaching and symbiotic algae?',
        choices: [
          { label: 'A', text: 'Bleaching occurs when algae overpopulate the coral structure' },
          { label: 'B', text: 'Bleaching is the process of corals expelling algae due to temperature stress' },
          { label: 'C', text: 'Algae cause bleaching by consuming coral nutrients' },
          { label: 'D', text: 'Bleaching strengthens the bond between corals and their algae' },
        ],
        correctAnswer: 1,
        explanation: 'The text directly states that coral bleaching is "a stress response in which corals expel the symbiotic algae." B accurately describes this relationship. A reverses the mechanism, C misidentifies the cause, and D contradicts the text entirely.',
        skill: 'Central Ideas and Details',
      },
    },
    {
      id: '1-3',
      passage: {
        title: 'Universal Education',
        text: `When Horace Mann championed public education in the 1830s, his critics were numerous: business owners complained about losing child laborers, wealthy families objected to taxes funding education for the poor, and some religious groups feared public schools would undermine their authority. Yet Mann persisted, arguing that education was not merely a personal benefit but a public good. Modern economists have largely vindicated his position, with studies showing each additional year of schooling increases earnings by approximately 10 percent while simultaneously reducing crime rates and improving public health outcomes.`,
        source: 'Adapted from Robert Alvarez, "Public Investment and Social Returns" (2022)',
      },
      question: {
        stem: 'As used in the text, "vindicated" most nearly means:',
        choices: [
          { label: 'A', text: 'Challenged with new evidence' },
          { label: 'B', text: 'Confirmed as correct' },
          { label: 'C', text: 'Simplified for modern audiences' },
          { label: 'D', text: 'Reinterpreted in a new context' },
        ],
        correctAnswer: 1,
        explanation: '"Vindicated" means proven right or justified. The text follows the word with evidence (earnings data, crime/health stats) that confirms Mann was correct. A is the opposite meaning; C and D don\'t capture the sense of proving someone right.',
        skill: 'Words in Context',
      },
    },
  ],
  // Set 2: Social Science + Literature + Science
  [
    {
      id: '2-1',
      passage: {
        title: 'Sleep and Memory',
        text: `A 2019 study at the University of Michigan found that participants who slept for eight hours after learning a new task performed 40 percent better on recall tests than those who stayed awake for the same period. The researchers attributed this improvement to sleep spindles — brief bursts of brain activity during non-REM sleep that appear to transfer memories from the hippocampus to the neocortex for long-term storage. Crucially, participants who napped for just 90 minutes showed nearly the same benefit, suggesting that even short sleep periods can consolidate learning.`,
        source: 'Adapted from Dr. Sarah Patel, "The Neuroscience of Rest" (2020)',
      },
      question: {
        stem: 'Which finding from the study best supports the claim that sleep duration does not need to be lengthy to benefit memory?',
        choices: [
          { label: 'A', text: 'Eight hours of sleep improved recall by 40 percent' },
          { label: 'B', text: 'Sleep spindles occur during non-REM sleep' },
          { label: 'C', text: 'A 90-minute nap produced nearly the same memory benefit as full sleep' },
          { label: 'D', text: 'Memories transfer from the hippocampus to the neocortex' },
        ],
        correctAnswer: 2,
        explanation: 'The claim is about short sleep being sufficient. C directly supports this by showing that a 90-minute nap yielded "nearly the same benefit." A supports the value of sleep generally but not short durations. B and D describe mechanisms, not duration effects.',
        skill: 'Command of Evidence (Textual)',
      },
    },
    {
      id: '2-2',
      passage: {
        title: 'The Appointment',
        text: `Dr. Okafor studied the X-ray for a long time, tilting it toward the window as if better light might change what she saw. When she finally spoke, her voice carried the careful neutrality that Marcus had learned to dread — the tone that meant the news was neither simple nor good. "The fracture has healed," she said, "but not quite the way we hoped." She placed the film on the desk between them, and Marcus noticed that her hand, usually so steady, paused for just a moment before withdrawing.`,
        source: 'Adapted from James Osei, "The Waiting Room" (2022)',
      },
      question: {
        stem: "The detail about Dr. Okafor's hand pausing primarily serves to:",
        choices: [
          { label: 'A', text: 'Indicate that Dr. Okafor is physically exhausted from her work' },
          { label: 'B', text: 'Suggest that the medical situation is more serious than her words convey' },
          { label: 'C', text: 'Show that Dr. Okafor lacks confidence in her diagnosis' },
          { label: 'D', text: "Demonstrate Marcus's tendency to overanalyze small gestures" },
        ],
        correctAnswer: 1,
        explanation: 'Her hand is described as "usually so steady" but it "paused" — a departure from her norm that, combined with her "careful neutrality" (which Marcus has "learned to dread"), suggests the situation is worse than stated. A is unsupported, C contradicts her characterization, and D misidentifies the focus.',
        skill: 'Text Structure and Purpose',
      },
    },
    {
      id: '2-3',
      passage: {
        title: 'Urban Green Spaces',
        text: `A comprehensive analysis of 35 cities found that residents living within 300 meters of a park reported 20 percent lower stress levels and exercised an average of 45 minutes more per week than those without nearby green space. The effect was most pronounced among low-income residents, who were 2.5 times more likely to use free public parks as their primary exercise venue. Researchers noted, however, that the parks in wealthier neighborhoods were significantly better maintained, raising questions about equitable access to these health benefits.`,
        source: 'Adapted from Lin Zhang, "Green Infrastructure and Public Health" (2023)',
      },
      question: {
        stem: 'The researchers\' observation about park maintenance in wealthier neighborhoods primarily introduces:',
        choices: [
          { label: 'A', text: 'A counterargument against the health benefits of parks' },
          { label: 'B', text: 'Evidence that wealthy residents exercise more than others' },
          { label: 'C', text: 'A qualification about the equitable distribution of park benefits' },
          { label: 'D', text: 'A recommendation for increasing park funding nationwide' },
        ],
        correctAnswer: 2,
        explanation: 'The maintenance disparity raises "questions about equitable access" — this is a qualification (a limiting condition) to the positive findings, not a counterargument against parks\' benefits (A). B is not what the observation is about, and D goes beyond what the text states.',
        skill: 'Inferences',
      },
    },
  ],
  // Set 3: History + Science + Literature
  [
    {
      id: '3-1',
      passage: {
        title: 'The Right to Dissent',
        text: `In a 1927 Supreme Court opinion, Justice Louis Brandeis argued that "those who won our independence believed that the final end of the State was to make men free to develop their faculties." He contended that the founders understood that "the greatest menace to freedom is an inert people; that public discussion is a political duty." For Brandeis, suppressing speech was not merely wrong but counterproductive: silencing dissent did not eliminate dangerous ideas but instead drove them underground, where they could fester without the corrective force of open debate.`,
        source: 'Adapted from Whitney v. California, 274 U.S. 357 (1927)',
      },
      question: {
        stem: "Which choice best describes Brandeis's reasoning about the suppression of speech?",
        choices: [
          { label: 'A', text: 'It violates citizens\' natural rights but may sometimes be necessary for public safety' },
          { label: 'B', text: 'It is both morally unjust and practically ineffective at eliminating dangerous ideas' },
          { label: 'C', text: 'It reflects the original intent of the Constitution\'s framers' },
          { label: 'D', text: 'It is acceptable only when directed at ideas that threaten democratic institutions' },
        ],
        correctAnswer: 1,
        explanation: 'Brandeis calls suppression "not merely wrong but counterproductive" — wrong = morally unjust, counterproductive = practically ineffective. He argues silencing dissent drives ideas underground rather than eliminating them. A incorrectly suggests he allows exceptions; C reverses his point; D contradicts his argument.',
        skill: 'Central Ideas and Details',
      },
    },
    {
      id: '3-2',
      passage: {
        title: 'Microplastics in Rainfall',
        text: `Researchers at a remote weather station in the French Pyrenees mountains discovered an average of 365 microplastic particles per square meter falling with daily rainfall — a finding remarkable because the nearest city was over 100 kilometers away. Analysis revealed that the particles had been carried by atmospheric currents from distant urban and industrial centers, traveling hundreds of kilometers before being deposited by rain. The study suggested that microplastic contamination is now so pervasive that even locations previously considered pristine are affected.`,
        source: 'Adapted from Dr. Émile Rousseau, "Atmospheric Transport of Synthetic Polymers" (2021)',
      },
      question: {
        stem: 'The remoteness of the weather station is significant to the study because it:',
        choices: [
          { label: 'A', text: 'Demonstrates that microplastics originate primarily from mountain environments' },
          { label: 'B', text: 'Proves that rainfall in urban areas contains fewer microplastics' },
          { label: 'C', text: 'Strengthens the conclusion that microplastics can travel long distances through the atmosphere' },
          { label: 'D', text: 'Suggests that monitoring stations should only be placed in remote areas' },
        ],
        correctAnswer: 2,
        explanation: 'Finding microplastics 100+ km from the nearest city directly supports the conclusion about long-distance atmospheric transport. If the station were near a city, local sources could explain the contamination. A reverses the origin; B is not addressed; D is not a claim in the text.',
        skill: 'Command of Evidence (Textual)',
      },
    },
    {
      id: '3-3',
      passage: {
        title: 'The Garden',
        text: `Mrs. Kimura had kept the garden for forty years, long after her husband passed and long after the neighborhood had changed around her. The roses she had planted as a bride now climbed two stories up the trellis, their roots so deep that the city's attempt to widen the sidewalk had been quietly abandoned. Her neighbors, most of whom had arrived within the last decade, regarded the garden with a mixture of admiration and bewilderment — this impossibly lush rectangle of color amid the concrete, tended by a woman who spoke to her plants in Japanese and seemed to hear their answers.`,
        source: 'Adapted from Yuki Tanaka, "Roots" (2023)',
      },
      question: {
        stem: 'The description of the roses\' roots causing the city to abandon sidewalk widening most likely serves to convey:',
        choices: [
          { label: 'A', text: "The city's general neglect of infrastructure maintenance" },
          { label: 'B', text: "The garden's deep, immovable presence in a changing landscape" },
          { label: 'C', text: "Mrs. Kimura's political influence in her community" },
          { label: 'D', text: 'The impracticality of growing roses in urban settings' },
        ],
        correctAnswer: 1,
        explanation: 'The detail about roots "so deep" that the city abandoned its plans symbolizes the garden\'s — and by extension Mrs. Kimura\'s — deep, enduring presence amid neighborhood change. The passage emphasizes permanence vs. change. A misreads the cause; C attributes political power not mentioned; D contradicts the garden\'s thriving description.',
        skill: 'Text Structure and Purpose',
      },
    },
  ],
];

export default function DemoPage() {
  const [setIdx, setSetIdx] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [results, setResults] = useState<{ questionId: string; skill: string; correct: boolean }[]>([]);

  useEffect(() => {
    setSetIdx(Math.floor(Math.random() * DEMO_SETS.length));
  }, []);

  const currentSet = DEMO_SETS[setIdx];
  const currentItem = currentSet[currentQ];

  const handleSubmit = () => {
    if (selected === null) return;
    setRevealed(true);
  };

  const handleNext = () => {
    const isCorrect = selected === currentItem.question.correctAnswer;
    if (isCorrect) setCorrectCount(c => c + 1);
    setResults(r => [...r, { questionId: currentItem.id, skill: currentItem.question.skill, correct: isCorrect }]);

    if (currentQ < currentSet.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setRevealed(false);
      setCompleted(completed + 1);
    } else {
      setCompleted(currentSet.length);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">SAT Prep</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-gray-400 mr-2">Like what you see?</span>
            <Link href="/register" className="btn-primary !py-1.5 !px-4 text-sm">
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium px-3 py-1 rounded-full mb-3">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Digital SAT Format — No account needed
          </span>
          <h1 className="text-xl font-bold text-gray-900">Try Digital SAT Reading & Writing</h1>
          <p className="text-sm text-gray-500 mt-1">Short passage + 1 question each — just like the real Digital SAT</p>
        </div>

        {/* Completed state */}
        {completed >= currentSet.length && (
          <div className="max-w-lg mx-auto text-center py-12 animate-fade-in">
            <div className={clsx('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5',
              correctCount === currentSet.length ? 'bg-emerald-50' : correctCount > 0 ? 'bg-amber-50' : 'bg-red-50'
            )}>
              {correctCount === currentSet.length ? (
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : correctCount > 0 ? (
                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {correctCount === currentSet.length ? 'Perfect score!' : correctCount > 0 ? 'Good effort!' : 'Keep practicing!'}
            </h2>
            <p className="text-2xl font-bold text-primary-600 mb-2">{correctCount} / {currentSet.length} correct</p>
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {results.map((r, i) => (
                <div key={r.questionId} className="flex items-center gap-1.5 text-sm">
                  <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white', r.correct ? 'bg-emerald-500' : 'bg-red-400')}>
                    {i + 1}
                  </span>
                  <span className="text-gray-500">{r.skill}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 mb-2">You just experienced the Digital SAT format — short passages with one question each.</p>
            <p className="text-sm text-gray-400 mb-8">The full platform includes adaptive diagnostics, AI-generated exercises targeting your weak spots, detailed progress analytics, and a personal AI coach.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-3 shadow-lg shadow-primary-500/25">
                Create Free Account
              </Link>
              <button
                onClick={() => { setSetIdx(Math.floor(Math.random() * DEMO_SETS.length)); setCurrentQ(0); setSelected(null); setRevealed(false); setCompleted(0); setCorrectCount(0); setResults([]); }}
                className="btn-secondary px-6 py-3"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Question area */}
        {completed < currentSet.length && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Question {currentQ + 1} of {currentSet.length}</span>
              <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-xs">{currentItem.question.skill}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Passage */}
              <div className="card lg:sticky lg:top-4">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <h2 className="font-semibold text-gray-900">{currentItem.passage.title}</h2>
                </div>
                <PassageText text={currentItem.passage.text} />
                <p className="text-xs text-gray-400 mt-4 italic">{currentItem.passage.source}</p>
              </div>

              {/* Question + Choices */}
              <div className="space-y-4">
                <div className="card">
                  <p className="font-medium text-gray-900 mb-5 leading-relaxed">{currentItem.question.stem}</p>
                  <div className="space-y-2.5">
                    {currentItem.question.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => !revealed && setSelected(idx)}
                        disabled={revealed}
                        className={clsx(
                          'w-full text-left p-3.5 rounded-lg border-2 transition-all duration-150 text-sm leading-relaxed',
                          revealed
                            ? idx === currentItem.question.correctAnswer
                              ? 'border-emerald-400 bg-emerald-50'
                              : idx === selected && idx !== currentItem.question.correctAnswer
                                ? 'border-red-400 bg-red-50'
                                : 'border-gray-100 bg-gray-50/50 opacity-60'
                            : selected === idx
                              ? 'border-primary-400 bg-primary-50 shadow-sm'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50',
                        )}
                      >
                        <span className={clsx(
                          'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mr-3',
                          revealed
                            ? idx === currentItem.question.correctAnswer
                              ? 'bg-emerald-200 text-emerald-800'
                              : idx === selected && idx !== currentItem.question.correctAnswer
                                ? 'bg-red-200 text-red-800'
                                : 'bg-gray-100 text-gray-500'
                            : selected === idx
                              ? 'bg-primary-200 text-primary-800'
                              : 'bg-gray-100 text-gray-500',
                        )}>
                          {choice.label}
                        </span>
                        {choice.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                {revealed && (
                  <div className={clsx(
                    'card animate-slide-up',
                    selected === currentItem.question.correctAnswer
                      ? '!border-emerald-200 !bg-emerald-50'
                      : '!border-red-200 !bg-red-50',
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {selected === currentItem.question.correctAnswer ? (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                      <p className="font-semibold">{selected === currentItem.question.correctAnswer ? 'Correct!' : 'Incorrect'}</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{currentItem.question.explanation}</p>
                    <p className="text-xs text-gray-400 mt-3 italic">On the full platform, you get AI step-by-step reasoning, similar practice questions, and spaced review for questions you miss.</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex justify-end gap-3">
                  {!revealed && (
                    <button
                      onClick={handleSubmit}
                      disabled={selected === null}
                      className="btn-primary"
                    >
                      Submit Answer
                    </button>
                  )}
                  {revealed && (
                    <button onClick={handleNext} className="btn-primary flex items-center gap-1.5">
                      {currentQ < currentSet.length - 1 ? 'Next Question' : 'See Results'}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  )}
                  </div>
                  {selected === null && !revealed && (
                    <p className="text-xs text-gray-400 mt-1">Select an answer to continue</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
