const fs = require("fs")
const util = require("util")

const isNumber = (x) => typeof x === "number" && !isNaN(x)
const delay = (ms) => isNumber(ms) && new Promise((resolve) => setTimeout(resolve, ms))

module.exports = {
  async handler(m) {
    if (global.db.data == null) return

    if (!m) return

    try {
      m.exp = 0
      m.limit = false

      const user = global.db.data.users[m.sender]
      if (typeof user !== "object") global.db.data.users[m.sender] = {}
      if (user) {
        if (!isNumber(user.saldo)) user.saldo = 0
        if (!isNumber(user.exp)) user.exp = 0
        if (!isNumber(user.level)) user.level = 0
        if (!isNumber(user.limit)) user.limit = 10
        if (!("registered" in user)) user.registered = false
        if (!("premium" in user)) user.premium = false
        if (!("banned" in user)) user.banned = false
        if (!("autolevelup" in user)) user.autolevelup = true
        if (!isNumber(user.premiumTime)) user.premiumTime = 0
        if (!isNumber(user.command)) user.command = 0
        if (!isNumber(user.commandTotal)) user.commandTotal = 0
        if (!isNumber(user.lastCmd)) user.lastCmd = 0
        if (!isNumber(user.chat)) user.chat = 0
        if (!isNumber(user.chatTotal)) user.chatTotal = 0
        if (!isNumber(user.lastseen)) user.lastseen = 0
      } else {
        global.db.data.users[m.sender] = {
          saldo: 0,
          exp: 0,
          level: 0,
          limit: 10,
          registered: false,
          premium: false,
          banned: false,
          autolevelup: true,
          premiumTime: 0,
          command: 0,
          commandTotal: 0,
          lastCmd: 0,
          chat: 0,
          chatTotal: 0,
          lastseen: 0,
        }
      }

      const chat = global.db.data.chats[m.chat]
      if (typeof chat !== "object") global.db.data.chats[m.chat] = {}
      if (chat) {
        if (!("isBanned" in chat)) chat.isBanned = false
        if (!("welcome" in chat)) chat.welcome = true
        if (!("detect" in chat)) chat.detect = false
        if (!("mute" in chat)) chat.mute = false
        if (!("antiLink" in chat)) chat.antiLink = false
        if (!("antiBot" in chat)) chat.antiBot = false
        if (!("antiToxic" in chat)) chat.antiToxic = false
        if (!("sWelcome" in chat)) chat.sWelcome = "Selamat datang @user di grup @subject!"
        if (!("sBye" in chat)) chat.sBye = "Selamat tinggal @user!"
      } else {
        global.db.data.chats[m.chat] = {
          isBanned: false,
          welcome: true,
          detect: false,
          mute: false,
          antiLink: false,
          antiBot: false,
          antiToxic: false,
          sWelcome: "Selamat datang @user di grup @subject!",
          sBye: "Selamat tinggal @user!",
        }
      }

      const isROwner = global.ownerid.includes(m.sender.toString())
      const isOwner = isROwner || m.fromMe
      const isPrems =
        isROwner || global.db.data.users[m.sender].premiumTime > 0 || global.db.data.users[m.sender].premium

      for (const name in global.plugins) {
        const plugin = global.plugins[name]
        if (!plugin) continue
        if (plugin.disabled) continue

        const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
        const _prefix = plugin.customPrefix ? plugin.customPrefix : global.prefix
        const match = (
          _prefix instanceof RegExp
            ? [[_prefix.exec(m.text), _prefix]]
            : Array.isArray(_prefix)
              ? _prefix.map((p) => {
                  const re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
                  return [re.exec(m.text), re]
                })
              : typeof _prefix === "string"
                ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
                : [[[], new RegExp()]]
        ).find((p) => p[1])

        if (typeof plugin.before === "function") {
          if (
            await plugin.before.call(this, m, {
              match,
              conn: this,
              isROwner,
              isOwner,
              isPrems,
            })
          )
            continue
        }

        if (typeof plugin !== "function") continue

        let usedPrefix
        if ((usedPrefix = (match[0] || "")[0])) {
          const noPrefix = m.text.replace(usedPrefix, "")
          let [command, ...args] = noPrefix.trim().split` `.filter((v) => v)
          args = args || []
          const _args = noPrefix.trim().split` `.slice(1)
          const text = _args.join` `
          command = (command || "").toLowerCase()
          const fail = plugin.fail || global.dfail

          const isAccept =
            plugin.command instanceof RegExp
              ? plugin.command.test(command)
              : Array.isArray(plugin.command)
                ? plugin.command.some((cmd) => (cmd instanceof RegExp ? cmd.test(command) : cmd === command))
                : typeof plugin.command === "string"
                  ? plugin.command === command
                  : false

          if (!isAccept) continue
          m.plugin = name

          if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
            const chat = global.db.data.chats[m.chat]
            const user = global.db.data.users[m.sender]
            if (chat?.isBanned || chat?.mute) return
            if (user && user.banned) return
          }

          if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
            fail("owner", m, this)
            continue
          }
          if (plugin.rowner && !isROwner) {
            fail("rowner", m, this)
            continue
          }
          if (plugin.owner && !isOwner) {
            fail("owner", m, this)
            continue
          }
          if (plugin.premium && !isPrems) {
            fail("premium", m, this)
            continue
          }
          if (plugin.group && !m.isGroup) {
            fail("group", m, this)
            continue
          }
          if (plugin.private && m.isGroup) {
            fail("private", m, this)
            continue
          }

          m.isCommand = true
          const xp = "exp" in plugin ? Number.parseInt(plugin.exp) : 17
          if (xp > 200) m.reply("Ngecit -_-")
          else m.exp += xp

          if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
            this.reply(m.chat, `Limit anda habis, silahkan tunggu reset limit`, { message_id: m.id })
            continue
          }

          const extra = {
            match,
            usedPrefix,
            noPrefix,
            _args,
            args,
            command,
            text,
            conn: this,
            isROwner,
            isOwner,
            isPrems,
          }

          try {
            await plugin.call(this, m, extra)
            if (!isPrems) m.limit = m.limit || plugin.limit || false
          } catch (e) {
            m.error = e
            console.error(e)
            if (e) {
              const text = util.format(e)
              for (const ownerId of global.ownerid) {
                this.reply(
                  ownerId,
                  `*Plugin:* ${m.plugin}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${usedPrefix}${command} ${args.join(" ")}\n\n\`\`\`${text}\`\`\``,
                )
              }
              m.reply(text)
            }
          } finally {
            if (typeof plugin.after === "function") {
              try {
                await plugin.after.call(this, m, extra)
              } catch (e) {
                console.error(e)
              }
            }
          }
        }
      }

      const _user = global.db.data.users[m.sender]
      const stats = global.db.data.stats
      if (m) {
        if (m.sender && _user) {
          _user.exp += m.exp
          _user.limit -= m.limit * 1
        }

        let stat
        if (m.plugin) {
          const now = +new Date()
          if (m.plugin in stats) {
            stat = stats[m.plugin]
            if (!isNumber(stat.total)) stat.total = 1
            if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
            if (!isNumber(stat.last)) stat.last = now
            if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
          } else {
            stat = stats[m.plugin] = {
              total: 1,
              success: m.error != null ? 0 : 1,
              last: now,
              lastSuccess: m.error != null ? 0 : now,
            }
          }
          stat.total += 1
          stat.last = now
          if (m.error == null) {
            stat.success += 1
            stat.lastSuccess = now
          }
        }
      }

      _user.chat++
      _user.chatTotal++
      _user.lastseen = Date.now()
    } catch (e) {
      console.error(e)
    }
  },

  async participantsUpdate({ id, participants, action }) {
    if (global.db.data == null) return

    const chat = global.db.data.chats[id] || {}
    let text = ""

    switch (action) {
      case "add":
        if (chat.welcome) {
          for (const user of participants) {
            try {
              const userName = await this.getName(user)
              const chatName = await this.getName(id)
              text = (chat.sWelcome || "Selamat datang @user!").replace("@user", userName).replace("@subject", chatName)

              await this.sendMessage(id, { text })
            } catch (e) {
              console.error(e)
            }
          }
        }
        break

      case "remove":
        if (chat.welcome) {
          for (const user of participants) {
            try {
              const userName = await this.getName(user)
              text = (chat.sBye || "Selamat tinggal @user!").replace("@user", userName)

              await this.sendMessage(id, { text })
            } catch (e) {
              console.error(e)
            }
          }
        }
        break
    }
  },
}

global.dfail = (type, m, conn) => {
  const msg = {
    rowner: "Perintah ini hanya dapat digunakan oleh _*OWNER!*_",
    owner: "Perintah ini hanya dapat digunakan oleh _*Owner Bot*_!",
    admin: "Perintah ini hanya dapat digunakan oleh _*Admin*_!",
    premium: "Perintah ini hanya untuk member _*Premium*_!",
    group: "Perintah ini hanya dapat digunakan di grup!",
    private: "Perintah ini hanya dapat digunakan di Chat Pribadi!",
  }[type]
  if (msg) return m.reply(msg)
}

let chalk = require('chalk');
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
console.log(chalk.redBright(`Update 'handler.js'`));
  delete require.cache[file];
});
