# 🤖 NesaBot 📊

NesaBot is a bot that informs students via WhatsApp and Discord when new grades are available on the NESA website. It was built using Node.js and TypeScript.

## 🚀 Getting Started

To get started with NesaBot, follow these steps:

1. Clone this repository
2. Install dependencies using `npm install`
3. Create a `.env` file based on the `.env.example` file
4. Update the `.env` file with your NESA login credentials and the appropriate WhatsApp and/or Discord API keys
5. Start the bot using `npm run start`

## 🐳 Docker Deployment

To deploy NesaBot using Docker, follow these steps:

1. Clone this repository on your server
2. Create a `.env` file based on the `.env.example` file
3. Update the `.env` file with your NESA login credentials and the appropriate WhatsApp and/or Discord API keys
4. Build the Docker image by running the following command in the root directory of the project: docker build -t nesabot:latest .
5. Run the Docker container with the following command:

## 💻 Usage

Once the bot is running, it will periodically check the NESA website for new grades. When new grades are available, the bot will send a message to the specified WhatsApp and/or Discord group(s) with the updated grades.

## 📝 Notes

- The bot checks the grades every 15 Minutes, so you might not get informes emediatly
- The bot currently only supports WhatsApp and Discord, but could be extended to support other messaging platforms in the future.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
