import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  KnowledgeBaseEntry,
  KnowledgeBaseType,
} from '../../database/entities/knowledge-base-entry.entity';
import { Bookmark } from '../../database/entities/bookmark.entity';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(KnowledgeBaseEntry)
    private readonly entryRepo: Repository<KnowledgeBaseEntry>,
    @InjectRepository(Bookmark)
    private readonly bookmarkRepo: Repository<Bookmark>,
  ) {}

  async search(
    query: string,
    type?: KnowledgeBaseType,
  ): Promise<KnowledgeBaseEntry[]> {
    const qb = this.entryRepo.createQueryBuilder('entry');

    if (query) {
      qb.where('(entry.title ILIKE :query OR entry.content ILIKE :query)', {
        query: `%${query}%`,
      });
    }

    if (type) {
      qb.andWhere('entry.type = :type', { type });
    }

    qb.orderBy('entry.created_at', 'DESC');
    return qb.getMany();
  }

  async getById(id: string): Promise<KnowledgeBaseEntry> {
    const entry = await this.entryRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Knowledge base entry not found');
    }
    return entry;
  }

  async create(
    data: Partial<KnowledgeBaseEntry>,
  ): Promise<KnowledgeBaseEntry> {
    const entry = this.entryRepo.create(data);
    return this.entryRepo.save(entry);
  }

  async update(
    id: string,
    data: Partial<KnowledgeBaseEntry>,
  ): Promise<KnowledgeBaseEntry> {
    const entry = await this.getById(id);
    Object.assign(entry, data);
    return this.entryRepo.save(entry);
  }

  async addBookmark(studentId: string, entryId: string): Promise<Bookmark> {
    await this.getById(entryId);

    const existing = await this.bookmarkRepo.findOne({
      where: { studentId, entryId },
    });
    if (existing) {
      throw new ConflictException('Already bookmarked');
    }

    const bookmark = this.bookmarkRepo.create({ studentId, entryId });
    return this.bookmarkRepo.save(bookmark);
  }

  async removeBookmark(studentId: string, entryId: string): Promise<void> {
    const bookmark = await this.bookmarkRepo.findOne({
      where: { studentId, entryId },
    });
    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }
    await this.bookmarkRepo.remove(bookmark);
  }

  async getBookmarks(studentId: string): Promise<KnowledgeBaseEntry[]> {
    const bookmarks = await this.bookmarkRepo.find({
      where: { studentId },
      relations: ['entry'],
      order: { createdAt: 'DESC' },
    });
    return bookmarks.map((b) => b.entry);
  }
}
