import { formatTailwindHTML } from "@/lib/utils";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Configuração para Vercel
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export const POST = async (request: Request) => {
  let browser = null;
  
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
    if (process.env.NODE_ENV === "development") {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } else {
      // Configuração para produção no Vercel
      browser = await puppeteerCore.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    }

    const page = await browser.newPage();
    
    // Timeout para evitar travamentos
    await page.setDefaultTimeout(20000);
    
    // Aguardar o conteúdo carregar completamente
    await page.setContent(formatTailwindHTML(html, structure), {
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    // Aguardar fontes e estilos carregarem
    await page.evaluateHandle('document.fonts.ready');

    const bodyHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      ) + 20;
    });

    const pdf = await page.pdf({
      width: "210mm",
      height: `${bodyHeight}px`,
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-cache"
      }
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return Response.json(
      { 
        message: "Erro ao gerar PDF", 
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
}