const yt = require("yt-search")
const b = require("notmebotz-tools")
const { default: axios } = require("axios")

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply("Masukkan nama lagu!\n\nContoh:\n" + usedPrefix + command + " as it was")

  const search = await yt(text)
  const vid = search.videos[0]
  if (!vid) return m.reply("Lagu tidak ditemukan")

  const result = await b.youtube("ytmp3", vid.url, "mp3")
  if (result.status !== 200) return m.reply("Gagal mengunduh audio")

  const { title, duration, views, thumbnail } = result.data.metadata
  const yturl = vid.url
  const caption = `🎶 *${title}*\n⏱️ ${duration} detik\n👀 ${views.toLocaleString()} views\n🔗 [YouTube Link](${yturl})`

  conn.sendMessage(
    m.chat,
    {
      photo: thumbnail,
      caption,
    },
    { quoted: m },
  )

  conn.sendMessage(
    m.chat,
    {
      audio: result.data.download.url,
      caption: title,
      performer: result.data.metadata.author || "Unknown Artist",
      title: title,
      duration: Number.parseInt(duration) || 0,
    },
    { quoted: m },
  )
}

handler.help = ["play <query>"]
handler.tags = ["downloader"]
handler.command = ["play"]
handler.limit = 2

module.exports = handler
