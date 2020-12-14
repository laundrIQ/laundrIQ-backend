import Influx from "influx";
import config from "./settings.js";

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

export default db;