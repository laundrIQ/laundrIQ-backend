import ActivityWatcher from "./activityWatcher.js";

const getBatteryStatus = headers => {
    if (headers["battery-status"]) {
        const status = JSON.parse(headers["battery-status"]);
        return `[${status.charging ? '+' : '-'}]${status.level}%`
    }
    else return "[?]"
}

const init = (app, db) => {
    const watcher = new ActivityWatcher();
    watcher.onUpdate = (update) => {
        const room = update.machine.split('-')[0];
        console.log(`[${new Date(update.time).toLocaleTimeString()} | ${update.machine} | ${update.activity}]`);
        db.writePoints([
            {
                measurement: 'washing_activity',
                tags: {room, machine: update.machine},
                fields: {activity: update.activity},
                timestamp: new Date(update.time)
            }
        ], {precision: 's'}).catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`)
        });
    };

    app.post('/log', (req, res) => {
        let status = 200;
        try {
            const batteryStatus = getBatteryStatus(req.headers);
            console.log(`--- ${req.body.reader} | ${req.body.beacons.length} | ${new Date().toLocaleTimeString()} | ${batteryStatus} ---`);
            watcher.registerReading(req.body);
        }
        catch (error) {
            console.error(error);
            status = 500;
        }

        return res.status(status).send();
    });
};

export default {init};