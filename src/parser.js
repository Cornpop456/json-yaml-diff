import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

export default function parseFile(resolvedPath) {
  const ext = path.extname(resolvedPath);
  try {
    if (ext === '.yml') {
      const fileObj = yaml.load(fs.readFileSync(resolvedPath));
      return fileObj;
    } if (ext === '.json') {
      const fileObj = JSON.parse(fs.readFileSync(resolvedPath));
      return fileObj;
    }
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }

  return ':(';
}
