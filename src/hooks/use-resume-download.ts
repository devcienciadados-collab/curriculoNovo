import { toast } from "@/components/ui/use-toast";
import { ApiService } from "@/services/api";
import { useMutation } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";

export const useResumeDownload = (title?: string) => {
  const { getValues } = useFormContext<ResumeData>();

  const { mutateAsync: handleGetResumeUrl, isPending } = useMutation({
    mutationFn: ApiService.getResumeUrl,
  });

  const handleDownloadResume = async () => {
    const resume = document.getElementById("resume-content");

    if (!resume) return;

    const structure = getValues("structure");

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
      let message = "Ocorreu um erro inesperado.";

      if (error.response?.data) {
        try {
          const errorData = JSON.parse(await error.response.data.text());
          message = errorData.error || message;
        } catch (e) {
          // Ignore json parse error
        }
      }
      
      toast({
        title: "Erro ao baixar currículo",
        description: message,
        variant: "destructive",
      });
    }
  };

  return {
    handleDownloadResume,
    isLoading: isPending,
  };
};

