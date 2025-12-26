import { ApiProperty } from '@nestjs/swagger';

export class AccountStatsDto {
  @ApiProperty()
  totalInitialBalance: number;

  @ApiProperty()
  totalCurrentBalance: number;

  @ApiProperty()
  accountsByType: { type: string; count: number }[];
}
