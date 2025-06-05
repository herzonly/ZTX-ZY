const handler = async (m, { conn }) => {
  const start = Date.now()
  const msg = await conn.sendMessage(m.chat, { text: "Pinging..." }, { quoted: { message_id: m.id } })
  const end = Date.now()

  const ping = end - start
  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = Math.floor(uptime % 60)

  const pingText = `🏓 *PONG!*

📊 **Response Time:** ${ping}ms
⏱️ **Uptime:** ${hours}h ${minutes}m ${seconds}s
💾 **Memory Usage:* *${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
🤖 **Bot Status:** Online`

  await conn.telegram.editMessageText(m.chat, msg.message_id, undefined, pingText)
}

handler.help = ["ping"]
handler.tags = ["info"]
handler.command = /^(ping|p)$/i

module.exports = handler
