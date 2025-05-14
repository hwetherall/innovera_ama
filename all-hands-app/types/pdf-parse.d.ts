declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      [key: string]: string | boolean | number;
    };
    metadata: Record<string, string | boolean | number>;
    version: string;
  }

  function PDFParse(dataBuffer: Buffer, options?: { pagerender?: (pageData: { getTextContent: () => Promise<{ items: Array<{ str: string }> }> }) => string }): Promise<PDFData>;
  export = PDFParse;
} 