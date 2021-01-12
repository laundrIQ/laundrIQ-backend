import moment from "moment";
import db from "../database.js";

const MINIMUM_MEAN_ACTIVITY = 0.15;
const DEFAULT_WASH_LENGTH = 70;
const WASH_LENGTH_RANGE = [40, 60]

const isMachineBusy = async (machineName) => {
    const result = await db.query(`SELECT moving_average("activity", 4) FROM "washing_activity" WHERE machine='${machineName}' ORDER BY DESC LIMIT 2`);
    return ((result[0].moving_average + result[1].moving_average) / 2) > MINIMUM_MEAN_ACTIVITY;
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
    const queryRes = await db.query(`SELECT moving_average("activity", 4) FROM "washing_activity" WHERE machine='${machineName}' AND time >= now() - 80m`);
    let i = 0;
    // if we went too far back, find a point where machine is idle
    while (queryRes[i].moving_average > 0) {
        i++;
    }
    // now go forwards until we find activity
    while (queryRes[i].moving_average === 0) {
        i++;
    }
    const start = queryRes[i].time.getTime();
    const earliestEnd = moment(start).add(WASH_LENGTH_RANGE[0], 'minute').valueOf();
    const latestEnd = moment(start).add(WASH_LENGTH_RANGE[1], 'minute').valueOf();

    return {start, end: {earliest: earliestEnd, latest: latestEnd}};
};

export default {
    isMachineBusy,
    getMachineRoom,
    getCurrentUsageStats
}