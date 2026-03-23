export interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface MiembroExportRow {
  rut: string;
  nombre: string;
  email: string | null;
  celular: string | null;
  region: string | null;
  comuna: string | null;
  tipoAtaxia: string | null;
  fechaIngreso: string;
  estado: string;
  diagnostico?: {
    confirmacion: string;
    institucion: string | null;
    medico: string | null;
    fechaDiagnostico: string | null;
  };
  ultimaEvaluacion?: {
    fecha: string;
    nivelMovilidad: string;
    puntuacionSara: number | null;
    disartria: boolean;
    disfagia: boolean;
    nistagmo: boolean;
  };
}

export abstract class BaseExporter {
  abstract generate(
    data: MiembroExportRow[],
  ): ExportResult | Promise<ExportResult>;
}
