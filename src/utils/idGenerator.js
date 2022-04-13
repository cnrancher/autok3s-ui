export function useIdGenerator(start = 0, prefix = '', suffix = '') {
  return function () {
    return `${prefix}${start++}${suffix}`
  }
}
