// SCRIPT BY HERZA, DO NOT DELETE WM
global.token = "BOT_TOKEN"
global.ownername = "OWNER_NAME"
global.ownerid = "OWNER_ID"
global.premid = "PREM_ID"
global.botname = "BOT_NAME"
global.prefix = ["/", ".", "#", "!"]
global.wib = 7
global.wait = "Wait for a moment..."

let fs = require('fs');
let chalk = require('chalk');

const file = require.resolve(__filename);

fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update 'config.js'`));
  delete require.cache[file];
  require(file);
});

// SCRIPT TIDAK BOLEH DI PERJUAL BELIKAN
// jangan lupa kirim foto furry berotot gay ke herzfnf@gmail.com udh
//g tahan soalnya 😂
