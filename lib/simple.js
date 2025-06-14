const fs = require('fs')
const path = require('path')
const axios = require('axios')
const print = require('./print')

const isUrl = (str) => {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

const isFilePath = (str) => {
  if (typeof str !== 'string') return false
  if (isUrl(str)) return false
  return fs.existsSync(str)
}

const isBuffer = (input) => {
  return Buffer.isBuffer(input)
}

const downloadMedia = async (url) => {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      maxRedirects: 5
    })
    return Buffer.from(response.data)
  } catch (error) {
    console.error('Download error:', error.message)
    throw new Error(`Failed to download: ${error.message}`)
  }
}

const processMediaInput = async (input) => {
  try {
    if (isBuffer(input)) {
      return input
    }
    
    if (isUrl(input)) {
      return await downloadMedia(input)
    }
    
    if (isFilePath(input)) {
      return fs.readFileSync(input)
    }
    
    return input
  } catch (error) {
    console.error('Process media error:', error.message)
    throw error
  }
}

module.exports = (conn) => {
  conn.sendMessage = async (jid, content, options = {}) => {
    try {
      if (!jid || jid === "" || jid === undefined || jid === null) {
        throw new Error("Chat ID (jid) is required and cannot be empty")
      }

      const { text, photo, video, audio, document, sticker, image } = content

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

      if (photo || image) {
        const imageInput = photo || image
        const processedImage = await processMediaInput(imageInput)
        
        const opts = {
          caption: content.caption || "",
          parse_mode: "Markdown",
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        
        const result = await conn.telegram.sendPhoto(jid, processedImage, opts)
        print({ content: { photo: imageInput, caption: content.caption }, chat: jid }, conn, true)
        return result
      }

      if (video) {
        const processedVideo = await processMediaInput(video)
        
        const opts = {
          caption: content.caption || "",
          parse_mode: "Markdown",
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        const result = await conn.telegram.sendVideo(jid, processedVideo, opts)
        print({ content: { video, caption: content.caption }, chat: jid }, conn, true)
        return result
      }

      if (audio) {
        const processedAudio = await processMediaInput(audio)
        
        const opts = {
          caption: content.caption || "",
          parse_mode: "Markdown",
          performer: content.performer,
          title: content.title,
          duration: content.duration,
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        const result = await conn.telegram.sendAudio(jid, processedAudio, opts)
        print({ content: { audio, caption: content.caption }, chat: jid }, conn, true)
        return result
      }

      if (document) {
        const processedDocument = await processMediaInput(document)
        
        const opts = {
          caption: content.caption || "",
          parse_mode: "Markdown",
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        const result = await conn.telegram.sendDocument(jid, processedDocument, opts)
        print({ content: { document, caption: content.caption }, chat: jid }, conn, true)
        return result
      }

      if (sticker) {
        const processedSticker = await processMediaInput(sticker)
        
        const opts = {
          ...options,
        }
        if (options.quoted && options.quoted.message_id) {
          opts.reply_to_message_id = options.quoted.message_id
        }
        const result = await conn.telegram.sendSticker(jid, processedSticker, opts)
        print({ content: { sticker }, chat: jid }, conn, true)
        return result
      }

      throw new Error("No valid content provided")
    } catch (error) {
      console.error('SendMessage error:', error.message)
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

      const fileInput = await processMediaInput(path)
      const result = await conn.telegram.sendDocument(jid, fileInput, opts)
      print({ content: { document: path, caption }, chat: jid }, conn, true)
      return result
    } catch (error) {
      console.error('SendFile error:', error.message)
      throw error
    }
  }

  conn.sendImage = async (jid, image, caption = "", quoted, options = {}) => {
    try {
      if (!jid || jid === "" || jid === undefined || jid === null) {
        throw new Error("Chat ID (jid) is required and cannot be empty")
      }

      const processedImage = await processMediaInput(image)
      
      const opts = {
        caption,
        parse_mode: "Markdown",
        ...options,
      }
      if (quoted && quoted.message_id) {
        opts.reply_to_message_id = quoted.message_id
      }

      const result = await conn.telegram.sendPhoto(jid, processedImage, opts)
      print({ content: { photo: image, caption }, chat: jid }, conn, true)
      return result
    } catch (error) {
      console.error('SendImage error:', error.message)
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
      console.error('Reply error:', error.message)
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
      console.error('SendButt error:', error.message)
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
