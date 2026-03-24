import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  CoachingSession,
  CoachingSessionStatus,
} from '../../database/entities/coaching-session.entity';
import { StudentSkillEstimate } from '../../database/entities/student-skill-estimate.entity';

const MODEL_ID = 'us.anthropic.claude-sonnet-4-20250514-v1:0';

@Injectable()
export class CoachingService {
  private readonly logger = new Logger(CoachingService.name);
  private readonly client: BedrockRuntimeClient;

  constructor(
    @InjectRepository(CoachingSession)
    private readonly sessionRepo: Repository<CoachingSession>,
    @InjectRepository(StudentSkillEstimate)
    private readonly estimateRepo: Repository<StudentSkillEstimate>,
    private readonly configService: ConfigService,
  ) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.client = new BedrockRuntimeClient({ region });
  }

  async listSessions(studentId: string): Promise<Partial<CoachingSession>[]> {
    const sessions = await this.sessionRepo.find({
      where: { studentId, status: CoachingSessionStatus.ENDED },
      order: { endedAt: 'DESC' },
      select: ['id', 'startedAt', 'endedAt', 'focusSkillId', 'status'],
    });
    return sessions.map((s) => ({
      id: s.id,
      createdAt: s.startedAt,
      endedAt: s.endedAt,
      focusSkillId: s.focusSkillId,
      status: s.status,
    }));
  }

  async getSession(
    studentId: string,
    sessionId: string,
  ): Promise<CoachingSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Coaching session not found');
    }
    if (session.studentId !== studentId) {
      throw new ForbiddenException('Not your coaching session');
    }
    return session;
  }

  async startSession(
    studentId: string,
    focusSkillId?: string,
  ): Promise<{
    session: CoachingSession;
    suggestedTopics: { skillId: string; skillName: string; prompt: string }[];
  }> {
    // End any existing active session
    await this.sessionRepo.update(
      { studentId, status: CoachingSessionStatus.ACTIVE },
      { status: CoachingSessionStatus.ENDED, endedAt: new Date() },
    );

    // Fetch student's weakest skills for suggested topics
    const estimates = await this.estimateRepo.find({
      where: { studentId },
      relations: ['skill'],
      order: { abilityEstimate: 'ASC' },
    });

    const weakSkills = estimates.slice(0, 5);

    const suggestedTopics = weakSkills.map((e) => ({
      skillId: e.skillId,
      skillName: e.skill.name,
      prompt: this.buildTopicPrompt(e.skill.name, e.masteryStatus),
    }));

    // Generate an opening message from the tutor
    const openingMessage = await this.generateOpeningMessage(
      weakSkills,
      focusSkillId,
    );

    const session = this.sessionRepo.create({
      studentId,
      status: CoachingSessionStatus.ACTIVE,
      messages: [
        {
          role: 'tutor',
          content: openingMessage,
          timestamp: new Date().toISOString(),
        },
      ],
      focusSkillId: focusSkillId || null,
    });

    const saved = await this.sessionRepo.save(session);
    return { session: saved, suggestedTopics };
  }

  async sendMessage(
    studentId: string,
    sessionId: string,
    content: string,
  ): Promise<{ reply: string; session: CoachingSession }> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Coaching session not found');
    }
    if (session.studentId !== studentId) {
      throw new ForbiddenException('Not your coaching session');
    }
    if (session.status !== CoachingSessionStatus.ACTIVE) {
      throw new BadRequestException('Session has ended');
    }

    // Add student message
    session.messages.push({
      role: 'student',
      content,
      timestamp: new Date().toISOString(),
    });

    // Get student context for the AI
    const estimates = await this.estimateRepo.find({
      where: { studentId },
      relations: ['skill'],
      order: { abilityEstimate: 'ASC' },
    });

    const skillContext = estimates
      .slice(0, 5)
      .map(
        (e) =>
          `${e.skill.name}: ${e.masteryStatus} (${e.abilityEstimate.toFixed(2)})`,
      )
      .join(', ');

    // Generate AI reply
    const reply = await this.generateReply(session.messages, skillContext);

    // Add tutor reply
    session.messages.push({
      role: 'tutor',
      content: reply,
      timestamp: new Date().toISOString(),
    });

    await this.sessionRepo.save(session);

    return { reply, session };
  }

  async endSession(
    studentId: string,
    sessionId: string,
  ): Promise<CoachingSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Coaching session not found');
    }
    if (session.studentId !== studentId) {
      throw new ForbiddenException('Not your coaching session');
    }

    session.status = CoachingSessionStatus.ENDED;
    session.endedAt = new Date();
    return this.sessionRepo.save(session);
  }

  private buildTopicPrompt(skillName: string, mastery: string): string {
    switch (mastery) {
      case 'novice':
        return `I'm struggling with ${skillName}. Can you teach me the basics?`;
      case 'developing':
        return `I want to get better at ${skillName}. What strategies should I use?`;
      default:
        return `Help me master ${skillName} for the SAT.`;
    }
  }

  private async generateOpeningMessage(
    weakSkills: StudentSkillEstimate[],
    focusSkillId?: string,
  ): Promise<string> {
    if (weakSkills.length === 0) {
      return "Hi! I'm your SAT Reading coach. What would you like to work on today?";
    }

    const focusSkill = focusSkillId
      ? weakSkills.find((s) => s.skillId === focusSkillId)
      : null;

    const skillSummary = weakSkills
      .slice(0, 3)
      .map((e) => `${e.skill.name} (${e.masteryStatus})`)
      .join(', ');

    const prompt = focusSkill
      ? `Generate a short (2-3 sentence) opening greeting for a student who wants to focus on "${focusSkill.skill.name}" (currently ${focusSkill.masteryStatus}). Be warm and specific about what you'll help them with.`
      : `Generate a short (2-3 sentence) opening greeting for a student whose weakest SAT Reading areas are: ${skillSummary}. Mention their top 1-2 weak areas by name and suggest starting with one. Be warm and encouraging.`;

    try {
      const command = new ConverseCommand({
        modelId: MODEL_ID,
        system: [
          {
            text: 'You are a friendly SAT Reading tutor greeting a student at the start of a coaching session. Be concise and actionable.',
          },
        ],
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 200 },
      });

      const response = await this.client.send(command);
      const text = response.output?.message?.content?.[0]?.text;

      return (
        text ||
        "Hi! I'm your SAT Reading coach. Based on your recent practice, I have some areas we can focus on together. Pick a topic below or ask me anything!"
      );
    } catch (error) {
      this.logger.error('Opening message generation failed', error);
      return "Hi! I'm your SAT Reading coach. Based on your recent practice, I have some areas we can focus on together. Pick a topic below or ask me anything!";
    }
  }

  private async generateReply(
    messages: CoachingSession['messages'],
    skillContext: string,
  ): Promise<string> {
    const systemPrompt = `You are a friendly, encouraging SAT Reading tutor. You help students improve their reading comprehension skills for the SAT.

Student skill profile (weakest first): ${skillContext}

Guidelines:
- Be concise (2-4 sentences per response)
- Give specific, actionable advice
- Reference SAT Reading strategies when relevant
- Be encouraging but honest about areas needing improvement
- If asked about a specific passage type or skill, give targeted advice`;

    const converseMessages = messages.map((m) => ({
      role: (m.role === 'student' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: [{ text: m.content }],
    }));

    try {
      const command = new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: systemPrompt }],
        messages: converseMessages,
        inferenceConfig: { maxTokens: 400 },
      });

      const response = await this.client.send(command);
      const text = response.output?.message?.content?.[0]?.text;

      return text || 'Could you rephrase that? I want to make sure I give you the best advice.';
    } catch (error) {
      this.logger.error('Coaching Bedrock call failed', error);
      return "I'm having trouble connecting right now. Try reviewing the strategies in the Knowledge Base while I get back online!";
    }
  }
}
