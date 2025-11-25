import { Injectable } from '@nestjs/common';
import { EnvironmentService, UserRepository } from '@nanogpt-monorepo/core';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { CreateUserDto } from '../dtos/create-user-dto';
import { toUserEntity } from '../mappers/user.mapper';
import { SecurityService } from '../security/security.service';
import { DeleteUserDto } from '../dtos/delete-user-dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly environment: EnvironmentService,
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

  async deleteUser(dto: DeleteUserDto): Promise<void> {
    const exists = await this.users.getUser(dto.email);
    if (!exists) {
      throw Error(`Can't remove user`);
    }

    if (exists.role === 'ADMIN' && this.environment.adminEmail === dto.email) {
      throw Error(`Can't remove user`);
    }

    await this.users.deleteUser(dto.email);
  }

  async updateUser(dto: CreateUserDto): Promise<void> {
    const exists = await this.users.getUser(dto.email);
    if (!exists) {
      throw Error(`Can't update user`);
    }

    return this.users.saveUser(toUserEntity(dto));
  }

  async getAll(): Promise<Omit<UserEntity, 'password'>[]> {
    return this.users.getAllUsers();
  }
}
