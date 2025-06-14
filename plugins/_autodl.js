let handler = m => m;

handler.before = async function (m, { conn }) {
  if (!m.text) return true;

  const urlRegex =
    /https?:\/\/[^\s]*(?:tiktok|instagram|twitter|x\.com|threads|youtube|youtu\.be|douyin|rednote)[^\s]*/gi;
  const urls = m.text.match(urlRegex);
  if (!urls) return true;

  const chat = global.db?.data?.chats?.[m.chat] || {};
  if (!chat.autoDL) return true;

  const b = require('notmebotz-tools');

  for (const url of urls) {
    try {
      await m.reply('🔄 Mendeteksi URL media, sedang mengunduh...');
      
      const downloadWithRetry = async (url, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const { status, data } = await Promise.race([
              b.aio(url),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 30000)
              )
            ]);
            return { status, data };
          } catch (err) {
            if (i === maxRetries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      };

      const { status, data } = await downloadWithRetry(url);

      if (status !== 200 || !Array.isArray(data) || data.length === 0) {
        await m.reply('❌ Gagal mengunduh media - Server tidak merespon dengan benar');
        continue;
      }

      const media = data[0];
      const caption = media.title ? `📹 ${media.title}` : '📹 Media Downloaded';

      const sendMediaWithFallback = async (mediaUrl, type, caption) => {
        try {
          if (!mediaUrl) throw new Error('No media URL provided');
          
          const mediaOptions = { 
            [type]: { url: mediaUrl },
            caption
          };
          
          await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
          return true;
        } catch (err) {
          return false;
        }
      };

      let sent = false;

      if (media.video_file_url && !sent) {
        sent = await sendMediaWithFallback(media.video_file_url, 'video', caption);
      }

      if (!sent && media.videoimg_file_url) {
        sent = await sendMediaWithFallback(media.videoimg_file_url, 'image', caption);
      }

      if (!sent && media.image) {
        sent = await sendMediaWithFallback(media.image, 'image', caption);
      }

      if (!sent) {
        await m.reply(`✅ Media berhasil diproses tapi gagal dikirim`);
      }

    } catch (err) {
      await m.reply('❌ Error saat mengunduh media');
    }
  }

  return true;
};

handler.disabled = false;
module.exports = handler;
