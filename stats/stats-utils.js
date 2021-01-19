import db from "../database.js";
import moment from "moment";
import {getPastWeekdays} from "./time-utils.js";
import usage from "../usage/usage-utils.js";

const STAT_WEEKS = 12;
const STAT_UNIT_BLOCK = 2; // in hours
const STAT_OCCUPATION_FACTOR = 1.5; // each activity value is multiplied by this
                                  // so if = 2, then 50% active minutes = 100% occupation activity in the graph

const STAT_UNIT_AMOUNT = Math.round(24 / STAT_UNIT_BLOCK); // amount of results

const processDayQuery = async (query) => {
    const queryRes = await db.query(query);
    let machineDicts = {};

    // create and fill entries for each machine
    for (let m of queryRes) {
        const hour = moment(m.time).utc().hour() / STAT_UNIT_BLOCK;
        if (!machineDicts.hasOwnProperty(m.machine)) {
            machineDicts[m.machine] = new Array(STAT_UNIT_AMOUNT).fill(0);
        }
        if (m.sum_active_minutes) {
            machineDicts[m.machine][hour] += m.sum_active_minutes;
        }
    }
    // calculate mean of each score
    for (let i = 0; i < STAT_UNIT_AMOUNT; i++) {
        for (let m in machineDicts) {
            // mean per day
            // and per 2 hours
            machineDicts[m][i] /= STAT_WEEKS + (60 * STAT_UNIT_BLOCK);
            // then correct the value upwards, so we have a reasonable expectation
            machineDicts[m][i] = Math.min(1, machineDicts[m][i] * STAT_OCCUPATION_FACTOR);
        }
    }

    return machineDicts;
};

const getHistoricalUsageStats = async () => {
    // go through each weekday and get a query
    let queries = [];
    for (let i = 0; i < 7; i++) {
        // we go back 3 months (12 weeks) to generate statistics
        const days = getPastWeekdays(i, STAT_WEEKS);
        let subqueries = [];
        for (let d of days) {
            subqueries.push(`(SELECT * FROM "washing_hourly" WHERE time >= ${d[0]}ms AND time <= ${d[1]}ms)`);
        }
        let query = `SELECT sum(*) FROM ${subqueries.join(', ')} GROUP BY "machine", time(2h) fill(none)`;
        queries.push(query);
    }

    let promises = [];
    for (let q of queries) {
        promises.push(processDayQuery(q));
    }

    const statistics = await Promise.all(promises);

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