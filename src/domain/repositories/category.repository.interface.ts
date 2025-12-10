import { Category, Prisma } from 'generated/prisma/client';
import { IGenericRepository } from './generic.repository';

export interface ICategoryRepository
  extends Omit<IGenericRepository<Category>, 'create' | 'update'> {
  findAll(
    params?: Prisma.CategoryFindManyArgs,
  ): Prisma.PrismaPromise<Category[]>;
  count(params?: Prisma.CategoryCountArgs): Prisma.PrismaPromise<number>;
  create(data: Prisma.CategoryCreateInput): Prisma.PrismaPromise<Category>;
  update(
    id: string,
    data: Prisma.CategoryUpdateInput,
  ): Prisma.PrismaPromise<Category>;
  delete(id: string): Prisma.PrismaPromise<Category>;
  findOne(id: string): Prisma.PrismaPromise<Category | null>;
}
