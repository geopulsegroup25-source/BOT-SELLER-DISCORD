 AEGIS Anticheat Discord Bot

A dedicated Discord bot integrated with the AEGIS Anticheat system. It handles automated Discord actions, server communication via Express, and payment integrations through Mercado Pago.

## Prerequisites
- [Node.js](https://nodejs.org/) (v16.9.0 or newer recommended for Discord.js v14)
- A Discord Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications)

## Installation

1. Clone or download the repository.
2. Open a terminal in the project directory.
3. Install the required dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the root directory and configure your environment variables (DO NOT commit this file). Example variables you might need:

```env
DISCORD_TOKEN=your_bot_token_here
MERCADOPAGO_ACCESS_TOKEN=your_mp_token_here
PORT=3000
```
*(Check your specific requirements for exactly what your `.env` needs).*

## Usage

To start the bot, run:
```bash
npm start
```

## Built With
- [Discord.js](https://discord.js.org/)
- [Express](https://expressjs.com/)
- [Mercado Pago SDK](https://www.npmjs.com/package/mercadopago)
