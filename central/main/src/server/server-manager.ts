import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { ChildProcess, spawn } from 'child_process';
import { Logger } from 'winston';

const SERVER_PORT = 4560;
const HEALTH_URL = `http://localhost:${SERVER_PORT}/api/v1/health`;
const MAX_WAIT_MS = 30_000;
const POLL_INTERVAL_MS = 500;

export class ServerManager {
    private process: ChildProcess | null = null;
    private readonly logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    getBaseUrl(): string {
        return `http://localhost:${SERVER_PORT}`;
    }

    async start(): Promise<void> {
        const serverEntry = this.resolveServerEntry();
        const serverEnvFile = path.resolve(path.dirname(serverEntry), '..', '.env');
        const serverEnv = this.loadDotEnv(serverEnvFile);
        this.logger.info('Starting NestJS server', { entry: serverEntry, envFile: serverEnvFile });

        this.process = spawn(process.execPath, [serverEntry], {
            env: {
                ...process.env,
                ...serverEnv,
                PORT: String(SERVER_PORT),
                NODE_ENV: process.env.NODE_ENV ?? 'production',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        this.process.stdout?.on('data', (data: Buffer) => {
            this.logger.info('[server]', { msg: data.toString().trim() });
        });
        this.process.stderr?.on('data', (data: Buffer) => {
            this.logger.warn('[server stderr]', { msg: data.toString().trim() });
        });
        this.process.on('exit', (code) => {
            this.logger.info('Server process exited', { code });
            this.process = null;
        });

        await this.waitForReady();
        this.logger.info('NestJS server is ready');
    }

    async stop(): Promise<void> {
        if (this.process) {
            this.logger.info('Stopping NestJS server');
            this.process.kill('SIGTERM');
            this.process = null;
        }
    }

    private loadDotEnv(envFile: string): Record<string, string> {
        if (!fs.existsSync(envFile)) return {};
        const result: Record<string, string> = {};
        for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const idx = trimmed.indexOf('=');
            if (idx < 1) continue;
            result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
        }
        return result;
    }

    private resolveServerEntry(): string {
        // In packaged app, server dist lives next to the main executable
        const packaged = path.join(path.dirname(process.execPath), 'server', 'dist', 'main.js');
        if (fs.existsSync(packaged)) return packaged;

        // In development, look relative to this file
        const dev = path.resolve(__dirname, '..', '..', '..', '..', '..', 'server', 'dist', 'main.js');
        if (fs.existsSync(dev)) return dev;

        throw new Error(`Cannot locate server entry point. Checked:\n  ${packaged}\n  ${dev}`);
    }

    private waitForReady(): Promise<void> {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const poll = () => {
                http.get(HEALTH_URL, (res) => {
                    if (res.statusCode === 200) {
                        resolve();
                    } else {
                        retry();
                    }
                }).on('error', retry);
            };
            const retry = () => {
                if (Date.now() - start > MAX_WAIT_MS) {
                    reject(new Error('Server did not become ready in time'));
                } else {
                    setTimeout(poll, POLL_INTERVAL_MS);
                }
            };
            poll();
        });
    }
}
