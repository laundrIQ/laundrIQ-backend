import usage from "./usage/usage-utils.js";

//TODO: add error handling

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
        const uniqueMachines = new Set(machinesRes.map(m => m.value));
        const rooms = {};
        let response = {rooms: []};
        const promises = [];
        for (let machine of uniqueMachines) {
            promises.push((async () => {
                const room = await usage.getMachineRoom(machine);
                const isBusy = await usage.isMachineBusy(machine);
                let startTime = null;
                let endTime = null;
                if (isBusy) {
                    const times = await usage.getCurrentUsageStats(machine);
                    startTime = times.start;
                    endTime = times.end;
                }
                if (!rooms.hasOwnProperty(room)) {
                    rooms[room] = {
                        name: room,
                        machines: []
                    };
                }
                rooms[room].machines.push({
                    room,
                    name: machine,
                    isBusy,
                    startTime,
                    endTime
                });
            })());
        }
        await Promise.all(promises);
        for (const r in rooms) {
            rooms[r].machines = rooms[r].machines.sort((a, b) => {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            });
        }
        response.rooms = Object.values(rooms).sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });
        res.json(response);
    });
};

export default {init};