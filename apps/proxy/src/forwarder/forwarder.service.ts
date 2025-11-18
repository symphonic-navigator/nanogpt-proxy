import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Request, Response } from 'express';
import { CryptorService, EnvironmentService, UserRepository } from '@nanogpt-monorepo/core';

@Injectable()
export class ForwarderService {
  private readonly API_BASE = 'https://nano-gpt.com/api';
  private readonly SUBSCRIPTION_API = this.API_BASE + '/subscription/v1';
  private readonly REGULAR_API = this.API_BASE + '/v1';

  constructor(
    private readonly env: EnvironmentService,
    private readonly cryptor: CryptorService,
    private readonly users: UserRepository,
  ) {}

  async handleRequest(req: Request, res: Response) {
    const userEmail = req.headers['x-openwebui-user-email'] as string;

    console.log(`[${req.method}] ${req.path} for ${userEmail || 'unknown user'}`);

    // --- Special: /v1/models passt du durch ohne UserAuth ---
    if (req.path === '/v1/models') {
      return this.forwardModels(res);
    }

    if (!userEmail) {
      throw new HttpException('Missing user email header', HttpStatus.BAD_REQUEST);
    }

    // --- get user from DB ---
    const entry = await this.users.getUser(userEmail);

    if (!entry) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    const decryptedKey = this.cryptor.decrypt(entry.api_key);

    return this.forwardGeneric(req, res, decryptedKey);
  }

  private async forwardModels(res: Response) {
    try {
      const r = await axios.get(`${this.SUBSCRIPTION_API}/models`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60_000,
      });

      return res.json(r.data);
    } catch (err: any) {
      console.error('Error fetching models:', err.response?.data);
      throw new HttpException(err.response?.data, HttpStatus.BAD_GATEWAY);
    }
  }

  private async forwardGeneric(req: Request, res: Response, apiKey: string) {
    const upstream = await axios({
      url: `${this.REGULAR_API}${req.path}`,
      method: req.method as any,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      data: req.method !== 'GET' ? req.body : undefined,
      responseType: 'stream',
      timeout: 180_000,
    });

    res.setHeader('Content-Type', upstream.headers['content-type'] || 'application/json');

    upstream.data.pipe(res);
  }
}
