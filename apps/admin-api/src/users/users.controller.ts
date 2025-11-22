import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../security/jwt-auth-guard';
import { UsersService } from './users.service';

@Controller('v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async listUsers() {
    return this.users.getAll();
  }
}
