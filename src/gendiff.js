import _ from 'lodash';

import { quotesIfString, complexValueCheck, normalizeNull } from './utils.js';

export const getDiffArray = (file1Obj, file2Obj, propChain = []) => {
  const entriesFile1 = Object.entries(file1Obj);
  const entriesFile2 = Object.entries(file2Obj);

  const diffArray = entriesFile1
    .map(([prop, value]) => {
      if (_.has(file2Obj, prop)) {
        if (_.isEqual(value, file2Obj[prop])) {
          if ((!Array.isArray(value) && _.isObjectLike(value))) {
            return {
              propName: prop,
              info: {
                innerArr: getDiffArray(value, file2Obj[prop], propChain.concat(prop)),
              },
            };
          }

          return { propName: prop, info: { propChain, valueBefore: value, valueAfter: value } };
        }

        if ((!Array.isArray(value) && _.isObjectLike(value))
        && (!Array.isArray(value) && _.isObjectLike(file2Obj[prop]))) {
          return {
            propName: prop,
            info: {
              innerArr: getDiffArray(value, file2Obj[prop], propChain.concat(prop)),
            },
          };
        }

        const valueBefore = normalizeNull(value);
        const valueAfter = normalizeNull(file2Obj[prop]);

        if (!Array.isArray(valueBefore) && _.isObjectLike(valueBefore)) {
          return {
            propName: prop,
            info:
            {
              propChain,
              innerSignArr: getDiffArray(valueBefore, valueBefore, propChain.concat(prop)),
              valueAfter,
            },
          };
        }

        if (!Array.isArray(valueAfter) && _.isObjectLike(valueAfter)) {
          return {
            propName: prop,
            info:
            {
              propChain,
              innerSignArr: getDiffArray(valueAfter, valueAfter, propChain.concat(prop)),
              valueBefore,
            },
          };
        }

        return {
          propName: prop,
          info: { propChain, valueBefore, valueAfter },
        };
      }

      const valueBefore = normalizeNull(value);

      if (!Array.isArray(value) && _.isObjectLike(value)) {
        return {
          propName: prop,
          info:
          {
            propChain,
            sign: '-',
            innerSignArr: getDiffArray(value, value, propChain.concat(prop)),
          },
        };
      }

      return { propName: prop, info: { propChain, valueBefore, valueAfter: null } };
    })
    .concat(entriesFile2
      .filter(([prop]) => !_.has(file1Obj, prop))
      .map(([prop, value]) => {
        const valueAfter = normalizeNull(value);

        if (!Array.isArray(value) && _.isObjectLike(value)) {
          return {
            propName: prop,
            info:
            {
              propChain,
              sign: '+',
              innerSignArr: getDiffArray(value, value, propChain.concat(prop)),
            },
          };
        }

        return ({
          propName: prop,
          info: { propChain, valueBefore: null, valueAfter },
        });
      }));

  const sortedDiffArray = _.sortBy(diffArray, ({ propName }) => propName.toUpperCase());

  return sortedDiffArray;
};

export const diffArrayToString = (diffArray, layer = 1) => {
  const spaceLastIndent = ' '.repeat(4 * (layer - 1));
  const spacesNorm = ' '.repeat(layer * 4);
  const len = ' '.repeat(layer * 4).length;
  const spaceSign = ' '.repeat(layer * 4).slice(0, len - 2);

  return diffArray.reduce((acc,
    {
      propName, info: {
        valueBefore: before, valueAfter: after, innerArr, innerSignArr, sign,
      },
    }) => {
    let valueBefore = before;
    let valueAfter = after;

    if (Array.isArray(before)) {
      valueBefore = JSON.stringify(before)
        .replace(/,/g, ', ')
        .replace(/:/g, ': ');
    }

    if (Array.isArray(after)) {
      valueAfter = JSON.stringify(after)
        .replace(/,/g, ', ')
        .replace(/:/g, ': ');
    }

    if (innerSignArr) {
      if (valueBefore) {
        return acc
          .concat(`${spaceSign}- ${propName}: ${valueBefore}\n`)
          .concat(`${spaceSign}+ ${propName}: ${diffArrayToString(innerSignArr, layer + 1)}\n`);
      }

      if (valueAfter) {
        return acc
          .concat(`${spaceSign}- ${propName}: ${diffArrayToString(innerSignArr, layer + 1)}\n`)
          .concat(`${spaceSign}+ ${propName}: ${valueAfter}\n`);
      }

      return acc.concat(`${spaceSign}${sign} ${propName}: ${diffArrayToString(innerSignArr, layer + 1)}\n`);
    } if (innerArr) {
      return acc.concat(`${spacesNorm}${propName}: ${diffArrayToString(innerArr, layer + 1)}\n`);
    } if (_.isEqual(valueBefore, valueAfter)) {
      return acc
        .concat(`${spacesNorm}${propName}: ${valueBefore}\n`);
    } if (_.isNull(valueBefore)) {
      return acc
        .concat(`${spaceSign}+ ${propName}: ${valueAfter}\n`);
    } if (_.isNull(valueAfter)) {
      return acc
        .concat(`${spaceSign}- ${propName}: ${valueBefore}\n`);
    }

    return acc.concat(`${spaceSign}- ${propName}: ${valueBefore}\n`)
      .concat(`${spaceSign}+ ${propName}: ${valueAfter}\n`);
  }, '{\n').concat(`${spaceLastIndent}}`);
};

export const diffArrayToPlain = (diffArray) => diffArray.reduce((acc,
  {
    propName, info: {
      valueBefore, valueAfter, innerArr, innerSignArr, sign, propChain,
    },
  }) => {
  const propPath = propChain?.concat(propName).join('.');
  if (innerArr) {
    return acc.concat(`${diffArrayToPlain(innerArr)}`);
  } if (innerSignArr && valueBefore) {
    return acc.concat(`Property '${propPath}' was updated. From ${quotesIfString(valueBefore)} to [complex value]\n`);
  } if (innerSignArr && valueAfter) {
    return acc.concat(`Property '${propPath}' was updated. From [complex value] to ${quotesIfString(valueAfter)}\n`);
  } if (innerSignArr && sign === '+') {
    return acc.concat(`Property '${propPath}' was added with value: [complex value]\n`);
  } if (innerSignArr && sign === '-') {
    return acc.concat(`Property '${propPath}' was removed\n`);
  } if (_.isEqual(valueBefore, valueAfter)) {
    return acc;
  } if (_.isNull(valueBefore)) {
    const addedValue = quotesIfString(complexValueCheck(valueAfter));

    return acc.concat(`Property '${propPath}' was added with value: ${addedValue}\n`);
  } if (_.isNull(valueAfter)) {
    return acc.concat(`Property '${propPath}' was removed\n`);
  }

  const newValue = quotesIfString(complexValueCheck(valueAfter));
  const oldValue = quotesIfString(complexValueCheck(valueBefore));

  return acc.concat(`Property '${propPath}' was updated. From ${oldValue} to ${newValue}\n`);
}, '');

export const diffArrayToJSON = (diffArray) => {
  const lastIndex = diffArray.length - 1;

  return diffArray.reduce((acc,
    {
      propName, info: {
        valueBefore: before, valueAfter: after, innerArr, innerSignArr, sign,
      },
    }, index) => {
    const comma = index === lastIndex ? '' : ',';
    let valueBefore = before;
    let valueAfter = after;

    if (Array.isArray(before)) {
      valueBefore = JSON.stringify(before);
    } else if (_.isString(before)) {
      valueBefore = `"${valueBefore}"`;
    }

    if (Array.isArray(after)) {
      valueAfter = JSON.stringify(after);
    } else if (_.isString(after)) {
      valueAfter = `"${valueAfter}"`;
    }

    if (innerSignArr) {
      if (valueBefore) {
        return acc
          .concat(`"- ${propName}":${valueBefore}${comma}`)
          .concat(`"${sign} ${propName}":${diffArrayToJSON(innerSignArr)}${comma}`);
      }

      if (valueAfter) {
        return acc
          .concat(`"${sign} ${propName}":${diffArrayToJSON(innerSignArr)}${comma}`)
          .concat(`"+ ${propName}":${valueAfter}${comma}`);
      }

      return acc.concat(`"${sign} ${propName}":${diffArrayToJSON(innerSignArr)}${comma}`);
    } if (innerArr) {
      return acc.concat(`"${propName}":${diffArrayToJSON(innerArr)}${comma}`);
    } if (_.isEqual(valueBefore, valueAfter)) {
      return acc
        .concat(`"${propName}":${valueBefore}${comma}`);
    } if (_.isNull(valueBefore)) {
      return acc
        .concat(`"+ ${propName}":${valueAfter}${comma}`);
    } if (_.isNull(valueAfter)) {
      return acc
        .concat(`"- ${propName}":${valueBefore}${comma}`);
    }

    return acc.concat(`"- ${propName}":${valueBefore}${comma}`)
      .concat(`"+ ${propName}":${valueAfter}${comma}`);
  }, '{').concat('}');
};
