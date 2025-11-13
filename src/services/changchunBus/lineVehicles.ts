import { EntitySchema } from 'typeorm';
import { Service } from '@/utils/service.ts';
import { getRealtime, type ChangchunBusRealtimeVehicle } from '@/api/changchunBus/index.ts';
import { getRepository } from '@/utils/orm.ts';
import { lineInfoEntity, lineMetaEntity } from './lineList.ts';

type VehicleRecord = Pick<ChangchunBusRealtimeVehicle, 'busNo' | 'busNoChar'>;
const vehiclesEntity = new EntitySchema<VehicleRecord>({
    name: 'changchunBusVehicles',
    columns: {
        busNo: { type: 'text' },
        busNoChar: { type: 'text', primary: true },
    },
});

type VehicleOnlineRecord = { busNoChar: string; lineNo: string; date: Date };
const vehiclesOnlineMetaEntity = new EntitySchema<VehicleOnlineRecord>({
    name: 'changchunBusVehiclesOnline',
    columns: {
        busNoChar: { type: 'text', primary: true },
        lineNo: { type: 'text', primary: true },
        date: { type: 'date', primary: true },
    },
    relations: {
        busNoChar: {
            target: vehiclesEntity,
            type: 'many-to-one',
            joinColumn: { name: 'busNoChar', referencedColumnName: 'busNoChar' },
        },
        lineNo: {
            target: lineMetaEntity,
            type: 'many-to-one',
            joinColumn: { name: 'lineNo', referencedColumnName: 'lineNo' },
        },
    },
});

export default class ChangchunBusVehiclesService extends Service {
    static override entities = [vehiclesEntity, vehiclesOnlineMetaEntity];
    static override interval = 5;

    async run() {
        const lineInfosRepo = getRepository(lineInfoEntity);
        const vehicleRepo = getRepository(vehiclesEntity);
        const vehicleOnlineRepo = getRepository(vehiclesOnlineMetaEntity);

        const date = new Date();
        const lineInfos = await lineInfosRepo.find();
        let vehicleCount = 0;

        const tasks = lineInfos.map(async (lineInfo) => {
            this.logger.debug(`Getting realtime for ${lineInfo.lineName}-${lineInfo.isUpDown}`);
            const realtime = await getRealtime(lineInfo.lineNo, lineInfo.isUpDown, '1');
            if ('error' in realtime) {
                this.logger.error(`获取 ${lineInfo.lineName}[${lineInfo.isUpDown}] 实时信息失败`);
                return;
            }

            const vehicles = realtime.allBusList;
            vehicleCount += vehicles.length;

            await vehicleRepo.upsert(vehicles, ['busNoChar']);
            await vehicleOnlineRepo.upsert(
                vehicles.map((vehicle) => ({
                    busNoChar: vehicle.busNoChar,
                    lineNo: lineInfo.lineNo,
                    date,
                })),
                ['busNoChar', 'lineNo', 'date']
            );
        });
        await Promise.allSettled(tasks);

        this.logger.debug('Finished');
        this.logger.info(`Upserted ${vehicleCount} vehicles`);
    }
}
