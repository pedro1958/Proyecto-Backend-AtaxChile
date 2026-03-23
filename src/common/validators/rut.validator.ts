import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// ── 1. Normalización ────────────────────────────────────────────────────────
// Acepta cualquier formato de entrada:
//   "12345678-9"  → "12345678-9"
//   "12.345.678-9"→ "12345678-9"
//   "123456789"   → "12345678-9"
//   "12345678K"   → "12345678-K"
export function normalizarRut(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const limpio = raw.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  if (limpio.length < 2) return '';
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${cuerpo}-${dv}`;
}

// ── 2. Algoritmo módulo 11 ──────────────────────────────────────────────────
// Retorna true si el RUT (en cualquier formato) es válido.
export function validarRut(rut: unknown): boolean {
  const normalizado = normalizarRut(rut);
  const partes = normalizado.split('-');
  if (partes.length !== 2) return false;

  const [cuerpo, dv] = partes;

  if (!/^\d+$/.test(cuerpo)) return false;
  if (!/^[\dK]$/.test(dv)) return false;
  if (parseInt(cuerpo, 10) < 1) return false;

  const digitos = cuerpo.split('').reverse().map(Number);
  const serie = [2, 3, 4, 5, 6, 7];
  const suma = digitos.reduce((acc, d, i) => acc + d * serie[i % 6], 0);
  const resultado = 11 - (suma % 11);

  let dvEsperado: string;
  if (resultado === 11) dvEsperado = '0';
  else if (resultado === 10) dvEsperado = 'K';
  else dvEsperado = String(resultado);

  return dv === dvEsperado;
}

// ── 3. Constraint para class-validator ──────────────────────────────────────
@ValidatorConstraint({ name: 'isRutValido', async: false })
export class IsRutValidoConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return validarRut(value);
  }

  defaultMessage(): string {
    return 'El RUT ingresado no es válido';
  }
}

// ── 4. Decorador listo para usar en DTOs ────────────────────────────────────
export function IsRutValido(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsRutValidoConstraint,
    });
  };
}

// ── 5. Transform de normalización ───────────────────────────────────────────
// Usar ANTES de @IsRutValido() en el DTO para normalizar la entrada.
// Permite que el usuario envíe "12.345.678-9" y se almacene "12345678-9".
export const TransformRut = () =>
  Transform(({ value }) => normalizarRut(value));
