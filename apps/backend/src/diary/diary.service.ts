import { Injectable } from '@nestjs/common';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiaryService {
  constructor(private prisma: PrismaService) {}

  create(createDiaryDto: CreateDiaryDto) {
    return this.prisma.diary.create({
      data: createDiaryDto,
    });
  }

  findAll() {
    return this.prisma.diary.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.diary.findUnique({
      where: { id },
    });
  }

  update(id: number, updateDiaryDto: UpdateDiaryDto) {
    return this.prisma.diary.update({
      where: { id },
      data: updateDiaryDto,
    });
  }

  remove(id: number) {
    return this.prisma.diary.delete({
      where: { id },
    });
  }
}
