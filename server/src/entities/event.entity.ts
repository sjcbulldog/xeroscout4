import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    OneToMany, Index,
} from 'typeorm';
import { TeamEntity } from './team.entity.js';
import { MatchEntity } from './match.entity.js';
import { TabletEntity } from './tablet.entity.js';
import { ScoutingResultEntity } from './scouting-result.entity.js';
import { CorrectionEntity } from './correction.entity.js';
import {
    FormulaEntity,
    DatasetEntity,
    GraphEntity,
    PicklistEntity,
    PlayoffBracketEntity,
} from './analysis.entities.js';

@Entity('events')
export class EventEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 36 })
    uuid!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ name: 'ba_event_key', type: 'varchar', length: 64, nullable: true })
    baEventKey!: string | null;

    @Column({ type: 'int' })
    year!: number;

    @Column({ name: 'start_date', type: 'varchar', length: 16, nullable: true })
    startDate!: string | null;

    @Column({ name: 'end_date', type: 'varchar', length: 16, nullable: true })
    endDate!: string | null;

    @Column({ type: 'boolean', default: false })
    locked!: boolean;

    @Column({ name: 'team_form_json', type: 'longtext', nullable: true })
    teamFormJson!: string | null;

    @Column({ name: 'match_form_json', type: 'longtext', nullable: true })
    matchFormJson!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => TeamEntity, t => t.event, { cascade: true })
    teams!: TeamEntity[];

    @OneToMany(() => MatchEntity, m => m.event, { cascade: true })
    matches!: MatchEntity[];

    @OneToMany(() => TabletEntity, t => t.event, { cascade: true })
    tablets!: TabletEntity[];

    @OneToMany(() => ScoutingResultEntity, r => r.event, { cascade: true })
    scoutingResults!: ScoutingResultEntity[];

    @OneToMany(() => CorrectionEntity, c => c.event, { cascade: true })
    corrections!: CorrectionEntity[];

    @OneToMany(() => FormulaEntity, f => f.event, { cascade: true })
    formulas!: FormulaEntity[];

    @OneToMany(() => DatasetEntity, d => d.event, { cascade: true })
    datasets!: DatasetEntity[];

    @OneToMany(() => GraphEntity, g => g.event, { cascade: true })
    graphs!: GraphEntity[];

    @OneToMany(() => PicklistEntity, p => p.event, { cascade: true })
    picklists!: PicklistEntity[];

    @OneToMany(() => PlayoffBracketEntity, b => b.event, { cascade: true })
    playoffBracket!: PlayoffBracketEntity[];
}
