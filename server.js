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
  if (token.length <= 10) return "*".repeat(token.length)
  const start = token.substring(0, 5)
  const end = token.substring(token.length - 5)
  const middle = "***_O_B_F_U_S_C_A_T_E_D_***" // Fixed 3 asterisks instead of full length
  // //const middle = "*".repeat(token.length - 10) // Old line 
  return `${start}${middle}${end}`
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
