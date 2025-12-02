import { ApiProperty } from '@nestjs/swagger';

export class BaseErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    example: 'Validation failed',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: '2023-10-27T10:00:00.000Z', required: false })
  timestamp?: string;

  @ApiProperty({ example: '/api/v1/auth/login', required: false })
  path?: string;
}
