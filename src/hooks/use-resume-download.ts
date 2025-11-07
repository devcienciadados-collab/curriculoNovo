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

      // Captura o elemento como canvas
      const canvas = await html2canvas(resume, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: resume.scrollWidth,
        height: resume.scrollHeight,
      });

      // Cria o PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
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

