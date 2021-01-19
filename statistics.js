import stats from "./stats/stats-utils.js";

//TODO: add error handling

const init = (app, db) => {
    app.get("/stats", async (req, res) => {
        const usageStats = await stats.getHistoricalUsageStats();
        const orderedStats = await stats.orderHistoricalDataByRooms(usageStats);
        res.json(orderedStats);
    });
};

export default {init};