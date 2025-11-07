import { getLogger, type Logger } from '@/utils/logger.ts';

type PollerOptions = {
    name: string;
    intervalMs: number;
    immediate?: boolean;
    task: (signal: AbortSignal) => Promise<void>;
};

export default class Poller {
    private name: string;
    private intervalMs: number;
    private immediate: boolean;
    private logger: Logger;
    private task: (signal: AbortSignal) => Promise<void>;
    private controller: AbortController;
    private timer?: number;
    private running = false;

    constructor(opts: PollerOptions) {
        this.name = opts.name;
        this.intervalMs = Math.max(1 * 60 * 1000, opts.intervalMs);
        this.immediate = opts.immediate ?? false;
        this.logger = getLogger().child(`Poller`).child(this.name);
        this.task = opts.task;
        this.controller = new AbortController();
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.logger.info(`Start (Every ${this.intervalMs / 60 / 1000} minutes)`);
        if (this.immediate) this.runOnce();
        this.schedule();
    }

    private schedule() {
        if (!this.running) return;
        this.timer = setTimeout(() => this.runOnce().finally(() => this.schedule()), this.intervalMs);
    }

    private async runOnce() {
        if (!this.running) return;
        try {
            await this.task(this.controller.signal);
        } catch (e) {
            this.logger.error('Task error:', e);
        }
    }

    stop(): Promise<void> {
        if (!this.running) return Promise.resolve();
        this.running = false;
        if (this.timer) clearTimeout(this.timer);
        this.controller.abort();
        this.logger.info('Stopped');
        return Promise.resolve();
    }
}
