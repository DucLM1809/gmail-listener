import { Category } from 'generated/prisma/client';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryType } from '../enums/type.enum';

export class CategoryMapper {
  static toDto(entity: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();

    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.image = entity.image;
    dto.type = CategoryType[entity.type];
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
