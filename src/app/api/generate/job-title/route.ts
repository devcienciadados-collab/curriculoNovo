import { decrementUserCredits } from "@/db/actions";
import { getUserCredits } from "@/db/queries";
import genAI from "@/lib/gemini"; // Importa a instância corretamente
import { isValidJSON } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  jobTitle: z.string(),
  jobDescription: z.string().optional(),
});

export const POST = async (request: Request) => {
  try {
    // Verifica se a chave da API está presente
    if (!process.env.GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({
          message: "A chave da API do Google não está configurada.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const credits = await getUserCredits();

    if (credits <= 0) {
      return new Response(
        JSON.stringify({ message: "Créditos insuficientes." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { jobTitle, jobDescription } = schema.parse(body);

    if (!genAI || typeof genAI.getGenerativeModel !== "function") {
      return new Response(
        JSON.stringify({ message: "Serviço de geração de IA indisponível." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Modelo mais recente

    if (!model || typeof model.generateContent !== "function") {
      return new Response(
        JSON.stringify({ message: "Modelo de geração não disponível." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = `
      Crie um conteúdo JSON que será utilizado para popular um currículo, alinhado com o título da vaga: ${jobTitle}${
      jobDescription
        ? ` e com a seguinte descrição da vaga: ${jobDescription}`
        : ""
    }.
      O conteúdo deve ser otimizado para aumentar as chances de match com a vaga, focando nas habilidades mais relevantes.

      **Importante**: Não mencione o título da vaga ou dados da empresa no JSON. O conteúdo deve ser escrito de forma profissional e direta, utilizando a metodologia STAR para o campo de "sobre mim" e adotando um tom que destaque as qualificações do candidato.

      Estrutura (Gere um JSON válido e bem formatado):
      {
        summary: "Campo usado para sobre mim, usando metodologia tipo STAR, focando em conquistas relevantes para a vaga.",
        headline: "Headline curto em poucas palavras para ficar abaixo do nome do candidato. Normalmente é o nome do cargo",
        skills: [
          {
            name: "Nome da habilidade mais relevante para a vaga.",
            keywords: "Palavras-chave relacionadas a essa habilidade, separadas por vírgula, que ajudem a destacar a competência.",
            level: 0-5 (0 para básico, 5 para avançado)
          },
          ...
        ]
      }
    `;

    const result = await model.generateContent(prompt);

    // Extrai o texto do resultado de forma segura, considerando diferentes shapes da resposta
    let jsonText: string | undefined;

    if (!result) {
      throw new Error("Resposta vazia do modelo.");
    }

    // Possíveis formatos: result.response (objeto Response), result.response (string), result.text (string), result (string)
    if (typeof result === "string") {
      jsonText = result;
    } else if (typeof result.response === "string") {
      jsonText = result.response;
    } else if (result.response && typeof result.response.text === "function") {
      jsonText = await result.response.text();
    } else if (typeof result.text === "function") {
      jsonText = await result.text();
    } else if (typeof result.text === "string") {
      jsonText = result.text;
    }

    if (!jsonText) {
      throw new Error(
        "Não foi possível extrair texto JSON da resposta do modelo."
      );
    }

    if (!isValidJSON(jsonText)) throw new Error("JSON inválido.");

    await decrementUserCredits(1);

    const parsed = JSON.parse(jsonText);

    return new Response(JSON.stringify({ data: parsed }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        message: "Ocorreu um erro inesperado.",
        error: message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/* import { decrementUserCredits } from "@/db/actions";
import { getUserCredits } from "@/db/queries";
import * as genAI from "@/lib/gemini";
import { isValidJSON } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  jobTitle: z.string(),
  jobDescription: z.string().optional(),
});

export const POST = async (request: Request) => {
  try {
    if (!genAI) {
      return Response.json(
        { message: "A chave da API do Google não está configurada." },
        { status: 500 }
      );
    }

    const credits = await getUserCredits();

    if (credits <= 0) {
      return Response.json({ message: "Créditos insuficientes." }, { status: 403 });
    }

    const body = await request.json();

    const { jobTitle, jobDescription } = schema.parse(body);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Crie um conteúdo JSON que será utilizado para popular um currículo, alinhado com o título da vaga: ${jobTitle}${
        !!jobDescription
          ? ` e com a seguinte descrição da vaga: ${jobDescription}`
          : ""
      }. O conteúdo deve ser otimizado para aumentar as chances de match com a vaga, focando nas habilidades mais relevantes.
    
      **Importante**: Não mencione o título da vaga ou dados da empresa no JSON. O conteúdo deve ser escrito de forma profissional e direta, utilizando a metodologia STAR para o campo de "sobre mim" e adotando um tom que destaque as qualificações do candidato.
    
      Estrutura (Gere um JSON válido e bem formatado):
      {
        summary: "Campo usado para sobre mim, usando metodologia tipo STAR, focando em conquistas relevantes para a vaga.",
        headline: "Headline curto em poucas palavras para ficar abaixo do nome do candidato. Normalmente é o nome do cargo",
        skills: [
          {
            name: "Nome da habilidade mais relevante para a vaga.",
            keywords: "Palavras-chave relacionadas a essa habilidade, separadas por vírgula, que ajudem a destacar a competência."
            level: 0-5 (0 para básico, 5 para avançado),
          },
          ...
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const json = response.text();

    if (!isValidJSON(json)) throw new Error("JSON inválido.");

    await decrementUserCredits(1);

    return Response.json({ data: json });
  } catch (error) {
    return Response.json(
      { message: "Ocorreu um erro inesperado.", error },
      { status: 500 }
    );
  }
};
 */
