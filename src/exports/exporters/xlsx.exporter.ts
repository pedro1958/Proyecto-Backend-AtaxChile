import * as ExcelJS from 'exceljs';
import { BaseExporter, ExportResult, MiembroExportRow } from './base.exporter';

export class XlsxExporter extends BaseExporter {
  async generate(data: MiembroExportRow[]): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AtaxChile API';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Miembros');

    if (data.length === 0) {
      const bufferResult = await workbook.xlsx.writeBuffer();
      const buffer = Buffer.from(bufferResult as ArrayBuffer);
      return {
        buffer,
        filename: `miembros_${new Date().toISOString().split('T')[0]}.xlsx`,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const headers = Object.keys(data[0]);
    sheet.addRow(headers.map((h) => this.formatHeader(h)));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a1a2e' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.forEach((row) => {
      const values = headers.map((h) => {
        const value = row[h as keyof MiembroExportRow];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      });
      sheet.addRow(values);
    });

    sheet.columns.forEach((column) => {
      column.width = 20;
    });

    const bufferResult = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(bufferResult as ArrayBuffer);

    return {
      buffer,
      filename: `miembros_${new Date().toISOString().split('T')[0]}.xlsx`,
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private formatHeader(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
