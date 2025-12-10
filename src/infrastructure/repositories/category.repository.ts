import { Injectable } from '@nestjs/common';
import { Category } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaGenericRepository } from './prisma-generic.repository';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';

@Injectable()
export class CategoryRepository
  extends PrismaGenericRepository<Category>
  implements ICategoryRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'category');
  }
}
