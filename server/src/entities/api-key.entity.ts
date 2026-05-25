import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { EventEntity } from './event.entity.js';

@Entity('api_keys')
export class ApiKeyEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'team_number', type: 'int' })
    teamNumber!: number;

    @Index({ unique: true })
    @Column({ name: 'key_hash', type: 'varchar', length: 64 })
    keyHash!: string;

    @Column({ type: 'varchar', length: 255 })
    label!: string;

    @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ name: 'last_used_at', type: 'datetime', nullable: true })
    lastUsedAt!: Date | null;
}
