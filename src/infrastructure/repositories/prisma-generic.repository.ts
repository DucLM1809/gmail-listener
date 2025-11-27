import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IGenericRepository } from '../../domain/repositories/generic.repository';

@Injectable()
export abstract class PrismaGenericRepository<T>
  implements IGenericRepository<T>
{
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {}

  async findAll(params?: any): Promise<T[]> {
    return (this.prisma as any)[this.modelName].findMany(params);
  }

  async findOne(id: string | number): Promise<T | null> {
    return (this.prisma as any)[this.modelName].findUnique({
      where: { id },
    });
  }

  async create(data: any): Promise<T> {
    return (this.prisma as any)[this.modelName].create({
      data,
    });
  }

  async update(id: string | number, data: any): Promise<T> {
    return (this.prisma as any)[this.modelName].update({
      where: { id },
      data,
    });
  }

  async delete(id: string | number): Promise<T> {
    return (this.prisma as any)[this.modelName].delete({
      where: { id },
    });
  }
}
