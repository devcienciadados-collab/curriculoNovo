import { formatTailwindHTML } from "@/lib/utils";

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

    // Import dinâmico para evitar problemas de tipos
    const puppeteer = await import('puppeteer');
    const puppeteerCore = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium');

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

    const page = await browser.newPage();
    
    // Configurar timeout
    await page.setDefaultTimeout(20000);
    
    // Carregar conteúdo HTML
    await page.setContent(formatTailwindHTML(html, structure), {
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    // Aguardar renderização
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calcular altura do documento de forma simples
    const bodyHeight = await page.evaluate(() => {
      return document.body.scrollHeight + 20;
    });

    // Gerar PDF
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