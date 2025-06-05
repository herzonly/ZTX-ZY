// SCRIPT BY HERZA, DO NOT DELETE WM

global.token = "BOT_TOKEN"
global.ownername = "OWNER_NAME"
global.ownerid = ["OWNER_ID"]
global.premid = ["PREMIUM_ID"]
global.botname = "BOT_NAME"
global.prefix = /^[/]/
global.wib = 7




let fs = require('fs');
let chalk = require('chalk');
const file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update 'config.js'`));
  delete require.cache[file];
});

// SCRIPT TIDAK BOLEH DI PERJUAL BELIKAN
