import moment from "moment";
import schedule from "node-schedule";

async function main() {
  console.log(`Start at ${moment().format("DD.MM.YYYY HH:mm:ss")}`);

  schedule.scheduleJob("*/15 * * * *", async function () {});
}

main();
