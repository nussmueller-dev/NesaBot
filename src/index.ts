import moment from "moment";
import schedule from "node-schedule";
import { MarksHandler } from "./marksHandler";

MarksHandler.init();

console.log(`Start at ${moment().format("DD.MM.YYYY HH:mm:ss")}`);

schedule.scheduleJob("*/10 * * * *", async function () {
  let maxTimeoutMinutes = 3;
  let timeoutMills = Math.floor(
    Math.random() * (maxTimeoutMinutes * 60 * 1000)
  );

  setTimeout(() => {
    console.log(`ScheduleJob at ${moment().format("DD.MM.YYYY HH:mm:ss")}`);
    MarksHandler.checkMarks();
  }, timeoutMills);
});
