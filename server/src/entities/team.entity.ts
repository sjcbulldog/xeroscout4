import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, UpdateDateColumn,
} from 'typeorm';
import { EventEntity } from './event.entity.js';

@Entity('teams')
@Index(['event', 'teamNumber'], { unique: true })
export class TeamEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => EventEntity, e => e.teams, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event!: EventEntity;

    @Column({ name: 'team_number', type: 'int' })
    teamNumber!: number;

    @Column({ type: 'varchar', length: 255, default: '' })
    nickname!: string;

    @Column({ type: 'float', nullable: true })
    opr!: number | null;

    @Column({ type: 'float', nullable: true })
    dpr!: number | null;

    @Column({ type: 'float', nullable: true })
    ccwm!: number | null;

    @Column({ type: 'int', nullable: true })
    rank!: number | null;

    @Column({ type: 'float', nullable: true })
    epa!: number | null;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
