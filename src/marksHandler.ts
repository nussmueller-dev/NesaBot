import axios, { AxiosError } from "axios";
import config from "./config/config.json";
import { DiscordHandler } from "./discordHandler";
import { StorageHandler } from "./storageHandler";
import { TokenHandler } from "./tokenHandler";

export class MarksHandler {
  private storageHandler: StorageHandler;
  private discordHandler: DiscordHandler;
  private tokenHandler: TokenHandler;

  constructor() {
    this.storageHandler = StorageHandler.getInstance();
    this.discordHandler = DiscordHandler.getInstance();
    this.tokenHandler = new TokenHandler();
  }

  public async checkMarks() {
    try {
      let response = await axios.get(`${config.API_URL}/me/grades`, {
        headers: {
          Authorization: `Bearer ${this.storageHandler.data.activeToken}`,
        },
      });

      let newMarks: Mark[] = [];
      let responseMakrs: Mark[] = response.data;
      responseMakrs.forEach((mark) => {
        if (!this.storageHandler.data.checkedMarks.includes(mark.id)) {
          newMarks.push(mark);
        }
      });

      newMarks.forEach((mark) => {
        this.discordHandler.informAboutMark(mark);
        this.storageHandler.data.checkedMarks.push(mark.id);
      });

      this.storageHandler.saveData();
    } catch (error: AxiosError | any) {
      if (axios.isAxiosError(error)) {
        let axiosError = error as AxiosError;

        console.error(
          `${axiosError.response?.status} ${axiosError.response?.statusText}`
        );

        if (axiosError.response?.status == 401) {
          await this.tokenHandler.loadNewToken();

          if (this.storageHandler.data.activeToken) {
            await this.checkMarks();
          } else {
            console.error("Unauthorized");

            this.discordHandler.askForNewPassword();
          }
        }
      } else {
        console.error(error);
      }

      return;
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
