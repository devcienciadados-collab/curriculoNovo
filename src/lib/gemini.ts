import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY não encontrada nas variáveis de ambiente');
}

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
