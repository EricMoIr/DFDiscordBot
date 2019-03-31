import { Message } from "discord.js";

type Command = {
    name: string,
    description: string,
    execute: (message: Message, params?: string[]) => Promise<any>,
}

export default Command;