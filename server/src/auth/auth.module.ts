import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyEntity } from '../entities/api-key.entity.js';
import { AuthService } from './auth.service.js';
import { ApiKeyGuard } from './api-key.guard.js';

@Module({
    imports: [TypeOrmModule.forFeature([ApiKeyEntity])],
    providers: [AuthService, ApiKeyGuard],
    exports: [AuthService, ApiKeyGuard],
})
export class AuthModule {}
