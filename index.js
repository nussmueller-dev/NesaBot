const { Client, Intents } = require("discord.js");
const fs = require("fs");
const moment = require("moment");
const axios = require("axios");
const config = require("./config.json");
const TokenHandler = require("./tokenHandler.js");
const schedule = require("node-schedule");

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

const job = schedule.scheduleJob("*/15 * * * *", function () {
  CheckMarks();
  console.log(`ScheduleJob at ${lastReloadTime.format("DD.MM.YYYY HH:mm:ss")}`);
});

LoadData();

client.once("ready", () => {
  console.log("Ready!");
});

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(discordPrefix)) return;

  const commandBody = message.content.slice(discordPrefix.length).toLowerCase();

  if (commandBody === "join") {
    if (chanels.includes(message.channelId)) {
      message.reply("Guten Tag, ich bin bereits hier");
    } else {
      chanels.push(message.channelId);
      StoreData();

      console.log(`Joinde chanel ${message.channel.name}`);
      message.reply("Okay, bin diesem Chanel beigetreten");
    }
  }

  if (commandBody === "reload") {
    if (
      !lastReloadTime ||
      lastReloadTime.valueOf() < moment().subtract(5, "minutes").valueOf()
    ) {
      await CheckMarks();

      if (currentToken) {
        console.log(
          `Reloadet at ${lastReloadTime.format("DD.MM.YYYY HH:mm:ss")}`
        );
        message.reply("Okay, die Noten wurden nochmals geprüft");
      } else {
        console.log(
          `Reload failed at ${lastReloadTime.format("DD.MM.YYYY HH:mm:ss")}`
        );
        message.reply("Die Noten konnten leider nicht geladen werden");
      }
    } else {
      message.reply(
        "Sorry, die Noten wurden gerade aktualisiert und können deshalb nicht erneut aktualisiert werden"
      );
    }
  }

  if (
    commandBody.includes("inform") ||
    commandBody.includes("mention") ||
    commandBody == 'i'
  ) {
    if (commandBody.includes("not") || commandBody.includes("dont") || commandBody.includes("remove")) {
      if(usersToMention.includes(message.author.id)){
        usersToMention.splice(usersToMention.indexOf(message.author.id), 1);
        message.reply("Okay, du wirst von nun an nicht mehr informiert, wenn es neue Noten gibt");
        StoreData();
      }
    } else {
      usersToMention.push(message.author.id);
      message.reply("Okay, du wirst von nun an informiert, wenn es neue Noten gibt");
      StoreData();
    }
  }

  if (commandBody.includes("set") && commandBody.includes("owner") && !owner) {
    owner = message.author.id;
    message.reply("Du bist nun der Besitzer dieses Bots");
    StoreData();
  }
});

client.login(config.BOT_TOKEN);

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

function InformAboutMark(mark) {
  let text = "Neue Note wurde auf Nesa zur Verfügung gestellt: \n";
  text += `:arrow_right: Fach: ${mark.subject} \n`;
  text += `:arrow_right: Beschreibung: ${mark.title} \n`;
  text += `:arrow_right: Gewichtung: ${mark.weight} \n`;

  let deletedChanels = [];
  chanels.forEach((chanel) => {
    let serverChanel = client.channels.cache.get(chanel);

    if (serverChanel) {
      serverChanel.send(text);
    } else {
      deletedChanels.push(chanel);
    }
  });

  usersToMention.forEach((userId) => {
    var user = client.users.cache.find((user) => user.id == userId);

    if (user) {
      user.send(text);
    }
  });

  deletedChanels.forEach((chanel) => {
    chanels.splice(chanels.indexOf(chanel), 1);
  });

  if (deletedChanels.length > 0) {
    StoreData();
  }
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
