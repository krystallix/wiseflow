const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
for (const k in envConfig) process.env[k] = envConfig[k];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function run() {
  const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log(models);
}
run().catch(console.error);
