import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { EventEntity } from './event.entity.js';
import { TabletAssignmentEntity } from './tablet-assignment.entity.js';

@Entity('tablets')
@Index(['event', 'name'], { unique: true })
export class TabletEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => EventEntity, e => e.tablets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event!: EventEntity;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'enum', enum: ['match', 'team'] })
    purpose!: 'match' | 'team';

    @OneToMany(() => TabletAssignmentEntity, a => a.tablet, { cascade: true, eager: true })
    assignments!: TabletAssignmentEntity[];
}
