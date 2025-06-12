const print = require('./print')

module.exports = (conn) => {
  conn.sendMessage = async (jid, content, options = {}) => {
    try {
      if (!jid || jid === "" || jid === undefined || jid === null) {
        throw new Error("Chat ID (jid) is required and cannot be empty")
      }

      const { text, photo, video, audio, document, sticker } = content

      if (text) {
        const messageText = String(text).trim()
        if (!messageText || messageText === "undefined" || messageText === "null") {
          return null
        }

        const opts = {
          parse_mode: "Markdown",
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        const result = await conn.telegram.sendMessage(jid, messageText, opts)
        print({ content: { text: messageText }, chat: jid }, conn, true)
        return result
      }

      if (photo) {
        const opts = {
          caption: content.caption || "",
          parse_mode: "Markdown",
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        const result = await conn.telegram.sendPhoto(jid, photo, opts)
        print({ content: { photo, caption: content.caption }, chat: jid }, conn, true)
        return result
      }

      if (video) {
        const opts = {
          caption: content.caption || "",
          parse_mode: "Markdown",
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        const result = await conn.telegram.sendVideo(jid, video, opts)
        print({ content: { video, caption: content.caption }, chat: jid }, conn, true)
        return result
      }

      if (audio) {
        const opts = {
          caption: content.caption || "",
          parse_mode: "Markdown",
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        const result = await conn.telegram.sendAudio(jid, audio, opts)
        print({ content: { audio, caption: content.caption }, chat: jid }, conn, true)
        return result
      }

      if (document) {
        const opts = {
          caption: content.caption || "",
          parse_mode: "Markdown",
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        const result = await conn.telegram.sendDocument(jid, document, opts)
        print({ content: { document, caption: content.caption }, chat: jid }, conn, true)
        return result
      }

      if (sticker) {
        const opts = {
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        const result = await conn.telegram.sendSticker(jid, sticker, opts)
        print({ content: { sticker }, chat: jid }, conn, true)
        return result
      }

      throw new Error("No valid content provided")
    } catch (error) {
      throw error
    }
  }

  conn.sendFile = async (jid, path, filename = "", caption = "", quoted, options = {}) => {
    try {
      if (!jid || jid === "" || jid === undefined || jid === null) {
        throw new Error("Chat ID (jid) is required and cannot be empty")
      }

      const opts = {
        caption,
        parse_mode: "Markdown",
        ...options,
      }
      if (quoted && quoted.message_id) {
        opts.reply_to_message_id = quoted.message_id
      }

      if (typeof path === "string" && path.startsWith("http")) {
        const result = await conn.telegram.sendDocument(jid, { url: path, filename }, opts)
        print({ content: { document: path, caption }, chat: jid }, conn, true)
        return result
      } else {
        const result = await conn.telegram.sendDocument(jid, { source: path, filename }, opts)
        print({ content: { document: path, caption }, chat: jid }, conn, true)
        return result
      }
    } catch (error) {
      throw error
    }
  }

  conn.reply = async (jid, text, quoted, options = {}) => {
    try {
      if (!jid || jid === "" || jid === undefined || jid === null) {
        return null
      }

      if (!text || text === "" || text === undefined || text === null) {
        return null
      }

      const messageText = String(text).trim()
      if (messageText === "" || messageText === "undefined" || messageText === "null") {
        return null
      }

      const opts = {
        parse_mode: "Markdown",
        ...options,
      }

      if (quoted && quoted.message_id) {
        opts.reply_to_message_id = quoted.message_id
      }

      if (options.parse_mode === false || options.parse_mode === null) {
        delete opts.parse_mode
      }

      const result = await conn.telegram.sendMessage(jid, messageText, opts)
      print({ content: { text: messageText }, chat: jid }, conn, true)
      return result
    } catch (error) {
      return null
    }
  }

  conn.sendButt = async (jid, text, buttons, quoted, options = {}) => {
    try {
      if (!jid || jid === "" || jid === undefined || jid === null) {
        throw new Error("Chat ID (jid) is required and cannot be empty")
      }

      if (!text || text === "" || text === undefined || text === null) {
        return null
      }

      const messageText = String(text).trim()
      if (messageText === "" || messageText === "undefined" || messageText === "null") {
        return null
      }

      const opts = {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: buttons || [],
        },
        ...options,
      }

      if (quoted && quoted.message_id) {
        opts.reply_to_message_id = quoted.message_id
      }

      const result = await conn.telegram.sendMessage(jid, messageText, opts)
      print({ content: { text: messageText }, chat: jid }, conn, true)
      return result
    } catch (error) {
      return null
    }
  }

  conn.getName = (jid) => {
    return jid ? jid.toString() : "Unknown"
  }

  conn.parseMention = (text) => {
    if (!text) return []
    return [...text.matchAll(/@(\d+)/g)].map((v) => v[1])
  }

  conn.user = {
    jid: conn.botInfo?.id || 0,
  }

  return conn
}
