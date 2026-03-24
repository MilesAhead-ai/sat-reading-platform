import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ReviewQueueItem } from '../../database/entities/review-queue-item.entity';
import { Question } from '../../database/entities/question.entity';
import { StudentResponse } from '../../database/entities/student-response.entity';
import { LlmService } from '../../services/llm.service';

@Injectable()
export class ReviewQueueService {
  constructor(
    @InjectRepository(ReviewQueueItem)
    private readonly reviewRepo: Repository<ReviewQueueItem>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(StudentResponse)
    private readonly responseRepo: Repository<StudentResponse>,
    private readonly llmService: LlmService,
  ) {}

  async addToReviewQueue(
    studentId: string,
    questionId: string,
  ): Promise<ReviewQueueItem> {
    const existing = await this.reviewRepo.findOne({
      where: { studentId, questionId },
    });

    if (existing) {
      existing.nextReviewDate = new Date();
      existing.interval = 1;
      existing.repetitions = 0;
      return this.reviewRepo.save(existing);
    }

    const item = this.reviewRepo.create({
      studentId,
      questionId,
      nextReviewDate: new Date(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    });

    return this.reviewRepo.save(item);
  }

  async getDueItems(studentId: string): Promise<ReviewQueueItem[]> {
    return this.reviewRepo.find({
      where: {
        studentId,
        nextReviewDate: LessThanOrEqual(new Date()),
      },
      relations: ['question', 'question.passage', 'question.skills'],
      order: { nextReviewDate: 'ASC' },
      take: 20,
    });
  }

  async getDueCount(studentId: string): Promise<number> {
    return this.reviewRepo.count({
      where: {
        studentId,
        nextReviewDate: LessThanOrEqual(new Date()),
      },
    });
  }

  /**
   * SM-2 algorithm: update review schedule based on quality of recall.
   * @param quality 0-5 rating (0=complete failure, 5=perfect recall)
   */
  async reviewItem(
    studentId: string,
    itemId: string,
    quality: number,
  ): Promise<ReviewQueueItem> {
    const item = await this.reviewRepo.findOne({
      where: { id: itemId, studentId },
    });

    if (!item) {
      throw new NotFoundException('Review item not found');
    }

    const q = Math.min(5, Math.max(0, quality));

    if (q < 3) {
      item.repetitions = 0;
      item.interval = 1;
    } else {
      if (item.repetitions === 0) {
        item.interval = 1;
      } else if (item.repetitions === 1) {
        item.interval = 6;
      } else {
        item.interval = Math.round(item.interval * item.easeFactor);
      }
      item.repetitions += 1;
    }

    // Update ease factor (never below 1.3)
    item.easeFactor = Math.max(
      1.3,
      item.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    );

    // Set next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + item.interval);
    item.nextReviewDate = nextDate;

    return this.reviewRepo.save(item);
  }

  async getContext(
    studentId: string,
    itemId: string,
  ): Promise<{
    previousAnswer: number;
    isCorrect: boolean;
    timeSpentSeconds: number | null;
    errorPattern: string | null;
  }> {
    const item = await this.reviewRepo.findOne({
      where: { id: itemId, studentId },
    });
    if (!item) throw new NotFoundException('Review item not found');

    const lastResponse = await this.responseRepo.findOne({
      where: { studentId, questionId: item.questionId },
      order: { createdAt: 'DESC' },
    });

    if (!lastResponse) {
      throw new NotFoundException('No previous response found for this question');
    }

    return {
      previousAnswer: lastResponse.chosenAnswer,
      isCorrect: lastResponse.isCorrect,
      timeSpentSeconds: lastResponse.timeSpentSeconds,
      errorPattern: lastResponse.errorPattern,
    };
  }

  async retry(
    studentId: string,
    itemId: string,
    chosenAnswer: number,
    timeSpentSeconds: number | null,
  ): Promise<{
    isCorrect: boolean;
    previousAnswer: number;
    correctAnswer: number;
    awaitingRating: boolean;
  }> {
    const item = await this.reviewRepo.findOne({
      where: { id: itemId, studentId },
      relations: ['question'],
    });
    if (!item) throw new NotFoundException('Review item not found');

    const question = item.question;
    const isCorrect = chosenAnswer === question.correctAnswer;

    // Get previous answer for comparison
    const lastResponse = await this.responseRepo.findOne({
      where: { studentId, questionId: item.questionId },
      order: { createdAt: 'DESC' },
    });
    const previousAnswer = lastResponse?.chosenAnswer ?? -1;

    // Save new response with sessionType 'review'
    const response = this.responseRepo.create({
      studentId,
      questionId: item.questionId,
      sessionId: itemId, // use review item ID as session reference
      sessionType: 'review',
      chosenAnswer,
      isCorrect,
      timeSpentSeconds,
      hintsUsed: 0,
    });
    await this.responseRepo.save(response);

    return {
      isCorrect,
      previousAnswer,
      correctAnswer: question.correctAnswer,
      awaitingRating: true,
    };
  }

  async getStepByStep(
    studentId: string,
    itemId: string,
  ): Promise<{ stepByStep: string }> {
    const item = await this.reviewRepo.findOne({
      where: { id: itemId, studentId },
      relations: ['question', 'question.passage'],
    });
    if (!item) throw new NotFoundException('Review item not found');

    const question = item.question;

    // Return cached if available
    if (question.stepByStep) {
      return { stepByStep: question.stepByStep };
    }

    // Generate and cache
    const stepByStep = await this.llmService.generateStepByStep({
      passageText: question.passage?.text ?? '',
      stem: question.stem,
      choices: question.choices,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });

    await this.questionRepo.update(question.id, { stepByStep });

    return { stepByStep };
  }

  async getSimilar(
    studentId: string,
    itemId: string,
  ): Promise<{
    stem: string;
    choices: { label: string; text: string }[];
    correctAnswer: number;
    explanation: string;
  }> {
    const item = await this.reviewRepo.findOne({
      where: { id: itemId, studentId },
      relations: ['question', 'question.passage', 'question.skills'],
    });
    if (!item) throw new NotFoundException('Review item not found');

    const question = item.question;

    return this.llmService.generateSimilarQuestion({
      passageText: question.passage?.text ?? '',
      stem: question.stem,
      choices: question.choices,
      skillNames: question.skills?.map((s) => s.name) ?? [],
      difficulty: question.difficulty,
    });
  }
}
