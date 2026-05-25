import {
    CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';

export const AUTH_CONTEXT_KEY = 'authContext';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
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
