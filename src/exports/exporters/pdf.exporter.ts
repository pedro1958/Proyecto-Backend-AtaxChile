import * as PDFDocument from 'pdfkit'
import { BaseExporter, ExportResult, MiembroExportRow } from './base.exporter'

type PDFKitDoc = ReturnType<typeof PDFDocument>

export class PdfExporter extends BaseExporter {
  async generate(data: MiembroExportRow[]): Promise<ExportResult> {
    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    this.renderHeader(doc)
    this.renderTable(doc, data)

    doc.end()

    await new Promise<void>((resolve) => {
      doc.on('end', resolve)
    })

    const buffer = Buffer.concat(chunks)

    return {
      buffer,
      filename: `miembros_${new Date().toISOString().split('T')[0]}.pdf`,
      mimeType: 'application/pdf',
    }
  }

  private renderHeader(doc: PDFKitDoc): void {
    doc
      .fontSize(20)
      .fillColor('#1a1a2e')
      .text('AtaxChile', 50, 50, { align: 'center' })

    doc
      .fontSize(14)
      .fillColor('#4a90d9')
      .text('Reporte de Miembros', 50, 80, { align: 'center' })

    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 50, 100, { align: 'center' })

    doc.moveDown(3)
  }

  private renderTable(doc: PDFKitDoc, data: MiembroExportRow[]): void {
    if (data.length === 0) {
      doc.fontSize(12).text('No hay datos para mostrar', { align: 'center' })
      return
    }

    const startX = 30
    let startY = 140

    const pageHeight = doc.page.height - 50
    const rowHeight = 20

    const columns = [
      { key: 'rut', header: 'RUT', width: 80 },
      { key: 'nombre', header: 'Nombre', width: 120 },
      { key: 'email', header: 'Email', width: 100 },
      { key: 'region', header: 'Region', width: 80 },
      { key: 'comuna', header: 'Comuna', width: 80 },
      { key: 'tipoAtaxia', header: 'Tipo Ataxia', width: 80 },
      { key: 'fechaIngreso', header: 'Fecha Ingreso', width: 70 },
      { key: 'estado', header: 'Estado', width: 60 },
    ]

    doc
      .rect(startX, startY - 5, doc.page.width - 60, rowHeight)
      .fill('#1a1a2e')

    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')

    let x = startX + 5
    columns.forEach((col) => {
      doc.text(col.header, x, startY, { width: col.width })
      x += col.width
    })

    startY += rowHeight
    doc.font('Helvetica').fillColor('#1a1a2e')

    data.forEach((row, index) => {
      if (startY + rowHeight > pageHeight) {
        doc.addPage()
        startY = 50
      }

      if (index % 2 === 0) {
        doc
          .rect(startX, startY - 3, doc.page.width - 60, rowHeight)
          .fill('#f5f7ff')
      }

      x = startX + 5
      columns.forEach((col) => {
        const value = row[col.key as keyof MiembroExportRow]
        const displayValue = value === null || value === undefined ? '-' : String(value)
        doc.text(displayValue.substring(0, col.width / 5), x, startY, {
          width: col.width,
        })
        x += col.width
      })

      startY += rowHeight
    })

    const total = data.length
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Total: ${total} miembros`, startX, startY + 20)
  }
}
