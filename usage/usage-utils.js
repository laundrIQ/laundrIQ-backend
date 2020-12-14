import moment from "moment";
import db from "../database.js";

const MINIMUM_MEAN_ACTIVITY = 0.2;
const DEFAULT_WASH_LENGTH = 70;

const isMachineBusy = async (machineName) => {
    // TODO: remove time
    // ORDER BY DESC LIMIT 2
    const result = await db.query(`SELECT activity FROM "washing_activity" WHERE machine='${machineName}' AND time >= 1607870992956ms - 60m LIMIT 2`);
    return ((result[0].activity + result[1].activity) / 2) > MINIMUM_MEAN_ACTIVITY;
};

const getMachineRoom = async (machineName) => {
    const result = await db.query(`SELECT * FROM "washing_activity" WHERE machine='${machineName}' LIMIT 1`);
    return result[0].room;
};

/**
 * Gets the start and projected end of a currently working machine.
 * @param machineName: string
 * @returns {Promise<Object>}
 */
const getCurrentUsageStats = async (machineName) => {
    // TODO: replace timestamp with now()
    const queryRes = await db.query(`SELECT moving_average("activity", 4) FROM "washing_activity" WHERE machine='${machineName}' AND time >= 1607870992956ms - 80m`);
    let i = 0;
    // if we went too far back, find a point where machine is idle
    while (queryRes[i].moving_average > 0) {
        i++;
    }
    while (queryRes[i].moving_average === 0) {
        i++;
    }
    const start = queryRes[i].time.getTime();
    const projectedEnd = moment(start).add(DEFAULT_WASH_LENGTH, 'minute').valueOf();

    return {start, projectedEnd};
};

export default {
    isMachineBusy,
    getMachineRoom,
    getCurrentUsageStats
}