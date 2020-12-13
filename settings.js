import fs from "fs";
import path from "path";

const settingsPath = path.resolve('./data/config.json');

const settingsExist = () => {
    return fs.existsSync(settingsPath);
}

const createSkeleton = () => {
    if (!fs.existsSync(path.resolve('./data'))) {
        fs.mkdirSync('./data');
    }
    fs.writeFileSync(settingsPath, JSON.stringify({
        port: 5000,
        influx: {
            host: 'localhost',
            port: 8086,
            database: 'laundry',
        }
    }, null, 2));
};

const getSettings = () => {
    return JSON.parse(fs.readFileSync(settingsPath));
};

export default {
    exist: settingsExist,
    load: getSettings,
    createSkeleton
};