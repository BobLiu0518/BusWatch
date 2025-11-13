import settings from '@/utils/settings.ts';
import { getLogger, setLogLevel } from '@/utils/logger.ts';
import Poller from '@/utils/poller.ts';
import { Service, autoloadServices } from '@/utils/service.ts';
import { initOrm, closeOrm } from '@/utils/orm.ts';

setLogLevel(settings.logLevel);
const logger = getLogger().child('Watcher');

const main = async () => {
    logger.info('Watch starting');
    await autoloadServices(new URL(import.meta.resolve('@/services/')));

    const services = Service.getServices();
    const entities = Service.getEntities();
    await initOrm(entities, settings.dbFile);

    const pollers: Poller[] = services.map(
        ({ instance: service, ctor }) =>
            new Poller({
                name: ctor.name ?? service.constructor.name,
                intervalMs: (ctor.interval ?? 5) * 60 * 1000,
                immediate: true,
                task: async (signal) => {
                    if (signal.aborted) return;
                    await service.run();
                },
            })
    );

    pollers.forEach((p) => p.start());

    let shuttingDown = false;
    const shutdown = async (reason: string) => {
        if (shuttingDown) return;
        shuttingDown = true;
        logger.warn(`Shutdown requested: ${reason}`);
        await Promise.all(pollers.map((p) => p.stop()));
        try {
            await closeOrm();
        } catch (err) {
            logger.error('Error occurred when shutting down', err);
        }
        logger.info('All pollers stopped. Bye.');
    };

    const onSig = (sig: Deno.Signal) => () => {
        shutdown(sig).then(() => Deno.exit(0));
    };
    Deno.addSignalListener('SIGINT', onSig('SIGINT'));
    if (Deno.build.os != 'windows') {
        Deno.addSignalListener('SIGTERM', onSig('SIGTERM'));
    }
};

main().catch((err) => {
    logger.error('Fatal error', err);
    Deno.exit(1);
});
