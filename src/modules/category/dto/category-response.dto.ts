import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../core/dto/base-response.dto';
import { CategoryType } from '../enums/type.enum';

export class CategoryResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'cuid-1234' })
  id: string;

  @ApiProperty({ example: 'Groceries' })
  name: string;

  @ApiPropertyOptional({ example: 'Monthly grocery shopping' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/icon.png' })
  image?: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.Expense })
  type: CategoryType;
}
