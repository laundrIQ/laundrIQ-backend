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

const loadSettings = () => {
    return JSON.parse(fs.readFileSync(settingsPath));
};

console.log("Loading settings...");

if (!settingsExist()) {
    console.warn("No settings file found, creating skeleton...");
    createSkeleton();
    console.log("Please change the settings skeleton to your liking and restart the app.");
    process.exit();
}

const settings = loadSettings();
console.log("Successfully loaded settings");

export default settings;