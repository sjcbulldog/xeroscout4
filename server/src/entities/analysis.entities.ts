import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EventEntity } from './event.entity.js';

@Entity('formulas')
export class FormulaEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => EventEntity, e => e.formulas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event!: EventEntity;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    desc!: string | null;

    @Column({ type: 'text' })
    formula!: string;

    @Column({ type: 'enum', enum: ['central', 'scout', 'coach'], default: 'central' })
    owner!: 'central' | 'scout' | 'coach';
}

@Entity('datasets')
export class DatasetEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => EventEntity, e => e.datasets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event!: EventEntity;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ name: 'config_json', type: 'text' })
    configJson!: string;
}

@Entity('graphs')
export class GraphEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => EventEntity, e => e.graphs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event!: EventEntity;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ name: 'config_json', type: 'text' })
    configJson!: string;

    @Column({ type: 'enum', enum: ['central', 'scout', 'coach'], default: 'central' })
    owner!: 'central' | 'scout' | 'coach';
}

@Entity('picklists')
export class PicklistEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => EventEntity, e => e.picklists, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event!: EventEntity;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ name: 'config_json', type: 'longtext' })
    configJson!: string;

    @Column({ type: 'enum', enum: ['central', 'scout', 'coach'], default: 'central' })
    owner!: 'central' | 'scout' | 'coach';
}

@Entity('playoff_bracket')
export class PlayoffBracketEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => EventEntity, e => e.playoffBracket, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event!: EventEntity;

    @Column({ name: 'bracket_json', type: 'longtext' })
    bracketJson!: string;

    @Column({ name: 'updated_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;
}
