import * as SQLite from 'expo-sqlite';
import type { ApiSubmitResultRequest } from '@xeroscout4/shared';

export interface QueuedResult {
    id: number;
    eventUuid: string;
    payload: ApiSubmitResultRequest;
    attempts: number;
    createdAt: number;
    lastError?: string;
}

const DB_NAME = 'xeroscout_queue.db';

let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
    if (!_db) {
        _db = SQLite.openDatabaseSync(DB_NAME);
        _db.execSync(`
            CREATE TABLE IF NOT EXISTS result_queue (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                event_uuid  TEXT NOT NULL,
                payload     TEXT NOT NULL,
                attempts    INTEGER NOT NULL DEFAULT 0,
                created_at  INTEGER NOT NULL,
                last_error  TEXT
            );
        `);
    }
    return _db;
}

export async function enqueue(eventUuid: string, result: ApiSubmitResultRequest): Promise<number> {
    const db = getDb();
    const now = Date.now();
    const stmt = db.prepareSync(
        'INSERT INTO result_queue (event_uuid, payload, attempts, created_at) VALUES (?, ?, 0, ?)'
    );
    const res = stmt.executeSync(eventUuid, JSON.stringify(result), now);
    stmt.finalizeSync();
    return res.lastInsertRowId;
}

export function listPending(): QueuedResult[] {
    const db = getDb();
    const rows = db.getAllSync<{
        id: number; event_uuid: string; payload: string;
        attempts: number; created_at: number; last_error: string | null;
    }>('SELECT * FROM result_queue ORDER BY created_at ASC');
    return rows.map(r => ({
        id: r.id,
        eventUuid: r.event_uuid,
        payload: JSON.parse(r.payload) as ApiSubmitResultRequest,
        attempts: r.attempts,
        createdAt: r.created_at,
        lastError: r.last_error ?? undefined,
    }));
}

export function markSent(id: number): void {
    const db = getDb();
    db.runSync('DELETE FROM result_queue WHERE id = ?', id);
}

export function markFailed(id: number, error: string): void {
    const db = getDb();
    db.runSync(
        'UPDATE result_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?',
        error, id
    );
}

export function pendingCount(): number {
    const db = getDb();
    const row = db.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM result_queue');
    return row?.cnt ?? 0;
}
