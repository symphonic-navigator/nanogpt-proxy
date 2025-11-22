import { Injectable } from '@nestjs/common';
import { UserRepository } from '@nanogpt-monorepo/core';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async getAll(): Promise<Omit<UserEntity, 'password'>[]> {
    return this.users.getAllUsers();
  }
}
