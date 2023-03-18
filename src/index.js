const { Client, Intents } = require("discord.js");
const fs = require("fs");
const moment = require("moment");
const axios = require("axios");
const schedule = require("node-schedule");
const config = require("./config.json");
const TokenHandler = require("./tokenHandler.js");

const intents = new Intents([
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
]);
const client = new Client({ intents: intents });

const discordPrefix = "!";

let lastReloadTime = null;
let owner = null;
let currentToken = "";
let chanels = [];
let checkedMarks = [];
let usersToMention = [];

const job = schedule.scheduleJob("*/30 * * * *", function () {
  let maxTimeoutMinutes = 11;
  let timeoutMills = Math.floor(Math.random() * (maxTimeoutMinutes * 60 * 1000));

  setTimeout(() => {
    CheckMarks();
    console.log(`ScheduleJob at ${lastReloadTime.format("DD.MM.YYYY HH:mm:ss")}`);
  }, timeoutMills);
});

LoadData();

async function CheckMarks() {
  let newMarks = [];
  let reqConfig = {
    method: "get",
    url: `${config.API_URL}/me/grades`,
    headers: {
      Authorization: `Bearer ${currentToken}`,
    },
  };

  lastReloadTime = moment();

  let body;
  try {
    let response = await axios(reqConfig);

    body = response.data;
  } catch (error) {
    console.error(error.response.status + error.response.statusText);

    if (error.response.status == 401) {
      await LoadNewToken();

      if (currentToken) {
        await CheckMarks();
      } else {
        console.error("Unauthorized");

        if (owner) {
          var user = client.users.cache.find((user) => user.id == owner);

          if (user) {
            user.send("Gib mir dis neue beschissene Passwort du Vogel");
          }
        }
      }
    }

    return;
  }

  body.forEach((mark) => {
    if (!checkedMarks.includes(mark.id)) {
      newMarks.push(mark);
    }
  });

  newMarks.forEach((mark) => {
    InformAboutMark(mark);
    checkedMarks.push(mark.id);
  });

  StoreData();
}



async function LoadNewToken() {
  currentToken = await TokenHandler.GetToken();

  StoreData();

  if (currentToken) {
    console.log("Got new Token");
  } else {
    console.error("No Token");
  }
}

async function LoadData() {
  await fs.readFile("data.json", (err, data) => {
    if (err) return;

    let objectData = JSON.parse(data);

    currentToken = objectData.activeToken;
    chanels = objectData.chanels ?? [];
    checkedMarks = objectData.checkedMarks ?? [];
    usersToMention = objectData.usersToMention ?? [];
    owner = objectData.owner;
  });
}

function StoreData() {
  let object = {
    activeToken: currentToken,
    chanels: chanels,
    checkedMarks: checkedMarks,
    owner: owner,
    usersToMention: usersToMention,
  };

  let data = JSON.stringify(object);
  fs.writeFileSync("data.json", data);
}
