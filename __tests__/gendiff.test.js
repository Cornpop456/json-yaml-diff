import { test, expect } from '@jest/globals';

import { getDiffArray } from '../src/gendiff.js';

test('getDiffArray', () => {
  const testCases = [
    [{ }, { }],
    [{ a: 1 }, { a: 1 }],
    [{ a: 1 }, { a: 2 }],
    [{ }, { a: 1 }],
    [{ a: 1 }, { }],
    [{ a: {} }, { a: { b: 123 } }],
  ];

  const expected = [
    [],
    [{ propName: 'a', info: { propChain: [], valueBefore: 1, valueAfter: 1 } }],
    [{ propName: 'a', info: { propChain: [], valueBefore: 1, valueAfter: 2 } }],
    [{ propName: 'a', info: { propChain: [], valueBefore: null, valueAfter: 1 } }],
    [{ propName: 'a', info: { propChain: [], valueBefore: 1, valueAfter: null } }],
    [{
      propName: 'a',
      info: {
        propChain: [],
        innerArr: [{
          propName: 'b',
          info: {
            propChain: ['a'],
            valueAfter: 123,
            valueBefore: null,
          },
        }],
      },
    }],
  ];

  testCases.forEach((testData, index) => {
    expect(getDiffArray(...testData)).toEqual(expected[index]);
  });
});
