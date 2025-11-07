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
      // Importação dinâmica para reduzir bundle
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      toast({
        title: "Gerando PDF...",
        description: "Aguarde enquanto processamos seu currículo.",
      });

      // Preparar o DOM para captura
      const originalStyle = resume.style.cssText;
      
      // Aplicar estilos temporários para melhor renderização
      resume.style.cssText = `
        ${originalStyle}
        position: relative !important;
        z-index: 999 !important;
        background: white !important;
        width: 794px !important;
        min-height: auto !important;
        padding: 20px !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        transform: none !important;
      `;
      
      // Aguardar fontes e layout
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Forçar reflow
      resume.offsetHeight;
      
      // Captura o elemento como canvas com configurações otimizadas
      const canvas = await html2canvas(resume, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: resume.offsetWidth,
        height: resume.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: resume.offsetWidth,
        windowHeight: resume.offsetHeight,
        onclone: (clonedDoc) => {
          // Garantir que estilos sejam aplicados no clone
          const clonedElement = clonedDoc.getElementById('resume-content');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.width = resume.offsetWidth + 'px';
            clonedElement.style.height = 'auto';
          }
        }
      });
      
      // Restaurar estilo original
      resume.style.cssText = originalStyle;

      // Cria o PDF com margens adequadas
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensões mantendo proporção
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      // Centralizar na página
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      
      // Download do PDF
      pdf.save(`${title ?? "Currículo"}.pdf`);

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

