//config/openaiConfig.mjs
import OpenAI from 'openai';

import dotenv from 'dotenv'; // Load dotenv package
dotenv.config()

const KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: KEY
});

export default openai;

