import { Account } from 'generated/prisma/client';
import { AccountResponseDto } from '../dto/account-response.dto';

export class AccountMapper {
  static toDto(entity: Account): AccountResponseDto {
    const dto = new AccountResponseDto();

    dto.id = entity.id;
    dto.name = entity.name;
    dto.type = entity.type;
    dto.currentBalance = entity.currentBalance;
    dto.initialBalance = entity.initialBalance;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    return dto;
  }
}
