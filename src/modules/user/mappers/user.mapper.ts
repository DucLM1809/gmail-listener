import { User } from 'generated/prisma/client';
import { Role } from '../../auth/enums/role.enum';
import { UserResponseDto } from '../dto/user-response.dto';

export class UserMapper {
  static toDto(user: User): UserResponseDto {
    const dto = new UserResponseDto();

    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.picture = user.picture;
    dto.role = Role[user.role];
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;

    return dto;
  }
}
