import bodyParser from "body-parser";
import express from "express";
import settings from "./settings.js";
import db from "./database.js";
import relay from "./relay/relay.js";
import status from "./status.js";
import statistics from "./statistics.js";
import cors from "cors";
import moment from "moment";

moment.updateLocale('en', {
    week: {
        dow: 1,
    },
});
moment.updateLocale('de', {
    week: {
        dow: 1,
    },
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

relay.init(app, db);
status.init(app, db);
statistics.init(app, db);

app.get('/', (req, res) => {
    res.send("laundrIQ backend is running!");
});

app.listen(settings.port, () => {
    console.log("laundrIQ backend running at http://localhost:" + settings.port);
})