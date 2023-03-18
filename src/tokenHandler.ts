import puppeteer from "puppeteer";
import config from "./config/config.json";
import { sleep } from "./util";

export class TokenHandler {
  static async GetToken() {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
      executablePath: "/usr/bin/chromium-browser",
    });

    const page = await browser.newPage();
    let token = null;

    await page.goto(config.LOGIN_URL);

    page.on("framenavigated", (frame) => {
      const url = frame.url();

      if (url.includes("access_token=")) {
        let tokenStartIndex = url.indexOf("access_token=");
        let unfinishedToken = url.slice(tokenStartIndex, url.length);
        unfinishedToken = unfinishedToken.replace("access_token=", "");

        let endIndex = unfinishedToken.indexOf("&");

        if (endIndex >= 0) {
          token = unfinishedToken.slice(0, endIndex);
        }
      }
    });

    await page.waitForSelector(".mat-raised-button", {
      visible: true,
    });

    await sleep(1000);

    await page.click(".mat-raised-button");

    await page.waitForSelector('input[name="login"]', {
      visible: true,
    });

    await sleep(200);

    await page.type('input[name="login"]', config.USERNAME);
    await page.type('input[name="passwort"]', config.PASSWORD);
    await page.click('input[type="submit"]');

    await sleep(1000);

    await browser.close();

    return token;
  }
}
