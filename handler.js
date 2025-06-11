const fs = require("fs")
const util = require("util")

const isNumber = (x) => typeof x === "number" && !isNaN(x)
const delay = (ms) => isNumber(ms) && new Promise((resolve) => setTimeout(resolve, ms))

function isRealError(error) {
  return error instanceof Error || (error && error.constructor && error.constructor.name === "Error")
}

module.exports = {
  async handler(m) {
    await global.loadDatabase()
    if (global.db.data == null) return

    if (!m) return

    try {
      m.exp = 0
      m.limit = false

      if (m.callbackQuery && !m.isSimulated) {
        await this.telegram.answerCbQuery(m.callbackQuery.id)
      }

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
        if (!("mute" in chat)) chat.mute = false
        if (!("sWelcome" in chat)) chat.sWelcome = "Selamat datang @user di grup @subject!"
        if (!("sBye" in chat)) chat.sBye = "Selamat tinggal @user!"
      } else {
        global.db.data.chats[m.chat] = {
          isBanned: false,
          welcome: true,
          mute: false,
          sWelcome: "Selamat datang @user di grup @subject!",
          sBye: "Selamat tinggal @user!",
        }
      }

      const isROwner = global.ownerid.includes(m.sender.toString())
      const isOwner = isROwner || m.fromMe
      const isPrems =
        isROwner || global.db.data.users[m.sender].premiumTime > 0 || global.db.data.users[m.sender].premium

      try {
        require("./lib/print")(m, this)
      } catch (e) {
        console.log(m, m.quoted, e)
      }

      // Skip jika tidak ada text
      if (!m.text) return

      for (const name in global.plugins) {
        const plugin = global.plugins[name]
        if (!plugin) continue
        if (plugin.disabled) continue

        const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
        
        // Perbaikan handling prefix
        let _prefix = plugin.customPrefix || global.prefix || "/"
        
        // Pastikan prefix adalah array untuk memudahkan pengecekan
        if (!Array.isArray(_prefix)) {
          _prefix = [_prefix]
        }

        let match = null
        let usedPrefix = ""

        // Cek setiap prefix yang tersedia
        for (const prefix of _prefix) {
          if (prefix instanceof RegExp) {
            const regexMatch = prefix.exec(m.text)
            if (regexMatch) {
              match = [regexMatch, prefix]
              usedPrefix = regexMatch[0]
              break
            }
          } else {
            const prefixStr = String(prefix)
            if (m.text.startsWith(prefixStr)) {
              match = [[prefixStr], new RegExp(str2Regex(prefixStr))]
              usedPrefix = prefixStr
              break
            }
          }
        }

        // Jalankan before function jika ada
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

        // Skip jika plugin bukan function
        if (typeof plugin !== "function") continue

        // Lanjutkan jika ada match prefix
        if (match && usedPrefix) {
          const noPrefix = m.text.replace(usedPrefix, "")
          let [command, ...args] = noPrefix.trim().split` `.filter((v) => v)
          args = args || []
          const _args = noPrefix.trim().split` `.slice(1)
          const text = _args.join` `
          command = (command || "").toLowerCase()
          const fail = plugin.fail || global.dfail

          // Cek apakah command cocok dengan plugin
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

          // Cek ban status
          if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
            const chat = global.db.data.chats[m.chat]
            const user = global.db.data.users[m.sender]
            if (chat?.isBanned || chat?.mute) return
            if (user && user.banned) return
          }

          // Cek permission
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

          // Cek limit
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
            if (isRealError(e)) {
              m.error = e
              console.error(`Plugin Error (${m.plugin}):`, e)
              const text = util.format(e)
              for (const ownerId of global.ownerid) {
                try {
                  this.reply(
                    ownerId,
                    `*Plugin Error:* ${m.plugin}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${usedPrefix}${command} ${args.join(" ")}\n\n\`\`\`${text}\`\`\``,
                  )
                } catch (notifyError) {
                  console.error("Failed to notify owner:", notifyError)
                }
              }
              try {
                m.reply(text)
              } catch (replyError) {
                console.error("Failed to reply error to user:", replyError)
              }
            } else {
              try {
                m.reply(String(e))
              } catch (replyError) {
                console.error("Failed to reply to user:", replyError)
              }
            }
          } finally {
            if (typeof plugin.after === "function") {
              try {
                await plugin.after.call(this, m, extra)
              } catch (e) {
                console.error(`Plugin After Error (${m.plugin}):`, e)
              }
            }
          }
          
          // Break setelah command dijalankan
          break
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

      if (_user) {
        _user.chat++
        _user.chatTotal++
        _user.lastseen = Date.now()
      }
    } catch (e) {
      console.error("Handler Error:", e)
    }
  },

  async participantsUpdate(ctx) {
    if (!ctx.myChatMember) return

    const chatId = ctx.chat.id
    const userId = ctx.myChatMember.new_chat_member.user.id
    const status = ctx.myChatMember.new_chat_member.status

    const chat = global.db.data.chats[chatId] || {}
    let text = ""

    if (status === "member" && ctx.myChatMember.old_chat_member.status === "left") {
      if (chat.welcome) {
        text = (chat.sWelcome || "Selamat datang @user!").replace("@user", `@${userId}`)
        this.reply(chatId, text)
      }
    } else if (status === "left" && ctx.myChatMember.old_chat_member.status === "member") {
      if (chat.welcome) {
        text = (chat.sBye || "Selamat tinggal @user!").replace("@user", `@${userId}`)
        this.reply(chatId, text)
      }
    }
  },
}

global.dfail = (type, m, conn) => {
  const msg = {
    rowner: "Perintah ini hanya dapat digunakan oleh _*OWNER!*_",
    owner: "Perintah ini hanya dapat digunakan oleh _*Owner Bot*_!",
    premium: "Perintah ini hanya untuk member _*Premium*_!",
    group: "Perintah ini hanya dapat digunakan di grup!",
    private: "Perintah ini hanya dapat digunakan di Chat Pribadi!",
  }[type]
  if (msg) return m.reply(msg)
}
