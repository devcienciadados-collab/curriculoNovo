import { toast } from "@/components/ui/use-toast";
import { ApiService } from "@/services/api";
import { useMutation } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";

export const useResumeDownload = (title?: string) => {
  const { getValues } = useFormContext<ResumeData>();

  const { mutateAsync: handleGetResumeUrl, isPending } = useMutation({
    mutationFn: ApiService.getResumeUrl,
  });

  const handleDownloadResume = async (retryCount: number = 0) => {
    const resume = document.getElementById("resume-content");

    if (!resume) return;

    const structure = getValues("structure");
    const maxRetries = 2;

    try {
      const url = await handleGetResumeUrl({
        html: resume.outerHTML,
        structure,
      });
  
      if(!url) return;

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title ?? "Currículo"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Download error:", error);
      
      // Retry logic para timeouts
      if (retryCount < maxRetries && (error.code === 'FUNCTION_INVOCATION_TIMEOUT' || error.message?.includes('timeout'))) {
        toast({
          title: "Tentando novamente...",
          description: `Tentativa ${retryCount + 2} de ${maxRetries + 1}`,
        });
        
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        return handleDownloadResume(retryCount + 1);
      }
      
      let message = "Ocorreu um erro inesperado.";

      if (error.response?.data) {
        try {
          const errorData = JSON.parse(await error.response.data.text());
          message = errorData.error || message;
        } catch (e) {
          message = "Erro ao processar a resposta do servidor.";
        }
      } else if (error.request) {
        message = "Sem resposta do servidor. Verifique sua conexão.";
      } else {
        message = error.message || message;
      }
      
      toast({
        title: "Erro ao baixar currículo",
        description: message,
        variant: "destructive",
      });
    }
  };

  const downloadResume = () => handleDownloadResume(0);

  return {
    handleDownloadResume: downloadResume,
    isLoading: isPending,
  };
};

