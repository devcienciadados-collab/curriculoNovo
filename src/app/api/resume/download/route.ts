import { formatTailwindHTML } from "@/lib/utils";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Configuração para Vercel
export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = async (request: Request) => {
  let browser;

  try {
    const body = await request.json();
    const { html, structure } = body;

    if (!html || !structure) {
      return Response.json(
        { message: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    // Configuração para desenvolvimento e produção
    if (process.env.NODE_ENV === "development") {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    } else {
      // Configuração otimizada para Vercel
      browser = await puppeteerCore.launch({
        args: [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--single-process",
          "--no-zygote",
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    }

    const page = await browser.newPage();

    // Carregar conteúdo HTML
    await page.setContent(formatTailwindHTML(html, structure), {
      waitUntil: "networkidle0",
    });

    // Gerar PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
    });

    await browser.close();

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    if (browser) {
      await browser.close();
    }

    console.error("PDF Generation Error:", error);
    return Response.json(
      {
        message: "Erro ao gerar PDF",
        error:
          error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
      },
      { status: 500 }
    );
  }
};
