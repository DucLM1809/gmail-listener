import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  picture?: string;

  @ApiProperty()
  role: number;

  @ApiProperty()
  isTwoFactorEnabled: boolean;
}
