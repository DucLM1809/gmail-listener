import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../core/dto/page-options.dto';
import { CategoryType } from '../enums/type.enum';

export class CategoryPageOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional({ enum: CategoryType })
  @IsEnum(CategoryType)
  @IsOptional()
  readonly type?: CategoryType;
}
