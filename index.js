import bodyParser from "body-parser";
import express from "express";
import settings from "./settings.js";
import db from "./database.js";
import relay from "./relay/relay.js";
import status from "./status.js";

const app = express();
app.use(bodyParser.json());
const port = settings.port;

relay.init(app, db);
status.init(app, db);

app.get('/', (req, res) => {
    res.send("laundrIQ backend is running!");
});

app.listen(port, () => {
    console.log("laundrIQ backend running at http://localhost:" + port);
})