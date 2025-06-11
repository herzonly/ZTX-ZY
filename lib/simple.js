module.exports = (conn) => {
  conn.sendMessage = async (jid, content, options = {}) => {
    try {
      if (!jid || jid === "" || jid === undefined || jid === null) {
        throw new Error("Chat ID (jid) is required and cannot be empty")
      }

      const { text, photo, video, audio, document, sticker } = content

      if (text) {
        const opts = {
          ...options,
        }

        if (options.parse_mode !== null && options.parse_mode !== false) {
          opts.parse_mode = options.parse_mode || "Markdown"
        }

        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }

        const result = await conn.telegram.sendMessage(jid, text, opts)

        const outgoingMessage = {
          chat: jid,
          text: text,
          content: { text: text },
          isGroup: false,
          id: result.message_id,
          sender: conn.botInfo?.id || "bot",
          name: conn.botInfo?.first_name || global.botname || "Bot",
          fromMe: true,
        }
        require("../lib/print")(outgoingMessage, conn, true)

        return result
      }

      if (photo) {
        const opts = {
          caption: content.caption || "",
          ...options,
        }

        if (options.parse_mode !== null && options.parse_mode !== false) {
          opts.parse_mode = options.parse_mode || "Markdown"
        }

        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }

        const result = await conn.telegram.sendPhoto(jid, photo, opts)

        const outgoingMessage = {
          chat: jid,
          content: { photo: photo, caption: content.caption },
          isGroup: false,
          id: result.message_id,
          sender: conn.botInfo?.id || "bot",
          name: conn.botInfo?.first_name || global.botname || "Bot",
          fromMe: true,
        }
        require("../lib/print")(outgoingMessage, conn, true)

        return result
      }

      if (video) {
        const opts = {
          caption: content.caption || "",
          ...options,
        }

        if (options.parse_mode !== null && options.parse_mode !== false) {
          opts.parse_mode = options.parse_mode || "Markdown"
        }

        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }

        const result = await conn.telegram.sendVideo(jid, video, opts)

        const outgoingMessage = {
          chat: jid,
          content: { video: video, caption: content.caption },
          isGroup: false,
          id: result.message_id,
          sender: conn.botInfo?.id || "bot",
          name: conn.botInfo?.first_name || global.botname || "Bot",
          fromMe: true,
        }
        require("../lib/print")(outgoingMessage, conn, true)

        return result
      }

      if (audio) {
        const opts = {
          caption: content.caption || "",
          ...options,
        }

        if (options.parse_mode !== null && options.parse_mode !== false) {
          opts.parse_mode = options.parse_mode || "Markdown"
        }

        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }

        const result = await conn.telegram.sendAudio(jid, audio, opts)

        const outgoingMessage = {
          chat: jid,
          content: { audio: audio, caption: content.caption },
          isGroup: false,
          id: result.message_id,
          sender: conn.botInfo?.id || "bot",
          name: conn.botInfo?.first_name || global.botname || "Bot",
          fromMe: true,
        }
        require("../lib/print")(outgoingMessage, conn, true)

        return result
      }

      if (document) {
        const opts = {
          caption: content.caption || "",
          ...options,
        }

        if (options.parse_mode !== null && options.parse_mode !== false) {
          opts.parse_mode = options.parse_mode || "Markdown"
        }

        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }

        const result = await conn.telegram.sendDocument(jid, document, opts)

        const outgoingMessage = {
          chat: jid,
          content: { document: document, caption: content.caption },
          isGroup: false,
          id: result.message_id,
          sender: conn.botInfo?.id || "bot",
          name: conn.botInfo?.first_name || global.botname || "Bot",
          fromMe: true,
        }
        require("../lib/print")(outgoingMessage, conn, true)

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

        const outgoingMessage = {
          chat: jid,
          content: { sticker: sticker },
          isGroup: false,
          id: result.message_id,
          sender: conn.botInfo?.id || "bot",
          name: conn.botInfo?.first_name || global.botname || "Bot",
          fromMe: true,
        }
        require("../lib/print")(outgoingMessage, conn, true)

        return result
      }
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
        ...options,
      }

      if (options.parse_mode !== null && options.parse_mode !== false) {
        opts.parse_mode = options.parse_mode || "Markdown"
      }

      if (quoted && quoted.message_id) {
        opts.reply_to_message_id = quoted.message_id
      }

      function getMimeType(filePath) {
        const ext = filePath.toLowerCase().split(".").pop()
        const mimeTypes = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
          bmp: "image/bmp",
          svg: "image/svg+xml",

          mp4: "video/mp4",
          avi: "video/avi",
          mov: "video/quicktime",
          wmv: "video/wmv",
          flv: "video/flv",
          webm: "video/webm",
          mkv: "video/mkv",
          "3gp": "video/3gpp",

          mp3: "audio/mpeg",
          wav: "audio/wav",
          ogg: "audio/ogg",
          aac: "audio/aac",
          flac: "audio/flac",
          m4a: "audio/mp4",
          wma: "audio/wma",

          pdf: "application/pdf",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xls: "application/vnd.ms-excel",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ppt: "application/vnd.ms-powerpoint",
          pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          txt: "text/plain",
          zip: "application/zip",
          rar: "application/rar",
          "7z": "application/7z",
        }

        return mimeTypes[ext] || "application/octet-stream"
      }

      const mimeType = getMimeType(filename || path)
      let result
      let messageType = "document"

      if (mimeType.startsWith("image/")) {
        messageType = "photo"
        if (typeof path === "string" && path.startsWith("http")) {
          result = await conn.telegram.sendPhoto(jid, { url: path }, opts)
        } else {
          result = await conn.telegram.sendPhoto(jid, { source: path }, opts)
        }
      } else if (mimeType.startsWith("video/")) {
        messageType = "video"
        if (typeof path === "string" && path.startsWith("http")) {
          result = await conn.telegram.sendVideo(jid, { url: path }, opts)
        } else {
          result = await conn.telegram.sendVideo(jid, { source: path }, opts)
        }
      } else if (mimeType.startsWith("audio/")) {
        messageType = "audio"
        if (typeof path === "string" && path.startsWith("http")) {
          result = await conn.telegram.sendAudio(jid, { url: path }, opts)
        } else {
          result = await conn.telegram.sendAudio(jid, { source: path }, opts)
        }
      } else {
        messageType = "document"
        if (typeof path === "string" && path.startsWith("http")) {
          result = await conn.telegram.sendDocument(jid, { url: path, filename }, opts)
        } else {
          result = await conn.telegram.sendDocument(jid, { source: path, filename }, opts)
        }
      }

      const outgoingMessage = {
        chat: jid,
        content: { [messageType]: path, caption: caption },
        isGroup: false,
        id: result.message_id,
        sender: conn.botInfo?.id || "bot",
        name: conn.botInfo?.first_name || global.botname || "Bot",
        fromMe: true,
      }
      require("../lib/print")(outgoingMessage, conn, true)

      return result
    } catch (error) {
      console.error("Error sending file:", error)
      console.error("JID:", jid)
      throw error
    }
  }

  conn.reply = async (jid, text, quoted, options = {}) => {
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

      const opts = {
        ...options,
      }

      if (quoted && quoted.message_id) {
        opts.reply_to_message_id = quoted.message_id
      }

      if (options.parse_mode === false || options.parse_mode === null) {
        delete opts.parse_mode
      } else if (!opts.parse_mode) {
        try {
          opts.parse_mode = "Markdown"
          const result = await conn.telegram.sendMessage(jid, text, opts)

          const outgoingMessage = {
            chat: jid,
            text: text,
            content: { text: text },
            isGroup: false,
            id: result.message_id,
            sender: conn.botInfo?.id || "bot",
            name: conn.botInfo?.first_name || global.botname || "Bot",
            fromMe: true,
          }
          require("../lib/print")(outgoingMessage, conn, true)

          return result
        } catch (markdownError) {
          console.warn("Markdown parsing failed, retrying without parse_mode:", markdownError.message)
          delete opts.parse_mode
        }
      }

      const result = await conn.telegram.sendMessage(jid, text, opts)

      const outgoingMessage = {
        chat: jid,
        text: text,
        content: { text: text },
        isGroup: false,
        id: result.message_id,
        sender: conn.botInfo?.id || "bot",
        name: conn.botInfo?.first_name || global.botname || "Bot",
        fromMe: true,
      }
      require("../lib/print")(outgoingMessage, conn, true)

      return result
    } catch (error) {
      console.error("Error in reply function:", error)
      console.error("Parameters - JID:", jid, "Text:", text, "Quoted:", quoted)
      throw error
    }
  }

  conn.sendButt = async (jid, text, buttons, quoted, options = {}) => {
    try {
      if (!jid || jid === "" || jid === undefined || jid === null) {
        throw new Error("Chat ID (jid) is required and cannot be empty")
      }

      if (!text || text === "") {
        throw new Error("Text message cannot be empty")
      }

      const opts = {
        reply_markup: {
          inline_keyboard: buttons,
        },
        ...options,
      }

      if (options.parse_mode === false || options.parse_mode === null) {
        delete opts.parse_mode
      } else if (!opts.parse_mode) {
        try {
          opts.parse_mode = "Markdown"
          if (quoted && quoted.message_id) {
            opts.reply_to_message_id = quoted.message_id
          }

          const result = await conn.telegram.sendMessage(jid, text, opts)

          const outgoingMessage = {
            chat: jid,
            text: text,
            content: { text: text },
            isGroup: false,
            id: result.message_id,
            sender: conn.botInfo?.id || "bot",
            name: conn.botInfo?.first_name || global.botname || "Bot",
            fromMe: true,
          }
          require("../lib/print")(outgoingMessage, conn, true)

          return result
        } catch (markdownError) {
          console.warn("Markdown parsing failed in sendButt, retrying without parse_mode:", markdownError.message)
          delete opts.parse_mode
        }
      }

      if (quoted && quoted.message_id) {
        opts.reply_to_message_id = quoted.message_id
      }

      const result = await conn.telegram.sendMessage(jid, text, opts)

      const outgoingMessage = {
        chat: jid,
        text: text,
        content: { text: text },
        isGroup: false,
        id: result.message_id,
        sender: conn.botInfo?.id || "bot",
        name: conn.botInfo?.first_name || global.botname || "Bot",
        fromMe: true,
      }
      require("../lib/print")(outgoingMessage, conn, true)

      return result
    } catch (error) {
      console.error("Error sending button message:", error)
      console.error("JID:", jid)
      console.error("Text:", text)
      console.error("Buttons:", buttons)
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
