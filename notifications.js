import settings from "./settings.js";
import usage from "./usage/usage-utils.js";
import webPush from "web-push";

const subscriptions = {};

const init = (app, db) => {
    app.get('/push-key', async (req, res) => {
        return res.json({publicKey: settings.vapid.publicKey});
    });

    app.post('/push-subscription', (req, res) => {
        let sub = JSON.stringify(req.body.subscription);
        if (req.body.machines.length === 0) {
            delete subscriptions[sub];
        }
        else {
            subscriptions[sub] = req.body.machines;
        }

        return res.json({status: "Subscription updated."});
    });
};

setInterval(async () => {
    const machines = await usage.getUniqueMachines();
    for (let m of machines) {
        if (!(await usage.isMachineBusy(m))) {
            let room;
            for (let sub in subscriptions) {
                let subMachines = subscriptions[sub];
                if (subMachines.includes(m)) {
                    if (!room) room = await usage.getMachineRoom(m);
                    webPush.sendNotification(JSON.parse(sub), JSON.stringify({
                        name: m,
                        room
                    }));
                    subMachines.splice(subMachines.indexOf(m), 1);
                    if (subMachines.length < 1) {
                        delete subscriptions[sub];
                    }
                }
            }
        }
    }
}, 10000);

export default {init};