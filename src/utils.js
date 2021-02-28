import _ from 'lodash';

export function quotesIfString(string) {
  return _.isString(string)
  && !_.isEqual(string, '[complex value]')
  && !_.isEqual(string, 'null')
    ? `'${string}'` : string;
}

export function complexValueCheck(value) {
  return _.isObject(value) ? '[complex value]' : value;
}

export function normalizeNull(value) {
  return _.isNull(value) ? 'null' : value;
}
