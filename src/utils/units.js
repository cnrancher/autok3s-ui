export const UNITS = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
export const FRACTIONAL = ['', 'm', 'u', 'n', 'p', 'f', 'a', 'z', 'y'] // milli micro nano pico femto

export function parseSi(inValue, opt) {
  opt = opt || {}
  let increment = opt.increment
  const allowFractional = opt.allowFractional !== false

  if (!inValue || typeof inValue !== 'string' || !inValue.length) {
    return NaN
  }

  inValue = inValue.replace(/,/g, '')

  // eslint-disable-next-line prefer-const
  let [, valStr, unit, incStr] = inValue.match(/^([0-9.-]+)\s*([^0-9.-]?)([^0-9.-]?)/)
  const val = parseFloat(valStr)

  if (!unit) {
    return val
  }

  // micro "mu" symbol -> u
  if (unit.charCodeAt(0) === 181) {
    unit = 'u'
  }

  const divide = FRACTIONAL.includes(unit)
  const multiply = UNITS.includes(unit.toUpperCase())

  if (!increment) {
    // Automatically handle 1 KB = 1000B, 1 KiB = 1024B if no increment set
    if ((multiply || divide) && incStr === 'i') {
      increment = 1024
    } else {
      increment = 1000
    }
  }

  if (divide && allowFractional) {
    const exp = FRACTIONAL.indexOf(unit)

    return val / increment ** exp
  }

  if (multiply) {
    const exp = UNITS.indexOf(unit.toUpperCase())

    return val * increment ** exp
  }

  // Unrecognized unit character
  return val
}
