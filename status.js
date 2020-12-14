import usage from "./usage/usage-utils.js";


const init = (app, db) => {
    app.get('/room-names', async (req, res) => {
        const result = await db.query('show tag values with key=room');

        let response = {rooms: []};
        for (let room of result) {
            response.rooms.push(room.value);
        }

        res.json(response);
    });

    app.get('/machines', async (req, res) => {
        const machinesRes = await db.query('show tag values with key=machine');
        let response = {machines: []};
        const promises = [];
        for (let machine of machinesRes) {
            promises.push((async () => {
                const room = await usage.getMachineRoom(machine.value);
                const isBusy = await usage.isMachineBusy(machine.value);
                let startTime = null;
                let projectedEndTime = null;
                if (isBusy) {
                    const times = await usage.getCurrentUsageStats(machine.value);
                    startTime = times.start;
                    projectedEndTime = times.projectedEnd;
                }
                response.machines.push({
                    room: room,
                    name: machine.value,
                    isBusy,
                    startTime,
                    projectedEndTime
                });
            })());
        }
        await Promise.all(promises);
        res.json(response);
    });
};

export default {init};