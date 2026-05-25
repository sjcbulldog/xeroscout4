import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { TabletEntity } from './tablet.entity.js';
import { MatchEntity } from './match.entity.js';

@Entity('tablet_assignments')
export class TabletAssignmentEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => TabletEntity, t => t.assignments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tablet_id' })
    tablet!: TabletEntity;

    @Column({ name: 'event_id', type: 'int' })
    eventId!: number;

    @ManyToOne(() => MatchEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'match_id' })
    match!: MatchEntity | null;

    @Column({ name: 'team_number', type: 'int', nullable: true })
    teamNumber!: number | null;

    @Column({ name: 'alliance_position', type: 'tinyint', nullable: true })
    alliancePosition!: number | null;
}
