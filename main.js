const { Telegraf } = require("telegraf")
const fs = require("fs")
const path = require("path")
require("./config")
const print = require ('./lib/print')

const conn = new Telegraf(global.token)

require("./lib/simple")(conn)

global.db = {
  data: {
    users: {},
    chats: {},
    stats: {},
  },
}

global.botStartTime = Date.now()

function loadDatabase() {
  try {
    if (fs.existsSync("./database.json")) {
      global.db.data = JSON.parse(fs.readFileSync("./database.json", "utf8"))
    }
  } catch (e) {
    console.log("Database error:", e)
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync("./database.json", JSON.stringify(global.db.data, null, 2))
  } catch (e) {
    console.log("Save database error:", e)
  }
}

loadDatabase()
setInterval(saveDatabase, 30000)

global.plugins = {}
const pluginsDir = path.join(__dirname, "plugins")

function loadPlugins() {
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir)
  }

  const files = fs.readdirSync(pluginsDir).filter((file) => file.endsWith(".js"))

  for (const file of files) {
    try {
      delete require.cache[require.resolve(path.join(pluginsDir, file))]
      global.plugins[file] = require(path.join(pluginsDir, file))
    } catch (e) {
      console.log(`Error loading plugin ${file}:`, e)
    }
  }
}

loadPlugins()

fs.watch(pluginsDir, (eventType, filename) => {
  if (filename && filename.endsWith(".js")) {
    loadPlugins()
  }
})

function smsg(ctx) {
  if (!ctx.message) return null

  const m = ctx.message
  const M = {}

  M.text = m.text || m.caption || ""
  M.mtype = Object.keys(m)[0]
  M.id = m.message_id
  M.chat = ctx.chat.id
  M.chatName = ctx.chat.title || ctx.chat.first_name || ctx.chat.username || "Unknown"
  M.sender = ctx.from.id
  M.firstName = ctx.from.first_name || ""
  M.lastName = ctx.from.last_name || ""
  M.fromMe = ctx.from.is_bot
  M.name = `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim() || ctx.from.username || "Unknown"
  M.username = ctx.from.username || ""
  M.tag = ctx.from.username ? `@${ctx.from.username}` : M.name
  M.isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup"
  M.mentionedJid = []
  M.messageTime = m.date * 1000

  if (m.entities) {
    m.entities.forEach((entity) => {
      if (entity.type === "mention") {
        M.mentionedJid.push(entity.user?.id)
      }
    })
  }

  M.fakeObj = {
    update: ctx.update,
    botInfo: ctx.botInfo,
    state: ctx.state,
  }

  M.reply = async (text, options = {}) => {
    return await conn.reply(M.chat, text, { message_id: M.id })
  }

  M.copy = () => M

  M.forward = async (jid) => {
    return await conn.telegram.forwardMessage(jid, M.chat, M.id)
  }

  M.delete = async () => {
    return await conn.telegram.deleteMessage(M.chat, M.id)
  }

  if (m.reply_to_message) {
    M.quoted = {
      text: m.reply_to_message.text || m.reply_to_message.caption || "",
      sender: m.reply_to_message.from.id,
      firstName: m.reply_to_message.from.first_name || "",
      lastName: m.reply_to_message.from.last_name || "",
      username: m.reply_to_message.from.username || "",
      message_id: m.reply_to_message.message_id,
      download: async () => {
        if (m.reply_to_message.photo) {
          const fileId = m.reply_to_message.photo[m.reply_to_message.photo.length - 1].file_id
          const file = await conn.telegram.getFile(fileId)
          return await downloadFile(file.file_path)
        } else if (m.reply_to_message.document) {
          const file = await conn.telegram.getFile(m.reply_to_message.document.file_id)
          return await downloadFile(file.file_path)
        } else if (m.reply_to_message.video) {
          const file = await conn.telegram.getFile(m.reply_to_message.video.file_id)
          return await downloadFile(file.file_path)
        } else if (m.reply_to_message.audio) {
          const file = await conn.telegram.getFile(m.reply_to_message.audio.file_id)
          return await downloadFile(file.file_path)
        }
        return null
      },
    }
  }

  M.download = async () => {
    if (m.photo) {
      const fileId = m.photo[m.photo.length - 1].file_id
      const file = await conn.telegram.getFile(fileId)
      return await downloadFile(file.file_path)
    } else if (m.document) {
      const file = await conn.telegram.getFile(m.document.file_id)
      return await downloadFile(file.file_path)
    } else if (m.video) {
      const file = await conn.telegram.getFile(m.video.file_id)
      return await downloadFile(file.file_path)
    } else if (m.audio) {
      const file = await conn.telegram.getFile(m.audio.file_id)
      return await downloadFile(file.file_path)
    }
    return null
  }

  return M
}

async function downloadFile(filePath) {
  const https = require("https")
  const http = require("http")

  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/file/bot${global.token}/${filePath}`
    const protocol = url.startsWith("https:") ? https : http

    protocol
      .get(url, (res) => {
        const chunks = []
        res.on("data", (chunk) => chunks.push(chunk))
        res.on("end", () => resolve(Buffer.concat(chunks)))
        res.on("error", reject)
      })
      .on("error", reject)
  })
}

conn.use(async (ctx, next) => {
  if (ctx.message) {
    const m = smsg(ctx)
    await print(m, conn)
    if (m && m.messageTime >= global.botStartTime) {
      await require("./handler").handler.call(conn, m)
    }
  }
  return next()
})

conn.on("new_chat_members", async (ctx) => {
  if (ctx.message.date * 1000 >= global.botStartTime) {
    await require("./handler").participantsUpdate.call(conn, {
      id: ctx.chat.id,
      participants: ctx.message.new_chat_members.map((user) => user.id),
      action: "add",
    })
  }
})

conn.on("left_chat_member", async (ctx) => {
  if (ctx.message.date * 1000 >= global.botStartTime) {
    await require("./handler").participantsUpdate.call(conn, {
      id: ctx.chat.id,
      participants: [ctx.message.left_chat_member.id],
      action: "remove",
    })
  }
})

conn.launch()
process.once("SIGINT", () => conn.stop("SIGINT"))
process.once("SIGTERM", () => conn.stop("SIGTERM"))
