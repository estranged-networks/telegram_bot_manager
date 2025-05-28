const express = require("express")
const fs = require("fs")
const path = require("path")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Function to get bot configurations from environment variables
function getBotConfigs() {
  const bots = []
  let i = 1

  while (process.env[`BOT_${i}_NAME`] && process.env[`BOT_${i}_TOKEN`]) {
    bots.push({
      id: `bot_${i}`,
      name: process.env[`BOT_${i}_NAME`],
      token: process.env[`BOT_${i}_TOKEN`],
    })
    i++
  }

  return bots
}

// Function to get chat configurations from environment variables
function getChatConfigs() {
  const chats = []
  let i = 1

  while (process.env[`CHAT_${i}_ID`] && process.env[`CHAT_${i}_NAME`]) {
    chats.push({
      id: process.env[`CHAT_${i}_ID`],
      name: process.env[`CHAT_${i}_NAME`],
    })
    i++
  }

  return chats
}

// Function to obfuscate bot tokens
function obfuscateToken(token) {
  if (token.length <= 8) return "*".repeat(token.length)

  const start = token.substring(0, 4)
  const end = token.substring(token.length - 4)
  const result = `${start}***_O_F_U_S_C_A_T_E_D_***${end}`

  return result
}

// Function to get chat photo URL
async function getChatPhoto(botToken, chatId) {
  try {
    console.log(`Getting photo for chat ${chatId}`)

    // Get chat info first
    const chatResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`)
    const chatData = await chatResponse.json()

    if (!chatData.ok) {
      console.log(`Error getting chat ${chatId}: ${chatData.description}`)
      return { error: chatData.description, url: null }
    }

    console.log(`Chat data for ${chatId} retrieved successfully`)

    // Check if chat has a photo
    if (!chatData.result.photo) {
      console.log(`No photo available for chat ${chatId}`)
      return { error: null, url: null }
    }

    // Get the file info for the photo
    const fileId = chatData.result.photo.small_file_id
    console.log(`Getting file info for file ID: ${fileId}`)

    const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`)
    const fileData = await fileResponse.json()

    if (!fileData.ok) {
      console.log(`Failed to get file data for ${chatId}: ${fileData.description}`)
      return { error: fileData.description, url: null }
    }

    // Return the full URL to the photo
    const photoUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
    console.log(`Photo URL for ${chatId}: ${photoUrl}`)
    return { error: null, url: photoUrl }
  } catch (error) {
    console.error(`Error getting photo for chat ${chatId}:`, error)
    return { error: error.message, url: null }
  }
}

// Serve the main page with injected configuration
app.get("/", (req, res) => {
  const bots = getBotConfigs()
  const chats = getChatConfigs()

  // Prepare safe bot data (with obfuscated tokens)
  const safeBots = bots.map((bot) => ({
    id: bot.id,
    name: bot.name,
    obfuscatedToken: obfuscateToken(bot.token),
  }))

  // Read the HTML template
  const htmlTemplate = fs.readFileSync(path.join(__dirname, "index.html"), "utf8")

  // Inject the configuration into the HTML
  const html = htmlTemplate
    .replace("{{BOTS_CONFIG}}", JSON.stringify(safeBots))
    .replace("{{CHATS_CONFIG}}", JSON.stringify(chats))

  res.send(html)
})

// API endpoint to get chat photos
app.post("/api/getChatPhotos", async (req, res) => {
  try {
    console.log("getChatPhotos API called with:", req.body)

    const { botId } = req.body

    if (!botId) {
      return res.status(400).json({ error: "Bot ID is required" })
    }

    // Find the bot token
    const botNumber = botId.replace("bot_", "")
    const token = process.env[`BOT_${botNumber}_TOKEN`]

    if (!token) {
      return res.status(404).json({ error: "Bot not found" })
    }

    console.log(`Using bot token for bot ${botNumber}`)

    const chats = getChatConfigs()
    const chatPhotos = {}
    const errors = {}

    console.log(`Getting photos for ${chats.length} chats`)

    // Get photos for all chats
    for (const chat of chats) {
      console.log(`Processing chat: ${chat.name} (${chat.id})`)
      const result = await getChatPhoto(token, chat.id)

      if (result.error) {
        errors[chat.id] = result.error
      }

      chatPhotos[chat.id] = result.url
    }

    console.log("Final chat photos result:", chatPhotos)
    if (Object.keys(errors).length > 0) {
      console.log("Errors:", errors)
    }

    res.json({
      success: true,
      photos: chatPhotos,
      errors: errors,
    })
  } catch (error) {
    console.error("Error getting chat photos:", error)
    res.status(500).json({ error: error.message })
  }
})

// API endpoint to get updates
app.post("/api/getUpdates", async (req, res) => {
  try {
    const { botId } = req.body

    if (!botId) {
      return res.status(400).json({ error: "Bot ID is required" })
    }

    // Find the bot token
    const botNumber = botId.replace("bot_", "")
    const token = process.env[`BOT_${botNumber}_TOKEN`]

    if (!token) {
      return res.status(404).json({ error: "Bot not found" })
    }

    // Call Telegram API
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.description || "Telegram API error")
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error("Error getting updates:", error)
    res.status(500).json({ error: error.message })
  }
})

// API endpoint to send message
app.post("/api/sendMessage", async (req, res) => {
  try {
    const { botId, chatId, message } = req.body

    if (!botId || !chatId || !message) {
      return res.status(400).json({ error: "Bot ID, chat ID, and message are required" })
    }

    // Find the bot token
    const botNumber = botId.replace("bot_", "")
    const token = process.env[`BOT_${botNumber}_TOKEN`]

    if (!token) {
      return res.status(404).json({ error: "Bot not found" })
    }

    // Call Telegram API
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.description || "Telegram API error")
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Telegram Bot Manager running on port ${PORT}`)
  console.log(`📊 Loaded ${getBotConfigs().length} bots and ${getChatConfigs().length} chats`)
  console.log(`🌐 Access via your configured port mapping`)
})
