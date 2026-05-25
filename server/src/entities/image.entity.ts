import {
    Entity, PrimaryGeneratedColumn, Column, Index,
} from 'typeorm';

@Entity('images')
export class ImageEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int', name: 'event_id', nullable: true })
    eventId!: number | null;   // null = global (shared across events)

    @Index({ unique: false })
    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ name: 'mime_type', type: 'varchar', length: 64 })
    mimeType!: string;

    @Column({ name: 'data_base64', type: 'longtext' })
    dataBase64!: string;

    @Column({ name: 'size_bytes', type: 'int' })
    sizeBytes!: number;
}
