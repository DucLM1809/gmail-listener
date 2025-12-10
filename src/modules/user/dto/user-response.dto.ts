import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../../core/dto/base-response.dto';
import { Role } from 'src/modules/auth/enums/role.enum';

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'b4cb4cc6-ed4e-49db-a79b-bfd4deef0190' })
  id: string;

  @ApiProperty({ example: 'example@gmail.com' })
  email: string;

  @ApiProperty({ example: 'Example Name' })
  name: string;

  @ApiProperty({ example: 'https://example.com/picture.jpg' })
  picture: string;

  @ApiProperty({ enum: Role, example: 'ADMIN' })
  role: string;
}
