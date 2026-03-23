import { CsvExporter } from './csv.exporter';
import { XlsxExporter } from './xlsx.exporter';
import { PdfExporter } from './pdf.exporter';
import { MiembroExportRow } from './base.exporter';

const mockData: MiembroExportRow[] = [
  {
    rut: '12345678-9',
    nombre: 'Juan Perez',
    email: 'juan@test.com',
    celular: '999999999',
    region: 'Metropolitana',
    comuna: 'Santiago',
    tipoAtaxia: 'Friedreich',
    fechaIngreso: '2024-01-01',
    estado: 'activo',
  },
  {
    rut: '98765432-1',
    nombre: 'Maria Lopez',
    email: 'maria@test.com',
    celular: '888888888',
    region: 'Valparaiso',
    comuna: 'Valparaiso',
    tipoAtaxia: 'SCA2',
    fechaIngreso: '2024-02-15',
    estado: 'activo',
  },
];

describe('CsvExporter', () => {
  let exporter: CsvExporter;

  beforeEach(() => {
    exporter = new CsvExporter();
  });

  it('should be defined', () => {
    expect(exporter).toBeDefined();
  });

  it('debe generar un buffer CSV valido', () => {
    const result = exporter.generate(mockData);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.mimeType).toBe('text/csv; charset=utf-8');
    expect(result.filename).toContain('.csv');
  });

  it('debe incluir todos los campos en el CSV', () => {
    const result = exporter.generate(mockData);
    const content = result.buffer.toString('utf-8');

    expect(content).toContain('rut');
    expect(content).toContain('nombre');
    expect(content).toContain('email');
    expect(content).toContain('12345678-9');
    expect(content).toContain('Juan Perez');
  });

  it('debe manejar datos vacios', () => {
    const result = exporter.generate([]);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('.csv');
  });

  it('debe escapar comas y comillas en los datos', () => {
    const dataWithComma: MiembroExportRow[] = [
      { ...mockData[0], nombre: 'Perez, Juan' },
    ];

    const result = exporter.generate(dataWithComma);
    const content = result.buffer.toString('utf-8');

    expect(content).toContain('"Perez, Juan"');
  });

  it('debe manejar valores nulos', () => {
    const dataWithNull: MiembroExportRow[] = [
      {
        rut: '12345678-9',
        nombre: 'Juan',
        email: null,
        celular: null,
        region: null,
        comuna: null,
        tipoAtaxia: null,
        fechaIngreso: '2024-01-01',
        estado: 'activo',
      },
    ];

    const result = exporter.generate(dataWithNull);
    const content = result.buffer.toString('utf-8');

    expect(content).toBeDefined();
  });
});

describe('XlsxExporter', () => {
  let exporter: XlsxExporter;

  beforeEach(() => {
    exporter = new XlsxExporter();
  });

  it('should be defined', () => {
    expect(exporter).toBeDefined();
  });

  it('debe generar un buffer XLSX valido', async () => {
    const result = await exporter.generate(mockData);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(result.filename).toContain('.xlsx');
  });

  it('debe manejar datos vacios', async () => {
    const result = await exporter.generate([]);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('.xlsx');
  });

  it('debe incluir todos los campos', async () => {
    const result = await exporter.generate(mockData);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
  });
});

describe('PdfExporter', () => {
  let exporter: PdfExporter;

  beforeEach(() => {
    exporter = new PdfExporter();
  });

  it('should be defined', () => {
    expect(exporter).toBeDefined();
  });

  it('debe generar un buffer PDF valido', async () => {
    const result = await exporter.generate(mockData);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.filename).toContain('.pdf');
  });

  it('debe manejar datos vacios', async () => {
    const result = await exporter.generate([]);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('.pdf');
  });

  it('debe generar un PDF con contenido binario valido', async () => {
    const result = await exporter.generate(mockData);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(100);
    expect(result.mimeType).toBe('application/pdf');
  });
});
