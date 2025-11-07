// Configuração para Vercel (plano gratuito)
export const maxDuration = 10;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { html } = body;

    if (!html) {
      return Response.json(
        { message: "HTML não fornecido" },
        { status: 400 }
      );
    }

    // Retorna o HTML limpo para processamento no frontend
    return Response.json({ 
      success: true,
      html: html 
    });
    
  } catch (error) {
    console.error("PDF Generation Error:", error);
    
    return Response.json(
      {
        message: "Erro ao processar PDF",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
};
