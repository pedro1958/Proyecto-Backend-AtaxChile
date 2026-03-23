import { normalizarRut, validarRut } from './rut.validator';

// ── Casos de RUTs válidos utilizados en los tests ───────────────────────────
// Verificación de cada uno:
//   11111111-1 → suma=32, 32%11=10, 11-10=1  → DV='1' ✓
//   22222222-2 → suma=64, 64%11=9,  11-9=2   → DV='2' ✓
//   1234578-K  → suma=111, 111%11=1, 11-1=10  → DV='K' ✓
//   14-0       → suma=11, 11%11=0,  11-0=11  → DV='0' ✓

describe('normalizarRut', () => {
  it('conserva el formato correcto sin cambios', () => {
    expect(normalizarRut('11111111-1')).toBe('11111111-1');
  });

  it('elimina puntos y mantiene guion', () => {
    expect(normalizarRut('11.111.111-1')).toBe('11111111-1');
  });

  it('agrega guion si viene sin él', () => {
    expect(normalizarRut('111111111')).toBe('11111111-1');
  });

  it('convierte dv k minúscula a K mayúscula', () => {
    expect(normalizarRut('1234578-k')).toBe('1234578-K');
  });

  it('elimina puntos y guion, y reinserta el guion', () => {
    expect(normalizarRut('12.345.678-9')).toBe('12345678-9');
  });

  it('retorna cadena vacía si el valor no es string', () => {
    expect(normalizarRut(null)).toBe('');
    expect(normalizarRut(undefined)).toBe('');
    expect(normalizarRut(123456789)).toBe('');
  });

  it('retorna cadena vacía si el valor es muy corto', () => {
    expect(normalizarRut('')).toBe('');
    expect(normalizarRut('1')).toBe('');
  });
});

describe('validarRut', () => {
  describe('RUTs válidos', () => {
    it('valida un RUT con DV numérico normal', () => {
      expect(validarRut('11111111-1')).toBe(true);
    });

    it('valida un RUT distinto con DV numérico', () => {
      expect(validarRut('22222222-2')).toBe(true);
    });

    it('valida un RUT con DV igual a K', () => {
      expect(validarRut('1234578-K')).toBe(true);
    });

    it('valida un RUT con DV igual a 0', () => {
      expect(validarRut('14-0')).toBe(true);
    });

    it('acepta formato con puntos', () => {
      expect(validarRut('11.111.111-1')).toBe(true);
    });

    it('acepta formato sin guion', () => {
      expect(validarRut('111111111')).toBe(true);
    });

    it('acepta K minúscula', () => {
      expect(validarRut('1234578-k')).toBe(true);
    });
  });

  describe('RUTs inválidos', () => {
    it('rechaza un RUT con DV incorrecto', () => {
      expect(validarRut('11111111-2')).toBe(false);
    });

    it('rechaza un RUT con K como DV cuando no corresponde', () => {
      expect(validarRut('11111111-K')).toBe(false);
    });

    it('rechaza un RUT con 0 como DV cuando no corresponde', () => {
      expect(validarRut('11111111-0')).toBe(false);
    });

    it('rechaza una cadena de texto arbitraria', () => {
      expect(validarRut('no-es-un-rut')).toBe(false);
    });

    it('rechaza cadena vacía', () => {
      expect(validarRut('')).toBe(false);
    });

    it('rechaza valores no string', () => {
      expect(validarRut(null)).toBe(false);
      expect(validarRut(undefined)).toBe(false);
      expect(validarRut(11111111)).toBe(false);
    });

    it('rechaza RUT con cuerpo igual a cero', () => {
      expect(validarRut('0-0')).toBe(false);
    });

    it('rechaza RUT con caracteres inválidos en el cuerpo', () => {
      expect(validarRut('1234ABC-5')).toBe(false);
    });
  });
});
