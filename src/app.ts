import Logger from "utils/Logger";
import DiscordWorker from "workers/DiscordWorker";

const init = async () => {
    await DiscordWorker.start();
};

(async () => {
    try {
        Logger.log("The app is starting...");
        await init();
    } catch (error) {
        Logger.error("Couldn't start the app", error);
    }
})();