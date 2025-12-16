import html2pdf from 'html2pdf.js'
import QRCode from 'qrcode'
import { ref } from 'vue'

interface PDFExportOptions {
  filename?: string
  reportNumber?: string
  reportDate?: string
  projectName?: string
  wellCode?: string
  reportUrl?: string
}

export function usePrintReport() {
  const isExporting = ref(false)
  const exportProgress = ref(0)

  /**
   * Genera un código QR para el reporte
   */
  const generateQRCode = async (url: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(url, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
    }
    catch (error) {
      console.error('Error generating QR code:', error)

      return ''
    }
  }

  /**
   * Exporta el reporte a PDF con configuración profesional
   */
  const exportToPDF = async (
    element: HTMLElement,
    options: PDFExportOptions = {},
  ): Promise<void> => {
    isExporting.value = true
    exportProgress.value = 0

    try {
      const {
        filename = 'Reporte_Perforacion.pdf',
        reportNumber = '',
        reportDate = '',
        projectName = '',
        wellCode = '',
      } = options

      // Configuración de html2pdf.js para calidad enterprise
      const opt = {
        margin: [8, 8, 12, 8], // Top, Right, Bottom, Left (mm) - Reducidos
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2, // Alta resolución
          useCORS: true,
          logging: false,
          letterRendering: true,
          windowWidth: 1100, // Match del max-width del componente
        },
        jsPDF: {
          unit: 'mm',
          format: 'letter', // 8.5" x 11"
          orientation: 'portrait',
          compress: true,
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['.no-page-break', '.section', '.data-table', '.cdk-form-table'],
        },
      }

      exportProgress.value = 30

      // Crear el PDF con metadatos profesionales
      const worker = html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then((pdf: any) => {
          exportProgress.value = 70

          // Agregar metadatos del documento
          pdf.setProperties({
            title: `Reporte de Perforación ${reportNumber}`,
            subject: `Proyecto: ${projectName} - Pozo: ${wellCode}`,
            author: 'Sistema de Reportes de Perforación',
            keywords: 'drilling, perforación, reporte, diamantina, minería',
            creator: 'DrillingReports Module',
          })

          // Agregar numeración de páginas en el footer
          const totalPages = pdf.internal.getNumberOfPages()
          const pageWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()

          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i)
            pdf.setFontSize(8)
            pdf.setTextColor(100)

            // Footer: Página X de Y
            const pageText = `Página ${i} de ${totalPages}`
            const textWidth = pdf.getTextWidth(pageText)

            pdf.text(pageText, (pageWidth - textWidth) / 2, pageHeight - 7)

            // Footer: Fecha de generación
            const generatedDate = new Date().toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })

            const dateText = `Generado: ${generatedDate}`

            pdf.setFontSize(7)
            pdf.text(dateText, 10, pageHeight - 7)

            // Footer right: Report number
            if (reportNumber) {
              const reportText = `Reporte No. ${reportNumber}`
              const reportTextWidth = pdf.getTextWidth(reportText)

              pdf.text(reportText, pageWidth - reportTextWidth - 10, pageHeight - 7)
            }
          }

          exportProgress.value = 90
        })

      await worker.save()
      exportProgress.value = 100
    }
    catch (error) {
      console.error('Error exporting to PDF:', error)
      throw new Error('Error al exportar el PDF. Por favor, intente nuevamente.')
    }
    finally {
      setTimeout(() => {
        isExporting.value = false
        exportProgress.value = 0
      }, 1000)
    }
  }

  /**
   * Preparar el documento para impresión
   */
  const preparePrintDocument = (element: HTMLElement): void => {
    // Agregar clase temporal para estilos de impresión
    element.classList.add('print-ready')

    // Forzar renderizado antes de imprimir
    setTimeout(() => {
      window.print()

      // Remover clase después de imprimir
      setTimeout(() => {
        element.classList.remove('print-ready')
      }, 100)
    }, 100)
  }

  /**
   * Obtener dimensiones recomendadas para papel carta
   */
  const getLetterPageDimensions = () => ({
    width: 816, // 8.5" * 96 dpi = 816px
    height: 1056, // 11" * 96 dpi = 1056px
    aspectRatio: 8.5 / 11,
    margins: {
      top: 38, // ~10mm
      right: 38,
      bottom: 57, // ~15mm (más espacio para footer)
      left: 38,
    },
  })

  return {
    isExporting,
    exportProgress,
    generateQRCode,
    exportToPDF,
    preparePrintDocument,
    getLetterPageDimensions,
  }
}
