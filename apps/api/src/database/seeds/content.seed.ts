import { DataSource, In } from 'typeorm';
import { createHash } from 'crypto';
import { Passage, PassageType } from '../entities/passage.entity';
import { Question } from '../entities/question.entity';
import { Exercise, ExerciseType } from '../entities/exercise.entity';
import { Skill } from '../entities/skill.entity';
import { SKILL_ID_MIGRATION_MAP } from '@sat/shared';

const shortIdFromUuid = (uuid: string): string =>
  createHash('md5').update(uuid).digest('hex').substring(0, 8);

// ── Deterministic UUIDs ──
const P = (n: number) =>
  `00000000-0000-0000-0000-${n.toString().padStart(12, '0')}`;
const Q = (n: number) =>
  `10000000-0000-0000-0000-${n.toString().padStart(12, '0')}`;
const E = (n: number) =>
  `20000000-0000-0000-0000-${n.toString().padStart(12, '0')}`;

// Passage IDs
const PASSAGE_IDS = {
  lit1: P(1),
  lit2: P(2),
  hist1: P(3),
  hist2: P(4),
  sci1: P(5),
  sci2: P(6),
  soc1: P(7),
  soc2: P(8),
  // Batch 2 passages
  lit3: P(9),
  lit4: P(10),
  hist3: P(11),
  hist4: P(12),
  sci3: P(13),
  sci4: P(14),
  soc3: P(15),
  soc4: P(16),
};

export async function seedContent(dataSource: DataSource): Promise<void> {
  const passageRepo = dataSource.getRepository(Passage);
  const questionRepo = dataSource.getRepository(Question);
  const exerciseRepo = dataSource.getRepository(Exercise);
  const skillRepo = dataSource.getRepository(Skill);

  // ════════════════════════════════════════════════════════════════════
  // PASSAGES
  // ════════════════════════════════════════════════════════════════════
  console.log('Seeding passages...');

  const passages = [
    {
      id: PASSAGE_IDS.lit1,
      title: 'The Vanishing Light',
      type: PassageType.LITERATURE,
      difficulty: 2,
      source: 'Adapted from Clara Weston, "The Vanishing Light" (2019)',
      text: `Elena stood at the edge of the pier, watching the last traces of sunlight dissolve into the harbor. The water, which had been a brilliant cerulean only minutes before, was now the color of old pewter. She pulled her cardigan tighter, though it wasn't the chill that made her shiver—it was the silence. For twenty years this harbor had been her morning alarm, a cacophony of diesel engines, shouting fishermen, and the percussive slap of hulls against the dock. Now the fleet was gone, sold off to pay debts that had accumulated like barnacles on an untended keel.

She reached into her pocket and felt the folded letter—the offer from the city planning office. A "waterfront revitalization initiative," they called it. Boutique hotels. Artisan coffee shops. Kayak rental stations. The language was deliberately cheerful, engineered to make displacement sound like progress. Her grandmother would have called it what it was: erasure.

Yet Elena could not ignore the pragmatic voice in the back of her mind. The fishing cooperative had failed. The cold-storage warehouse sat empty. Her neighbors had already accepted buyout checks and moved inland. To refuse the offer was to choose sentiment over survival, and Elena had never been the sentimental type—or so she had always told herself. Standing here now, with the phantom sounds of the old harbor ringing in her ears, she was no longer sure.`,
      wordCount: 213,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.lit2,
      title: 'An Unexpected Visitor',
      type: PassageType.LITERATURE,
      difficulty: 3,
      source: 'Adapted from James Harlow, "The Cartographer\'s Daughter" (2017)',
      text: `The knock came at half past ten, an hour when respectable visitors had long since retreated to their parlors. Margaret set down her pen—she had been transcribing her father's field notes, a task that demanded both patience and a magnifying glass—and moved toward the door with the cautious deliberation of a woman who lived alone and preferred it that way.

The man on her doorstep was perhaps sixty, with the weathered complexion of someone who had spent decades outdoors and the restless eyes of someone who had spent those decades looking for something specific. He carried a leather satchel that bulged with papers and introduced himself as Professor Calloway from the Royal Geographical Society.

"Your father," he said, before Margaret could speak, "made a map in 1887 that the Society now believes to be of considerable significance." He paused, perhaps expecting excitement. Margaret offered none. She had grown up surrounded by her father's maps—topographic surveys of unnamed mountain ranges, coastal charts of islands that appeared on no other record—and she knew that "considerable significance" in academic circles often translated to "we would like to claim credit for someone else's work."

"You may come in," she said at last, stepping aside. "But I should warn you, Professor: my father's maps are not for sale, and neither is my cooperation."`,
      wordCount: 208,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.hist1,
      title: 'The Seneca Falls Convention and American Democracy',
      type: PassageType.HISTORY,
      difficulty: 3,
      source: 'Adapted from a speech by Elizabeth Cady Stanton, Seneca Falls Convention (1848)',
      text: `We hold these truths to be self-evident: that all men and women are created equal; that they are endowed by their Creator with certain inalienable rights; that among these are life, liberty, and the pursuit of happiness. The history of mankind is a history of repeated injuries and usurpations on the part of man toward woman, having in direct object the establishment of an absolute tyranny over her.

He has never permitted her to exercise her inalienable right to the elective franchise. He has compelled her to submit to laws in the formation of which she had no voice. He has made her, if married, in the eye of the law, civilly dead. He has taken from her all right in property, even to the wages she earns.

Now, in view of this entire disfranchisement of one-half the people of this country, and because women do feel themselves aggrieved, oppressed, and fraudulently deprived of their most sacred rights, we insist that they have immediate admission to all the rights and privileges which belong to them as citizens of the United States. In entering upon the great work before us, we anticipate no small amount of misconception, misrepresentation, and ridicule; but we shall use every instrumentality within our power to effect our object.`,
      wordCount: 200,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.hist2,
      title: 'The Philosophy of Civil Disobedience',
      type: PassageType.HISTORY,
      difficulty: 4,
      source: 'Adapted from Henry David Thoreau, "Civil Disobedience" (1849)',
      text: `I heartily accept the motto, "That government is best which governs least"; and I should like to see it acted up to more rapidly and systematically. Carried out, it finally amounts to this, which I also believe: "That government is best which governs not at all"; and when men are prepared for it, that will be the kind of government which they will have. Government is at best but an expedient; but most governments are usually, and all governments are sometimes, inexpedient.

The objections which have been brought against a standing army, and they are many and weighty, and deserve to prevail, may also at last be brought against a standing government. The standing army is only an arm of the standing government. The government itself, which is only the mode which the people have chosen to execute their will, is equally liable to be abused and perverted before the people can act through it.

Must the citizen ever for a moment, or in the least degree, resign his conscience to the legislator? Why has every man a conscience then? I think that we should be men first and subjects afterward. It is not desirable to cultivate a respect for the law, so much as for the right. The only obligation which I have a right to assume is to do at any time what I think right.`,
      wordCount: 210,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.sci1,
      title: 'CRISPR and the Future of Gene Editing',
      type: PassageType.SCIENCE,
      difficulty: 3,
      source: 'Adapted from "Advances in Molecular Biology" (2021)',
      text: `The discovery of CRISPR-Cas9 has fundamentally transformed the landscape of genetic research. CRISPR, which stands for Clustered Regularly Interspaced Short Palindromic Repeats, is a naturally occurring defense mechanism found in bacteria. When a virus attacks a bacterium, the bacterium incorporates small fragments of the viral DNA into its own genome, creating a molecular "memory" of the infection. If the same virus attacks again, the bacterium produces RNA sequences that match the viral DNA, guiding the Cas9 protein to locate and cut the invading genetic material.

Scientists Jennifer Doudna and Emmanuelle Charpentier recognized that this bacterial immune system could be repurposed as a precise gene-editing tool. By designing synthetic guide RNA sequences, researchers can now direct Cas9 to virtually any location in an organism's genome, where it creates a targeted double-strand break. The cell's natural repair mechanisms then either disable the gene or incorporate a new sequence provided by the researchers.

The implications are staggering. In agriculture, CRISPR has been used to develop disease-resistant crops and improve nutritional profiles. In medicine, clinical trials are underway for treatments targeting sickle cell disease, certain cancers, and hereditary blindness. However, the technology also raises profound ethical questions, particularly regarding germline editing—modifications that would be inherited by future generations. The scientific community continues to debate where the boundary between therapeutic intervention and enhancement should be drawn.`,
      wordCount: 214,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.sci2,
      title: 'The Microbiome and Human Health',
      type: PassageType.SCIENCE,
      difficulty: 4,
      source: 'Adapted from "Journal of Microbiology Research" (2022)',
      text: `The human body harbors approximately 38 trillion microorganisms, a population that rivals the total number of human cells. Collectively known as the microbiome, these bacteria, fungi, viruses, and archaea inhabit virtually every surface of the body, though they are most densely concentrated in the gastrointestinal tract. Far from being passive hitchhikers, these microbial communities perform functions essential to human health that the body cannot accomplish on its own.

The gut microbiome, in particular, plays a critical role in digestion, synthesizing vitamins K and B12, breaking down complex carbohydrates, and producing short-chain fatty acids that nourish the cells lining the colon. Perhaps more surprisingly, research over the past decade has revealed extensive communication between gut microbes and the central nervous system through what scientists call the gut-brain axis. This bidirectional signaling pathway involves the vagus nerve, immune mediators, and microbial metabolites, and has been implicated in conditions ranging from anxiety and depression to neurodegenerative diseases.

A landmark 2019 study published in Nature demonstrated that transplanting gut microbiota from patients with depression into germ-free mice produced depressive-like behaviors in the animals, providing compelling evidence for a causal relationship. Subsequent research has identified specific bacterial species—notably Lactobacillus and Bifidobacterium—whose abundance correlates with improved mood regulation. These findings have opened an entirely new frontier in psychiatry, raising the possibility that targeted probiotic interventions could complement or even replace traditional pharmacological treatments for certain mental health conditions.`,
      wordCount: 222,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.soc1,
      title: 'The Economics of Universal Basic Income',
      type: PassageType.SOCIAL_SCIENCE,
      difficulty: 3,
      source: 'Adapted from "Contemporary Economic Policy Review" (2023)',
      text: `Universal Basic Income (UBI) is a social policy proposal in which every adult citizen receives a regular, unconditional cash payment from the government, regardless of employment status or income level. Proponents argue that UBI could address several interconnected challenges of the modern economy: rising income inequality, job displacement caused by automation, and the bureaucratic inefficiency of existing welfare programs that often fail to reach those most in need.

The most frequently cited pilot program took place in Stockton, California, from 2019 to 2021. The Stockton Economic Empowerment Demonstration (SEED) provided 125 residents with $500 per month in unconditional cash transfers. Contrary to the common objection that free money would discourage work, recipients were actually more likely to find full-time employment than members of the control group. The additional financial security allowed participants to take time for job searches, pursue education, and manage childcare—activities that ultimately improved their economic productivity.

Critics, however, raise significant concerns about scalability. A nationwide UBI program providing $1,000 per month to every American adult would cost approximately $3 trillion annually, roughly equivalent to the entire federal discretionary budget. Funding such a program would require substantial tax increases, reductions in other government spending, or both. Economists remain divided on whether the downstream economic benefits—increased consumer spending, reduced healthcare costs, lower crime rates—would offset the fiscal burden.`,
      wordCount: 212,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.soc2,
      title: 'Language Extinction and Cultural Identity',
      type: PassageType.SOCIAL_SCIENCE,
      difficulty: 5,
      source: 'Adapted from "Annual Review of Linguistics" (2022)',
      text: `Of the roughly 7,000 languages currently spoken worldwide, linguists estimate that nearly half will fall silent by the end of this century. Language death—the process by which a language loses its last native speakers—is not a new phenomenon; languages have always emerged, evolved, and disappeared. What is unprecedented is the current rate of extinction, which far outpaces the historical baseline and is driven by globalization, urbanization, and the dominance of a handful of lingua francas in education, commerce, and digital communication.

The consequences of language loss extend far beyond the merely linguistic. Each language encodes a unique cognitive framework—a particular way of categorizing experience, marking social relationships, and structuring narrative. The Hopi language, for example, does not grammatically distinguish between past, present, and future in the way that English does, leading some researchers to hypothesize that Hopi speakers conceptualize time differently. When a language disappears, this cognitive architecture vanishes with it, along with centuries of accumulated ecological knowledge, oral literature, and cultural practice.

Revitalization efforts have achieved notable successes. Hebrew was resurrected as a spoken language after nearly two millennia of existing primarily as a liturgical tongue. The Maori language, once in precipitous decline in New Zealand, has stabilized through immersion schooling programs and official language policies. Yet these examples required extraordinary political will and institutional support—resources that the vast majority of endangered languages lack. The central tension in language preservation is whether external intervention can succeed when the economic incentives facing individual speakers overwhelmingly favor linguistic assimilation.`,
      wordCount: 237,
      reviewStatus: 'approved',
    },

    // ══════════════════════════════════════════════════════════════
    // BATCH 2: Additional passages for content diversity
    // ══════════════════════════════════════════════════════════════

    {
      id: PASSAGE_IDS.lit3,
      title: 'The Summer I Learned to See',
      type: PassageType.LITERATURE,
      difficulty: 1,
      source: 'Adapted from Rosa Nguyen, "The Summer I Learned to See" (2021)',
      text: `The summer I turned twelve, my grandmother taught me to identify birds by their songs alone. We would sit on her back porch before dawn, coffee for her and cocoa for me, while the darkness slowly peeled away from the sky like old wallpaper. "Close your eyes," she would say. "Your ears will tell you more than you think."

At first I heard only noise—a jumbled chorus with no meaning. But Grandmother was patient. She would isolate each call, humming it back to me and whispering its owner's name. The sharp, insistent chip-chip of the cardinal. The liquid tumble of the wood thrush. The lazy, descending whistle of the chickadee. Within two weeks, I could distinguish a dozen species without opening my eyes.

What surprised me was how this new skill changed the way I moved through the world even after summer ended. Walking to school in September, I noticed the mockingbird that perched on the telephone wire every morning—a bird I must have passed hundreds of times without registering its existence. My ears had taught my eyes to pay attention. Grandmother called this "learning to see," and she insisted it applied to people as well as birds. "Most folks go through life with their eyes wide open and their attention turned off," she told me. I have tried, ever since, to keep mine switched on.`,
      wordCount: 210,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.lit4,
      title: 'The Collector of Lost Things',
      type: PassageType.LITERATURE,
      difficulty: 4,
      source: 'Adapted from Marcus Fell, "The Collector of Lost Things" (2018)',
      text: `Renata had always understood that memory was unreliable, but she had not appreciated just how creatively unreliable it could be until she began cataloguing her late mother's belongings. The apartment, untouched for three months after the funeral, was a museum of contradictions. In the kitchen drawer: seven corkscrews but no wine. In the bedroom closet: hiking boots still bearing dried mud from a trail Renata was certain her mother had never walked. Under the bed: a cigar box containing forty-three foreign coins and a photograph of a man Renata did not recognize, his arm draped over her mother's shoulder with the casual intimacy of long familiarity.

Each object invited a story, but the stories refused to cohere. The mother Renata had known—meticulous, cautious, a woman who balanced her checkbook to the penny—seemed incompatible with the evidence accumulating around her. It was as though the apartment belonged to a stranger who happened to share her mother's name and face.

Renata considered the possibility that she had simply been an inattentive daughter, but dismissed it. The more unsettling explanation was that her mother had been, quite deliberately, two people: the one she presented to her family and the one she kept for herself. The apartment was the second woman's territory, and Renata, holding an unfamiliar man's photograph, felt distinctly like a trespasser.`,
      wordCount: 215,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.hist3,
      title: 'Learning to Read',
      type: PassageType.HISTORY,
      difficulty: 1,
      source: 'Adapted from Frederick Douglass, "Narrative of the Life of Frederick Douglass" (1845)',
      text: `Very soon after I went to live with Mr. and Mrs. Auld, she very kindly commenced to teach me the A, B, C. After I had learned this, she assisted me in learning to spell words of three or four letters. Just at this point of my progress, Mr. Auld found out what was going on, and at once forbade Mrs. Auld to instruct me further, telling her that it was unlawful, as well as unsafe, to teach a slave to read. "If you give a nigger an inch, he will take an ell," he said. "Learning would spoil the best nigger in the world."

These words sank deep into my heart. From that moment, I understood the pathway from slavery to freedom. What Mr. Auld most dreaded, that I most desired. The very decision which he so warmly urged against, was the one which I most firmly resolved to embrace.

I now understood the white man's power to enslave the black man. It was a grand achievement, and I prized it highly. Though conscious of the difficulty of learning without a teacher, I set out with high hope and a fixed purpose, at whatever cost of trouble, to learn how to read. The first step had been taken. Mistress, in teaching me the alphabet, had given me the inch, and no precaution could prevent me from taking the ell.`,
      wordCount: 218,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.hist4,
      title: 'On the Necessity of Checks and Balances',
      type: PassageType.HISTORY,
      difficulty: 5,
      source: 'Adapted from Alexander Hamilton and James Madison, "The Federalist No. 51" (1788)',
      text: `But the great security against a gradual concentration of the several powers in the same department consists in giving to those who administer each department the necessary constitutional means and personal motives to resist encroachments of the others. Ambition must be made to counteract ambition. The interest of the man must be connected with the constitutional rights of the place.

It may be a reflection on human nature that such devices should be necessary to control the abuses of government. But what is government itself but the greatest of all reflections on human nature? If men were angels, no government would be necessary. If angels were to govern men, neither external nor internal controls on government would be necessary. In framing a government which is to be administered by men over men, the great difficulty lies in this: you must first enable the government to control the governed; and in the next place oblige it to control itself.

A dependence on the people is, no doubt, the primary control on the government; but experience has taught mankind the necessity of auxiliary precautions. This policy of supplying, by opposite and rival interests, the defect of better motives, might be traced through the whole system of human affairs, private as well as public. We see it particularly displayed in all the subordinate distributions of power, where the constant aim is to divide and arrange the several offices in such a manner that each may be a check on the other.`,
      wordCount: 226,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.sci3,
      title: 'How Plants Capture Sunlight',
      type: PassageType.SCIENCE,
      difficulty: 1,
      source: 'Adapted from "Introduction to Plant Biology" (2020)',
      text: `Photosynthesis is the process by which green plants convert sunlight, water, and carbon dioxide into glucose and oxygen. This remarkable chemical reaction takes place primarily in the leaves, within tiny structures called chloroplasts. Each chloroplast contains a green pigment known as chlorophyll, which absorbs light energy—particularly from the red and blue portions of the visible spectrum—while reflecting green wavelengths, giving leaves their characteristic color.

The process occurs in two main stages. In the light-dependent reactions, chlorophyll absorbs sunlight and uses that energy to split water molecules into hydrogen and oxygen. The oxygen is released into the atmosphere as a byproduct, while the hydrogen atoms and their associated energy are stored in carrier molecules called ATP and NADPH. In the second stage, known as the Calvin cycle, these carrier molecules power the conversion of carbon dioxide from the air into glucose, a simple sugar that the plant uses as food.

The significance of photosynthesis cannot be overstated. It is the foundation of nearly every food chain on Earth, since animals either eat plants directly or eat other animals that depend on plants. Additionally, photosynthesis is responsible for producing the vast majority of the oxygen in our atmosphere. Scientists estimate that photosynthetic organisms generate approximately 300 billion tons of oxygen each year—enough to sustain all aerobic life on the planet.`,
      wordCount: 210,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.sci4,
      title: 'Quantum Entanglement and the Nature of Reality',
      type: PassageType.SCIENCE,
      difficulty: 5,
      source: 'Adapted from "Frontiers in Theoretical Physics" (2023)',
      text: `In 1935, Albert Einstein, Boris Podolsky, and Nathan Rosen published a thought experiment that they believed exposed a fatal flaw in quantum mechanics. The EPR paradox, as it came to be known, described a scenario in which two particles interact and then separate. According to quantum theory, measuring a property of one particle instantaneously determines the corresponding property of the other, regardless of the distance between them. Einstein famously dismissed this prediction as "spooky action at a distance," arguing that it violated the principle that no information can travel faster than light.

For nearly three decades, the EPR paradox remained a philosophical curiosity. Then in 1964, physicist John Bell devised a mathematical inequality—now called Bell's theorem—that could distinguish between quantum mechanics and any theory based on "local hidden variables," the alternative Einstein had favored. If measurements on entangled particles violated Bell's inequality, quantum mechanics would be vindicated.

The experimental verdict has been decisive. Beginning with Alain Aspect's landmark experiments in 1982 and culminating in loophole-free tests by multiple independent groups in 2015, every rigorous experiment has confirmed that entangled particles violate Bell's inequality. The correlations between them are stronger than any classical explanation can account for. This does not mean information travels faster than light—entanglement cannot be used to send messages—but it does mean that our intuitive understanding of separated objects possessing definite, independent properties is fundamentally mistaken.`,
      wordCount: 220,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.soc3,
      title: 'The Power of Conformity',
      type: PassageType.SOCIAL_SCIENCE,
      difficulty: 1,
      source: 'Adapted from "Introduction to Social Psychology" (2021)',
      text: `In the 1950s, psychologist Solomon Asch conducted a series of experiments that revealed just how powerfully social pressure can influence individual judgment. In each trial, a subject was placed in a room with seven other people who appeared to be fellow participants but were actually confederates working with the experimenter. The group was shown a line on a card and asked to identify which of three comparison lines matched it in length. The correct answer was always obvious.

On certain trials, the confederates unanimously gave the same wrong answer. Asch wanted to know whether the real participant would conform to the group's incorrect judgment or trust their own eyes. The results were striking: approximately 75 percent of participants conformed to the wrong answer at least once during the experiment. When interviewed afterward, many conforming participants reported knowing the group was wrong but feeling intense discomfort at the prospect of being the sole dissenter.

Asch also discovered that conformity dropped dramatically when even one confederate broke from the majority and gave the correct answer. The presence of a single ally reduced conformity by nearly 80 percent. This finding suggested that people do not simply follow the crowd out of ignorance or stupidity; rather, they are responding to a deep psychological need to belong and a fear of social rejection. The Asch experiments remain among the most cited studies in psychology and continue to inform research on groupthink, peer pressure, and decision-making.`,
      wordCount: 225,
      reviewStatus: 'approved',
    },
    {
      id: PASSAGE_IDS.soc4,
      title: 'Nudge Theory and the Architecture of Choice',
      type: PassageType.SOCIAL_SCIENCE,
      difficulty: 4,
      source: 'Adapted from "Behavioral Economics Quarterly" (2022)',
      text: `Traditional economic theory assumes that individuals make rational decisions by weighing costs and benefits. Behavioral economists Richard Thaler and Cass Sunstein challenged this assumption with their concept of the "nudge"—a subtle change in the way choices are presented that predictably alters behavior without restricting options or significantly changing economic incentives. Their central insight was that the architecture of a decision—how options are framed, ordered, and defaulted—shapes outcomes at least as much as the options themselves.

Consider organ donation. Countries that require citizens to opt in to donation programs typically have participation rates below 20 percent. Countries that make donation the default—requiring citizens to opt out if they object—often achieve rates above 90 percent. The options are identical in both systems; only the default has changed. Yet this single architectural choice determines whether millions of organs become available for transplant.

Critics argue that nudging is a form of paternalism that undermines individual autonomy. If people's choices can be so easily manipulated by framing effects, the critics contend, then the "choice architect" wields enormous unaccountable power. Thaler and Sunstein respond that choice architecture is inescapable—someone must decide how options are presented—and that nudges are preferable to mandates precisely because they preserve freedom of choice. The debate reveals a fundamental tension in democratic governance: the gap between what people choose and what they would choose if they had unlimited time, information, and cognitive resources.`,
      wordCount: 225,
      reviewStatus: 'approved',
    },
  ];

  await passageRepo.upsert(passages, ['id']);

  // ════════════════════════════════════════════════════════════════════
  // LOAD SKILLS for linking
  // ════════════════════════════════════════════════════════════════════
  const allSkills = await skillRepo.find();
  const skillMap: Record<string, Skill> = {};
  for (const s of allSkills) {
    skillMap[s.id] = s;
  }

  // Helper to get skills by IDs (auto-migrates old skill IDs, deduplicates)
  const migrateSkillId = (id: string): string => SKILL_ID_MIGRATION_MAP[id] || id;
  const getSkills = (ids: string[]): Skill[] => {
    const uniqueIds = [...new Set(ids.map(migrateSkillId))];
    return uniqueIds.map((id) => skillMap[id]).filter(Boolean);
  };

  // ════════════════════════════════════════════════════════════════════
  // QUESTIONS
  // ════════════════════════════════════════════════════════════════════
  console.log('Seeding questions...');

  const questionsData = [
    // ── Passage 1: The Vanishing Light (Literature, difficulty 2) ──
    {
      id: Q(1),
      passageId: PASSAGE_IDS.lit1,
      stem: 'Which choice best describes the central theme of the passage?',
      choices: [
        { label: 'A', text: 'The inevitable triumph of urban development over rural communities' },
        { label: 'B', text: 'The tension between preserving cultural identity and accepting economic reality' },
        { label: 'C', text: 'A woman\'s regret over failing to save a family business' },
        { label: 'D', text: 'The environmental consequences of overfishing in coastal waters' },
      ],
      correctAnswer: 1,
      explanation: 'The passage centers on Elena\'s internal conflict between her emotional attachment to the harbor\'s fishing heritage and the pragmatic need to accept the buyout offer, embodying the tension between cultural identity and economic reality.',
      hint: 'Consider what Elena is struggling to decide and why it is difficult for her.',
      difficulty: 2,
      skillIds: ['information_ideas.central_ideas', 'passage_type_proficiency.literature_passages'],
    },
    {
      id: Q(2),
      passageId: PASSAGE_IDS.lit1,
      stem: 'As used in the passage, "erasure" most nearly means:',
      choices: [
        { label: 'A', text: 'The physical demolition of buildings' },
        { label: 'B', text: 'The systematic elimination of a community\'s history and way of life' },
        { label: 'C', text: 'A clerical error in legal documents' },
        { label: 'D', text: 'The natural fading of memories over time' },
      ],
      correctAnswer: 1,
      explanation: 'Elena\'s grandmother would have called the revitalization plan "erasure" because it would eliminate the fishing community\'s identity and history, replacing it with something entirely different.',
      hint: 'Think about what the grandmother is reacting to and what the "revitalization" would actually remove.',
      difficulty: 2,
      skillIds: ['rhetoric.words_in_context', 'passage_type_proficiency.literature_passages'],
    },
    {
      id: Q(3),
      passageId: PASSAGE_IDS.lit1,
      stem: 'The phrase "phantom sounds of the old harbor" primarily serves to:',
      choices: [
        { label: 'A', text: 'Suggest that Elena is experiencing auditory hallucinations' },
        { label: 'B', text: 'Emphasize the contrast between the harbor\'s past vitality and its current emptiness' },
        { label: 'C', text: 'Foreshadow the return of the fishing fleet' },
        { label: 'D', text: 'Indicate that the harbor is haunted by its history' },
      ],
      correctAnswer: 1,
      explanation: 'The "phantom sounds" highlight the stark difference between the once-noisy, bustling harbor and its current silence, reinforcing Elena\'s sense of loss.',
      hint: 'What contrast is the author drawing between past and present?',
      difficulty: 2,
      skillIds: ['rhetoric.text_structure', 'rhetoric.purpose'],
    },
    {
      id: Q(4),
      passageId: PASSAGE_IDS.lit1,
      stem: 'Based on the passage, it can be reasonably inferred that Elena:',
      choices: [
        { label: 'A', text: 'Will ultimately refuse the city\'s offer' },
        { label: 'B', text: 'Has already decided to accept the buyout' },
        { label: 'C', text: 'Is reconsidering her self-image as a purely pragmatic person' },
        { label: 'D', text: 'Plans to start a new fishing cooperative' },
      ],
      correctAnswer: 2,
      explanation: 'The final sentence reveals Elena\'s uncertainty about her own self-assessment: she had "always told herself" she was not sentimental, but "was no longer sure," indicating she is reconsidering her self-image.',
      hint: 'Focus on the last sentence of the passage and what it reveals about Elena\'s self-understanding.',
      difficulty: 3,
      skillIds: ['information_ideas.inferences', 'passage_type_proficiency.literature_passages'],
    },
    {
      id: Q(5),
      passageId: PASSAGE_IDS.lit1,
      stem: 'The comparison of debts to "barnacles on an untended keel" serves primarily to:',
      choices: [
        { label: 'A', text: 'Illustrate the maritime setting of the passage' },
        { label: 'B', text: 'Suggest that the debts grew gradually and were neglected' },
        { label: 'C', text: 'Criticize the fishermen for poor financial management' },
        { label: 'D', text: 'Show that the harbor infrastructure is in disrepair' },
      ],
      correctAnswer: 1,
      explanation: 'The simile compares the accumulation of debt to barnacles that build up on a neglected boat hull—both grow slowly over time when not addressed, using a nautical metaphor fitting the setting.',
      hint: 'Consider how barnacles accumulate and what that suggests about the debts.',
      difficulty: 2,
      skillIds: ['rhetoric.words_in_context', 'rhetoric.text_structure'],
    },

    // ── Passage 2: An Unexpected Visitor (Literature, difficulty 3) ──
    {
      id: Q(6),
      passageId: PASSAGE_IDS.lit2,
      stem: 'The passage is primarily told from whose perspective?',
      choices: [
        { label: 'A', text: 'An omniscient narrator who reveals the thoughts of all characters' },
        { label: 'B', text: 'A third-person narrator closely aligned with Margaret\'s viewpoint' },
        { label: 'C', text: 'Professor Calloway, reflecting on his visit' },
        { label: 'D', text: 'Margaret, narrating in the first person' },
      ],
      correctAnswer: 1,
      explanation: 'The narrative follows Margaret\'s actions, perceptions, and internal thoughts (e.g., her suspicion about "considerable significance") while using third-person pronouns, indicating a close third-person perspective.',
      hint: 'Whose thoughts and impressions does the reader have access to?',
      difficulty: 3,
      skillIds: ['rhetoric.text_structure', 'passage_type_proficiency.literature_passages'],
    },
    {
      id: Q(7),
      passageId: PASSAGE_IDS.lit2,
      stem: 'Margaret\'s response to Professor Calloway\'s announcement suggests she is:',
      choices: [
        { label: 'A', text: 'Thrilled by the academic recognition of her father\'s work' },
        { label: 'B', text: 'Indifferent to all matters relating to cartography' },
        { label: 'C', text: 'Skeptical of the professor\'s motives and protective of her father\'s legacy' },
        { label: 'D', text: 'Afraid that the maps contain dangerous information' },
      ],
      correctAnswer: 2,
      explanation: 'Margaret\'s lack of excitement and her warning that neither the maps nor her cooperation are "for sale" demonstrate her skepticism about the professor\'s intentions and her protective stance toward her father\'s legacy.',
      hint: 'Pay attention to Margaret\'s reaction (or lack thereof) and her final statement.',
      difficulty: 3,
      skillIds: ['information_ideas.inferences', 'information_ideas.central_ideas'],
    },
    {
      id: Q(8),
      passageId: PASSAGE_IDS.lit2,
      stem: 'As used in the passage, "considerable significance" is presented as a phrase that:',
      choices: [
        { label: 'A', text: 'Accurately reflects the true value of the maps' },
        { label: 'B', text: 'Is deliberately vague academic language that Margaret views cynically' },
        { label: 'C', text: 'Is a legal term used in property disputes' },
        { label: 'D', text: 'Understates the importance of the discovery' },
      ],
      correctAnswer: 1,
      explanation: 'Margaret mentally translates "considerable significance" into "we would like to claim credit for someone else\'s work," revealing that she views the phrase as deliberately evasive academic jargon.',
      hint: 'What does Margaret think the phrase really means?',
      difficulty: 3,
      skillIds: ['rhetoric.words_in_context', 'information_ideas.inferences'],
    },
    {
      id: Q(9),
      passageId: PASSAGE_IDS.lit2,
      stem: 'Which choice best describes the function of the first paragraph?',
      choices: [
        { label: 'A', text: 'It establishes Margaret\'s character as cautious and self-sufficient' },
        { label: 'B', text: 'It creates suspense about the identity of the visitor' },
        { label: 'C', text: 'It describes the process of transcribing field notes' },
        { label: 'D', text: 'It contrasts Margaret\'s solitary life with society\'s expectations' },
      ],
      correctAnswer: 0,
      explanation: 'The first paragraph establishes key traits: Margaret lives alone and "preferred it that way," and she approaches the unexpected knock with "cautious deliberation," setting up her characterization for the rest of the passage.',
      hint: 'What do we learn about Margaret before the door opens?',
      difficulty: 3,
      skillIds: ['rhetoric.text_structure', 'rhetoric.purpose'],
    },
    {
      id: Q(10),
      passageId: PASSAGE_IDS.lit2,
      stem: 'The detail that Professor Calloway has "restless eyes of someone who had spent those decades looking for something specific" primarily suggests that he:',
      choices: [
        { label: 'A', text: 'Suffers from a neurological condition' },
        { label: 'B', text: 'Is uncomfortable being at Margaret\'s home' },
        { label: 'C', text: 'Has been driven by a long, focused intellectual pursuit' },
        { label: 'D', text: 'Is scanning the room for the maps' },
      ],
      correctAnswer: 2,
      explanation: 'The description characterizes Calloway as someone whose career has been defined by a persistent, specific quest—likely the very maps he has come to discuss.',
      hint: 'What does "looking for something specific" over "decades" tell you about his character?',
      difficulty: 3,
      skillIds: ['information_ideas.inferences', 'passage_type_proficiency.literature_passages'],
    },

    // ── Passage 3: Seneca Falls (History, difficulty 3) ──
    {
      id: Q(11),
      passageId: PASSAGE_IDS.hist1,
      stem: 'The primary purpose of the passage is to:',
      choices: [
        { label: 'A', text: 'Provide a historical account of the women\'s suffrage movement' },
        { label: 'B', text: 'Argue that women have been systematically denied equal rights and demand immediate reform' },
        { label: 'C', text: 'Compare the treatment of women to the treatment of enslaved people' },
        { label: 'D', text: 'Describe the legal framework governing women\'s property rights' },
      ],
      correctAnswer: 1,
      explanation: 'The passage systematically lists grievances against women and explicitly demands "immediate admission to all the rights and privileges" of citizenship, making it fundamentally an argument for equal rights and reform.',
      hint: 'What is the speaker calling for, and how does the structure of the speech support that call?',
      difficulty: 3,
      skillIds: ['rhetoric.purpose', 'rhetoric.arguments', 'passage_type_proficiency.history_passages'],
    },
    {
      id: Q(12),
      passageId: PASSAGE_IDS.hist1,
      stem: 'The opening sentence of the passage deliberately echoes the Declaration of Independence primarily in order to:',
      choices: [
        { label: 'A', text: 'Claim that the Founding Fathers supported women\'s suffrage' },
        { label: 'B', text: 'Invoke the authority of a revered national document to legitimize the demand for women\'s equality' },
        { label: 'C', text: 'Demonstrate the author\'s knowledge of American history' },
        { label: 'D', text: 'Argue that the Declaration of Independence was poorly written' },
      ],
      correctAnswer: 1,
      explanation: 'By echoing "We hold these truths to be self-evident" and inserting "and women," Stanton borrows the moral authority of the Declaration to argue that its principles logically extend to women.',
      hint: 'Why would the author choose to mirror a famous document?',
      difficulty: 3,
      skillIds: ['rhetoric.text_structure', 'rhetoric.arguments'],
    },
    {
      id: Q(13),
      passageId: PASSAGE_IDS.hist1,
      stem: 'As used in the passage, "instrumentality" most nearly means:',
      choices: [
        { label: 'A', text: 'Musical performance' },
        { label: 'B', text: 'Means or method' },
        { label: 'C', text: 'Legal document' },
        { label: 'D', text: 'Compromise' },
      ],
      correctAnswer: 1,
      explanation: 'In this context, "every instrumentality within our power" means every means or method available to them to achieve their goal of equal rights.',
      hint: 'Replace "instrumentality" with each answer choice and see which fits the sentence.',
      difficulty: 2,
      skillIds: ['rhetoric.words_in_context'],
    },
    {
      id: Q(14),
      passageId: PASSAGE_IDS.hist1,
      stem: 'The author anticipates "misconception, misrepresentation, and ridicule" in order to:',
      choices: [
        { label: 'A', text: 'Discourage potential allies from joining the movement' },
        { label: 'B', text: 'Acknowledge likely opposition while asserting determination to persevere' },
        { label: 'C', text: 'Argue that the movement has already been misunderstood' },
        { label: 'D', text: 'Request sympathy from the audience' },
      ],
      correctAnswer: 1,
      explanation: 'By naming the expected opposition, the author demonstrates awareness of the challenges ahead while the word "but" signals unwavering resolve to continue despite those obstacles.',
      hint: 'What comes after the author mentions these anticipated reactions?',
      difficulty: 3,
      skillIds: ['rhetoric.arguments', 'rhetoric.purpose'],
    },
    {
      id: Q(15),
      passageId: PASSAGE_IDS.hist1,
      stem: 'Which of the following best describes the rhetorical structure of the second paragraph?',
      choices: [
        { label: 'A', text: 'A series of parallel accusations building a cumulative case' },
        { label: 'B', text: 'A comparison of two opposing viewpoints' },
        { label: 'C', text: 'A chronological narrative of historical events' },
        { label: 'D', text: 'An extended metaphor illustrating political inequality' },
      ],
      correctAnswer: 0,
      explanation: 'The second paragraph uses anaphora ("He has...He has...He has...") to list specific grievances in parallel structure, creating a cumulative rhetorical effect.',
      hint: 'Notice how each sentence in the paragraph begins and what pattern that creates.',
      difficulty: 3,
      skillIds: ['rhetoric.text_structure', 'passage_type_proficiency.history_passages'],
    },

    // ── Passage 4: Civil Disobedience (History, difficulty 4) ──
    {
      id: Q(16),
      passageId: PASSAGE_IDS.hist2,
      stem: 'According to Thoreau, the fundamental problem with government is that it:',
      choices: [
        { label: 'A', text: 'Is inherently corrupt and must be abolished immediately' },
        { label: 'B', text: 'Can be manipulated and perverted before the people have a chance to act through it' },
        { label: 'C', text: 'Spends too much money on the military' },
        { label: 'D', text: 'Does not represent the interests of wealthy citizens' },
      ],
      correctAnswer: 1,
      explanation: 'Thoreau argues that government "is equally liable to be abused and perverted before the people can act through it," meaning it can be corrupted before citizens can exercise democratic control.',
      hint: 'Look at the second paragraph for Thoreau\'s specific complaint about government.',
      difficulty: 4,
      skillIds: ['information_ideas.central_ideas', 'passage_type_proficiency.history_passages'],
    },
    {
      id: Q(17),
      passageId: PASSAGE_IDS.hist2,
      stem: 'Thoreau draws an analogy between standing armies and standing governments to argue that:',
      choices: [
        { label: 'A', text: 'Both are necessary for national defense' },
        { label: 'B', text: 'The same objections raised against one apply to the other' },
        { label: 'C', text: 'Armies are more dangerous than governments' },
        { label: 'D', text: 'Citizens should serve in the military rather than in government' },
      ],
      correctAnswer: 1,
      explanation: 'Thoreau explicitly states that the objections "brought against a standing army... may also at last be brought against a standing government," using the analogy to extend familiar criticisms to government itself.',
      hint: 'What is the logical structure of comparing the army to the government?',
      difficulty: 4,
      skillIds: ['rhetoric.arguments', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(18),
      passageId: PASSAGE_IDS.hist2,
      stem: 'The rhetorical question "Why has every man a conscience then?" implies that:',
      choices: [
        { label: 'A', text: 'Not everyone actually has a conscience' },
        { label: 'B', text: 'Conscience exists precisely so individuals can exercise independent moral judgment' },
        { label: 'C', text: 'Legislators should have stronger moral principles' },
        { label: 'D', text: 'Conscience is a social construct rather than an innate quality' },
      ],
      correctAnswer: 1,
      explanation: 'The question follows Thoreau\'s challenge about whether citizens should "resign [their] conscience to the legislator," implying that conscience exists as an individual faculty meant to be exercised independently of governmental authority.',
      hint: 'What point is Thoreau making just before he asks this question?',
      difficulty: 4,
      skillIds: ['rhetoric.purpose', 'information_ideas.inferences'],
    },
    {
      id: Q(19),
      passageId: PASSAGE_IDS.hist2,
      stem: 'As used in the passage, "expedient" most nearly means:',
      choices: [
        { label: 'A', text: 'A rapid or hasty action' },
        { label: 'B', text: 'A convenient means to an end, though not ideal' },
        { label: 'C', text: 'An absolute necessity' },
        { label: 'D', text: 'An outdated tradition' },
      ],
      correctAnswer: 1,
      explanation: 'Thoreau describes government as "at best but an expedient" while adding that most are "inexpedient," using the word to mean a practical but imperfect means to achieve a goal.',
      hint: 'Notice the contrast between "expedient" and "inexpedient" in the same sentence.',
      difficulty: 4,
      skillIds: ['rhetoric.words_in_context'],
    },
    {
      id: Q(20),
      passageId: PASSAGE_IDS.hist2,
      stem: 'Which statement best summarizes Thoreau\'s argument in the final paragraph?',
      choices: [
        { label: 'A', text: 'Laws should be respected above all else to maintain social order' },
        { label: 'B', text: 'Individual moral judgment should take precedence over obedience to law' },
        { label: 'C', text: 'Citizens have no obligations to society whatsoever' },
        { label: 'D', text: 'Legislators should consult their consciences more frequently' },
      ],
      correctAnswer: 1,
      explanation: 'Thoreau argues "we should be men first and subjects afterward" and that one should cultivate "respect for the right" rather than "for the law," clearly prioritizing individual moral judgment over legal obedience.',
      hint: 'What does Thoreau say should come first: being a man or being a subject?',
      difficulty: 4,
      skillIds: ['information_ideas.central_ideas', 'rhetoric.arguments'],
    },

    // ── Passage 5: CRISPR (Science, difficulty 3) ──
    {
      id: Q(21),
      passageId: PASSAGE_IDS.sci1,
      stem: 'The primary purpose of the first paragraph is to:',
      choices: [
        { label: 'A', text: 'Argue that CRISPR should be used in medical treatments' },
        { label: 'B', text: 'Explain the natural biological mechanism underlying CRISPR technology' },
        { label: 'C', text: 'Compare CRISPR to other gene-editing technologies' },
        { label: 'D', text: 'Describe the history of bacterial research' },
      ],
      correctAnswer: 1,
      explanation: 'The first paragraph explains how CRISPR naturally functions in bacteria as a defense mechanism against viruses, providing the biological foundation for understanding the technology.',
      hint: 'What information does the first paragraph convey before the passage discusses applications?',
      difficulty: 2,
      skillIds: ['rhetoric.text_structure', 'rhetoric.purpose', 'passage_type_proficiency.science_passages'],
    },
    {
      id: Q(22),
      passageId: PASSAGE_IDS.sci1,
      stem: 'According to the passage, the Cas9 protein functions by:',
      choices: [
        { label: 'A', text: 'Replicating viral DNA sequences' },
        { label: 'B', text: 'Locating and cutting specific DNA sequences guided by RNA' },
        { label: 'C', text: 'Producing antibodies against viral infections' },
        { label: 'D', text: 'Synthesizing new guide RNA sequences' },
      ],
      correctAnswer: 1,
      explanation: 'The passage states that RNA sequences guide "the Cas9 protein to locate and cut the invading genetic material," and researchers can direct Cas9 to create "a targeted double-strand break."',
      hint: 'Look for the specific description of what Cas9 does in both paragraphs 1 and 2.',
      difficulty: 2,
      skillIds: ['information_ideas.central_ideas', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(23),
      passageId: PASSAGE_IDS.sci1,
      stem: 'The passage suggests that the primary ethical concern regarding CRISPR involves:',
      choices: [
        { label: 'A', text: 'The cost of developing CRISPR treatments' },
        { label: 'B', text: 'The possibility of creating genetically modified crops' },
        { label: 'C', text: 'Modifications to human DNA that would be passed to future generations' },
        { label: 'D', text: 'The use of bacterial systems in human medicine' },
      ],
      correctAnswer: 2,
      explanation: 'The passage identifies "germline editing—modifications that would be inherited by future generations" as raising "profound ethical questions," making heritable genetic changes the primary ethical concern discussed.',
      hint: 'What does "germline editing" mean, and why is it singled out?',
      difficulty: 3,
      skillIds: ['information_ideas.inferences', 'passage_type_proficiency.science_passages'],
    },
    {
      id: Q(24),
      passageId: PASSAGE_IDS.sci1,
      stem: 'The word "repurposed" in the second paragraph emphasizes that scientists:',
      choices: [
        { label: 'A', text: 'Invented an entirely new biological process' },
        { label: 'B', text: 'Adapted an existing natural mechanism for a different application' },
        { label: 'C', text: 'Improved upon the bacterial immune system' },
        { label: 'D', text: 'Discovered a flaw in bacterial defense mechanisms' },
      ],
      correctAnswer: 1,
      explanation: '"Repurposed" means taking something that already exists and using it for a new purpose. Scientists did not invent CRISPR; they adapted a natural bacterial defense system into a gene-editing tool.',
      hint: 'What does "repurposed" literally mean, and what was the original purpose?',
      difficulty: 2,
      skillIds: ['rhetoric.words_in_context'],
    },
    {
      id: Q(25),
      passageId: PASSAGE_IDS.sci1,
      stem: 'The overall structure of the passage can best be described as:',
      choices: [
        { label: 'A', text: 'A problem followed by a proposed solution' },
        { label: 'B', text: 'A chronological history of genetic research' },
        { label: 'C', text: 'An explanation of a natural process, its technological application, and its implications' },
        { label: 'D', text: 'A comparison of competing scientific theories' },
      ],
      correctAnswer: 2,
      explanation: 'The passage moves from natural mechanism (paragraph 1) to technological application (paragraph 2) to implications and ethical questions (paragraph 3), following a clear explanatory arc.',
      hint: 'Summarize what each paragraph is about and look for the pattern.',
      difficulty: 3,
      skillIds: ['rhetoric.text_structure'],
    },

    // ── Passage 6: The Microbiome (Science, difficulty 4) ──
    {
      id: Q(26),
      passageId: PASSAGE_IDS.sci2,
      stem: 'The passage primarily serves to:',
      choices: [
        { label: 'A', text: 'Argue that probiotics should replace psychiatric medications' },
        { label: 'B', text: 'Present evidence that gut microorganisms significantly influence human health, including mental health' },
        { label: 'C', text: 'Describe the process of fecal microbiota transplantation' },
        { label: 'D', text: 'Explain why the human body contains more microbial cells than human cells' },
      ],
      correctAnswer: 1,
      explanation: 'The passage progressively builds the case that the microbiome affects human health far beyond digestion, culminating in evidence linking gut bacteria to mental health conditions.',
      hint: 'What is the main point the passage builds toward across all three paragraphs?',
      difficulty: 3,
      skillIds: ['information_ideas.central_ideas', 'passage_type_proficiency.science_passages'],
    },
    {
      id: Q(27),
      passageId: PASSAGE_IDS.sci2,
      stem: 'The 2019 Nature study is cited primarily as evidence that:',
      choices: [
        { label: 'A', text: 'Depression is more common in people with fewer gut bacteria' },
        { label: 'B', text: 'Mice are suitable models for studying human psychology' },
        { label: 'C', text: 'There is a causal (not merely correlational) link between gut microbiota and depressive behavior' },
        { label: 'D', text: 'Fecal transplants are an effective treatment for depression' },
      ],
      correctAnswer: 2,
      explanation: 'The passage says the study provided "compelling evidence for a causal relationship" by showing that transplanting microbiota from depressed patients into mice produced depressive behaviors, establishing causation beyond correlation.',
      hint: 'What specific claim does the passage say this study supports?',
      difficulty: 4,
      skillIds: ['information_ideas.command_of_evidence', 'information_ideas.inferences'],
    },
    {
      id: Q(28),
      passageId: PASSAGE_IDS.sci2,
      stem: 'As used in the passage, "bidirectional" most nearly means:',
      choices: [
        { label: 'A', text: 'Operating in two stages' },
        { label: 'B', text: 'Communicating in both directions between two systems' },
        { label: 'C', text: 'Having two possible outcomes' },
        { label: 'D', text: 'Involving two types of bacteria' },
      ],
      correctAnswer: 1,
      explanation: 'In the context of the gut-brain axis, "bidirectional" means signals travel in both directions: from the gut to the brain and from the brain to the gut.',
      hint: 'The word describes a "signaling pathway" between the gut and the brain.',
      difficulty: 3,
      skillIds: ['rhetoric.words_in_context', 'passage_type_proficiency.science_passages'],
    },
    {
      id: Q(29),
      passageId: PASSAGE_IDS.sci2,
      stem: 'The author uses the phrase "far from being passive hitchhikers" to:',
      choices: [
        { label: 'A', text: 'Correct a potential misconception that microorganisms are merely inactive residents' },
        { label: 'B', text: 'Compare microorganisms to parasites' },
        { label: 'C', text: 'Suggest that microorganisms intentionally colonize the human body' },
        { label: 'D', text: 'Emphasize the harmful effects of certain bacteria' },
      ],
      correctAnswer: 0,
      explanation: 'The phrase preemptively counters the assumption that these microbes are inert passengers, leading into the explanation of their essential active functions.',
      hint: 'What expectation is the author pushing back against?',
      difficulty: 3,
      skillIds: ['rhetoric.purpose', 'rhetoric.words_in_context'],
    },
    {
      id: Q(30),
      passageId: PASSAGE_IDS.sci2,
      stem: 'Based on the passage, the author would most likely agree with which statement?',
      choices: [
        { label: 'A', text: 'Probiotic treatments will soon replace all psychiatric medications' },
        { label: 'B', text: 'The connection between gut microbiota and mental health is a promising but still developing area of research' },
        { label: 'C', text: 'The gut-brain axis has been thoroughly understood by modern science' },
        { label: 'D', text: 'Only Lactobacillus and Bifidobacterium bacteria affect human mood' },
      ],
      correctAnswer: 1,
      explanation: 'The passage uses cautious language ("raising the possibility," "could complement") and describes it as "an entirely new frontier," indicating a promising but still developing field.',
      hint: 'Pay attention to the qualifying language in the final sentence.',
      difficulty: 4,
      skillIds: ['information_ideas.inferences', 'rhetoric.arguments'],
    },

    // ── Passage 7: Universal Basic Income (Social Science, difficulty 3) ──
    {
      id: Q(31),
      passageId: PASSAGE_IDS.soc1,
      stem: 'The Stockton SEED program is presented in the passage primarily as:',
      choices: [
        { label: 'A', text: 'Definitive proof that UBI should be implemented nationwide' },
        { label: 'B', text: 'Evidence that challenges the assumption that unconditional cash discourages work' },
        { label: 'C', text: 'An example of a failed social experiment' },
        { label: 'D', text: 'A comparison to similar programs in other countries' },
      ],
      correctAnswer: 1,
      explanation: 'The passage introduces the SEED program with "Contrary to the common objection that free money would discourage work," then shows recipients were more likely to find full-time employment, directly countering a major criticism.',
      hint: 'What "common objection" does the paragraph address, and what did the data show?',
      difficulty: 3,
      skillIds: ['information_ideas.command_of_evidence', 'rhetoric.purpose'],
    },
    {
      id: Q(32),
      passageId: PASSAGE_IDS.soc1,
      stem: 'According to the passage, a primary concern about scaling UBI nationally is:',
      choices: [
        { label: 'A', text: 'It would cause inflation in the housing market' },
        { label: 'B', text: 'The enormous cost of approximately $3 trillion annually' },
        { label: 'C', text: 'Wealthy citizens would not spend the money' },
        { label: 'D', text: 'It would be difficult to distribute payments efficiently' },
      ],
      correctAnswer: 1,
      explanation: 'The passage specifically states a nationwide program "would cost approximately $3 trillion annually" and that funding it "would require substantial tax increases, reductions in other government spending, or both."',
      hint: 'Look at the third paragraph for the specific scalability concern mentioned.',
      difficulty: 2,
      skillIds: ['information_ideas.central_ideas', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(33),
      passageId: PASSAGE_IDS.soc1,
      stem: 'The overall structure of the passage is best described as:',
      choices: [
        { label: 'A', text: 'A definition of a concept, supporting evidence, and counterarguments' },
        { label: 'B', text: 'A series of case studies arranged chronologically' },
        { label: 'C', text: 'An argument for UBI followed by a rebuttal' },
        { label: 'D', text: 'A comparison of economic theories across different countries' },
      ],
      correctAnswer: 0,
      explanation: 'The passage opens by defining UBI and its rationale (paragraph 1), presents supporting evidence from the Stockton pilot (paragraph 2), and then addresses counterarguments about cost and scalability (paragraph 3).',
      hint: 'What does each paragraph do? Define, support, or challenge?',
      difficulty: 3,
      skillIds: ['rhetoric.text_structure'],
    },
    {
      id: Q(34),
      passageId: PASSAGE_IDS.soc1,
      stem: 'The passage implies that SEED recipients were more likely to find employment because:',
      choices: [
        { label: 'A', text: 'They were required to look for work as a condition of receiving payments' },
        { label: 'B', text: 'The financial cushion enabled them to invest time in job searches, education, and childcare' },
        { label: 'C', text: 'Employers preferred to hire people who were part of the program' },
        { label: 'D', text: 'They feared losing their benefits if they remained unemployed' },
      ],
      correctAnswer: 1,
      explanation: 'The passage explains that "additional financial security allowed participants to take time for job searches, pursue education, and manage childcare," activities that improved their economic outcomes.',
      hint: 'What specific explanation does the passage give for the employment result?',
      difficulty: 3,
      skillIds: ['information_ideas.inferences'],
    },
    {
      id: Q(35),
      passageId: PASSAGE_IDS.soc1,
      stem: 'The author\'s tone in discussing the UBI debate is best described as:',
      choices: [
        { label: 'A', text: 'Strongly in favor of implementing UBI' },
        { label: 'B', text: 'Dismissive of UBI as impractical' },
        { label: 'C', text: 'Balanced and analytical, presenting both supporting evidence and substantive concerns' },
        { label: 'D', text: 'Skeptical of all economic research on the topic' },
      ],
      correctAnswer: 2,
      explanation: 'The author presents both the positive SEED results and the serious fiscal concerns without clearly advocating for either position, maintaining a balanced analytical tone throughout.',
      hint: 'Does the author ultimately take a side?',
      difficulty: 3,
      skillIds: ['rhetoric.purpose', 'rhetoric.arguments'],
    },

    // ── Passage 8: Language Extinction (Social Science, difficulty 5) ──
    {
      id: Q(36),
      passageId: PASSAGE_IDS.soc2,
      stem: 'The author\'s central claim is that language extinction:',
      choices: [
        { label: 'A', text: 'Is a natural process that should not concern linguists' },
        { label: 'B', text: 'Represents a loss of unique cognitive frameworks, knowledge, and cultural heritage that extends far beyond language itself' },
        { label: 'C', text: 'Can be easily reversed with sufficient government funding' },
        { label: 'D', text: 'Is primarily caused by the dominance of English worldwide' },
      ],
      correctAnswer: 1,
      explanation: 'The passage argues that when languages die, they take with them "a unique cognitive framework," "ecological knowledge, oral literature, and cultural practice"—losses far beyond the linguistic domain.',
      hint: 'What does the author say disappears when a language dies?',
      difficulty: 4,
      skillIds: ['information_ideas.central_ideas'],
    },
    {
      id: Q(37),
      passageId: PASSAGE_IDS.soc2,
      stem: 'The Hopi language example serves to illustrate:',
      choices: [
        { label: 'A', text: 'That some languages are more complex than English' },
        { label: 'B', text: 'How different languages can encode fundamentally different ways of understanding experience' },
        { label: 'C', text: 'That Hopi speakers cannot understand the concept of time' },
        { label: 'D', text: 'Why indigenous languages are more valuable than modern languages' },
      ],
      correctAnswer: 1,
      explanation: 'The Hopi example demonstrates the passage\'s point that "each language encodes a unique cognitive framework" by showing how a specific grammatical difference may correspond to a fundamentally different conceptualization of time.',
      hint: 'What broader claim does the Hopi example support?',
      difficulty: 4,
      skillIds: ['information_ideas.command_of_evidence', 'rhetoric.purpose'],
    },
    {
      id: Q(38),
      passageId: PASSAGE_IDS.soc2,
      stem: 'The author mentions Hebrew and Maori primarily to:',
      choices: [
        { label: 'A', text: 'Argue that all endangered languages can be revitalized' },
        { label: 'B', text: 'Demonstrate that revitalization is possible but requires resources most endangered languages lack' },
        { label: 'C', text: 'Compare religious languages to secular languages' },
        { label: 'D', text: 'Show that immersion schooling is the only effective preservation method' },
      ],
      correctAnswer: 1,
      explanation: 'The passage presents Hebrew and Maori as success stories but immediately qualifies them: "these examples required extraordinary political will and institutional support—resources that the vast majority of endangered languages lack."',
      hint: 'What does the author say immediately after mentioning these success stories?',
      difficulty: 5,
      skillIds: ['rhetoric.arguments', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(39),
      passageId: PASSAGE_IDS.soc2,
      stem: 'As used in the passage, "precipitous" most nearly means:',
      choices: [
        { label: 'A', text: 'Dangerous' },
        { label: 'B', text: 'Steep and rapid' },
        { label: 'C', text: 'Gradual and predictable' },
        { label: 'D', text: 'Unexpected' },
      ],
      correctAnswer: 1,
      explanation: 'In the context of "precipitous decline," the word means steep and rapid, conveying the speed and severity of the Maori language\'s loss of speakers before revitalization efforts began.',
      hint: 'Think about a cliff—what does "precipice" suggest about the nature of the decline?',
      difficulty: 4,
      skillIds: ['rhetoric.words_in_context'],
    },
    {
      id: Q(40),
      passageId: PASSAGE_IDS.soc2,
      stem: 'The "central tension" described in the final sentence refers to the conflict between:',
      choices: [
        { label: 'A', text: 'Linguists who study languages and communities who speak them' },
        { label: 'B', text: 'External efforts to preserve languages and the economic pressures on individual speakers to adopt dominant languages' },
        { label: 'C', text: 'Oral traditions and written literacy' },
        { label: 'D', text: 'Government language policies and academic research priorities' },
      ],
      correctAnswer: 1,
      explanation: 'The final sentence explicitly frames the tension as "whether external intervention can succeed when the economic incentives facing individual speakers overwhelmingly favor linguistic assimilation."',
      hint: 'Read the final sentence carefully—what two forces are in conflict?',
      difficulty: 5,
      skillIds: ['information_ideas.central_ideas', 'information_ideas.inferences'],
    },
    {
      id: Q(41),
      passageId: PASSAGE_IDS.soc2,
      stem: 'The passage distinguishes the current period of language loss from historical language death by emphasizing:',
      choices: [
        { label: 'A', text: 'The types of languages currently going extinct' },
        { label: 'B', text: 'The unprecedented rate of extinction compared to historical baselines' },
        { label: 'C', text: 'The geographic regions most affected by language loss' },
        { label: 'D', text: 'The lack of written records for disappearing languages' },
      ],
      correctAnswer: 1,
      explanation: 'The passage acknowledges that "languages have always emerged, evolved, and disappeared" but states "what is unprecedented is the current rate of extinction, which far outpaces the historical baseline."',
      hint: 'What does the author say is "unprecedented" about the current situation?',
      difficulty: 4,
      skillIds: ['information_ideas.central_ideas', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(42),
      passageId: PASSAGE_IDS.soc2,
      stem: 'The author\'s attitude toward language revitalization efforts can best be described as:',
      choices: [
        { label: 'A', text: 'Unreservedly optimistic' },
        { label: 'B', text: 'Cautiously hopeful but realistic about the obstacles' },
        { label: 'C', text: 'Deeply pessimistic about any possibility of success' },
        { label: 'D', text: 'Neutral and detached from the outcomes' },
      ],
      correctAnswer: 1,
      explanation: 'The author acknowledges "notable successes" while tempering them with "extraordinary political will... resources that the vast majority of endangered languages lack," showing cautious hope balanced by realism.',
      hint: 'Does the author celebrate the successes fully, or add qualifications?',
      difficulty: 5,
      skillIds: ['rhetoric.purpose', 'information_ideas.inferences'],
    },

    // ══════════════════════════════════════════════════════════════
    // BATCH 2 QUESTIONS (Q43–Q82)
    // ══════════════════════════════════════════════════════════════

    // ── Passage 9: The Summer I Learned to See (Literature, difficulty 1) ──
    {
      id: Q(43),
      passageId: PASSAGE_IDS.lit3,
      stem: 'The main idea of the passage is that:',
      choices: [
        { label: 'A', text: 'Birdwatching is an important hobby for children' },
        { label: 'B', text: 'Learning to listen carefully can change how a person experiences the world' },
        { label: 'C', text: 'Grandmothers are better teachers than schoolteachers' },
        { label: 'D', text: 'Waking up early is essential for appreciating nature' },
      ],
      correctAnswer: 1,
      explanation: 'The passage shows how the narrator\'s grandmother taught her to identify birds by sound, and this skill of paying attention ("learning to see") transformed how she experienced the world beyond just birdwatching.',
      hint: 'What lesson did the narrator take away from the summer?',
      difficulty: 1,
      skillIds: ['information_ideas.central_ideas', 'passage_type_proficiency.literature_passages'],
    },
    {
      id: Q(44),
      passageId: PASSAGE_IDS.lit3,
      stem: 'As used in the passage, "liquid tumble" most nearly describes a sound that is:',
      choices: [
        { label: 'A', text: 'Harsh and grating' },
        { label: 'B', text: 'Smooth and cascading' },
        { label: 'C', text: 'Quiet and barely audible' },
        { label: 'D', text: 'Rapid and monotonous' },
      ],
      correctAnswer: 1,
      explanation: '"Liquid" suggests something smooth and flowing, while "tumble" implies a cascading, rolling quality. Together they describe a melodious, flowing birdsong.',
      hint: 'Think about what "liquid" suggests about the quality of the sound.',
      difficulty: 1,
      skillIds: ['rhetoric.words_in_context', 'passage_type_proficiency.literature_passages'],
    },
    {
      id: Q(45),
      passageId: PASSAGE_IDS.lit3,
      stem: 'The grandmother\'s phrase "learning to see" refers to:',
      choices: [
        { label: 'A', text: 'Improving one\'s eyesight through practice' },
        { label: 'B', text: 'Developing the habit of paying genuine attention to the world around you' },
        { label: 'C', text: 'Learning to identify birds by sight rather than sound' },
        { label: 'D', text: 'A specific technique used by professional birdwatchers' },
      ],
      correctAnswer: 1,
      explanation: 'The grandmother uses "learning to see" metaphorically to mean developing genuine attentiveness—she says it applies "to people as well as birds" and contrasts it with going through life "with their attention turned off."',
      hint: 'Does the grandmother limit this idea to birdwatching, or does she apply it more broadly?',
      difficulty: 1,
      skillIds: ['information_ideas.inferences', 'rhetoric.purpose'],
    },
    {
      id: Q(46),
      passageId: PASSAGE_IDS.lit3,
      stem: 'The detail about the mockingbird on the telephone wire primarily serves to:',
      choices: [
        { label: 'A', text: 'Show that mockingbirds are common in the narrator\'s neighborhood' },
        { label: 'B', text: 'Illustrate how the narrator\'s new skill changed her everyday perception' },
        { label: 'C', text: 'Prove that the narrator had become an expert birdwatcher' },
        { label: 'D', text: 'Contrast the narrator\'s school life with her summer experience' },
      ],
      correctAnswer: 1,
      explanation: 'The narrator notices a bird she had "passed hundreds of times without registering," demonstrating concretely how her trained ears opened her eyes—exactly the "learning to see" effect the passage describes.',
      hint: 'What point does the narrator make about this bird she had never noticed before?',
      difficulty: 1,
      skillIds: ['information_ideas.command_of_evidence', 'rhetoric.purpose'],
    },
    {
      id: Q(47),
      passageId: PASSAGE_IDS.lit3,
      stem: 'The passage is structured as:',
      choices: [
        { label: 'A', text: 'A scientific explanation of bird communication' },
        { label: 'B', text: 'A personal narrative that moves from a specific experience to a broader life lesson' },
        { label: 'C', text: 'A comparison of two different approaches to nature education' },
        { label: 'D', text: 'An argument for why schools should teach birdwatching' },
      ],
      correctAnswer: 1,
      explanation: 'The passage begins with the specific experience of learning bird songs during one summer and broadens to the general lesson about attentiveness that the narrator carries into the rest of her life.',
      hint: 'How does the passage move from the beginning to the end?',
      difficulty: 1,
      skillIds: ['rhetoric.text_structure', 'passage_type_proficiency.literature_passages'],
    },

    // ── Passage 10: The Collector of Lost Things (Literature, difficulty 4) ──
    {
      id: Q(48),
      passageId: PASSAGE_IDS.lit4,
      stem: 'The central conflict in the passage is best described as:',
      choices: [
        { label: 'A', text: 'Renata\'s grief over her mother\'s death' },
        { label: 'B', text: 'The contradiction between the mother Renata knew and the evidence the apartment reveals' },
        { label: 'C', text: 'A mystery about a missing family inheritance' },
        { label: 'D', text: 'Renata\'s guilt about not visiting her mother more often' },
      ],
      correctAnswer: 1,
      explanation: 'The passage focuses on how the objects in the apartment reveal a person "incompatible" with the mother Renata thought she knew, creating a conflict between Renata\'s memory and the physical evidence.',
      hint: 'What surprises Renata about the apartment, and why does it trouble her?',
      difficulty: 4,
      skillIds: ['information_ideas.central_ideas', 'passage_type_proficiency.literature_passages'],
    },
    {
      id: Q(49),
      passageId: PASSAGE_IDS.lit4,
      stem: 'The phrase "a museum of contradictions" suggests that the apartment:',
      choices: [
        { label: 'A', text: 'Was decorated in a confusing and inconsistent style' },
        { label: 'B', text: 'Contained objects that challenged Renata\'s understanding of her mother' },
        { label: 'C', text: 'Had been rearranged by someone after the mother\'s death' },
        { label: 'D', text: 'Was filled with valuable antiques from different historical periods' },
      ],
      correctAnswer: 1,
      explanation: '"Museum" implies a curated collection, and "contradictions" refers to items that don\'t match the mother Renata knew. Together the phrase means the apartment held a carefully preserved but bewildering record of an unfamiliar life.',
      hint: 'What does calling something a "museum" imply, and what are the "contradictions"?',
      difficulty: 4,
      skillIds: ['rhetoric.words_in_context', 'information_ideas.inferences'],
    },
    {
      id: Q(50),
      passageId: PASSAGE_IDS.lit4,
      stem: 'The passage implies that the mother\'s dual identity was:',
      choices: [
        { label: 'A', text: 'The result of mental illness' },
        { label: 'B', text: 'An accidental consequence of a busy life' },
        { label: 'C', text: 'A deliberate choice to maintain a private self separate from her family role' },
        { label: 'D', text: 'Something Renata had always suspected but never confronted' },
      ],
      correctAnswer: 2,
      explanation: 'The passage states "her mother had been, quite deliberately, two people: the one she presented to her family and the one she kept for herself," using "deliberately" to indicate intentional concealment.',
      hint: 'What word does the narrator use to describe how the mother maintained her dual identity?',
      difficulty: 4,
      skillIds: ['information_ideas.inferences', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(51),
      passageId: PASSAGE_IDS.lit4,
      stem: 'The final sentence describes Renata as "a trespasser" primarily to convey:',
      choices: [
        { label: 'A', text: 'That she is breaking the law by being in the apartment' },
        { label: 'B', text: 'Her sense of intruding on a private world she was never meant to see' },
        { label: 'C', text: 'That the apartment now belongs to someone else' },
        { label: 'D', text: 'Her guilt about inheriting her mother\'s possessions' },
      ],
      correctAnswer: 1,
      explanation: 'The metaphor of trespassing captures Renata\'s feeling that she has stumbled into "the second woman\'s territory"—her mother\'s secret private life—where she was never invited or welcomed.',
      hint: 'What does it mean to feel like a trespasser in a place you have a right to be?',
      difficulty: 4,
      skillIds: ['rhetoric.purpose', 'rhetoric.words_in_context'],
    },
    {
      id: Q(52),
      passageId: PASSAGE_IDS.lit4,
      stem: 'Which choice best describes the narrative technique used in the passage?',
      choices: [
        { label: 'A', text: 'A series of flashbacks to the mother\'s youth' },
        { label: 'B', text: 'Close third-person narration that reveals a character\'s shifting understanding through physical details' },
        { label: 'C', text: 'An omniscient narrator who explains both mother\'s and daughter\'s perspectives' },
        { label: 'D', text: 'First-person narration that directly addresses the reader' },
      ],
      correctAnswer: 1,
      explanation: 'The passage uses close third-person perspective ("Renata had always understood..."), focusing on her thoughts and reactions as she encounters physical objects that systematically shift her understanding of her mother.',
      hint: 'Who is telling the story, and how does the narrative reveal new information?',
      difficulty: 4,
      skillIds: ['rhetoric.text_structure', 'rhetoric.arguments'],
    },

    // ── Passage 11: Learning to Read (History, difficulty 1) ──
    {
      id: Q(53),
      passageId: PASSAGE_IDS.hist3,
      stem: 'What is the main idea of this passage?',
      choices: [
        { label: 'A', text: 'Mrs. Auld was a kind and generous teacher' },
        { label: 'B', text: 'Learning to read was the first step toward Douglass\'s path to freedom' },
        { label: 'C', text: 'Mr. Auld believed education was dangerous for all people' },
        { label: 'D', text: 'Douglass was angry at Mrs. Auld for stopping his lessons' },
      ],
      correctAnswer: 1,
      explanation: 'Douglass explicitly states "From that moment, I understood the pathway from slavery to freedom" and resolves to learn to read at "whatever cost of trouble." The passage centers on literacy as the gateway to liberation.',
      hint: 'What does Douglass say he understood after hearing Mr. Auld\'s words?',
      difficulty: 1,
      skillIds: ['information_ideas.central_ideas', 'passage_type_proficiency.history_passages'],
    },
    {
      id: Q(54),
      passageId: PASSAGE_IDS.hist3,
      stem: 'When Douglass says Mr. Auld\'s words "sank deep into my heart," he means they:',
      choices: [
        { label: 'A', text: 'Made him feel sad and hopeless' },
        { label: 'B', text: 'Deeply affected him and motivated his determination to learn' },
        { label: 'C', text: 'Caused him physical pain' },
        { label: 'D', text: 'Made him appreciate Mr. Auld\'s honesty' },
      ],
      correctAnswer: 1,
      explanation: 'Rather than discouraging Douglass, the words revealed the power of literacy and strengthened his resolve: "What Mr. Auld most dreaded, that I most desired."',
      hint: 'What was Douglass\'s reaction to Mr. Auld\'s prohibition?',
      difficulty: 1,
      skillIds: ['rhetoric.words_in_context', 'information_ideas.inferences'],
    },
    {
      id: Q(55),
      passageId: PASSAGE_IDS.hist3,
      stem: 'The passage suggests that Mr. Auld opposed teaching Douglass to read because:',
      choices: [
        { label: 'A', text: 'He believed education was unnecessary for farm work' },
        { label: 'B', text: 'He understood that literacy would make Douglass harder to control as a slave' },
        { label: 'C', text: 'He wanted to protect Douglass from dangerous ideas' },
        { label: 'D', text: 'He was jealous of Douglass\'s quick learning ability' },
      ],
      correctAnswer: 1,
      explanation: 'Mr. Auld said teaching a slave to read was "unsafe" and that "Learning would spoil the best nigger in the world." Douglass interprets this as revealing that literacy threatened the slaveholder\'s power.',
      hint: 'What specific reasons does Mr. Auld give for forbidding the lessons?',
      difficulty: 1,
      skillIds: ['information_ideas.inferences', 'rhetoric.arguments'],
    },
    {
      id: Q(56),
      passageId: PASSAGE_IDS.hist3,
      stem: 'The metaphor of "the inch" and "the ell" in the final paragraph refers to:',
      choices: [
        { label: 'A', text: 'The small amount of land that slaves were allowed to farm' },
        { label: 'B', text: 'The initial reading lessons leading to Douglass\'s full pursuit of literacy and freedom' },
        { label: 'C', text: 'The physical distance between the Auld house and the school' },
        { label: 'D', text: 'Mr. Auld\'s warning about giving too much freedom to workers' },
      ],
      correctAnswer: 1,
      explanation: 'Douglass reappropriates Mr. Auld\'s warning—"give a nigger an inch, he will take an ell"—to describe his own journey: the alphabet (the inch) led to his unstoppable determination to achieve full literacy (the ell).',
      hint: 'Mr. Auld used this phrase as a warning. How does Douglass turn it around?',
      difficulty: 1,
      skillIds: ['rhetoric.purpose', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(57),
      passageId: PASSAGE_IDS.hist3,
      stem: 'The author\'s tone in this passage is best described as:',
      choices: [
        { label: 'A', text: 'Bitter and resentful' },
        { label: 'B', text: 'Determined and reflective' },
        { label: 'C', text: 'Humble and apologetic' },
        { label: 'D', text: 'Amused and lighthearted' },
      ],
      correctAnswer: 1,
      explanation: 'Douglass reflects thoughtfully on the pivotal moment ("I now understood...") while expressing unwavering resolve ("a fixed purpose, at whatever cost of trouble"), blending reflection with determination.',
      hint: 'Consider the emotional quality of phrases like "a fixed purpose" and "I now understood."',
      difficulty: 1,
      skillIds: ['rhetoric.purpose', 'passage_type_proficiency.history_passages'],
    },

    // ── Passage 12: On the Necessity of Checks and Balances (History, difficulty 5) ──
    {
      id: Q(58),
      passageId: PASSAGE_IDS.hist4,
      stem: 'The phrase "Ambition must be made to counteract ambition" expresses the principle that:',
      choices: [
        { label: 'A', text: 'Politicians should be discouraged from seeking power' },
        { label: 'B', text: 'The self-interest of officeholders in different branches should check one another' },
        { label: 'C', text: 'Government officials must be ambitious to serve the public effectively' },
        { label: 'D', text: 'Ambition is the most dangerous quality in a leader' },
      ],
      correctAnswer: 1,
      explanation: 'The authors argue that each branch\'s officeholders should have "personal motives to resist encroachments of the others," harnessing their self-interest (ambition) as a mechanism for mutual restraint.',
      hint: 'What does the passage say each department needs to resist the others?',
      difficulty: 5,
      skillIds: ['information_ideas.central_ideas', 'rhetoric.arguments'],
    },
    {
      id: Q(59),
      passageId: PASSAGE_IDS.hist4,
      stem: 'The conditional statement "If men were angels, no government would be necessary" primarily serves to:',
      choices: [
        { label: 'A', text: 'Express optimism about human nature' },
        { label: 'B', text: 'Justify the need for institutional controls by acknowledging human imperfection' },
        { label: 'C', text: 'Argue that government should be modeled on religious principles' },
        { label: 'D', text: 'Suggest that democratic government is impossible' },
      ],
      correctAnswer: 1,
      explanation: 'The hypothetical about angels establishes that government is necessary precisely because humans are imperfect—a premise that then justifies the elaborate system of checks and balances the authors advocate.',
      hint: 'What conclusion does the author draw from the fact that men are NOT angels?',
      difficulty: 5,
      skillIds: ['rhetoric.purpose', 'rhetoric.arguments'],
    },
    {
      id: Q(60),
      passageId: PASSAGE_IDS.hist4,
      stem: 'According to the passage, the "great difficulty" in framing a government is:',
      choices: [
        { label: 'A', text: 'Balancing the need for government power with the need to limit that power' },
        { label: 'B', text: 'Ensuring that all citizens have equal representation' },
        { label: 'C', text: 'Preventing foreign interference in domestic affairs' },
        { label: 'D', text: 'Selecting virtuous leaders to serve in office' },
      ],
      correctAnswer: 0,
      explanation: 'The passage explicitly states the "great difficulty": "you must first enable the government to control the governed; and in the next place oblige it to control itself."',
      hint: 'What two things does the author say the government must be able to do?',
      difficulty: 5,
      skillIds: ['information_ideas.central_ideas', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(61),
      passageId: PASSAGE_IDS.hist4,
      stem: 'As used in the passage, "auxiliary precautions" most nearly refers to:',
      choices: [
        { label: 'A', text: 'Military defenses against external threats' },
        { label: 'B', text: 'Additional institutional mechanisms beyond popular elections to prevent abuse of power' },
        { label: 'C', text: 'Emergency powers granted to the executive during a crisis' },
        { label: 'D', text: 'Constitutional amendments added after the original document was ratified' },
      ],
      correctAnswer: 1,
      explanation: 'The passage states that "dependence on the people is the primary control" but "experience has taught... the necessity of auxiliary precautions"—structural mechanisms like separation of powers that supplement democratic accountability.',
      hint: 'What is the "primary control" that these precautions supplement?',
      difficulty: 5,
      skillIds: ['rhetoric.words_in_context', 'passage_type_proficiency.history_passages'],
    },
    {
      id: Q(62),
      passageId: PASSAGE_IDS.hist4,
      stem: 'The overall structure of this passage is best described as:',
      choices: [
        { label: 'A', text: 'A historical narrative of how the U.S. government was formed' },
        { label: 'B', text: 'A logical argument that moves from a principle to its philosophical justification to its practical application' },
        { label: 'C', text: 'A comparison of democratic and authoritarian forms of government' },
        { label: 'D', text: 'A rebuttal of critics who oppose the separation of powers' },
      ],
      correctAnswer: 1,
      explanation: 'The passage opens with the principle (ambition counteracting ambition), justifies it philosophically (human nature requires controls), and then applies it practically (dividing and arranging offices as mutual checks).',
      hint: 'What does each paragraph accomplish, and how do they connect?',
      difficulty: 5,
      skillIds: ['rhetoric.text_structure', 'rhetoric.arguments'],
    },

    // ── Passage 13: How Plants Capture Sunlight (Science, difficulty 1) ──
    {
      id: Q(63),
      passageId: PASSAGE_IDS.sci3,
      stem: 'The passage is primarily about:',
      choices: [
        { label: 'A', text: 'Why leaves are green' },
        { label: 'B', text: 'How photosynthesis works and why it is important' },
        { label: 'C', text: 'The chemical structure of chlorophyll molecules' },
        { label: 'D', text: 'How animals depend on oxygen to survive' },
      ],
      correctAnswer: 1,
      explanation: 'The passage explains the two stages of photosynthesis (how it works) and then discusses its importance for food chains and oxygen production (why it matters).',
      hint: 'What does the passage spend most of its time explaining?',
      difficulty: 1,
      skillIds: ['information_ideas.central_ideas', 'passage_type_proficiency.science_passages'],
    },
    {
      id: Q(64),
      passageId: PASSAGE_IDS.sci3,
      stem: 'According to the passage, chlorophyll appears green because it:',
      choices: [
        { label: 'A', text: 'Absorbs green light and reflects other colors' },
        { label: 'B', text: 'Reflects green wavelengths while absorbing red and blue light' },
        { label: 'C', text: 'Produces green-colored glucose during photosynthesis' },
        { label: 'D', text: 'Contains green-colored water molecules' },
      ],
      correctAnswer: 1,
      explanation: 'The passage states that chlorophyll "absorbs light energy—particularly from the red and blue portions of the visible spectrum—while reflecting green wavelengths, giving leaves their characteristic color."',
      hint: 'What does the passage say about which wavelengths chlorophyll absorbs versus reflects?',
      difficulty: 1,
      skillIds: ['information_ideas.command_of_evidence', 'passage_type_proficiency.science_passages'],
    },
    {
      id: Q(65),
      passageId: PASSAGE_IDS.sci3,
      stem: 'In the light-dependent reactions, water molecules are split to produce:',
      choices: [
        { label: 'A', text: 'Glucose and carbon dioxide' },
        { label: 'B', text: 'Oxygen, ATP, and NADPH' },
        { label: 'C', text: 'Chlorophyll and sunlight energy' },
        { label: 'D', text: 'Carbon dioxide and short-chain fatty acids' },
      ],
      correctAnswer: 1,
      explanation: 'The passage states that in the light-dependent reactions, "chlorophyll absorbs sunlight and uses that energy to split water molecules into hydrogen and oxygen," with oxygen released and energy stored in "ATP and NADPH."',
      hint: 'What three products does the passage mention coming from the light-dependent stage?',
      difficulty: 1,
      skillIds: ['information_ideas.command_of_evidence', 'information_ideas.inferences'],
    },
    {
      id: Q(66),
      passageId: PASSAGE_IDS.sci3,
      stem: 'The passage uses the statistic "300 billion tons of oxygen each year" primarily to:',
      choices: [
        { label: 'A', text: 'Compare photosynthesis to industrial oxygen production' },
        { label: 'B', text: 'Emphasize the enormous global importance of photosynthesis' },
        { label: 'C', text: 'Explain why oxygen levels are increasing in the atmosphere' },
        { label: 'D', text: 'Show that scientists can precisely measure oxygen production' },
      ],
      correctAnswer: 1,
      explanation: 'The statistic appears in the final paragraph where the author argues "the significance of photosynthesis cannot be overstated," using the number to support this claim about its global importance.',
      hint: 'What larger point is the author making when introducing this number?',
      difficulty: 1,
      skillIds: ['rhetoric.purpose', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(67),
      passageId: PASSAGE_IDS.sci3,
      stem: 'The passage is organized by:',
      choices: [
        { label: 'A', text: 'Comparing photosynthesis in different types of plants' },
        { label: 'B', text: 'Describing the process of photosynthesis, then explaining its broader significance' },
        { label: 'C', text: 'Presenting a scientific debate about how photosynthesis works' },
        { label: 'D', text: 'Tracing the historical discovery of photosynthesis' },
      ],
      correctAnswer: 1,
      explanation: 'The first two paragraphs describe what photosynthesis is and how its two stages work, while the final paragraph shifts to explaining its global significance for food chains and atmospheric oxygen.',
      hint: 'What does the passage do in the first two paragraphs versus the last paragraph?',
      difficulty: 1,
      skillIds: ['rhetoric.text_structure', 'passage_type_proficiency.science_passages'],
    },

    // ── Passage 14: Quantum Entanglement (Science, difficulty 5) ──
    {
      id: Q(68),
      passageId: PASSAGE_IDS.sci4,
      stem: 'The EPR paradox was originally presented to:',
      choices: [
        { label: 'A', text: 'Prove that quantum mechanics is correct' },
        { label: 'B', text: 'Argue that quantum mechanics contains a fundamental flaw' },
        { label: 'C', text: 'Demonstrate the practical applications of quantum entanglement' },
        { label: 'D', text: 'Propose a method for faster-than-light communication' },
      ],
      correctAnswer: 1,
      explanation: 'The passage states that Einstein, Podolsky, and Rosen "published a thought experiment that they believed exposed a fatal flaw in quantum mechanics."',
      hint: 'What did Einstein and his colleagues believe their thought experiment showed?',
      difficulty: 5,
      skillIds: ['information_ideas.central_ideas', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(69),
      passageId: PASSAGE_IDS.sci4,
      stem: 'Bell\'s theorem was significant because it:',
      choices: [
        { label: 'A', text: 'Proved that faster-than-light communication is possible' },
        { label: 'B', text: 'Provided a way to experimentally distinguish between quantum mechanics and local hidden variable theories' },
        { label: 'C', text: 'Showed that Einstein\'s theory of relativity was wrong' },
        { label: 'D', text: 'Demonstrated that entangled particles do not actually exist' },
      ],
      correctAnswer: 1,
      explanation: 'The passage states Bell "devised a mathematical inequality that could distinguish between quantum mechanics and any theory based on \'local hidden variables,\' the alternative Einstein had favored."',
      hint: 'What two things could Bell\'s theorem distinguish between?',
      difficulty: 5,
      skillIds: ['information_ideas.central_ideas', 'rhetoric.arguments'],
    },
    {
      id: Q(70),
      passageId: PASSAGE_IDS.sci4,
      stem: 'The passage makes clear that quantum entanglement:',
      choices: [
        { label: 'A', text: 'Allows information to travel faster than light' },
        { label: 'B', text: 'Has been disproved by recent experiments' },
        { label: 'C', text: 'Produces real correlations that cannot be explained classically, but cannot be used for communication' },
        { label: 'D', text: 'Only works over very short distances' },
      ],
      correctAnswer: 2,
      explanation: 'The passage explicitly states "entanglement cannot be used to send messages" but the correlations "are stronger than any classical explanation can account for"—real but not usable for communication.',
      hint: 'What does the passage say entanglement can and cannot do?',
      difficulty: 5,
      skillIds: ['information_ideas.inferences', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(71),
      passageId: PASSAGE_IDS.sci4,
      stem: 'As used in the passage, "loophole-free tests" most nearly means:',
      choices: [
        { label: 'A', text: 'Experiments that had no errors in their calculations' },
        { label: 'B', text: 'Experiments that eliminated all known alternative explanations for the results' },
        { label: 'C', text: 'Experiments conducted without any government oversight' },
        { label: 'D', text: 'Experiments that were repeated many times with identical results' },
      ],
      correctAnswer: 1,
      explanation: 'In the context of testing Bell\'s inequality, "loopholes" are potential alternative explanations. "Loophole-free" means these experiments closed all known gaps that could allow classical (non-quantum) interpretations.',
      hint: 'In a scientific context, what would a "loophole" in an experiment represent?',
      difficulty: 5,
      skillIds: ['rhetoric.words_in_context', 'passage_type_proficiency.science_passages'],
    },
    {
      id: Q(72),
      passageId: PASSAGE_IDS.sci4,
      stem: 'The passage is structured as:',
      choices: [
        { label: 'A', text: 'A chronological account of how a scientific challenge was posed, tested, and resolved' },
        { label: 'B', text: 'A comparison of Einstein\'s and Bell\'s competing theories' },
        { label: 'C', text: 'An argument for why quantum mechanics should be abandoned' },
        { label: 'D', text: 'A description of experimental methods followed by a discussion of their limitations' },
      ],
      correctAnswer: 0,
      explanation: 'The passage follows a chronological arc: the EPR paradox (1935), Bell\'s theorem (1964), Aspect\'s experiments (1982), and loophole-free tests (2015), tracing how a scientific challenge was progressively resolved.',
      hint: 'Notice the dates in the passage. What story do they tell?',
      difficulty: 5,
      skillIds: ['rhetoric.text_structure', 'rhetoric.purpose'],
    },

    // ── Passage 15: The Power of Conformity (Social Science, difficulty 1) ──
    {
      id: Q(73),
      passageId: PASSAGE_IDS.soc3,
      stem: 'The main finding of the Asch experiments was that:',
      choices: [
        { label: 'A', text: 'Most people cannot accurately judge the length of lines' },
        { label: 'B', text: 'Social pressure can lead people to give answers they know are wrong' },
        { label: 'C', text: 'Working in groups always improves decision-making' },
        { label: 'D', text: 'People are more honest when they are watched by others' },
      ],
      correctAnswer: 1,
      explanation: 'The passage states that 75% of participants conformed at least once, and many "reported knowing the group was wrong but feeling intense discomfort at the prospect of being the sole dissenter."',
      hint: 'Did participants conform because they couldn\'t see the right answer, or for another reason?',
      difficulty: 1,
      skillIds: ['information_ideas.central_ideas', 'passage_type_proficiency.science_passages'],
    },
    {
      id: Q(74),
      passageId: PASSAGE_IDS.soc3,
      stem: 'The passage states that conformity dropped dramatically when:',
      choices: [
        { label: 'A', text: 'The correct answer was made easier to identify' },
        { label: 'B', text: 'Participants were told the true purpose of the experiment' },
        { label: 'C', text: 'Even one other person broke from the majority and gave the correct answer' },
        { label: 'D', text: 'The group size was reduced from seven to three confederates' },
      ],
      correctAnswer: 2,
      explanation: 'The passage explicitly states that "conformity dropped dramatically when even one confederate broke from the majority and gave the correct answer," reducing conformity by nearly 80 percent.',
      hint: 'What specific change in the experiment reduced conformity by 80 percent?',
      difficulty: 1,
      skillIds: ['information_ideas.command_of_evidence', 'information_ideas.central_ideas'],
    },
    {
      id: Q(75),
      passageId: PASSAGE_IDS.soc3,
      stem: 'According to the passage, people conform primarily because of:',
      choices: [
        { label: 'A', text: 'Ignorance about the correct answer' },
        { label: 'B', text: 'A deep psychological need to belong and fear of social rejection' },
        { label: 'C', text: 'Respect for the authority of the experimenter' },
        { label: 'D', text: 'A desire to finish the experiment quickly' },
      ],
      correctAnswer: 1,
      explanation: 'The passage states that people "are responding to a deep psychological need to belong and a fear of social rejection," explicitly identifying belonging and rejection fear as the primary drivers.',
      hint: 'What two psychological motivations does the passage identify?',
      difficulty: 1,
      skillIds: ['information_ideas.inferences', 'rhetoric.arguments'],
    },
    {
      id: Q(76),
      passageId: PASSAGE_IDS.soc3,
      stem: 'The word "confederates" as used in the passage refers to:',
      choices: [
        { label: 'A', text: 'People from the southern United States' },
        { label: 'B', text: 'People secretly working with the experimenter who pretended to be real participants' },
        { label: 'C', text: 'Other psychologists who helped design the study' },
        { label: 'D', text: 'Participants who refused to conform to group pressure' },
      ],
      correctAnswer: 1,
      explanation: 'The passage defines them as people "who appeared to be fellow participants but were actually confederates working with the experimenter"—actors planted in the experiment.',
      hint: 'How does the passage describe what these people actually were?',
      difficulty: 1,
      skillIds: ['rhetoric.words_in_context', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(77),
      passageId: PASSAGE_IDS.soc3,
      stem: 'The passage is organized by:',
      choices: [
        { label: 'A', text: 'Describing the experimental setup, presenting the results, and discussing what the results mean' },
        { label: 'B', text: 'Comparing Asch\'s experiments with more recent studies on conformity' },
        { label: 'C', text: 'Arguing that conformity is always harmful to society' },
        { label: 'D', text: 'Presenting the experimenter\'s biography followed by his major discoveries' },
      ],
      correctAnswer: 0,
      explanation: 'Paragraph 1 describes the experimental design, paragraph 2 presents the key results (75% conformity), and paragraph 3 discusses additional findings and their psychological meaning.',
      hint: 'What does each paragraph do?',
      difficulty: 1,
      skillIds: ['rhetoric.text_structure', 'rhetoric.purpose'],
    },

    // ── Passage 16: Nudge Theory (Social Science, difficulty 4) ──
    {
      id: Q(78),
      passageId: PASSAGE_IDS.soc4,
      stem: 'According to the passage, a "nudge" is best defined as:',
      choices: [
        { label: 'A', text: 'A government regulation that limits consumer choices' },
        { label: 'B', text: 'A change in how choices are presented that predictably alters behavior while preserving freedom' },
        { label: 'C', text: 'An economic incentive such as a tax break or subsidy' },
        { label: 'D', text: 'A public awareness campaign designed to change attitudes' },
      ],
      correctAnswer: 1,
      explanation: 'The passage defines a nudge as "a subtle change in the way choices are presented that predictably alters behavior without restricting options or significantly changing economic incentives."',
      hint: 'Look for the passage\'s explicit definition near the beginning.',
      difficulty: 4,
      skillIds: ['information_ideas.central_ideas', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(79),
      passageId: PASSAGE_IDS.soc4,
      stem: 'The organ donation example is used primarily to illustrate:',
      choices: [
        { label: 'A', text: 'That most people are not willing to donate their organs' },
        { label: 'B', text: 'How a single change in default settings can dramatically alter outcomes without restricting choice' },
        { label: 'C', text: 'That opt-out systems are ethically superior to opt-in systems' },
        { label: 'D', text: 'The failure of government health policies worldwide' },
      ],
      correctAnswer: 1,
      explanation: 'The passage uses the organ donation example to show that "the options are identical in both systems; only the default has changed"—yet participation jumps from below 20% to above 90%, powerfully illustrating the nudge concept.',
      hint: 'What point does the author make about the difference between opt-in and opt-out countries?',
      difficulty: 4,
      skillIds: ['rhetoric.purpose', 'information_ideas.command_of_evidence'],
    },
    {
      id: Q(80),
      passageId: PASSAGE_IDS.soc4,
      stem: 'Critics of nudging argue that it:',
      choices: [
        { label: 'A', text: 'Is too expensive to implement on a large scale' },
        { label: 'B', text: 'Undermines individual autonomy by giving unaccountable power to choice architects' },
        { label: 'C', text: 'Has never been shown to work in controlled experiments' },
        { label: 'D', text: 'Only benefits wealthy corporations at the expense of consumers' },
      ],
      correctAnswer: 1,
      explanation: 'The passage states that critics argue nudging "undermines individual autonomy" and that "the \'choice architect\' wields enormous unaccountable power."',
      hint: 'What specific concern do critics raise about the people who design nudges?',
      difficulty: 4,
      skillIds: ['rhetoric.arguments', 'information_ideas.central_ideas'],
    },
    {
      id: Q(81),
      passageId: PASSAGE_IDS.soc4,
      stem: 'Thaler and Sunstein\'s response to critics is based on the argument that:',
      choices: [
        { label: 'A', text: 'People are incapable of making good decisions on their own' },
        { label: 'B', text: 'Nudges are less intrusive than mandates because someone must design the choice architecture anyway' },
        { label: 'C', text: 'Freedom of choice is less important than public health outcomes' },
        { label: 'D', text: 'Behavioral economics has been proven correct by scientific research' },
      ],
      correctAnswer: 1,
      explanation: 'The passage states their response: "choice architecture is inescapable—someone must decide how options are presented—and that nudges are preferable to mandates precisely because they preserve freedom of choice."',
      hint: 'What do Thaler and Sunstein say is "inescapable"?',
      difficulty: 4,
      skillIds: ['rhetoric.arguments', 'information_ideas.inferences'],
    },
    {
      id: Q(82),
      passageId: PASSAGE_IDS.soc4,
      stem: 'The "fundamental tension" described in the final sentence refers to:',
      choices: [
        { label: 'A', text: 'The conflict between economists and psychologists' },
        { label: 'B', text: 'The gap between what people actually choose and what they would choose with perfect information and rationality' },
        { label: 'C', text: 'The difference between democratic and authoritarian governance' },
        { label: 'D', text: 'The disagreement between Thaler and Sunstein over their own theory' },
      ],
      correctAnswer: 1,
      explanation: 'The final sentence identifies the tension as "the gap between what people choose and what they would choose if they had unlimited time, information, and cognitive resources."',
      hint: 'Read the final sentence carefully. What two things are being contrasted?',
      difficulty: 4,
      skillIds: ['information_ideas.central_ideas', 'information_ideas.inferences'],
    },
  ];

  // Save questions (without skills first)
  for (const qData of questionsData) {
    const { skillIds, ...questionFields } = qData;

    await questionRepo.upsert(
      {
        ...questionFields,
        irtDiscrimination: 1,
        irtDifficulty: 0,
        irtGuessing: 0.25,
      },
      ['id'],
    );
  }

  // Now link skills via the join table
  for (const qData of questionsData) {
    const question = await questionRepo.findOne({
      where: { id: qData.id },
      relations: ['skills'],
    });
    if (question) {
      question.skills = getSkills(qData.skillIds);
      await questionRepo.save(question);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // EXERCISES
  // ════════════════════════════════════════════════════════════════════
  console.log('Seeding exercises...');

  const exercises = [
    {
      id: E(1),
      title: 'Diagnostic: Mixed Reading Skills',
      type: ExerciseType.DIAGNOSTIC,
      passageId: null,
      questionIds: [Q(1), Q(6), Q(11), Q(16), Q(21), Q(26), Q(31), Q(36)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'rhetoric.text_structure',
        'rhetoric.purpose',
      ],
      difficulty: 3,
      estimatedMinutes: 20,
    },
    {
      id: E(2),
      title: 'Practice: Literature Passages',
      type: ExerciseType.PRACTICE,
      passageId: PASSAGE_IDS.lit1,
      questionIds: [Q(1), Q(2), Q(3), Q(4), Q(5)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'rhetoric.words_in_context',
        'information_ideas.inferences',
        'passage_type_proficiency.literature_passages',
      ],
      difficulty: 2,
      estimatedMinutes: 12,
    },
    {
      id: E(3),
      title: 'Practice: Advanced Literature Analysis',
      type: ExerciseType.PRACTICE,
      passageId: PASSAGE_IDS.lit2,
      questionIds: [Q(6), Q(7), Q(8), Q(9), Q(10)],
      skillsFocus: [
        'rhetoric.text_structure',
        'information_ideas.inferences',
        'rhetoric.words_in_context',
        'passage_type_proficiency.literature_passages',
      ],
      difficulty: 3,
      estimatedMinutes: 12,
    },
    {
      id: E(4),
      title: 'Practice: Historical Documents',
      type: ExerciseType.PRACTICE,
      passageId: PASSAGE_IDS.hist1,
      questionIds: [Q(11), Q(12), Q(13), Q(14), Q(15)],
      skillsFocus: [
        'rhetoric.purpose',
        'rhetoric.arguments',
        'rhetoric.text_structure',
        'passage_type_proficiency.history_passages',
      ],
      difficulty: 3,
      estimatedMinutes: 12,
    },
    {
      id: E(5),
      title: 'Practice: Philosophical Arguments',
      type: ExerciseType.PRACTICE,
      passageId: PASSAGE_IDS.hist2,
      questionIds: [Q(16), Q(17), Q(18), Q(19), Q(20)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'rhetoric.arguments',
        'rhetoric.words_in_context',
        'passage_type_proficiency.history_passages',
      ],
      difficulty: 4,
      estimatedMinutes: 15,
    },
    {
      id: E(6),
      title: 'Practice: Science - Gene Editing',
      type: ExerciseType.PRACTICE,
      passageId: PASSAGE_IDS.sci1,
      questionIds: [Q(21), Q(22), Q(23), Q(24), Q(25)],
      skillsFocus: [
        'rhetoric.text_structure',
        'information_ideas.central_ideas',
        'information_ideas.inferences',
        'passage_type_proficiency.science_passages',
      ],
      difficulty: 3,
      estimatedMinutes: 12,
    },
    {
      id: E(7),
      title: 'Practice: Science - Microbiome Research',
      type: ExerciseType.PRACTICE,
      passageId: PASSAGE_IDS.sci2,
      questionIds: [Q(26), Q(27), Q(28), Q(29), Q(30)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'information_ideas.command_of_evidence',
        'rhetoric.words_in_context',
        'passage_type_proficiency.science_passages',
      ],
      difficulty: 4,
      estimatedMinutes: 15,
    },
    {
      id: E(8),
      title: 'Practice: Social Science - Economics',
      type: ExerciseType.PRACTICE,
      passageId: PASSAGE_IDS.soc1,
      questionIds: [Q(31), Q(32), Q(33), Q(34), Q(35)],
      skillsFocus: [
        'information_ideas.command_of_evidence',
        'rhetoric.purpose',
        'rhetoric.text_structure',
        'information_ideas.inferences',
      ],
      difficulty: 3,
      estimatedMinutes: 12,
    },
    {
      id: E(9),
      title: 'Practice: Social Science - Linguistics',
      type: ExerciseType.PRACTICE,
      passageId: PASSAGE_IDS.soc2,
      questionIds: [Q(36), Q(37), Q(38), Q(39), Q(40), Q(41), Q(42)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'rhetoric.arguments',
        'rhetoric.words_in_context',
        'information_ideas.command_of_evidence',
      ],
      difficulty: 5,
      estimatedMinutes: 18,
    },
    {
      id: E(10),
      title: 'Drill: Words in Context',
      type: ExerciseType.DRILL,
      passageId: null,
      questionIds: [Q(2), Q(5), Q(8), Q(13), Q(19), Q(24), Q(28), Q(39)],
      skillsFocus: ['rhetoric.words_in_context'],
      difficulty: 3,
      estimatedMinutes: 15,
    },
    {
      id: E(11),
      title: 'Drill: Central Ideas & Details',
      type: ExerciseType.DRILL,
      passageId: null,
      questionIds: [Q(1), Q(7), Q(16), Q(20), Q(22), Q(26), Q(32), Q(36)],
      skillsFocus: ['information_ideas.central_ideas'],
      difficulty: 3,
      estimatedMinutes: 15,
    },
    {
      id: E(12),
      title: 'Review: Full Practice Test',
      type: ExerciseType.REVIEW,
      passageId: null,
      questionIds: [
        Q(1), Q(4), Q(7), Q(10), Q(11), Q(14), Q(17), Q(20),
        Q(22), Q(25), Q(27), Q(30), Q(32), Q(35), Q(37), Q(40),
      ],
      skillsFocus: [
        'information_ideas.central_ideas',
        'information_ideas.inferences',
        'rhetoric.text_structure',
        'rhetoric.arguments',
        'rhetoric.words_in_context',
      ],
      difficulty: 4,
      estimatedMinutes: 35,
    },

    // Batch 2 exercises
    {
      id: E(13),
      title: 'Practice: Easy Reading Foundations',
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds: [Q(43), Q(44), Q(53), Q(54), Q(63), Q(64), Q(73), Q(74)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'information_ideas.command_of_evidence',
        'rhetoric.words_in_context',
        'passage_type_proficiency.literature_passages',
        'passage_type_proficiency.history_passages',
        'passage_type_proficiency.science_passages',
      ],
      difficulty: 1,
      estimatedMinutes: 15,
    },
    {
      id: E(14),
      title: 'Practice: Advanced Analysis Challenge',
      type: ExerciseType.PRACTICE,
      passageId: null,
      questionIds: [Q(48), Q(50), Q(58), Q(60), Q(68), Q(70), Q(78), Q(80)],
      skillsFocus: [
        'information_ideas.central_ideas',
        'information_ideas.inferences',
        'rhetoric.arguments',
        'information_ideas.command_of_evidence',
      ],
      difficulty: 5,
      estimatedMinutes: 20,
    },
    {
      id: E(15),
      title: 'Drill: Text Structure & Purpose',
      type: ExerciseType.DRILL,
      passageId: null,
      questionIds: [Q(47), Q(52), Q(57), Q(62), Q(67), Q(72), Q(77), Q(82)],
      skillsFocus: [
        'rhetoric.text_structure',
        'rhetoric.purpose',
        'rhetoric.arguments',
      ],
      difficulty: 3,
      estimatedMinutes: 15,
    },
  ];

  // Migrate old skill IDs in skillsFocus arrays before upserting
  const migratedExercises = exercises.map((e) => ({
    ...e,
    skillsFocus: [...new Set(e.skillsFocus.map(migrateSkillId))],
  }));
  const exercisesWithShortId = migratedExercises.map((e: any) => ({
    ...e,
    shortId: shortIdFromUuid(e.id),
  }));
  await exerciseRepo.upsert(exercisesWithShortId, ['id']);

  console.log(
    `Content seeded successfully: ${passages.length} passages, ${questionsData.length} questions, ${exercises.length} exercises.`,
  );
}
