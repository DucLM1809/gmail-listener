import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorGenerateResponseDto {
  @ApiProperty({ example: 'otpauth://totp/...' })
  qrCodeUrl: string;
}
