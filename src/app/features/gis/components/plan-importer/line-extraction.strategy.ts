import DxfParser from 'dxf-parser';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js usando CDN para evitar problemas de empaquetado
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// OpenCV.js se carga globalmente a través de un script en index.html
declare var cv: any;

export interface ExtractedLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LineExtractionStrategy {
  extractLines(file: File): Promise<ExtractedLine[]>;
}

// ESTRATEGIA PARA ARCHIVOS CAD (.DXF) - Usando dxf-parser
export class CadExtractionStrategy implements LineExtractionStrategy {
  async extractLines(file: File): Promise<ExtractedLine[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const parser = new DxfParser();
          const dxf = parser.parseSync(text);
          const lines: ExtractedLine[] = [];
          
          if (dxf && dxf.entities) {
            dxf.entities.forEach((entity: any) => {
              if (entity.type === 'LINE') {
                lines.push({
                  x1: entity.vertices[0].x,
                  y1: entity.vertices[0].y,
                  x2: entity.vertices[1].x,
                  y2: entity.vertices[1].y
                });
              } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
                for (let i = 0; i < entity.vertices.length - 1; i++) {
                   lines.push({
                     x1: entity.vertices[i].x,
                     y1: entity.vertices[i].y,
                     x2: entity.vertices[i+1].x,
                     y2: entity.vertices[i+1].y
                   });
                }
              }
            });
          }
          resolve(lines);
        } catch (err) {
          reject(new Error('Error parseando DXF: ' + (err as Error).message));
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo CAD'));
      reader.readAsText(file);
    });
  }
}

// ESTRATEGIA PARA ARCHIVOS PDF (RASTER) - Usando pdfjs-dist + OpenCV.js
export class PdfExtractionStrategy implements LineExtractionStrategy {
  async extractLines(file: File): Promise<ExtractedLine[]> {
    return new Promise(async (resolve, reject) => {
      try {
        if (typeof cv === 'undefined') {
            throw new Error("OpenCV.js no está cargado. Añade <script src='https://docs.opencv.org/4.5.0/opencv.js'></script> en index.html");
        }

        const fileURL = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument({ url: fileURL });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // Extraemos líneas de la página 1
        
        const scale = 2.0; // Renderizamos con más resolución para mejor detección
        const viewport = page.getViewport({ scale: scale });
        
        // 1. Renderizar PDF a un canvas oculto
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error("No se pudo crear el contexto del canvas");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          canvas: canvas,
          viewport: viewport
        };
        await page.render(renderContext).promise;
        
        // 2. Procesar con OpenCV.js
        let src = cv.imread(canvas);
        let dst = new cv.Mat();
        
        // Convertir a escala de grises
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
        // Detección de bordes Canny
        cv.Canny(src, dst, 50, 200, 3, false);
        
        // Transformada de Hough probabilística
        let linesMat = new cv.Mat();
        // Parámetros: imagen, salida, rho, theta, threshold, minLineLength, maxLineGap
        cv.HoughLinesP(dst, linesMat, 1, Math.PI / 180, 50, 50, 10);
        
        const lines: ExtractedLine[] = [];
        for (let i = 0; i < linesMat.rows; ++i) {
            lines.push({
                x1: linesMat.data32S[i * 4],
                y1: linesMat.data32S[i * 4 + 1],
                x2: linesMat.data32S[i * 4 + 2],
                y2: linesMat.data32S[i * 4 + 3]
            });
        }
        
        // Limpiar memoria de WebAssembly
        src.delete(); 
        dst.delete(); 
        linesMat.delete();
        URL.revokeObjectURL(fileURL);
        
        resolve(lines);
      } catch (err) {
        reject(err);
      }
    });
  }
}

// CONTEXTO
export class PlanExtractorContext {
  private strategy: LineExtractionStrategy;

  constructor(fileName: string) {
    const nameLower = fileName.toLowerCase();
    if (nameLower.endsWith('.dxf') || nameLower.endsWith('.dwg')) {
      this.strategy = new CadExtractionStrategy();
    } else if (nameLower.endsWith('.pdf')) {
      this.strategy = new PdfExtractionStrategy();
    } else {
      throw new Error('Formato no soportado. Sube un archivo CAD (.dxf) o PDF.');
    }
  }

  public setStrategy(strategy: LineExtractionStrategy) {
    this.strategy = strategy;
  }

  public executeExtraction(file: File): Promise<ExtractedLine[]> {
    return this.strategy.extractLines(file);
  }
}
