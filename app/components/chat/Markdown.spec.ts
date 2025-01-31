import { describe, expect, it } from 'vitest';
import { stripCodeFenceFromArtifact } from './Markdown';

describe('stripCodeFenceFromArtifact', () => {
  it('debería eliminar los delimitadores de código alrededor del elemento de artefacto', () => {
    const input = "```xml\n<div class='__boltArtifact__'></div>\n```";
    const expected = "\n<div class='__boltArtifact__'></div>\n";
    expect(stripCodeFenceFromArtifact(input)).toBe(expected);
  });

  it('debería manejar delimitadores de código con especificación de lenguaje', () => {
    const input = "```typescript\n<div class='__boltArtifact__'></div>\n```";
    const expected = "\n<div class='__boltArtifact__'></div>\n";
    expect(stripCodeFenceFromArtifact(input)).toBe(expected);
  });

  it('no debería modificar contenido sin artefactos', () => {
    const input = '```\nbloque de código regular\n```';
    expect(stripCodeFenceFromArtifact(input)).toBe(input);
  });

  it('debería manejar entradas vacías', () => {
    expect(stripCodeFenceFromArtifact('')).toBe('');
  });

  it('debería manejar artefactos sin delimitadores de código', () => {
    const input = "<div class='__boltArtifact__'></div>";
    expect(stripCodeFenceFromArtifact(input)).toBe(input);
  });

  it('debería manejar múltiples artefactos pero solo eliminar los delimitadores alrededor de ellos', () => {
    const input = [
      'Algunos textos',
      '```typescript',
      "<div class='__boltArtifact__'></div>",
      '```',
      '```',
      'Código regular',
      '```',
    ].join('\n');

    const expected = [
      'Algunos textos',
      '',
      "<div class='__boltArtifact__'></div>",
      '',
      '```',
      'Código regular',
      '```',
    ].join('\n');

    expect(stripCodeFenceFromArtifact(input)).toBe(expected);
  });
});
