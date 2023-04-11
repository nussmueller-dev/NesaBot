import { Client, Intents, TextChannel } from "discord.js";
import config from "./config/config.json";
import { Mark } from "./marksHandler";
import { StorageHandler } from "./storageHandler";

const commandPrefix = "!";
const intents = new Intents([
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
]);

export class DiscordHandler {
  private static instance: DiscordHandler;
  private client: Client;
  private storageHandler: StorageHandler;

  constructor() {
    this.storageHandler = StorageHandler.getInstance();

    this.client = new Client({ intents: intents });
    this.setupCommands();
    this.clientLogin();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new DiscordHandler();
    }

    return this.instance;
  }

  public informAboutMark(mark: Mark) {
    let text = "Neue Note wurde auf Nesa zur Verfügung gestellt: \n";
    text += `:arrow_right: Fach: ${mark.subject} \n`;
    text += `:arrow_right: Beschreibung: ${mark.title} \n`;
    text += `:arrow_right: Gewichtung: ${mark.weight} \n`;

    this.filterChanels();

    this.storageHandler.data.chanels.forEach((chanel) => {
      let serverChanel: TextChannel = this.client.channels.cache.get(
        chanel
      ) as TextChannel;

      if (serverChanel) {
        serverChanel.send(text);
      }
    });

    this.storageHandler.data.usersToMention.forEach((userId) => {
      this.client.users.fetch(userId).then((user) => {
        user.send(text);
      });
    });
  }

  public askForNewPassword() {
    if (this.storageHandler.data.owner) {
      var user = this.client.users.cache.find(
        (user) => user.id == this.storageHandler.data.owner
      );

      if (user) {
        user.send("Gib mir dis neue beschissene Passwort du Vogel");
      }
    }
  }

  public askForScanningQrCode() {
    if (this.storageHandler.data.owner) {
      var user = this.client.users.cache.find(
        (user) => user.id == this.storageHandler.data.owner
      );

      if (user) {
        user.send("Whatsapp QR-Code scannen");
      }
    }
  }

  private setupCommands() {
    this.client.on("messageCreate", async (message) => {
      if (message.author.bot) return;
      if (!message.content.startsWith(commandPrefix)) return;

      const commandBody = message.content
        .slice(commandPrefix.length)
        .toLowerCase();

      if (
        commandBody.includes("set") &&
        commandBody.includes("owner") &&
        !this.storageHandler.data.owner
      ) {
        this.storageHandler.data.owner = message.author.id;
        message.reply("Du bist nun der Besitzer des NESA-Bots");
        this.storageHandler.saveData();
      }

      if (
        commandBody.includes("inform") ||
        commandBody.includes("mention") ||
        commandBody == "i"
      ) {
        if (
          commandBody.includes("not") ||
          commandBody.includes("dont") ||
          commandBody.includes("don't") ||
          commandBody.includes("remove")
        ) {
          if (
            this.storageHandler.data.usersToMention.includes(message.author.id)
          ) {
            this.storageHandler.data.usersToMention.splice(
              this.storageHandler.data.usersToMention.indexOf(
                message.author.id
              ),
              1
            );
            message.reply(
              "Okay, du wirst von nun an nicht mehr informiert, wenn es neue Noten gibt"
            );
            this.storageHandler.saveData();
          }
        } else {
          this.storageHandler.data.usersToMention.push(message.author.id);
          message.reply(
            "Okay, du wirst von nun an informiert, wenn es neue Noten gibt"
          );
          this.storageHandler.saveData();
        }
      }

      if (
        commandBody === "join" &&
        message.author.id == this.storageHandler.data.owner
      ) {
        if (this.storageHandler.data.chanels.includes(message.channelId)) {
          message.reply("Guten Tag, ich bin bereits hier");
        } else {
          this.storageHandler.data.chanels.push(message.channelId);
          this.storageHandler.saveData();

          console.log(`Joinde chanel ${message.channel.id}`);
          message.reply("Okay, bin diesem Chanel beigetreten");
        }
      }
    });
  }

  private async clientLogin() {
    this.client.once("ready", () => {
      console.log("DiscordBot Ready!");
    });

    await this.client.login(config.BOT_TOKEN);
  }

  private filterChanels() {
    let deletedChanels: string[] = [];
    this.storageHandler.data.chanels.forEach((chanel) => {
      let serverChanel = this.client.channels.cache.get(chanel);

      if (!serverChanel) {
        deletedChanels.push(chanel);
      }
    });

    deletedChanels.forEach((chanel) => {
      this.storageHandler.data.chanels.splice(
        this.storageHandler.data.chanels.indexOf(chanel),
        1
      );
    });

    if (deletedChanels.length > 0) {
      this.storageHandler.saveData();
    }
  }
}
