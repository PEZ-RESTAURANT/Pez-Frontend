export class ValidatorsUtil {
  static required(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  static min(value: number, min: number): boolean {
    return value >= min;
  }

  static max(value: number, max: number): boolean {
    return value <= max;
  }

  static isPositive(value: number): boolean {
    return value > 0;
  }

  static isValidDni(dni: string): boolean {
    return /^\d{8}$/.test(dni);
  }

  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
