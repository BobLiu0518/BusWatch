import ChangchunBus from './consts.ts';
import { fetchWithParams } from '@/utils/fetch.ts';

type ChangchunBusRealtime = {
    isUse: string;
    busList: ChangchunBusRealtimeVehicle[];
    allBusList: ChangchunBusRealtimeVehicle[];
    flightList: ChangchunBusRealtimeFlight[];
    roadList: ChangchunBusRealtimeRoad[];
    status: 1;
    statusInfo: string;
};

type ChangchunBusRealtimeVehicle = {
    busNo: string;
    busNoChar: string;
    labelNo: number;
    comfortIndex: number;
    onStation: string;
    lat: number;
    lng: number;
};

type ChangchunBusRealtimeFlight = {
    code: number;
    msg: string;
    note: string;
    distance: string;
    minutes: string;
    comfortIndex: number;
    count: number;
    busNo: string;
    busNoChar: string;
    display: string;
};

type ChangchunBusRealtimeRoad = {
    labelNo: string;
    speed: string;
};

type ChangchunBusRealtimeError = {
    status: 500;
    timestamp: number;
    error: string;
    message: string;
    path: string;
};

const getRealtime = async (lineNo: string, isUpDown: '0' | '1', labelNo: string): Promise<ChangchunBusRealtime | ChangchunBusRealtimeError> => {
    const response = await fetchWithParams(`${ChangchunBus.host}${ChangchunBus.api.realTime}`, { lineNo, isUpDown, labelNo, encrypt: 0 });
    const result: ChangchunBusRealtime | ChangchunBusRealtimeError = await response.json();
    return result;
};

export { getRealtime, type ChangchunBusRealtime, type ChangchunBusRealtimeVehicle };

if (import.meta.main) {
    console.log(await getRealtime('1', '0', '1'));
}
