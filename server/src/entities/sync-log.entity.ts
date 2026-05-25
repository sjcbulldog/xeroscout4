import {
    Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn,
} from 'typeorm';

@Entity('sync_log')
@Index(['tableName', 'rowId'])
@Index(['synced', 'changedAt'])
export class SyncLogEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id!: number;

    @Column({ name: 'table_name', type: 'varchar', length: 64 })
    tableName!: string;

    @Column({ name: 'row_id', type: 'int' })
    rowId!: number;

    @Column({ type: 'enum', enum: ['insert', 'update', 'delete'] })
    operation!: 'insert' | 'update' | 'delete';

    @Column({ name: 'changed_at', type: 'datetime', precision: 3 })
    changedAt!: Date;

    @Column({ type: 'enum', enum: ['central', 'cloud'] })
    source!: 'central' | 'cloud';

    @Column({ type: 'boolean', default: false })
    synced!: boolean;
}
