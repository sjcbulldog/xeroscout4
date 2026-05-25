import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { EventEntity } from './event.entity.js';

@Entity('scouting_results')
@Index(['event', 'resultType', 'matchId', 'teamNumber'])
export class ScoutingResultEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => EventEntity, e => e.scoutingResults, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event!: EventEntity;

    @Column({ name: 'tablet_name', type: 'varchar', length: 255 })
    tabletName!: string;

    @Column({ name: 'result_type', type: 'enum', enum: ['match', 'team'] })
    resultType!: 'match' | 'team';

    @Column({ name: 'match_id', type: 'int', nullable: true })
    matchId!: number | null;

    @Column({ name: 'team_number', type: 'int' })
    teamNumber!: number;

    @Column({ name: 'data_json', type: 'longtext' })
    dataJson!: string;

    @Column({ name: 'scouted_at', type: 'datetime' })
    scoutedAt!: Date;

    @CreateDateColumn({ name: 'uploaded_at' })
    uploadedAt!: Date;

    @Column({ type: 'enum', enum: ['tablet', 'central'], default: 'tablet' })
    source!: 'tablet' | 'central';
}
