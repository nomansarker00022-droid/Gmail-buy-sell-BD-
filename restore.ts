import * as fs from 'fs';
import * as path from 'path';

function listDirRecursive(dir: string, depth = 0) {
  if (depth > 6) return;
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const isDir = fs.statSync(fullPath).isDirectory();
      console.log('  '.repeat(depth) + f + (isDir ? '/' : ''));
      if (isDir) {
        listDirRecursive(fullPath, depth + 1);
      }
    }
  } catch (e: any) {
    // skip
  }
}

listDirRecursive('/.gemini');
