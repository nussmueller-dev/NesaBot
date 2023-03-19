import moment from "moment";
import schedule from "node-schedule";
import { MarksHandler } from "./marksHandler";

const marksHandler: MarksHandler = new MarksHandler();

console.log(`Start at ${moment().format("DD.MM.YYYY HH:mm:ss")}`);
marksHandler.checkMarks();

schedule.scheduleJob("*/30 * * * *", async function () {
  let maxTimeoutMinutes = 11;
  let timeoutMills = Math.floor(
    Math.random() * (maxTimeoutMinutes * 60 * 1000)
  );

  setTimeout(() => {
    console.log(`ScheduleJob at ${moment().format("DD.MM.YYYY HH:mm:ss")}`);
    marksHandler.checkMarks();
  }, timeoutMills);
});
