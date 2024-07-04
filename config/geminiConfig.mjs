// config/geminiConfig.mjs
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv'; // Load dotenv package
dotenv.config()

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default genAI;