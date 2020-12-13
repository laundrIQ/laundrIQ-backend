import bodyParser from "body-parser";
import express from "express";
import Influx from "influx";
import settings from "./settings.js";
import relay from "./relay/relay.js";
import status from "./status.js";

console.log("Loading settings...");
if (!settings.exist()) {
    console.warn("No settings file found, creating skeleton...");
    settings.createSkeleton();
    console.log("Please change the settings skeleton to your liking and restart the app.");
    process.exit();
}
const config = settings.load();
console.log("Successfully loaded settings");

const app = express();
app.use(bodyParser.json());
const port = config.port;

const db = new Influx.InfluxDB({
    ...config.influx,
    schema: [
        {
            measurement: 'washing_activity',
            fields: {
                activity: Influx.FieldType.FLOAT
            },
            tags: [
                'room',
                'machine'
            ]
        }
    ]
});

relay.init(app, db);
status.init(app, db);

app.get('/', (req, res) => {
    res.send("laundrIQ backend is running!");
});

app.listen(port, () => {
    console.log("laundrIQ backend running at http://localhost:" + port);
})