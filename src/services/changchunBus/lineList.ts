import { EntitySchema } from 'typeorm';
import { Service } from '@/utils/service.ts';
import { ChangchunBusLineInfo, getLineInfo, getLineList, type ChangchunBusLineMeta } from '@/api/changchunBus/index.ts';
import { getRepository } from '@/utils/orm.ts';

export const lineMetaEntity = new EntitySchema<ChangchunBusLineMeta>({
    name: 'changchunBusLines',
    columns: {
        lineNo: { type: 'text', primary: true },
        lineName: { type: 'text' },
        type: { type: 'integer', nullable: true },
        firstStation: { type: 'text', nullable: true },
        lastStation: { type: 'text', nullable: true },
        firstTime: { type: 'text', nullable: true },
        lastTime: { type: 'text', nullable: true },
    },
});

export const lineInfoEntity = new EntitySchema<ChangchunBusLineInfo>({
    name: 'changchunBusLineInfos',
    columns: {
        lineNo: { type: 'text', primary: true },
        isUpDown: { type: 'text', primary: true },
        lineName: { type: 'text' },
        firstStation: { type: 'text', nullable: true },
        lastStation: { type: 'text', nullable: true },
        speed: { type: 'float', nullable: true },
        icinfo: { type: 'text', nullable: true },
    },
    relations: {
        lineNo: {
            target: lineMetaEntity,
            type: 'many-to-one',
            joinColumn: { name: 'lineNo', referencedColumnName: 'lineNo' },
        },
    },
});

export default class ChangchunBusLineService extends Service {
    static override entities = [lineMetaEntity, lineInfoEntity];
    static override interval = 60;

    async run() {
        const linesRepo = getRepository(lineMetaEntity);
        const lineInfosRepo = getRepository(lineInfoEntity);

        this.logger.debug('Getting line list');
        const lineList = await getLineList();
        await linesRepo.upsert(lineList, ['lineNo']);

        await Promise.allSettled(
            lineList.map(async (line) => {
                this.logger.debug(`Getting line info for ${line.lineName}`);
                const lineInfo = await getLineInfo(line.lineNo);
                await lineInfosRepo.upsert(lineInfo, ['lineNo', 'isUpDown']);
            })
        );

        this.logger.debug('Finished');
        this.logger.info(`Upserted ${lineList.length} lines`);
    }
}
