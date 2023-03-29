import qrcode from "qrcode-terminal";
import WAWebJS, { Chat, Client, LocalAuth, Message } from "whatsapp-web.js";
import { Mark, MarksHandler } from "./marksHandler";
import { StorageHandler, dataFolderPath } from "./storageHandler";

const clientOptions: WAWebJS.ClientOptions = {
  authStrategy: new LocalAuth({
    dataPath: dataFolderPath + "/whatsapp",
  }),
  puppeteer: {
    args: ["--no-sandbox"],
    executablePath: "/usr/bin/chromium-browser",
  },
};

export class WhatsappHandler {
  private static instance: WhatsappHandler;
  private storageHandler: StorageHandler;
  private client = new Client(clientOptions);

  constructor() {
    this.storageHandler = StorageHandler.getInstance();

    this.setupClientEvents();
    this.setupCommands();

    this.client.initialize();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new WhatsappHandler();
    }

    return this.instance;
  }

  public informAboutMark(mark: Mark) {
    let text = "Neue Note wurde auf Nesa zur Verfügung gestellt: \n";
    text += `➡️ Fach: ${mark.subject} \n`;
    text += `➡️ Gewichtung: ${mark.weight} \n`;
    text += `➡️ Beschreibung: ${mark.title} \n`;

    this.storageHandler.data.whatsappIdsToMention.forEach(async (chatId) => {
      let chat = await this.getChatById(chatId);
      if (!chat) {
        return;
      }

      if (this.storageHandler.data.whatsappOwner === chatId) {
        chat.sendMessage(text + `➡️ Id: ${mark.id} \n`);
      } else {
        chat.sendMessage(text);
      }
    });
  }

  public async askForNewPassword() {
    if (!this.storageHandler.data.whatsappOwner) {
      return;
    }

    let chat = await this.getChatById(this.storageHandler.data.whatsappOwner);
    if (chat) {
      chat.sendMessage("Gib mir dis neue beschissene Passwort du Vogel");
    }
  }

  private setupCommands() {
    this.client.on("message", async (msg) => {
      let chat = await msg.getChat();
      let isOwner =
        this.storageHandler.data.whatsappOwner === chat.id._serialized;
      let messageBody = msg.body.toLowerCase();

      if (messageBody === "ping") {
        msg.reply("pong");
      }

      if (messageBody === "reload" && isOwner) {
        MarksHandler.checkMarks();
        msg.reply("Reloaded");
      }

      if (chat.isGroup) {
        if (messageBody === "!join") {
          this.storageHandler.data.whatsappIdsToMention.push(
            chat.id._serialized
          );
          msg.reply(
            "Okay, ihr werdet künftig informiert, wenn es neue Noten gibt"
          );
        }
        return;
      }

      if (messageBody === "set owner") {
        if (this.storageHandler.data.whatsappOwner) {
          msg.reply("Es gibt schon einen Besitzer");
        } else {
          this.storageHandler.data.whatsappOwner = chat.id._serialized;
          this.storageHandler.saveData();

          msg.reply("Du bist jetzt der Besitzer🥳");
        }
      }

      if (messageBody.startsWith("resolve number ") && isOwner) {
        await this.onResolveNumberCommand(msg);
      }

      if (
        (messageBody === "resolve" ||
          messageBody === "mark" ||
          messageBody === "note") &&
        isOwner &&
        msg.hasQuotedMsg
      ) {
        this.onResolveMarkCommand(msg, chat);
      }

      if (
        messageBody.includes("inform") ||
        messageBody.includes("mention") ||
        messageBody === "i"
      ) {
        this.onInformCommand(msg, chat);
      }
    });
  }

  private async onResolveNumberCommand(msg: Message) {
    let messageSpit = msg.body.split(" ");

    if (messageSpit.length !== 3) {
      msg.reply("Bitte gib eine Nummer an");
      return;
    }

    let number = messageSpit[2];
    number = number.replace(/[^\d]/g, "");

    let contactId = await this.client.getNumberId(number);

    if (!contactId) {
      msg.reply("Kontakt-Id wurde nicht gefunden");
      return;
    }

    let contact = await this.client.getContactById(contactId._serialized);

    if (!contact) {
      msg.reply("Kontakt wurde nicht gefunden");
      return;
    }

    let chat = await contact.getChat();

    if (!chat) {
      msg.reply("Chat wurde nicht gefunden");
      return;
    }

    let text = `Name: ${contact.name} \n`;
    text += `PushName: ${contact.pushname} \n`;
    text += `Chat-Id: ${chat.id._serialized} \n`;
    msg.reply(text);
  }

  private onInformCommand(msg: Message, chat: Chat) {
    let messageBody = msg.body.toLowerCase();

    if (
      messageBody.includes("not") ||
      messageBody.includes("dont") ||
      messageBody.includes("don't") ||
      messageBody.includes("remove")
    ) {
      if (
        this.storageHandler.data.whatsappIdsToMention.includes(
          chat.id._serialized
        )
      ) {
        this.storageHandler.data.whatsappIdsToMention.splice(
          this.storageHandler.data.whatsappIdsToMention.indexOf(
            chat.id._serialized
          ),
          1
        );
        msg.reply(
          "Okay, du wirst von nun an nicht mehr informiert, wenn es neue Noten gibt"
        );
      } else {
        msg.reply("Du wirst sowieso nicht informiert :D");
      }
    } else {
      if (
        !this.storageHandler.data.whatsappIdsToMention.includes(
          chat.id._serialized
        )
      ) {
        this.storageHandler.data.whatsappIdsToMention.push(chat.id._serialized);
        msg.reply(
          "Okay, du wirst von nun an informiert, wenn es neue Noten gibt"
        );
      } else {
        msg.reply("Du wirst sowieso informiert :D");
      }
    }
    this.storageHandler.saveData();
  }

  private async onResolveMarkCommand(msg: Message, chat: Chat) {
    let quotedMsg = await msg.getQuotedMessage();

    if (quotedMsg.body.includes("Id: ")) {
      let dirtyId = quotedMsg.body.split("Id: ")[1];
      let markId = dirtyId.split(" ")[0];

      let mark = await MarksHandler.getMarkById(markId);
      if (mark) {
        msg.reply(`Du hast in dieser Prüfung die Note *${mark.mark}*`);
      } else {
        msg.reply("Note wurde nicht gefunden");
      }
    }
  }

  private setupClientEvents() {
    this.client.on("qr", (qr) => {
      qrcode.generate(qr, { small: true });
    });

    this.client.on("authenticated", () => {
      console.log("WhatsApp-Client authenticated");
    });

    this.client.on("ready", () => {
      console.log("WhatsApp-Client is ready!");
    });
  }

  private async getChatById(id: string) {
    try {
      return await this.client.getChatById(id);
    } catch {
      console.log("Chat not found with id: " + id);
      return undefined;
    }
  }
}
