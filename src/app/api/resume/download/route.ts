import { formatTailwindHTML } from "@/lib/utils";

import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Configuração para Vercel
export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const isProduction = process.env.NODE_ENV === "production";

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

    // Configuração otimizada para Vercel
    if (isProduction) {
      await chromium.font(
        "https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf"
      );
      
      browser = await puppeteerCore.launch({
        args: [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--single-process",
          "--no-zygote",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
        defaultViewport: { width: 1280, height: 720 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });
    }

    const page = await browser.newPage();
    
    // Configurar timeout e viewport
    await page.setDefaultTimeout(25000);
    await page.setViewport({ width: 1280, height: 720 });

    // Carregar conteúdo HTML com timeout reduzido
    await page.setContent(formatTailwindHTML(html, structure), {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    // Aguardar um pouco para garantir que o CSS seja aplicado
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Gerar PDF com configurações otimizadas
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { 
        top: "0.5in", 
        right: "0.5in", 
        bottom: "0.5in", 
        left: "0.5in" 
      },
      timeout: 20000,
    });

    await page.close();
    await browser.close();

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=curriculo.pdf",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    let errorMessage = "Ocorreu um erro inesperado.";
    let errorDetails = error;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = "Ocorreu um erro inesperado e não serializável.";
      }
    }

    return Response.json(
      {
        message: "Erro ao gerar PDF",
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
};
