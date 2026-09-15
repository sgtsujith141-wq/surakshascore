import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      results.push(filePath);
    }
  }
  return results;
}

describe('Core Module Isolation (Task 14 & Architecture Quality)', () => {
  const coreDir = path.resolve(__dirname, '../../src/core');

  it('verifies src/core has ZERO imports from UI, Capacitor, native plugins or browser globals', () => {
    const files = getFilesRecursively(coreDir);
    expect(files.length).toBeGreaterThan(0);

    const forbiddenImports = [
      'react',
      'react-dom',
      '@capacitor',
      'lucide-react',
      '@supabase',
    ];

    const forbiddenTokens = [
      'window.',
      'document.',
      'localStorage',
      'sessionStorage',
      'navigator.',
    ];

    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;

        // Check forbidden package imports
        for (const forbidden of forbiddenImports) {
          if (line.includes(`from '${forbidden}`) || line.includes(`from "${forbidden}`)) {
            violations.push(`${path.basename(file)}:L${i + 1} imports "${forbidden}"`);
          }
        }

        // Check forbidden browser globals
        for (const token of forbiddenTokens) {
          if (line.includes(token)) {
            violations.push(`${path.basename(file)}:L${i + 1} references browser global "${token}"`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
