import { DataSource } from 'typeorm';
import { KnowledgeBaseEntry, KnowledgeBaseType } from '../entities/knowledge-base-entry.entity';

export async function seedKnowledgeBase(dataSource: DataSource): Promise<void> {
  const entryRepo = dataSource.getRepository(KnowledgeBaseEntry);

  console.log('Seeding knowledge base entries...');

  const entries: Partial<KnowledgeBaseEntry>[] = [
    {
      type: KnowledgeBaseType.STRATEGY,
      title: 'Active Reading Strategy',
      content: `Active reading is the most important skill for SAT Reading success. Instead of passively reading the passage, engage with the text:

1. Read the blurb first - it tells you the source, date, and context
2. Annotate as you read - underline main ideas, circle key terms, bracket important details
3. Pause after each paragraph to summarize the main point in 5 words or fewer
4. Note the author's tone and purpose as you read
5. Pay attention to transition words (however, moreover, nevertheless) - they signal shifts in argument

This approach takes slightly more time upfront but saves significant time when answering questions because you already have a mental map of the passage.`,
      tags: ['reading', 'strategy', 'fundamentals'],
      skills: ['information_ideas.central_ideas', 'craft_structure.text_structure'],
      passageTypes: [],
    },
    {
      type: KnowledgeBaseType.STRATEGY,
      title: 'Eliminating Wrong Answers (POE)',
      content: `Process of Elimination (POE) is often more effective than trying to find the right answer directly:

1. Read the question stem carefully - understand exactly what is being asked
2. Go back to the passage to find evidence before looking at choices
3. Eliminate choices that are:
   - Too extreme (always, never, completely, all)
   - Not supported by the passage (even if true in general)
   - Only partially correct (addresses part of the question)
   - Opposite of what the passage says
4. Compare remaining choices - the correct answer is the one best supported by the text
5. If stuck between two, look for the specific line or phrase that supports one over the other

Remember: every correct answer has direct evidence in the passage.`,
      tags: ['strategy', 'test-taking', 'elimination'],
      skills: ['information_ideas.command_of_evidence_textual'],
      passageTypes: [],
    },
    {
      type: KnowledgeBaseType.GUIDE,
      title: 'Literature Passage Guide',
      content: `Literature passages on the SAT are typically excerpts from novels or short stories. They test your ability to understand narrative elements:

Key elements to identify:
- Narrator's perspective (first person, third person, omniscient)
- Character motivations and relationships
- Tone and mood (is the narrator reflective, critical, nostalgic?)
- Use of literary devices (metaphor, imagery, symbolism)

Common question types for literature:
- How does the narrator view a character?
- What is the purpose of a specific description?
- What does a phrase or word suggest in context?
- How does the passage's mood shift?

Tips:
- Pay close attention to dialogue and internal thoughts
- Note changes in tone across the passage
- Don't impose your own interpretation - stick to what the text explicitly shows`,
      tags: ['guide', 'literature', 'passage-type'],
      skills: ['passage_type_proficiency.literature_passages'],
      passageTypes: ['literature'],
    },
    {
      type: KnowledgeBaseType.GUIDE,
      title: 'Science Passage Guide',
      content: `Science passages present research findings, experiments, or scientific concepts. You don't need prior science knowledge - everything you need is in the passage.

Reading approach:
1. Identify the main claim or hypothesis
2. Understand the experimental method (if applicable)
3. Note the results and whether they support or contradict the hypothesis
4. Pay attention to data references (tables, graphs)
5. Identify the author's conclusion and any limitations mentioned

Common question types:
- What conclusion does the data support?
- Which finding best supports the author's claim?
- What would weaken/strengthen the argument?
- What does the author imply about the results?

Tips:
- Don't be intimidated by technical vocabulary - context clues will help
- Focus on the logical structure, not memorizing details
- When graphs/tables are referenced, look at trends, not individual numbers`,
      tags: ['guide', 'science', 'passage-type'],
      skills: ['passage_type_proficiency.science_passages'],
      passageTypes: ['science'],
    },
    {
      type: KnowledgeBaseType.GUIDE,
      title: 'History/Social Studies Passage Guide',
      content: `History passages often include historical documents, speeches, or analyses of historical events. They test your ability to understand arguments and rhetoric.

Key elements:
- The historical context (when and why was this written?)
- The author's purpose and audience
- The central argument or thesis
- Use of evidence and reasoning
- Rhetorical strategies (appeals to emotion, logic, authority)

For paired passages:
- Read Passage 1 completely, then answer its questions
- Read Passage 2, then answer its questions
- Finally, answer the comparison questions
- Note points of agreement and disagreement between the passages

Tips:
- The blurb is especially important for historical context
- Don't let archaic language intimidate you - focus on the main ideas
- For founding documents, focus on the logical argument structure`,
      tags: ['guide', 'history', 'passage-type'],
      skills: ['passage_type_proficiency.history_passages', 'craft_structure.cross_text_connections'],
      passageTypes: ['history'],
    },
    {
      type: KnowledgeBaseType.STRATEGY,
      title: 'Words in Context Strategy',
      content: `"Words in Context" questions ask you to determine what a word means as used in a specific passage. The answer is almost never the most common definition.

Strategy:
1. Read the sentence containing the word
2. Read 1-2 sentences before and after for context
3. Cover the word and try to predict what word would fit
4. Look at the answer choices and find the closest match to your prediction
5. Plug your answer back into the sentence to verify it makes sense

Common traps:
- The most common definition of the word (this is usually wrong)
- A word that sounds sophisticated but changes the meaning
- A word that works in the sentence but doesn't match the author's intended meaning

Example: "The study yielded surprising results" - "yielded" here means "produced," not "gave way to" or "surrendered."`,
      tags: ['strategy', 'vocabulary', 'words-in-context'],
      skills: ['craft_structure.words_in_context'],
      passageTypes: [],
    },
    {
      type: KnowledgeBaseType.STRATEGY,
      title: 'Command of Evidence Strategy',
      content: `Evidence questions come in two forms:
1. "Which choice provides the best evidence for the answer to the previous question?"
2. Questions that ask you to identify what evidence supports a claim

Strategy for paired evidence questions:
1. Answer the first question based on your reading of the passage
2. Look at the evidence choices for the second question
3. Find the quote that directly supports your answer to the first question
4. If no evidence matches, reconsider your answer to the first question

Key principles:
- The correct evidence must DIRECTLY support the answer, not just be related to the topic
- Be wary of evidence that mentions the right topic but doesn't actually prove the point
- Sometimes you need to work backwards from the evidence to find the right answer to the first question

This is where annotation pays off - if you've marked key ideas while reading, you can quickly find relevant evidence.`,
      tags: ['strategy', 'evidence', 'paired-questions'],
      skills: ['information_ideas.command_of_evidence_textual'],
      passageTypes: [],
    },
    {
      type: KnowledgeBaseType.STRATEGY,
      title: 'Inference Questions Strategy',
      content: `Inference questions ask you to draw conclusions that are not explicitly stated but are strongly supported by the text.

Key rule: SAT inferences are SMALL logical steps, not big leaps. If an inference feels like a stretch, it's probably wrong.

Strategy:
1. Identify what the question is really asking
2. Find the relevant section of the passage
3. Look for what the author implies through word choice, examples, or structure
4. Choose the answer that requires the smallest logical leap from the text

Types of inference questions:
- "It can be inferred from the passage that..."
- "The author most likely believes that..."
- "The passage suggests that..."
- "Based on the passage, one could conclude that..."

Common traps:
- Answers that are true but not supported by this specific passage
- Answers that go too far beyond what the text implies
- Answers that contradict the author's tone or perspective`,
      tags: ['strategy', 'inference', 'reasoning'],
      skills: ['information_ideas.inferences'],
      passageTypes: [],
    },
    {
      type: KnowledgeBaseType.STRATEGY,
      title: 'Time Management Strategy',
      content: `The Digital SAT Reading & Writing section has 2 modules of 27 questions each, with 32 minutes per module. Each question has its own short passage (25-150 words).

Recommended pace:
- About 71 seconds per question (read passage + answer)
- Short passages mean faster reading, more time for reasoning

Time-saving tips:
1. Read the passage first, then the question - short passages take 15-30 seconds to read
2. Skip questions you find difficult and come back later
3. Never spend more than 2 minutes on a single question
4. For vocabulary-in-context questions, focus on the sentence containing the word
5. For evidence questions, identify the claim first, then find support

Module strategy:
- Module 1 determines the difficulty of Module 2
- Performing well on Module 1 gives you harder (but higher-scoring) questions in Module 2
- Focus on accuracy in Module 1

Remember: every question is worth the same within a module, so don't waste time on hard questions when easy ones remain.`,
      tags: ['strategy', 'timing', 'test-day'],
      skills: [],
      passageTypes: [],
    },
    {
      type: KnowledgeBaseType.VOCABULARY,
      title: 'High-Frequency SAT Vocabulary',
      content: `These words frequently appear in SAT Reading passages and answer choices:

Tone/Attitude words:
- ambivalent (having mixed feelings)
- didactic (intended to teach)
- sardonic (mocking, cynical)
- reverent (showing deep respect)
- pragmatic (practical, realistic)
- skeptical (doubtful)
- emphatic (forceful, definite)

Argument words:
- substantiate (provide evidence for)
- refute (prove wrong)
- corroborate (confirm, support)
- undermine (weaken)
- qualify (limit, add conditions to)
- concede (admit, acknowledge)

Passage description words:
- nuanced (having subtle differences)
- comprehensive (thorough, complete)
- cursory (hasty, superficial)
- anecdotal (based on personal stories, not data)
- empirical (based on observation/experiment)
- theoretical (based on theory, not practice)

Understanding these words is crucial for both comprehending passages and correctly interpreting answer choices.`,
      tags: ['vocabulary', 'high-frequency', 'word-list'],
      skills: ['craft_structure.words_in_context'],
      passageTypes: [],
    },
    {
      type: KnowledgeBaseType.STRATEGY,
      title: 'Text Structure & Purpose Questions',
      content: `These questions ask about HOW and WHY the author organized the passage or used specific elements.

Common question formats:
- "The primary purpose of the passage is to..."
- "The author includes the example in lines X-Y in order to..."
- "The function of the third paragraph is to..."
- "How does the author develop the central claim?"

Strategy:
1. Think about the role each paragraph plays in the overall argument
2. Ask yourself: Why did the author include this? What would be lost without it?
3. Look for structural signals: topic sentences, transitions, counterarguments

Common purposes of passage elements:
- Anecdote at the beginning → engage the reader, introduce the topic concretely
- Statistics/data → provide evidence for a claim
- Counterargument → acknowledge opposing view before refuting it
- Example → illustrate an abstract concept
- Quote from expert → add authority to the argument
- Rhetorical question → provoke thought, emphasize a point

The wrong answers often describe what the element says rather than why it's there.`,
      tags: ['strategy', 'structure', 'purpose'],
      skills: ['craft_structure.text_structure'],
      passageTypes: [],
    },
    {
      type: KnowledgeBaseType.GUIDE,
      title: 'Paired Passage Strategy',
      content: `Paired passages present two texts on a related topic, usually with different perspectives. They test your ability to synthesize information across texts.

Approach:
1. Read Passage 1 fully and answer questions about it alone
2. Read Passage 2 fully and answer questions about it alone
3. Then tackle the comparison/synthesis questions

Types of synthesis questions:
- How would Author 1 respond to Author 2's claim?
- On what point do both authors agree/disagree?
- How do the passages differ in their approach to the topic?
- What evidence from Passage 1 relates to Passage 2's argument?

Tips:
- Focus on the central claim of each passage
- Note the tone difference between the two authors
- Don't assume the passages must disagree - they might agree on some points
- For "how would Author X respond" questions, stay true to that author's stated views
- Mark key claims and evidence in both passages before attempting synthesis questions`,
      tags: ['strategy', 'synthesis', 'paired-passages'],
      skills: ['expression_of_ideas.rhetorical_synthesis'],
      passageTypes: [],
    },
  ];

  for (const entry of entries) {
    const existing = await entryRepo.findOne({ where: { title: entry.title! } });
    if (existing) {
      await entryRepo.update(existing.id, entry);
    } else {
      await entryRepo.save(entryRepo.create(entry));
    }
  }

  console.log(`Knowledge base seeded with ${entries.length} entries.`);
}
