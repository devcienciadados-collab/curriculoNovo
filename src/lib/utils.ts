import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import colors from "tailwindcss/colors"
import tailwindConfig from "../../tailwind.config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const sectionIsEmpty = (
  section: ResumeSections,
  data: ResumeContentData
) => {
  switch (section) {
    case "summary":
      return data.summary === "" || data.summary === "<p></p>";
    default:
      return data[section].length === 0;
  }
};

export const formatTailwindHTML = (
  html: string,
  structure: ResumeStructureData,
) => {
  const colorKey = structure.colorTheme as keyof typeof colors;
  const primaryColor = colors[colorKey]?.[500] || colors.blue[500];

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          :root {
            --resume-primary: ${primaryColor};
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, sans-serif;
          }
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        </style>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: "var(--resume-primary)"
                }
              }
            }
          };
        </script>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
}

export const isValidJSON = (json: string) => {
  try {
    JSON.parse(json);
    return true;
  } catch (error) {
    return false;
  }
}