import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IGenericRepository } from '../../domain/repositories/generic.repository';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export abstract class PrismaGenericRepository<T>
  implements IGenericRepository<T>
{
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {}

  findAll(params?: any): Prisma.PrismaPromise<T[]> {
    return (this.prisma as any)[this.modelName].findMany(params);
  }

  findOne(id: string | number): Prisma.PrismaPromise<T | null> {
    return (this.prisma as any)[this.modelName].findUnique({
      where: { id },
    });
  }

  create(data: any): Prisma.PrismaPromise<T> {
    return (this.prisma as any)[this.modelName].create({
      data,
    });
  }

  update(id: string | number, data: any): Prisma.PrismaPromise<T> {
    return (this.prisma as any)[this.modelName].update({
      where: { id },
      data,
    });
  }

  delete(id: string | number): Prisma.PrismaPromise<T> {
    return (this.prisma as any)[this.modelName].delete({
      where: { id },
    });
  }

  count(params?: any): Prisma.PrismaPromise<number> {
    return (this.prisma as any)[this.modelName].count(params);
  }

  aggregate(params: any): Prisma.PrismaPromise<any> {
    return (this.prisma as any)[this.modelName].aggregate(params);
  }

  groupBy(params: any): Prisma.PrismaPromise<any> {
    return (this.prisma as any)[this.modelName].groupBy(params);
  }
}
