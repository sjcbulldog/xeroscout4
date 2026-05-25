import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { EventEntity } from './event.entity.js';

@Entity('corrections')
@Index(['event', 'resultType', 'matchId', 'teamNumber', 'fieldName'])
export class CorrectionEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => EventEntity, e => e.corrections, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event!: EventEntity;

    @Column({ name: 'result_type', type: 'enum', enum: ['match', 'team'] })
    resultType!: 'match' | 'team';

    @Column({ name: 'match_id', type: 'int', nullable: true })
    matchId!: number | null;

    @Column({ name: 'team_number', type: 'int' })
    teamNumber!: number;

    @Column({ name: 'field_name', type: 'varchar', length: 255 })
    fieldName!: string;

    @Column({ name: 'corrected_value', type: 'text' })
    correctedValue!: string;  // JSON-encoded

    @Column({ name: 'original_value', type: 'text', nullable: true })
    originalValue!: string | null;  // JSON-encoded

    @Column({ name: 'corrected_by', type: 'varchar', length: 255 })
    correctedBy!: string;

    @CreateDateColumn({ name: 'corrected_at' })
    correctedAt!: Date;
}
