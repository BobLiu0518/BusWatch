import { getLogger, type Logger } from '@/utils/logger.ts';
import type { EntitySchema } from 'typeorm';

export abstract class Service {
    static disabled = false;
    static entities: EntitySchema[] = [];
    static interval: number = 5;
    abstract run(): Promise<void>;

    constructor(protected logger: Logger) {
        if (new.target === Service) {
            throw new Error('Cannot instantiate abstract Service directly');
        }
    }

    private static registry: { ctor: typeof Service; segments: string[] }[] = [];
    static register(subclass: typeof Service, segments: string[] = []) {
        Service.registry.push({ ctor: subclass, segments });
    }

    static getServices(): { ctor: typeof Service; instance: Service }[] {
        return Service.registry.map(({ ctor, segments }) => {
            const logger = segments.reduce((lg, seg) => lg.child(seg), getLogger());
            const instance: Service = Reflect.construct(ctor, [logger]);
            return { ctor, instance };
        });
    }

    static getEntities(): EntitySchema[] {
        const entities = Service.registry.flatMap(({ ctor }) => ctor.entities ?? []);
        return Array.from(new Set(entities));
    }
}

export const autoloadServices = async (path: URL) => {
    const logger = getLogger().child('Loader');
    logger.info('Auto loading');
    const loadServices = async (path: URL, segments: string[]) => {
        const subDirs: Promise<void>[] = [];

        for await (const entry of Deno.readDir(path)) {
            if (entry.isDirectory) {
                subDirs.push(loadServices(new URL(`${entry.name}/`, path), [...segments, entry.name]));
                continue;
            }

            if (!entry.isFile) continue;
            if (!entry.name.endsWith('.ts') || entry.name.startsWith('.')) continue;

            const modUrl = new URL(`./${entry.name}`, path).href;
            try {
                const mod = await import(modUrl);

                const fileBase = entry.name.replace(/\.ts$/, '');
                const service = mod && mod.default;
                if (typeof service === 'function' && service.prototype instanceof Service) {
                    const fullSeg = [...segments, fileBase];
                    logger.info(`${!service.disabled ? 'Load' : 'Skip'} ${fullSeg.slice(1).join(' > ')}`);
                    if (!service.disabled) Service.register(service, fullSeg);
                }
            } catch (err) {
                logger.error(`Load ${modUrl} failed.`, err);
            }
        }

        await Promise.allSettled(subDirs);
    };
    await loadServices(path, ['Service']);
};
