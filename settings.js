import fs from "fs";
import path from "path";
import webPush from "web-push";

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
        },
        vapid: webPush.generateVAPIDKeys()
    }, null, 2));
};

const loadSettings = () => {
    let settings = JSON.parse(fs.readFileSync(settingsPath));
    if (!settings.vapid) {
        console.log("Settings file did not contain VAPID keys, generating...");
        settings.vapid = webPush.generateVAPIDKeys();
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        console.log("Settings file saved with new VAPID keys.");
    }
    webPush.setVapidDetails(
        'mailto:admin@kekt.us',
        settings.vapid.publicKey,
        settings.vapid.privateKey
    );
    return settings;
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