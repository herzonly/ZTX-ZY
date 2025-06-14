const yt = require("yt-search")
const b = require("notmebotz-tools")
const { default: axios } = require("axios")

const parseDuration = (duration) => {
  if (!duration) return 0
  
  if (typeof duration === 'number') return duration
  
  const parts = duration.toString().split(':').reverse()
  let seconds = 0
  
  for (let i = 0; i < parts.length; i++) {
    seconds += parseInt(parts[i]) * Math.pow(60, i)
  }
  
  return seconds
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply("Masukkan nama lagu!\n\nContoh:\n" + usedPrefix + command + " as it was")

  try {
    const search = await yt(text)
    const vid = search.videos[0]
    if (!vid) return m.reply("Lagu tidak ditemukan")

    const searchDuration = parseDuration(vid.duration?.seconds || vid.timestamp)
    if (searchDuration > 1800) {
      return m.reply(`❌ Audio terlalu panjang!\n⏱️ Durasi: ${vid.timestamp}\n📝 Maksimal durasi yang diizinkan adalah 30 menit.`)
    }

    m.reply(wait)
    
    const result = await b.youtube("ytmp3", vid.url, "mp3")
    if (result.status !== 200) return m.reply("Gagal mengunduh audio")

    const { title, duration, views, thumbnail } = result.data.metadata
    const yturl = vid.url

    const finalDuration = parseDuration(duration)
    if (finalDuration > 1800) {
      return m.reply(`❌ Audio terlalu panjang!\n⏱️ Durasi: ${duration}\n📝 Maksimal durasi yang diizinkan adalah 30 menit.`)
    }

    const caption = `🎶 *${title}*\n⏱️ ${duration}\n👀 ${views.toLocaleString()} views\n🔗 [YouTube Link](${yturl})`

    await conn.sendMessage(
      m.chat,
      {
        image: { url: thumbnail },
        caption,
      },
      { quoted: m }
    )

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: result.data.download.url },
        performer: result.data.metadata.author || "Unknown Artist",
        title: title,
        duration: finalDuration,
      },
      { quoted: m }
    )

  } catch (error) {
    console.error("Error in play handler:", error)
    m.reply("❌ Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.")
  }
}

handler.help = ["play <query>"]
handler.tags = ["downloader"]
handler.command = ["play"]
handler.limit = 2

module.exports = handler
