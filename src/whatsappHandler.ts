import qrcode from "qrcode-terminal";
import WAWebJS, { Client, LocalAuth } from "whatsapp-web.js";
import { Mark } from "./marksHandler";
import { StorageHandler, dataFolderPath } from "./storageHandler";

const clientOptions: WAWebJS.ClientOptions = {
  authStrategy: new LocalAuth({
    dataPath: dataFolderPath + "/whatsapp",
  }),
};

export class WhatsappHandler {
  private static instance: WhatsappHandler;
  private storageHandler: StorageHandler;
  private client = new Client(clientOptions);

  constructor() {
    this.storageHandler = StorageHandler.getInstance();

    this.setupClientEvents();

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
    text += `:arrow_right: Fach: ${mark.subject} \n`;
    text += `:arrow_right: Beschreibung: ${mark.title} \n`;
    text += `:arrow_right: Gewichtung: ${mark.weight} \n`;

    // this.storageHandler.data.usersToMention.forEach((userId) => {
    //   this.client.users.fetch(userId).then((user) => {
    //     user.send(text);
    //   });
    // });
  }

  public askForNewPassword() {
    // if (this.storageHandler.data.owner) {
    //   var user = this.client.users.cache.find(
    //     (user) => user.id == this.storageHandler.data.owner
    //   );
    //   if (user) {
    //     user.send("Gib mir dis neue beschissene Passwort du Vogel");
    //   }
    // }
  }

  private setupClientEvents() {
    this.client.on("qr", (qr) => {
      qrcode.generate(qr, { small: true });
    });

    this.client.on("ready", () => {
      console.log("WhatsApp-Client is ready!");
    });

    this.client.on("authenticated", () => {
      console.log("WhatsApp-Client authenticated");
    });
  }
}
