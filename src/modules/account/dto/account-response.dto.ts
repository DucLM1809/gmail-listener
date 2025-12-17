import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../core/dto/base-response.dto';

export class AccountResponseDto extends BaseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  currentBalance: number;

  @ApiProperty()
  initialBalance: number;

  @ApiProperty()
  userId: string;
}
