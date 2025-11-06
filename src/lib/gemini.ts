/* import { GoogleGenAI } from "@google/genai";

/**
 * Adapter mínimo: não executa nada ao importar.
 * Usa o cliente oficial se disponível; fallback para fetch se necessário.
 */

const apiKey = process.env.GOOGLE_API_KEY;
let ai: any = null;

// Tenta carregar dinamicamente o SDK oficial se disponível; caso contrário mantém ai = null.
// Não usamos top-level await para manter compatibilidade com mais ambientes.
if (apiKey) {
  import("@google/genai")
    .then((mod: any) => {
      const GoogleGenAI = mod?.GoogleGenAI ?? mod?.default;
      if (GoogleGenAI) {
        try {
          ai = new GoogleGenAI({ apiKey });
        } catch {
          // falha ao instanciar: manter fallback para fetch
          ai = null;
        }
      } else {
        ai = null;
      }
    })
    .catch(() => {
      // SDK não disponível ou falha ao carregar
      ai = null;
    });
}

function createClient(apiKey?: string) {
  const key = apiKey ?? process.env.GOOGLE_API_KEY;
  return {
    getGenerativeModel: ({ model = "gemini-2.5-flash" } = {}) => ({
      generateContent: async (prompt: string) => {
        if (!key) {
          throw new Error("GOOGLE_API_KEY não configurada");
        }

        // Preferir SDK oficial quando instanciado
        if (ai && typeof ai.models?.generateContent === "function") {
          // Ajuste conforme shape retornado pela SDK instalada
          const res = await ai.models.generateContent({
            model,
            contents: [{ type: "text", text: prompt }],
          });

          // Tenta extrair um texto legível do resultado da SDK
          const candidateText =
            res?.candidates?.[0]?.content ??
            res?.content ??
            JSON.stringify(res);
          return candidateText;
        }

        // Fallback simples via fetch para a API REST
        const API_BASE = "https://generative.googleapis.com/v1/models";
        const url = `${API_BASE}/${model}:generate?key=${encodeURIComponent(
          key
        )}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            temperature: 0.2,
            maxOutputTokens: 512,
          }),
        });

        return await res.text();
      },
    }),
  };
}

const genAI: any = createClient();
export default genAI;
 