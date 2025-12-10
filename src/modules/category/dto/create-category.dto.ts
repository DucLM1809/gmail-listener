import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CategoryType } from '../enums/type.enum';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Monthly grocery shopping' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/icon.png' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ enum: CategoryType, example: CategoryType.Expense })
  @IsEnum(CategoryType)
  @IsOptional()
  type?: CategoryType = CategoryType.Expense;
}
