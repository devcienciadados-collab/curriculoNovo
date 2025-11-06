import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  return process.env.GOOGLE_API_KEY || "AIzaSyDcDmSUuR0A1gejUnF4yclqQk24kNWPtZg";
};

export const generateContent = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({
      apiKey: getApiKey(),
    });
    
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

const ai = new GoogleGenAI({
  apiKey: getApiKey(),
});

export default ai;
