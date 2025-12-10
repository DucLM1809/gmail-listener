import { Module } from '@nestjs/common';
import { CategoryService } from './services/category.service';
import { CategoryController } from './controllers/category.controller';
import { CategoryRepository } from '../../infrastructure/repositories/category.repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Module({
  controllers: [CategoryController],
  providers: [
    CategoryService,
    PrismaService,
    { provide: 'ICategoryRepository', useClass: CategoryRepository },
  ],
})
export class CategoryModule {}
