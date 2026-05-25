import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { ApiKeyEntity } from '../entities/api-key.entity.js';

export interface AuthContext {
    teamNumber: number;
    keyId: number;
    label: string;
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(ApiKeyEntity)
        private readonly keyRepo: Repository<ApiKeyEntity>,
    ) {}

    static hashKey(rawKey: string): string {
        return createHash('sha256').update(rawKey).digest('hex');
    }

    static generateKey(): string {
        return `xs4_${randomBytes(32).toString('hex')}`;
    }

    async validateKey(rawKey: string): Promise<AuthContext> {
        const hash = AuthService.hashKey(rawKey);
        const entity = await this.keyRepo.findOne({ where: { keyHash: hash } });
        if (!entity) {
            throw new UnauthorizedException('Invalid API key');
        }
        // Update last used timestamp (fire and forget)
        this.keyRepo.update(entity.id, { lastUsedAt: new Date() }).catch(() => {});
        return { teamNumber: entity.teamNumber, keyId: entity.id, label: entity.label };
    }

    async createKey(teamNumber: number, label: string): Promise<{ rawKey: string; entity: ApiKeyEntity }> {
        const rawKey = AuthService.generateKey();
        const keyHash = AuthService.hashKey(rawKey);
        const entity = this.keyRepo.create({ teamNumber, keyHash, label, lastUsedAt: null });
        await this.keyRepo.save(entity);
        return { rawKey, entity };
    }

    async listKeys(teamNumber?: number): Promise<ApiKeyEntity[]> {
        return teamNumber
            ? this.keyRepo.find({ where: { teamNumber } })
            : this.keyRepo.find();
    }

    async deleteKey(id: number): Promise<void> {
        await this.keyRepo.delete(id);
    }
}
