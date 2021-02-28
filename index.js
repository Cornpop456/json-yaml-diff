import path from 'path';

import parseFile from './src/parser.js';
import {
  getDiffArray, diffArrayToString, diffArrayToPlain, diffArrayToJSON,
} from './src/gendiff.js';

const genDiff = (filepath1, filepath2, style = 'stylish') => {
  const resolvedPath1 = path.resolve(process.cwd(), filepath1);
  const resolvedPath2 = path.resolve(process.cwd(), filepath2);

  const file1Obj = parseFile(resolvedPath1);
  const file2Obj = parseFile(resolvedPath2);

  if (style === 'plain') {
    return diffArrayToPlain(getDiffArray(file1Obj, file2Obj)).trimEnd();
  }

  if (style === 'json') {
    return JSON.parse(diffArrayToJSON(getDiffArray(file1Obj, file2Obj)));
  }

  if (style !== 'stylish') {
    return 'Unknown format: please use "plain" or "stylish"';
  }

  return diffArrayToString(getDiffArray(file1Obj, file2Obj));
};

export default genDiff;
