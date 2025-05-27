# Telegram Bot Manager - Docker Edition

A simple, secure Telegram bot management tool that runs in Docker with environment variable configuration.
Made so I can manage the many Chat, Groups, Super groups and Channels and assign them from one central place. 
## 🚀 Quick Start

### 1. Setup

# Clone the project
```bash
git clone 
```

cd to your "telegram-bot-manager" directory


# Copy environment template
````bash
cp .env.example .env
````

### 2. Configure Your Bots
Edit `.env` file with your real bot tokens:

````bash
env
BOT_1_NAME=My Bot
BOT_1_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk

CHAT_1_ID=-1001234567890
CHAT_1_NAME=My Group Chat
````

### 3. Run with Docker

# Start the application
```bash
docker-compose up -d
```
# View logs
```bash
docker-compose logs -f
```
# Stop the application
```bash
docker-compose down
```

### 4. Access
Open http://localhost:3000 in your browser!
or edit `docker-compose.yml` file with your prefered port

## 📁 Project Structure
```
├── Dockerfile              # Container configuration
├── docker-compose.yml      # Docker Compose setup
├── package.json            # Node.js dependencies
├── server.js               # Express server
├── index.html              # Main HTML page
├── .dockerignore           # Docker ignore file
├── .env.example            # Environment template
└── README.md               # This file
```


## 🔒 Security Features
- ✅ Bot tokens stored in `.env` file only
- ✅ Tokens never sent to browser (obfuscated display)
- ✅ All Telegram API calls proxied through server
- ✅ No sensitive data in client-side code

## 🛠️ Commands
- **Get Updates**: Retrieve recent messages/updates from Telegram - used to look up ID's
- **Send Message**: Send test messages to configured chats - used to ensure deleivery to the correct group

## 📝 Getting Bot Tokens
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newbot` to create a new bot
3. Copy the token to your `.env` file

## 📝 Getting Chat IDs
1. Add your bot to the group/chat
2. Send a message in the chat
3. Use "Get Updates" to see the chat ID in the response


## 🔧 Adding More Bots/Chats
Add more environment variables to your `.env` file:
```bash
env
BOT_3_NAME=Another Bot
BOT_3_TOKEN=your_token_here

CHAT_3_ID=another_chat_id
CHAT_3_NAME=Another Chat
```

**Important**: After editing `.env`, you must rebuild the container:
```bash
docker-compose down
docker-compose up --build
```

## 🐛 Troubleshooting

### Container won't start

# Check logs
```bash
docker-compose logs
```
# Rebuild container
```bash
docker-compose build --no-cache
```

### No bots/chats showing
- Check your `.env` file format
- Ensure environment variables follow the pattern: `BOT_1_NAME`, `BOT_1_TOKEN`
- Rebuild the container after changing `.env`: `docker-compose up --build`

### API errors
- Verify bot tokens are correct
- Check that bots are active
- Ensure chat IDs are correct (groups start with `-`)

### Changes to .env not showing
- Environment variables are loaded at container build time
- After editing `.env`, run: `docker-compose down && docker-compose up --build`
- A full rebuild is required for .env changes!
