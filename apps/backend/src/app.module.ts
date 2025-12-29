import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DiaryModule } from './diary/diary.module';

@Module({
  imports: [PrismaModule, DiaryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
