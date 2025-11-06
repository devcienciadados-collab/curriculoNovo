
import { decrementUserCredits } from "@/db/actions";
import { getUserCredits } from "@/db/queries";
import { generateContent } from "@/lib/gemini";
import { isValidJSON } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  content: z.object({}).passthrough(),
});

export const POST = async (request: Request) => {
  try {
    const credits = await getUserCredits();
    if (credits <= 0) {
      return Response.json(
        { message: "Créditos insuficientes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = schema.parse(body);

    const prompt = `
      Baseado no JSON abaixo, avalie todos os campos alterando o conteúdo de todos eles, aprimorando o texto para parecer mais claro e profissional, pois será usado em currículos.
      Também corrija erros gramaticais e de concordância, se necessário.
      Mantenha dados pessoais, links, emails, etc. como estão, apenas altere o texto dos campos.

      **Lembre-se de retornar um JSON válido e bem formatado.**

      **JSON:**

      ${JSON.stringify(content, null, 2)}
    `;

    const json = await generateContent(prompt);

    if (!isValidJSON(json)) throw new Error("JSON inválido.");

    await decrementUserCredits(1);

    return Response.json({ data: JSON.parse(json) });
  } catch (error) {
    return Response.json(
      {
        message: "Ocorreu um erro inesperado.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};