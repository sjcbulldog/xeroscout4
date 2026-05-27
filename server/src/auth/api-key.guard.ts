import {
    CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';

export const AUTH_CONTEXT_KEY = 'authContext';

const LOCALHOST_ADDRS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Central always connects via localhost — bypass key auth for local connections.
        // Remote devices (tablets) connect over the network and still require a key.
        const remoteAddr: string = request.socket?.remoteAddress ?? '';
        if (LOCALHOST_ADDRS.has(remoteAddr)) {
            request[AUTH_CONTEXT_KEY] = { teamNumber: 0, keyId: -1, label: 'localhost' };
            return true;
        }

        const authHeader: string | undefined = request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or malformed Authorization header');
        }

        const rawKey = authHeader.slice('Bearer '.length).trim();
        const authCtx = await this.authService.validateKey(rawKey);
        request[AUTH_CONTEXT_KEY] = authCtx;
        return true;
    }
}
