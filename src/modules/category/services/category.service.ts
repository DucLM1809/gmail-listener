import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PageMetaDto } from '../../../core/dto/page-meta.dto';
import { PageOptionsDto } from '../../../core/dto/page-options.dto';
import { PageDto } from '../../../core/dto/page.dto';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { CategoryPageOptionsDto } from '../dto/category-page-options.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryMapper } from '../mappers/category.mapper';
import { Result } from '../../../core/result';
import { CategoryNotFoundException } from '../exceptions/category.exceptions';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class CategoryService {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    userId: string,
  ): Promise<Result<CategoryResponseDto>> {
    const category = await this.categoryRepository.create({
      name: createCategoryDto.name,
      description: createCategoryDto.description,
      image: createCategoryDto.image,
      type: createCategoryDto.type,
      user: {
        connect: {
          id: userId,
        },
      },
    });

    return Result.ok(CategoryMapper.toDto(category));
  }

  async findAll(
    pageOptionsDto: CategoryPageOptionsDto,
    userId: string,
  ): Promise<Result<PageDto<CategoryResponseDto>>> {
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(pageOptionsDto.q && {
        name: {
          contains: pageOptionsDto.q,
          mode: 'insensitive',
        },
      }),
      ...(pageOptionsDto.type && {
        type: pageOptionsDto.type,
      }),
      OR: [{ createdBy: userId }, { createdBy: null }],
    };

    const [categories, total] = await this.prismaService.$transaction([
      this.categoryRepository.findAll({
        skip: pageOptionsDto.skip,
        take: pageOptionsDto.take,
        where,
        orderBy: {
          createdAt: pageOptionsDto.order === 'ASC' ? 'asc' : 'desc',
        },
      }),
      this.categoryRepository.count({
        where,
      }),
    ]);

    const pageMetaDto = new PageMetaDto({ itemCount: total, pageOptionsDto });
    const data = categories.map(CategoryMapper.toDto);

    return Result.ok(new PageDto(data, pageMetaDto));
  }

  async findOne(id: string): Promise<Result<CategoryResponseDto>> {
    const category = await this.categoryRepository.findOne(id);

    if (!category || category.deletedAt) {
      return Result.fail(new CategoryNotFoundException());
    }

    return Result.ok(CategoryMapper.toDto(category));
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Result<CategoryResponseDto>> {
    const categoryExists = await this.categoryRepository.findOne(id);

    if (!categoryExists || categoryExists.deletedAt) {
      return Result.fail(new CategoryNotFoundException());
    }

    const category = await this.categoryRepository.update(
      id,
      updateCategoryDto,
    );

    return Result.ok(CategoryMapper.toDto(category));
  }

  async remove(id: string, userId: string): Promise<Result<boolean>> {
    const category = await this.categoryRepository.findOne(id);

    if (!category || category.deletedAt) {
      return Result.fail(new CategoryNotFoundException());
    }

    if (category.createdBy !== userId) {
      return Result.fail(new Error('You can only delete your own categories'));
    }

    await this.categoryRepository.update(id, {
      deletedAt: new Date(),
    });

    return Result.ok(true);
  }
}
