import { Client, Guild, TextChannel } from "discord.js";
import axios from "axios";

import DiscordController from "controllers/DiscordController";
import Logger from "utils/Logger";
import Outposts from "types/Outposts";

const { DISCORD_TOKEN } = process.env;

abstract class DiscordWorker {
    static async start() {
        Logger.log("The bot is starting...");
        const client = new Client();

        const beginning = Date.now();
        
        const controller = new DiscordController(client);

        client.on("ready", async () => {
            await controller.ready();
            Logger.log(`Starting the bot took ${(Date.now() - beginning) / 1000} seconds`);
            startLookingForOAs(client);
        });
        client.on("disconnect", (event) => controller.disconnect(event, DISCORD_TOKEN));
        client.on("error", (error) => controller.error(error, DISCORD_TOKEN));
        client.on("messageReactionAdd", controller.messageReactionAdd);
        client.on("messageReactionRemove", controller.messageReactionRemove);

        await client.login(DISCORD_TOKEN);
    }
}
const REFETCH_TIME = 60000;
const OA_URL = "https://www.deadfrontier.com/OACheck.php";
const BOT_NOTIFICATIONS_CHANNEL_NAME = "bot-notifications";
let activeOAs = [];
function startLookingForOAs(client: Client) {
    lookForOAs();
    let i = setInterval(lookForOAs, REFETCH_TIME);

    async function lookForOAs() {
        const response = await axios.get(OA_URL);
        const data: string[] = response.data;
        for (const outpost of data) {
            if (!activeOAs.includes(outpost)) {
                activeOAs.push(outpost);
                for (const [, guild] of client.guilds) {
                    sendNotification(outpost, guild);
                }
            }
        }
        activeOAs = [...data];
    }
}

function sendNotification(outpostName: string, guild: Guild) {
    const channelToSend = guild.channels.find((channel) => channel.name === BOT_NOTIFICATIONS_CHANNEL_NAME) as TextChannel;
    if (!channelToSend) {
        Logger.warn(`The channel ${BOT_NOTIFICATIONS_CHANNEL_NAME} doesn't exist in ${guild.name}`);
        return;
    }
    const outpost = Outposts.find((outpost) => outpost.name === outpostName);
    const roleToTag = guild.roles.find((role) => role.name === outpost.roleName);
    if (!roleToTag) {
        Logger.warn(`The role ${roleToTag.name} doesn't exist in ${guild.name}`);
        return;
    }
    channelToSend.sendMessage(`An Outpost Attack just started at ${outpost.prettyName}!\n${roleToTag}`)
}

export default DiscordWorker;