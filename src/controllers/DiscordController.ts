import { GuildMember, MessageReaction, User, Client } from "discord.js";

import Logger from "utils/Logger";
import Outposts from "types/Outposts";

class DiscordController {
    client: Client;

    constructor(client: Client){
        this.client = client;
    }

    async ready() {
        Logger.log("Bot is ready");
    };
    
    async disconnect(_, token: string) {
        try {
            Logger.warn("Was disconnected from discord.");
            await this.client.login(token);
        } catch (error) {
            await error(error, token);
        }
    };
    
    async error(thrownError: Error, token: string) {
        Logger.error("Error occurred", thrownError);
        try {
            await this.client.login(token);
        } catch (err) {
            await this.error(err, token);
        }
    };

    messageReactionAdd = async (messageReaction: MessageReaction) => {
        if (!this.changesSubscription(messageReaction)) {
            return;
        }
        return this.subscribeToOA(messageReaction.message.member, messageReaction.emoji.name);
    }

    messageReactionRemove = async (messageReaction: MessageReaction) => {
        if (!this.changesSubscription(messageReaction)) {
            return;
        }
        return this.unsubscribeToOA(messageReaction.message.member, messageReaction.emoji.name);
    }

    private changesSubscription(messageReaction: MessageReaction) {
        if (messageReaction.message.id !== this.getSubscriptionMessageId()) {
            // return false;
        }
        if (Outposts.some((outpost) => outpost.emojiId === messageReaction.emoji.name)) {
            return true;
        }
        return false;
    }

    private getSubscriptionMessageId() {
        return "561750317998407690";
    }

    private async addRole(user: GuildMember, name: string) {
        let role = user.guild.roles.find((role) => role.name === name);
        if (role === null) {
            try {
            role = await user.guild.createRole({ name });
            } catch(error) {
                Logger.error(error);
                return;
            }
        }
        if (user.roles.some((role) => role.name === name)) {
            return;
        }
        return user.addRole(role);
    }

    private async removeRole(user: GuildMember, name: string) {
        let role = user.guild.roles.find((role) => role.name === name);
        if (role === null) {
            Logger.warn(`The role attempted to be removed doesn't exist`);
            return;
        }
        if (user.roles.every((role) => role.name !== name)) {
            return;
        }
        return user.removeRole(role);
    }

    private async subscribeToOA(user: GuildMember, outpostId: string) {
        const outpost = Outposts.find((outpost) => outpost.emojiId === outpostId);
        return this.addRole(user, outpost.name);
    }

    private async unsubscribeToOA(user: GuildMember, outpostId: string) {
        const outpost = Outposts.find((outpost) => outpost.emojiId === outpostId);
        return this.removeRole(user, outpost.name);
    }
};

export default DiscordController;