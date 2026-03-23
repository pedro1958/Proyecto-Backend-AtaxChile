import { BaseExporter, ExportResult, MiembroExportRow } from './base.exporter'

export class CsvExporter extends BaseExporter {
  generate(data: MiembroExportRow[]): ExportResult {
    const headers = Object.keys(data[0] || {})

    const escapeCell = (value: unknown): string => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = data.map((row) =>
      headers.map((h) => escapeCell(row[h as keyof MiembroExportRow])).join(','),
    )

    const csv = [headers.join(','), ...rows].join('\n')
    const buffer = Buffer.from(csv, 'utf-8')

    return {
      buffer,
      filename: `miembros_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv; charset=utf-8',
    }
  }
}
