import db from "../database.js";
import moment from "moment";
import {getPastWeekdays} from "./time-utils.js";
import usage from "../usage/usage-utils.js";

const STAT_UNIT_BLOCK = 2; // in hours
const STAT_CORRECTION_FACTOR = 5; // each activity value is multiplied by this
// so if = 2, then 50% active minutes = 100% occupation activity in the graph

const processDayQuery = async (query, weeks) => {
    const queryRes = await db.query(query);
    let machineDicts = {};

    const max_minutes = weeks * (60 * STAT_UNIT_BLOCK);
    // amount of results based on block size (block size 2 = 12 results)
    const result_amount = Math.round(24 / STAT_UNIT_BLOCK);

    // create and fill entries for each machine
    for (let m of queryRes) {
        const hour = moment(m.time).utc().hour() / STAT_UNIT_BLOCK;
        if (!machineDicts.hasOwnProperty(m.machine)) {
            machineDicts[m.machine] = new Array(result_amount).fill(0);
        }
        if (m.sum_active_minutes) {
            machineDicts[m.machine][hour] += m.sum_active_minutes;
        }
    }
    // calculate mean of each score
    for (let i = 0; i < result_amount; i++) {
        for (let m in machineDicts) {
            // correct the value upwards, so we have a reasonable expectation
            machineDicts[m][i] = Math.min(max_minutes, machineDicts[m][i] * STAT_CORRECTION_FACTOR);
            // mean per day
            // and per 2 hours
            machineDicts[m][i] /= max_minutes;
        }
    }

    return machineDicts;
};

const adjustExperimental = stats => {
    let max = 0;
    for (let day of stats) {
        const machineDays = Object.values(day);

        for (let i = 0; i < machineDays[0].length; i++) {
            let currSum = 0;

            for (let j = 0; j < machineDays.length; j++) {
                currSum += machineDays[j][i];
            }
            currSum /= machineDays.length;

            if (currSum > max) {
                max = currSum;
            }
        }
    }

    if (max > 0) {
        const factor = 1 / max;

        for (let day in stats) {
            for (let machine in stats[day]) {
                for (let i = 0; i < stats[day][machine].length; i++) {
                    // stats[day][machine][i] *= factor;
                    stats[day][machine][i] = Math.min(1, stats[day][machine][i] * factor);
                }
            }
        }
    }

    return stats;
};

/**
 * Calculates the usage statistics based on usage from the past weeks.
 * @param weeks: number - amount of weeks to use for statistics calculation.
 * @returns {Promise<Object>}
 */
const getHistoricalUsageStats = async (weeks) => {
    // go through each weekday and get a query
    let queries = [];
    for (let i = 0; i < 7; i++) {
        // we go back 3 months (12 weeks) to generate statistics
        const days = getPastWeekdays(i, weeks);
        let subqueries = [];
        for (let d of days) {
            subqueries.push(`(SELECT * FROM "washing_hourly" WHERE time >= ${d[0]}ms AND time <= ${d[1]}ms)`);
        }
        let query = `SELECT sum(*) FROM ${subqueries.join(', ')} GROUP BY "machine", time(2h) fill(none)`;
        queries.push(query);
    }

    let promises = [];
    for (let q of queries) {
        promises.push(processDayQuery(q, weeks));
    }

    let statistics = await Promise.all(promises);
    // statistics = adjustExperimental(statistics);

    return statistics;
};

const orderHistoricalDataByRooms = async (data) => {
    const knownMachines = [];
    const roomAssignments = {};
    const orderedData = {};

    for (let i = 0; i < data.length; i++) {
        for (let machine in data[i]) {
            if (!knownMachines.includes(machine)) {
                const room = await usage.getMachineRoom(machine);
                knownMachines.push(machine);
                if (!roomAssignments.hasOwnProperty(room)) {
                    roomAssignments[room] = [];
                }
                if (!roomAssignments[room].includes(machine)) {
                    roomAssignments[room].push(machine);
                }
            }
        }
    }

    for (let room in roomAssignments) {
        orderedData[room] = [];
        for (let i = 0; i < data.length; i++) {
            let dayData = {};
            for (let machine of roomAssignments[room]) {
                dayData[machine] = data[i][machine];
            }
            orderedData[room].push(dayData);
        }
    }

    return orderedData;
};

export default {
    getHistoricalUsageStats,
    orderHistoricalDataByRooms
};