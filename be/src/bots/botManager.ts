export interface Bot {
    start(): void;
    stop(): void;
}

export class BotManager {
    private bots: Bot[] = [];

    addBot(bot: Bot) {
        this.bots.push(bot);
    }

    start() {
        for (const bot of this.bots) {
            bot.start();
        }
    }

    stop() {
        for (const bot of this.bots) {
            bot.stop();
        }
    }
}