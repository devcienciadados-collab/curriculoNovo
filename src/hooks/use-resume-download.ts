import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

export const useResumeDownload = (title?: string) => {
  const { getValues } = useFormContext<ResumeData>();
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadResume = async () => {
    const resume = document.getElementById("resume-content");
    if (!resume) return;

    setIsLoading(true);

    try {
      // Importação dinâmica do html2pdf
      const html2pdf = (await import('html2pdf.js')).default;

      toast({
        title: "Gerando PDF...",
        description: "Aguarde enquanto processamos seu currículo.",
      });

      // Aguardar fontes carregarem
      await document.fonts.ready;
      
      // Configurações otimizadas para preservar layout
      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number], // margens em mm [top, left, bottom, right]
        filename: `${title ?? "Currículo"}.pdf`,
        image: { 
          type: 'jpeg' as const, 
          quality: 0.98 
        },
        html2canvas: {
          scale: 2, // alta qualidade
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          width: resume.scrollWidth,
          height: resume.scrollHeight,
          onclone: (clonedDoc: Document) => {
            // Aplicar estilos específicos para PDF no clone
            const clonedElement = clonedDoc.getElementById('resume-content');
            if (clonedElement) {
              clonedElement.style.cssText += `
                width: 210mm !important;
                max-width: 210mm !important;
                min-height: auto !important;
                padding: 15mm !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                color: black !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                line-height: 1.4 !important;
              `;
              
              // Ajustar todos os elementos filhos
              const allElements = clonedElement.querySelectorAll('*');
              allElements.forEach((el: Element) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.pageBreakInside = 'avoid';
                htmlEl.style.boxSizing = 'border-box';
                
                // Ajustar títulos
                if (htmlEl.tagName.match(/^H[1-6]$/)) {
                  htmlEl.style.marginBottom = '8px';
                  htmlEl.style.marginTop = '12px';
                  htmlEl.style.lineHeight = '1.2';
                  htmlEl.style.fontWeight = '600';
                }
                
                // Ajustar parágrafos
                if (htmlEl.tagName === 'P') {
                  htmlEl.style.marginBottom = '6px';
                  htmlEl.style.lineHeight = '1.4';
                }
                
                // Ajustar seções
                if (htmlEl.tagName === 'SECTION') {
                  htmlEl.style.marginBottom = '16px';
                  htmlEl.style.pageBreakInside = 'avoid';
                }
              });
            }
          }
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy']
        }
      };

      // Gerar e baixar o PDF
      await html2pdf().set(options).from(resume).save();

      toast({
        title: "PDF gerado com sucesso!",
        description: "Seu currículo foi baixado.",
      });

    } catch (error: any) {
      console.error("Download error:", error);
      
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleDownloadResume,
    isLoading,
  };
};

