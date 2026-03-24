import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { StudentProfile } from '../../database/entities/student-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
  ) {}

  async findById(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.name',
        'user.role',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getProfile(userId: string): Promise<StudentProfile> {
    const profile = await this.studentProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    return profile;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<StudentProfile> {
    const profile = await this.getProfile(userId);

    if (dto.grade !== undefined) {
      profile.grade = dto.grade;
    }
    if (dto.targetScore !== undefined) {
      profile.targetScore = dto.targetScore;
    }
    if (dto.targetTestDate !== undefined) {
      profile.targetTestDate = new Date(dto.targetTestDate);
    }
    if (dto.weakAreas !== undefined) {
      profile.preferences = { ...profile.preferences, weakAreas: dto.weakAreas };
    }

    return this.studentProfileRepository.save(profile);
  }
}
