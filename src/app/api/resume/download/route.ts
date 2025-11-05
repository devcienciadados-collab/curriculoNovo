import { formatTailwindHTML } from "@/lib/utils";

// Configuração para Vercel
export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { html, structure } = body;

    if (!html || !structure) {
      return Response.json(
        { message: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    // Import dinâmico para evitar problemas de tipos
    const puppeteer = await import('puppeteer');
    const puppeteerCore = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium');

    let browser;

    // Configuração para desenvolvimento e produção
    if (process.env.NODE_ENV === "development") {
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } else {
      // Configuração otimizada para Vercel
      browser = await puppeteerCore.default.launch({
        args: [
          ...chromium.default.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote'
        ],
        defaultViewport: chromium.default.defaultViewport,
        executablePath: await chromium.default.executablePath(),
        headless: chromium.default.headless,
      });
    }

    try {
      const page = await browser.newPage();
      
      // Carregar conteúdo HTML com timeout reduzido
      await page.setContent(formatTailwindHTML(html, structure), {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      // Aguardar renderização
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Gerar PDF com altura fixa para evitar problemas de cálculo
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
      });

      await browser.close();

      return new Response(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "no-cache",
          "Content-Disposition": "attachment; filename=curriculo.pdf"
        }
      });

    } catch (pageError) {
      await browser.close();
      throw pageError;
    }

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return Response.json(
      { 
        message: "Erro ao gerar PDF", 
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}