const fs = require("fs")
const path = require("path")

class JSONFile {
  constructor(filename) {
    this.filename = filename
  }

  async read() {
    try {
      const data = await fs.promises.readFile(this.filename, "utf8")
      return JSON.parse(data)
    } catch (error) {
      if (error.code === "ENOENT") {
        return null
      }
      throw error
    }
  }

  async write(data) {
    const dir = path.dirname(this.filename)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(this.filename, JSON.stringify(data, null, 2))
  }
}

class Low {
  constructor(adapter) {
    this.adapter = adapter
    this.data = null
    this.READ = false
  }

  async read() {
    this.READ = true
    this.data = await this.adapter.read()
    this.READ = false
    return this.data
  }

  async write() {
    if (this.data !== null) {
      await this.adapter.write(this.data)
    }
  }
}

module.exports = { Low, JSONFile }
