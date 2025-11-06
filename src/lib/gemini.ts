import { GoogleGenAI } from "@google/genai";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY não encontrada nas variáveis de ambiente");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

export const generateContent = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Erro ao gerar conteúdo:", error);
    throw new Error("Falha na geração de conteúdo com IA");
  }
};

export default ai;
