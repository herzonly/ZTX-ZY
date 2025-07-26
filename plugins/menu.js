const fs = require("fs")
const path = require("path")

const handler = async (m, { conn, Func }) => {
  const user = global.db.data.users[m.sender]
  const isOwner = global.ownerid.includes(m.sender.toString())
  const isPrems = global.premid.includes(m.sender.toString()) || user.premium || user.premiumTime > 0

  const loadPlugins = () => {
    const pluginDir = path.join(__dirname)
    const plugins = []

    fs.readdirSync(pluginDir).forEach((file) => {
      if (file.endsWith(".js") && file !== "menu.js") {
        try {
          delete require.cache[require.resolve(path.join(pluginDir, file))]
          const plugin = require(path.join(pluginDir, file))
          if (plugin.help && plugin.tags) {
            plugins.push(plugin)
          }
        } catch (e) {
          console.error(`Error loading ${file}:`, e)
        }
      }
    })

    return plugins
  }

  const plugins = loadPlugins()
  const categories = {}

  plugins.forEach((plugin) => {
    if (plugin.tags && plugin.help) {
      plugin.tags.forEach((tag) => {
        if (!categories[tag]) {
          categories[tag] = []
        }
        plugin.help.forEach((help) => {
          categories[tag].push(help)
        })
      })
    }
  })

  const categoryNames = {
    main: "🏠 MAIN MENU",
    tools: "🛠️ TOOLS",
    downloader: "📥 DOWNLOADER",
    fun: "🎮 FUN",
    group: "👥 GROUP",
    owner: "👑 OWNER ONLY",
    admin: "⚔️ ADMIN ONLY",
    premium: "💎 PREMIUM",
    info: "ℹ️ INFO",
    advanced: "🔧 ADVANCED",
  }

  let limitStatus = ""
  if (isOwner) {
    limitStatus = "♾️ Unlimited (Owner)"
  } else if (isPrems) {
    limitStatus = "♾️ Unlimited (Premium)"
  } else {
    limitStatus = `${user?.limit || 0} (User)`
  }

  let menuText = `╭─「 BOT INFO 」
│ 📱 Bot Name: ${global.botname}
│ 👑 Owner: ${global.ownername}
│ 🚀 Version: 1.0.0
│ 📊 Total Users: ${Object.keys(global.db.data.users).length}
╰────────────

╭─「 USER INFO 」
│ 👤 Name: ${m.name}
│ 🆔 ID: ${m.sender}
│ ⭐ Limit: ${limitStatus}
│ 🏆 Level: ${user?.level || 1}
│ 📝 Registered: ${user?.registered ? "✅" : "❌"}
╰────────────

`

  let totalCommands = 0
  Object.keys(categories)
    .sort()
    .forEach((category) => {
      const categoryName = categoryNames[category] || `📂 ${category.toUpperCase()}`
      menuText += `╭─「 ${categoryName} 」\n`

      categories[category].forEach((help) => {
        menuText += `│ • /${help}\n`
        totalCommands++
      })

      menuText += `╰────────────\n\n`
    })

  menuText += `📋 Total Commands: ${totalCommands}\n\n`
  menuText += `💡 Tips: Gunakan /daftar untuk mendaftar jika belum terdaftar`

  await conn.sendMessage(m.chat, { video: { url: "https://file.idnet.my.id/api/preview.php?file=jspfr1vc.mp4" },
  caption: Func.escapeMarkdownV2Safe(menuText)
                              }, { quoted: { message_id: m.id } })
}

handler.help = ["menu"]
handler.tags = ["main"]
handler.command = /^(menu|help|\?)$/i

module.exports = handler
