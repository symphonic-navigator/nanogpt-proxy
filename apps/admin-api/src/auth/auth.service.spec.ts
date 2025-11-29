import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EnvironmentService, UserRepository } from '@nanogpt-monorepo/core';
import { SecurityService } from '../security/security.service';
import { TokenService } from '../security/token.service';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import jwt from 'jsonwebtoken';
import { LoginDto } from '../dtos/login.dto';

// Helpers / mocks typed proprement
const makeUserRepoMock = () => ({
  getUser: jest.fn<Promise<UserEntity | null>, [string]>(),
  saveUser: jest.fn<Promise<void>, [UserEntity]>(),
});

const makeSecurityMock = () => ({
  hashPassword: jest.fn<Promise<string>, [string]>(),
  verifyPassword: jest.fn<Promise<boolean>, [string, string]>(),
});

const makeTokenMock = () => ({
  rotateTokens: jest.fn<Promise<{ accessToken: string; refreshToken: string }>, [UserEntity]>(),
  verifyRefreshToken: jest.fn<Promise<{ sub: string }>, [string]>(),
  blacklistAccessToken: jest.fn<Promise<void>, [string, number?]>(),
  revokeRefreshForUser: jest.fn<Promise<void>, [string]>(),
});

// On ne se casse pas la tête : mock partiel de l'env
const makeEnvMock = () =>
  ({
    adminEmail: 'admin@example.com',
    adminPassword: 'bootstrap-secret',
  }) as Partial<EnvironmentService>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof makeUserRepoMock>;
  let security: ReturnType<typeof makeSecurityMock>;
  let tokens: ReturnType<typeof makeTokenMock>;
  let env: Partial<EnvironmentService>;

  beforeEach(async () => {
    userRepo = makeUserRepoMock();
    security = makeSecurityMock();
    tokens = makeTokenMock();
    env = makeEnvMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepo },
        { provide: SecurityService, useValue: security },
        { provide: TokenService, useValue: tokens },
        { provide: EnvironmentService, useValue: env },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('ensureBootstrapAdmin (indirect)', () => {
    it('crée un admin bootstrap si adminEmail/adminPassword sont configurés et que l’admin n’existe pas', async () => {
      // getUser est appelé 2 fois dans login():
      // 1) dans ensureBootstrapAdmin avec env.adminEmail
      // 2) pour l’email du dto
      userRepo.getUser
        .mockResolvedValueOnce(null) // bootstrap: admin inexistant
        .mockResolvedValueOnce(null); // login: aussi inexistant -> on va se rendre jusqu’à l’Unauthorized

      security.hashPassword.mockResolvedValue('hashed-bootstrap');

      await expect(
        service.login({ email: 'admin@example.com', password: 'whatever' } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(userRepo.getUser).toHaveBeenCalledWith('admin@example.com');
      expect(security.hashPassword).toHaveBeenCalledWith('bootstrap-secret');
      expect(userRepo.saveUser).toHaveBeenCalledWith(
        expect.objectContaining<UserEntity>({
          email: 'admin@example.com',
          role: 'ADMIN',
          enabled: true,
          password: 'hashed-bootstrap',
          api_key: '',
        }),
      );
    });

    it("ne recrée pas l'admin si un ADMIN existe déjà", async () => {
      const existingAdmin: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'hashed',
        api_key: '',
        role: 'ADMIN',
      };

      userRepo.getUser
        .mockResolvedValueOnce(existingAdmin) // bootstrap: admin déjà présent
        .mockResolvedValueOnce(existingAdmin); // login: même user

      security.verifyPassword.mockResolvedValue(true);
      tokens.rotateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.login({
        email: 'admin@example.com',
        password: 'secret',
      } as LoginDto);

      expect(userRepo.saveUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
    });
  });

  describe('login', () => {
    it('lance Unauthorized si user est introuvable ou pas ADMIN', async () => {
      // bootstrap voit un admin existant
      const bootstrapAdmin: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'x',
        api_key: '',
        role: 'ADMIN',
      };

      userRepo.getUser
        .mockResolvedValueOnce(bootstrapAdmin) // ensureBootstrapAdmin
        .mockResolvedValueOnce(null); // login pour dto -> user introuvable

      await expect(
        service.login({ email: 'someone@example.com', password: 'pw' } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(security.verifyPassword).not.toHaveBeenCalled();
      expect(tokens.rotateTokens).not.toHaveBeenCalled();
    });

    it('lance Unauthorized si le mot de passe est invalide', async () => {
      const bootstrapAdmin: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'x',
        api_key: '',
        role: 'ADMIN',
      };

      const loginUser: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'hashed',
        api_key: '',
        role: 'ADMIN',
      };

      userRepo.getUser
        .mockResolvedValueOnce(bootstrapAdmin) // bootstrap
        .mockResolvedValueOnce(loginUser); // login

      security.verifyPassword.mockResolvedValue(false);

      await expect(
        service.login({ email: 'admin@example.com', password: 'bad' } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(security.verifyPassword).toHaveBeenCalledWith('bad', 'hashed');
      expect(tokens.rotateTokens).not.toHaveBeenCalled();
    });

    it('retourne tokens + info user si credentials valides', async () => {
      const bootstrapAdmin: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'x',
        api_key: '',
        role: 'ADMIN',
      };

      const loginUser: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'hashed',
        api_key: '',
        role: 'ADMIN',
      };

      userRepo.getUser
        .mockResolvedValueOnce(bootstrapAdmin) // bootstrap
        .mockResolvedValueOnce(loginUser); // login

      security.verifyPassword.mockResolvedValue(true);
      tokens.rotateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.login({
        email: 'admin@example.com',
        password: 'good',
      } as LoginDto);

      expect(tokens.rotateTokens).toHaveBeenCalledWith(loginUser);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
    });
  });

  describe('refresh', () => {
    it('retourne de nouveaux tokens si refresh valide et user actif', async () => {
      tokens.verifyRefreshToken.mockResolvedValue({ sub: 'user@example.com' });

      const user: UserEntity = {
        enabled: true,
        email: 'user@example.com',
        password: 'hashed',
        api_key: 'enc-key',
        role: 'USER',
      };

      userRepo.getUser.mockResolvedValue(user);

      tokens.rotateTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const result = await service.refresh('refresh-token');

      expect(tokens.verifyRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(userRepo.getUser).toHaveBeenCalledWith('user@example.com');
      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('lance Unauthorized si user introuvable ou disabled', async () => {
      tokens.verifyRefreshToken.mockResolvedValue({ sub: 'ghost@example.com' });
      userRepo.getUser.mockResolvedValue(null);

      await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(UnauthorizedException);

      // disabled
      const disabledUser: UserEntity = {
        enabled: false,
        email: 'user@example.com',
        password: 'x',
        api_key: 'y',
        role: 'USER',
      };
      tokens.verifyRefreshToken.mockResolvedValue({ sub: 'user@example.com' });
      userRepo.getUser.mockResolvedValue(disabledUser);

      await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const decodeSpy = jest.spyOn(jwt, 'decode');

    afterEach(() => {
      decodeSpy.mockReset();
    });

    it('blackliste l’access token et révoque le refresh si payload valide', async () => {
      decodeSpy.mockReturnValue({
        sub: 'user@example.com',
        jti: 'jti-123',
        exp: 1234567890,
      });

      await service.logout('access-token-value');

      expect(tokens.blacklistAccessToken).toHaveBeenCalledWith('jti-123', 1234567890);
      expect(tokens.revokeRefreshForUser).toHaveBeenCalledWith('user@example.com');
    });

    it('should do nothing if token is invalid or missing sub/jti', async () => {
      decodeSpy.mockReturnValue(null);

      await service.logout('bad-token');

      expect(tokens.blacklistAccessToken).not.toHaveBeenCalled();
      expect(tokens.revokeRefreshForUser).not.toHaveBeenCalled();

      decodeSpy.mockReturnValue({ sub: 'user@example.com' });
      await service.logout('another-token');

      expect(tokens.blacklistAccessToken).not.toHaveBeenCalled();
      expect(tokens.revokeRefreshForUser).not.toHaveBeenCalled();
    });
  });
});
