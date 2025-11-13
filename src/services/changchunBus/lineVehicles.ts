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

        const vehicles: VehicleRecord[] = [];
        const vehicleOnlines: VehicleOnlineRecord[] = [];
        const tasks = lineInfos.map(async (lineInfo) => {
            this.logger.debug(`Getting realtime for ${lineInfo.lineName}-${lineInfo.isUpDown}`);
            const realtime = await getRealtime(lineInfo.lineNo, lineInfo.isUpDown, '1');
            if ('error' in realtime) {
                throw new Error(`获取 ${lineInfo.lineName}[${lineInfo.isUpDown}] 实时信息失败`);
            }

            vehicles.push(...realtime.allBusList);
            vehicleOnlines.push(
                ...realtime.allBusList.map((vehicle) => ({
                    busNoChar: vehicle.busNoChar,
                    lineNo: lineInfo.lineNo,
                    date,
                }))
            );
        });
        const results = await Promise.allSettled(tasks);
        results.filter((r) => r.status === 'rejected').forEach((r) => this.logger.error(r.reason));

        this.logger.debug(`Saving ${vehicles.length} vehicles`);
        await vehicleRepo.upsert(vehicles, { conflictPaths: ['busNoChar'], skipUpdateIfNoValuesChanged: true });
        await vehicleOnlineRepo.upsert(vehicleOnlines, { conflictPaths: ['busNoChar', 'lineNo', 'date'], skipUpdateIfNoValuesChanged: true });

        this.logger.info(`Upserted ${vehicles.length} vehicles`);
    }
}
