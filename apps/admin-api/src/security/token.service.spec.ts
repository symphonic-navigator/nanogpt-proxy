import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentService, RedisService } from '@nanogpt-monorepo/core';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { TokenService } from './token.service';
import { JwtType } from '@nanogpt-monorepo/core/dist/enums/jwt-type';
import jwt from 'jsonwebtoken';

describe('TokenService', () => {
  let service: TokenService;
  let redis: jest.Mocked<RedisService>;
  let env: Partial<EnvironmentService> & {
    jwtSecret: string;
    jwtExpiresIn: string | number;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string | number;
    jwtBlacklistTtlSeconds: number;
  };

  const user: UserEntity = {
    email: 'user@example.com',
    password: 'hashed',
    api_key: 'encrypted',
    role: 'ADMIN',
    enabled: true,
  };

  beforeEach(async () => {
    redis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      // autres méthodes inutiles ici
    } as unknown as jest.Mocked<RedisService>;

    env = {
      jwtSecret: 'access-secret',
      jwtExpiresIn: '1h',
      jwtRefreshSecret: 'refresh-secret',
      jwtRefreshExpiresIn: '7d',
      jwtBlacklistTtlSeconds: 86_400,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: RedisService, useValue: redis },
        { provide: EnvironmentService, useValue: env },
      ],
    }).compile();

    service = module.get(TokenService);
  });

  it('createAccessToken - génère un token avec les bons champs', async () => {
    const token = await service.createAccessToken({
      email: user.email,
      role: user.role,
    });

    const decoded = jwt.verify(token, env.jwtSecret) as any;

    expect(decoded.sub).toBe(user.email);
    expect(decoded.r).toEqual([user.role]);
    expect(decoded.type).toBe(JwtType.ACCESS);
    expect(typeof decoded.jti).toBe('string');
  });

  it('verifyAccessToken - retourne le payload quand valide', async () => {
    const token = await service.createAccessToken({
      email: user.email,
      role: user.role,
    });

    const payload = await service.verifyAccessToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(user.email);
    expect(payload?.type).toBe(JwtType.ACCESS);
  });

  /*
  it('verifyAccessToken - lève BadRequest si type ≠ ACCESS', async () => {
    const badToken = jwt.sign(
      {
        sub: user.email,
        type: JwtType.REFRESH,
      },
      env.jwtSecret,
    );

    await expect(service.verifyAccessToken(badToken)).rejects.toBeInstanceOf(BadRequestException);
  });
   */

  it('createRefreshToken - stocke le token en Redis avec TTL', async () => {
    redis.set.mockResolvedValueOnce(undefined);

    const token = await service.createRefreshToken(user);

    expect(typeof token).toBe('string');
    expect(redis.set).toHaveBeenCalledTimes(1);

    const [key, storedToken, ttl] = redis.set.mock.calls[0];

    expect(key).toContain('jwt:nanogpt:refresh:');
    expect(storedToken).toBe(token);
    expect(ttl).toBeGreaterThan(0);
  });

  it('verifyRefreshToken - retourne le payload si token valide + match Redis', async () => {
    const token = await service.createRefreshToken(user);
    redis.get.mockResolvedValueOnce(token);

    const payload = await service.verifyRefreshToken(token);

    expect(payload.sub).toBe(user.email);
    expect(payload.type).toBe(JwtType.REFRESH);
  });

  it('verifyRefreshToken - lève BadRequest si type ≠ REFRESH', async () => {
    const badToken = jwt.sign({ sub: user.email, type: JwtType.ACCESS }, env.jwtRefreshSecret);

    await expect(service.verifyRefreshToken(badToken)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('verifyRefreshToken - lève BadRequest si token non trouvé ou mismatch', async () => {
    const token = await service.createRefreshToken(user);
    redis.get.mockResolvedValueOnce(null);

    await expect(service.verifyRefreshToken(token)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rotateTokens - retourne access + refresh tokens', async () => {
    const spyCreateAccess = jest.spyOn(service, 'createAccessToken');
    const spyCreateRefresh = jest.spyOn(service, 'createRefreshToken');

    const { accessToken, refreshToken } = await service.rotateTokens(user);

    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
    expect(spyCreateAccess).toHaveBeenCalled();
    expect(spyCreateRefresh).toHaveBeenCalled();
  });

  it('blacklistAccessToken - met le jti en blacklist', async () => {
    redis.set.mockResolvedValueOnce(undefined);

    await service.blacklistAccessToken('jti-123', undefined);

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('jwt:nanogpt:blacklist:'),
      '1',
      env.jwtBlacklistTtlSeconds,
    );
  });

  it('isBlacklisted - retourne true si Redis contient "1"', async () => {
    redis.get.mockResolvedValueOnce('1');

    const result = await service.isBlacklisted('jti-x');

    expect(redis.get).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('isBlacklisted - retourne false sinon', async () => {
    redis.get.mockResolvedValueOnce(null);

    const result = await service.isBlacklisted('jti-x');

    expect(result).toBe(false);
  });

  it('revokeRefreshForUser - supprime la clé de refresh', async () => {
    redis.del.mockResolvedValueOnce(undefined);

    await service.revokeRefreshForUser(user.email);

    expect(redis.del).toHaveBeenCalledWith(expect.stringContaining('jwt:nanogpt:refresh:'));
  });
});
