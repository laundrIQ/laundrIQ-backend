
const MINIMUM_MEAN_ACTIVITY = 0.2

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
        const promises =[];
        for (let machine of machinesRes) {
            // retrieve the last two minutes of activity
            promises.push(db.query(`select * from washing_activity where machine='${machine.value}' order by desc limit 2`));
        }
        const results = await Promise.all(promises);
        for (const activityRes of results) {
            if (activityRes.length === 2) {
                const isBusy = ((activityRes[0].activity + activityRes[1].activity) / 2) > MINIMUM_MEAN_ACTIVITY;
                response.machines.push({
                    room: activityRes[0].room,
                    name: activityRes[0].machine,
                    isBusy
                });
            }
        }

        res.json(response);
    });
};

export default {init};