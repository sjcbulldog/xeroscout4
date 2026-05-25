import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AUTH_CONTEXT_KEY } from './api-key.guard.js';
import type { AuthContext } from './auth.service.js';

export const CurrentAuth = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): AuthContext => {
        const request = ctx.switchToHttp().getRequest();
        return request[AUTH_CONTEXT_KEY] as AuthContext;
    },
);
