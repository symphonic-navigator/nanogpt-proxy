import { Injectable } from '@nestjs/common';
import { UserRepository } from '@nanogpt-monorepo/core';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { CreateUserDto } from '../dtos/create-user-dto';
import { toUserEntity } from '../mappers/user.mapper';
import { SecurityService } from '../security/security.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly security: SecurityService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<void> {
    const exists = await this.users.getUser(dto.email);
    if (exists) {
      throw Error(`User already exists`);
    }

    const passwordHash = await this.security.hashPassword(dto.password);
    const user = toUserEntity(dto, { passwordHash });

    await this.users.saveUser(user);
  }

  async getAll(): Promise<Omit<UserEntity, 'password'>[]> {
    return this.users.getAllUsers();
  }
}
