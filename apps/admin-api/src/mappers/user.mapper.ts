import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { CreateUserDto } from '../dtos/create-user-dto';

export function toUserEntity(
  dto: CreateUserDto,
  extras: { passwordHash: string; apiKeyEncrypted?: string } = {
    passwordHash: '',
    apiKeyEncrypted: '',
  },
): UserEntity {
  return {
    enabled: true,
    email: dto.email.trim().toLowerCase(),
    password: extras.passwordHash,
    api_key: extras.apiKeyEncrypted ?? dto.api_key ?? '',
    role: 'USER',
  };
}
