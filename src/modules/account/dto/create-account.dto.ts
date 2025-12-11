import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  initialBalance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  currentBalance?: number;
}
