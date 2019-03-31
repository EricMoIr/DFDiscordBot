import chalk from "chalk";

function print(color, level, messages) {
    const toPrint = messages.map(m => {
        if (m instanceof Error) {
            return m.stack;
        }
        return JSON.stringify(m);
    });
    const now = new Date().toLocaleString();
    const msg = `[${now}][${level}]: ${toPrint.join("\n")}`;
    console.log(chalk[color](msg));
    return console.log;
}

class Logger {
    static log(...debug) {
        return print("white", "DEBUG", debug);
    }

    static warn(...warn) {
        return print("yellow", "WARN", warn);
    }

    static error(...err) {
        return print("red", "ERROR", err);
    }

    static db(...db) {
        return print("green", "DB", db);
    }
}

export default Logger;