import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, UpdateDateColumn,
} from 'typeorm';
import { EventEntity } from './event.entity.js';

@Entity('matches')
@Index(['event', 'compLevel', 'matchNumber', 'setNumber'], { unique: true })
export class MatchEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => EventEntity, e => e.matches, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event!: EventEntity;

    @Column({ name: 'comp_level', type: 'enum', enum: ['qm', 'sf', 'f'] })
    compLevel!: 'qm' | 'sf' | 'f';

    @Column({ name: 'match_number', type: 'int' })
    matchNumber!: number;

    @Column({ name: 'set_number', type: 'int', default: 1 })
    setNumber!: number;

    @Column({ type: 'int' })
    red1!: number;

    @Column({ type: 'int' })
    red2!: number;

    @Column({ type: 'int' })
    red3!: number;

    @Column({ type: 'int' })
    blue1!: number;

    @Column({ type: 'int' })
    blue2!: number;

    @Column({ type: 'int' })
    blue3!: number;

    @Column({ name: 'red_score', type: 'int', nullable: true })
    redScore!: number | null;

    @Column({ name: 'blue_score', type: 'int', nullable: true })
    blueScore!: number | null;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
