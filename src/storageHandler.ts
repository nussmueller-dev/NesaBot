const dataFolderPath = "./storage";
const dataFileName = "data.json";
const dataFilePath = dataFolderPath + "/" + dataFileName;
const fs = require("fs");

export class StorageHandler {
  data = new StorageData();

  constructor() {
    this.loadData();
  }

  loadData() {
    if (!fs.existsSync(dataFolderPath)) {
      fs.mkdirSync(dataFolderPath);
    }

    if (!fs.existsSync(dataFilePath)) {
      this.saveData();
    }

    let fileContent = fs.readFileSync(dataFilePath);
    this.data = JSON.parse(fileContent);
  }

  saveData() {
    let json = JSON.stringify(this.data);
    fs.writeFileSync(dataFilePath, json, { flag: "w" });
  }
}

export class StorageData {
  activeToken: string = "";
  owner: string = "";
  chanels: string[] = [];
  checkedMarks: string[] = [];
  usersToMention: string[] = [];
}
