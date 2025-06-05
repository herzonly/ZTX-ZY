module.exports = (conn) => {
  conn.sendMessage = async (jid, content, options = {}) => {
    try {
      if (!jid || jid === "" || jid === undefined || jid === null) {
        throw new Error("Chat ID (jid) is required and cannot be empty")
      }

      const { text, photo, video, audio, document, sticker } = content
      let result

      if (text) {
        const opts = {
          parse_mode: "Markdown",
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        result = await conn.telegram.sendMessage(jid, text, opts)
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
        result = await conn.telegram.sendPhoto(jid, photo, opts)
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
        result = await conn.telegram.sendVideo(jid, video, opts)
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
        result = await conn.telegram.sendAudio(jid, audio, opts)
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
        result = await conn.telegram.sendDocument(jid, document, opts)
      }

      if (sticker) {
        const opts = {
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        result = await conn.telegram.sendSticker(jid, sticker, opts)
      }

      try {
        const logMessage = {
          chat: jid,
          content: content,
          text: content.text || "",
          isGroup: jid < 0,
        }
        require("./print")(logMessage, conn, true)
      } catch (e) {
        console.log("Print error:", e)
      }

      return result
    } catch (error) {
      console.error("Error sending message:", error)
      console.error("JID:", jid)
      console.error("Content:", content)
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

      let result
      if (typeof path === "string" && path.startsWith("http")) {
        result = await conn.telegram.sendDocument(jid, { url: path, filename }, opts)
      } else {
        result = await conn.telegram.sendDocument(jid, { source: path, filename }, opts)
      }

      try {
        const logMessage = {
          chat: jid,
          content: { document: path, caption: caption },
          text: `File: ${filename}`,
          isGroup: jid < 0,
        }
        require("./print")(logMessage, conn, true)
      } catch (e) {
        console.log("Print error:", e)
      }

      return result
    } catch (error) {
      console.error("Error sending file:", error)
      console.error("JID:", jid)
      throw error
    }
  }

  conn.reply = async (jid, text, quoted) => {
    try {
      if (!jid || jid === "" || jid === undefined || jid === null) {
        console.error("Reply failed: Chat ID is missing or empty")
        console.error("JID:", jid)
        console.error("Text:", text)
        console.error("Quoted:", quoted)
        throw new Error("Chat ID (jid) is required and cannot be empty")
      }

      if (!text || text === "") {
        throw new Error("Text message cannot be empty")
      }

      const result = await conn.sendMessage(jid, { text }, { quoted })

      try {
        const logMessage = {
          chat: jid,
          content: { text: text },
          text: text,
          isGroup: jid < 0,
        }
        require("./print")(logMessage, conn, true)
      } catch (e) {
        console.log("Print error:", e)
      }

      return result
    } catch (error) {
      console.error("Error in reply function:", error)
      console.error("Parameters - JID:", jid, "Text:", text, "Quoted:", quoted)
      throw error
    }
  }

  conn.getName = (jid) => {
    return jid.toString()
  }

  conn.parseMention = (text) => {
    return [...text.matchAll(/@(\d+)/g)].map((v) => v[1])
  }

  conn.user = {
    jid: conn.botInfo?.id || 0,
  }

  return conn
}
