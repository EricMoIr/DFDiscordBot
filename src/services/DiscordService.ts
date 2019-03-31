import { Client, Guild } from "discord.js";

import Logger from "utils/Logger";

const { GUILD_ID } = process.env;

class DiscordService {
    static instance: DiscordService;
    client: Client;
    guild: Guild;

    static setInstance(client: Client) {
        DiscordService.instance = new DiscordService(client);
    }

    private constructor(client: Client) {
        this.client = client;
    }

    handleUser = async (username: string, discordId: string, isBanned?: boolean) => {
        if (!this.canHandleUser(discordId)) {
            return null;
        }
        let result = await this.renameMember(username, discordId);
        if (!result) {
            return "Couldn't rename member. The bot is probably missing permissions.";
        }
        if (isBanned) {
            result = await this.handleBannedUser(discordId);
            if (!result) {
                return "Couldn't handle banned user. The bot is probably missing permissions.";
            }
        }
        result = await this.addVerifiedRole(discordId);
        if (!result) {
            return "Couldn't give the verified role. The bot is probably missing permissions.";
        }
        return null;
    }

    canHandleUser = (discordId) => {
        const user = this.guild.members.get(discordId);
        if (!user) {
            Logger.warn("The member doesn't exist");
            return false;
        }
        return !user.roles.find((role) => role.name === "Devs");
    }

    addVerifiedRole = async (discordId) => {
        const user = this.guild.members.get(discordId);
        if (!user) {
            Logger.warn("The member doesn't exist");
            return false;
        }

        const role = this.guild.roles.find((role) => role.name === "Verified");
        if (!role) {
            Logger.warn("The Verified role doesn't exist");
            return false;
        }
        if (user.roles.has(role.id)) {
            return true;
        }
        try {
            await user.addRole(role);
            return true;
        } catch (error) {
            Logger.error(error);
            return false;
        }
    }

    private renameMember = async (username: string, discordId: string) => {
        if (!this.guild) {
            Logger.error(`The guild wasn't initialized`);
            return false;
        }
        const toRename = this.guild.members.get(discordId);
        if (!toRename) {
            Logger.error(`Couldn't find the user ${discordId}`);
            return false;
        }
        try {
            const possibleUsername = `${toRename.user.username} (${username})`;
            const newUsername = possibleUsername.length > 32 ? username : possibleUsername;
            await toRename.setNickname(newUsername);
            return true;
        } catch (error) {
            Logger.error(`Couldn't rename ${discordId} to ${username}`, error);
            return false;
        }
    }

    private handleBannedUser = async (discordId: string) => {
        if (!this.guild) {
            Logger.error(`The guild wasn't initialized`);
            return false;
        }
        const toHandle = this.guild.members.get(discordId);
        if (!toHandle) {
            Logger.error(`Couldn't find the user ${discordId}`);
            return false;
        }

        let role = this.guild.roles.find(({ name }) => name.toLowerCase().includes("banned"));
        if (!role) {
            Logger.warn(`Couldn't find the banned role. Attempting to create it...`);
            role = await this.guild.createRole({
                name: "Banned",
            });
            const promises = this.guild.channels.map((channel) => {
                return channel.overwritePermissions(role, { 
                    "SEND_MESSAGES": false,
                    "SPEAK": false,
                    "ADD_REACTIONS": false,
                });
            });
            try {
                await Promise.all(promises);
            } catch(error) {
                Logger.error(`Couldn't create the banned role`, error);
                return false;
            }
        }
        try {
            await toHandle.addRole(role);
            return true;
        } catch (error) {
            Logger.error(`Couldn't add the banned role to ${discordId}`, error);
            return false;
        }
    }
}

export default DiscordService;