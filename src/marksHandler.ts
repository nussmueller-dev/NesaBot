import axios, { AxiosError } from "axios";
import config from "./config/config.json";
import { DiscordHandler } from "./discordHandler";
import { StorageHandler } from "./storageHandler";
import { TokenHandler } from "./tokenHandler";
import { WhatsappHandler } from "./whatsappHandler";

export class MarksHandler {
  private static storageHandler: StorageHandler;
  private static discordHandler: DiscordHandler;
  private static whatsappHandler: WhatsappHandler;
  private static tokenHandler: TokenHandler;

  public static init() {
    MarksHandler.storageHandler = StorageHandler.getInstance();
    MarksHandler.discordHandler = DiscordHandler.getInstance();
    MarksHandler.whatsappHandler = WhatsappHandler.getInstance();
    MarksHandler.tokenHandler = new TokenHandler();
  }

  public static async getMarkById(id: string) {
    let allMarks = await this.getAllMarks();

    if (!allMarks) {
      return undefined;
    }

    return allMarks.find((mark) => mark.id === id);
  }

  public static async checkMarks() {
    let allMarks = await MarksHandler.getAllMarks();

    if (!allMarks) {
      return;
    }

    let newMarks: Mark[] = [];
    allMarks.forEach((mark) => {
      if (!MarksHandler.storageHandler.data.checkedMarks.includes(mark.id)) {
        newMarks.push(mark);
      }
    });

    newMarks.forEach((mark) => {
      MarksHandler.discordHandler.informAboutMark(mark);
      MarksHandler.whatsappHandler.informAboutMark(mark);
      MarksHandler.storageHandler.data.checkedMarks.push(mark.id);
    });

    MarksHandler.storageHandler.saveData();
  }

  private static async getAllMarks(): Promise<Mark[] | undefined> {
    try {
      if (!this.storageHandler.data.activeToken) {
        await this.tokenHandler.loadNewToken();
      }

      let response = await axios.get(`${config.API_URL}/me/grades`, {
        headers: {
          Authorization: `Bearer ${this.storageHandler.data.activeToken}`,
        },
      });

      return response.data as Mark[];
    } catch (error: AxiosError | any) {
      if (axios.isAxiosError(error)) {
        let axiosError = error as AxiosError;

        console.error(
          `${axiosError.response?.status} ${axiosError.response?.statusText}`
        );

        console.error(axiosError.response);

        if (axiosError.response?.status == 401) {
          await this.tokenHandler.loadNewToken();

          if (this.storageHandler.data.activeToken) {
            return await this.getAllMarks();
          } else {
            console.error("Unauthorized");

            this.discordHandler.askForNewPassword();
          }
        }
      } else {
        console.error(error);
      }

      return undefined;
    }
  }
}

export class Mark {
  constructor(
    public id: string,
    public course: string,
    public courseType: string,
    public subject: string,
    public subjectToken: string,
    public title: string,
    public date: string,
    public mark: number,
    public weight: number,
    public isConfirmed: boolean
  ) {}
}
