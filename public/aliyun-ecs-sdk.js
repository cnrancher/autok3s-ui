require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (global){(function (){
'use strict';

var possibleNames = [
	'BigInt64Array',
	'BigUint64Array',
	'Float32Array',
	'Float64Array',
	'Int16Array',
	'Int32Array',
	'Int8Array',
	'Uint16Array',
	'Uint32Array',
	'Uint8Array',
	'Uint8ClampedArray'
];

var g = typeof globalThis === 'undefined' ? global : globalThis;

module.exports = function availableTypedArrays() {
	var out = [];
	for (var i = 0; i < possibleNames.length; i++) {
		if (typeof g[possibleNames[i]] === 'function') {
			out[out.length] = possibleNames[i];
		}
	}
	return out;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],4:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],5:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":3,"buffer":5,"ieee754":18}],6:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":7,"get-intrinsic":13}],7:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":12,"get-intrinsic":13}],8:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"get-intrinsic":13}],9:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

},{}],10:[function(require,module,exports){
'use strict';

var isCallable = require('is-callable');

var toStr = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

var forEachArray = function forEachArray(array, iterator, receiver) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            if (receiver == null) {
                iterator(array[i], i, array);
            } else {
                iterator.call(receiver, array[i], i, array);
            }
        }
    }
};

var forEachString = function forEachString(string, iterator, receiver) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        if (receiver == null) {
            iterator(string.charAt(i), i, string);
        } else {
            iterator.call(receiver, string.charAt(i), i, string);
        }
    }
};

var forEachObject = function forEachObject(object, iterator, receiver) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            if (receiver == null) {
                iterator(object[k], k, object);
            } else {
                iterator.call(receiver, object[k], k, object);
            }
        }
    }
};

var forEach = function forEach(list, iterator, thisArg) {
    if (!isCallable(iterator)) {
        throw new TypeError('iterator must be a function');
    }

    var receiver;
    if (arguments.length >= 3) {
        receiver = thisArg;
    }

    if (toStr.call(list) === '[object Array]') {
        forEachArray(list, iterator, receiver);
    } else if (typeof list === 'string') {
        forEachString(list, iterator, receiver);
    } else {
        forEachObject(list, iterator, receiver);
    }
};

module.exports = forEach;

},{"is-callable":21}],11:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],12:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":11}],13:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/g, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":12,"has":17,"has-symbols":14}],14:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":15}],15:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],16:[function(require,module,exports){
'use strict';

var hasSymbols = require('has-symbols/shams');

module.exports = function hasToStringTagShams() {
	return hasSymbols() && !!Symbol.toStringTag;
};

},{"has-symbols/shams":15}],17:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":12}],18:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],19:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],20:[function(require,module,exports){
'use strict';

var hasToStringTag = require('has-tostringtag/shams')();
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString(value) !== '[object Array]' &&
		$toString(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{"call-bind/callBound":6,"has-tostringtag/shams":16}],21:[function(require,module,exports){
'use strict';

var fnToStr = Function.prototype.toString;
var reflectApply = typeof Reflect === 'object' && Reflect !== null && Reflect.apply;
var badArrayLike;
var isCallableMarker;
if (typeof reflectApply === 'function' && typeof Object.defineProperty === 'function') {
	try {
		badArrayLike = Object.defineProperty({}, 'length', {
			get: function () {
				throw isCallableMarker;
			}
		});
		isCallableMarker = {};
		// eslint-disable-next-line no-throw-literal
		reflectApply(function () { throw 42; }, null, badArrayLike);
	} catch (_) {
		if (_ !== isCallableMarker) {
			reflectApply = null;
		}
	}
} else {
	reflectApply = null;
}

var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
	try {
		var fnStr = fnToStr.call(value);
		return constructorRegex.test(fnStr);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionToStr(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag = typeof Symbol === 'function' && !!Symbol.toStringTag; // better: use `has-tostringtag`
/* globals document: false */
var documentDotAll = typeof document === 'object' && typeof document.all === 'undefined' && document.all !== undefined ? document.all : {};

module.exports = reflectApply
	? function isCallable(value) {
		if (value === documentDotAll) { return true; }
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (typeof value === 'function' && !value.prototype) { return true; }
		try {
			reflectApply(value, null, badArrayLike);
		} catch (e) {
			if (e !== isCallableMarker) { return false; }
		}
		return !isES6ClassFn(value);
	}
	: function isCallable(value) {
		if (value === documentDotAll) { return true; }
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (typeof value === 'function' && !value.prototype) { return true; }
		if (hasToStringTag) { return tryFunctionObject(value); }
		if (isES6ClassFn(value)) { return false; }
		var strClass = toStr.call(value);
		return strClass === fnClass || strClass === genClass;
	};

},{}],22:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag = require('has-tostringtag/shams')();
var getProto = Object.getPrototypeOf;
var getGeneratorFunc = function () { // eslint-disable-line consistent-return
	if (!hasToStringTag) {
		return false;
	}
	try {
		return Function('return function*() {}')();
	} catch (e) {
	}
};
var GeneratorFunction;

module.exports = function isGeneratorFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}
	if (isFnRegex.test(fnToStr.call(fn))) {
		return true;
	}
	if (!hasToStringTag) {
		var str = toStr.call(fn);
		return str === '[object GeneratorFunction]';
	}
	if (!getProto) {
		return false;
	}
	if (typeof GeneratorFunction === 'undefined') {
		var generatorFunc = getGeneratorFunc();
		GeneratorFunction = generatorFunc ? getProto(generatorFunc) : false;
	}
	return getProto(fn) === GeneratorFunction;
};

},{"has-tostringtag/shams":16}],23:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('for-each');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasToStringTag = require('has-tostringtag/shams')();

var g = typeof globalThis === 'undefined' ? global : globalThis;
var typedArrays = availableTypedArrays();

var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		var arr = new g[typedArray]();
		if (Symbol.toStringTag in arr) {
			var proto = getPrototypeOf(arr);
			var descriptor = gOPD(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf(proto);
				descriptor = gOPD(superProto, Symbol.toStringTag);
			}
			toStrTags[typedArray] = descriptor.get;
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var anyTrue = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!anyTrue) {
			try {
				anyTrue = getter.call(value) === typedArray;
			} catch (e) { /**/ }
		}
	});
	return anyTrue;
};

module.exports = function isTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag || !(Symbol.toStringTag in value)) {
		var tag = $slice($toString(value), 8, -1);
		return $indexOf(typedArrays, tag) > -1;
	}
	if (!gOPD) { return false; }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":2,"call-bind/callBound":6,"es-abstract/helpers/getOwnPropertyDescriptor":8,"for-each":10,"has-tostringtag/shams":16}],24:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],25:[function(require,module,exports){
(function (global){(function (){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],26:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],27:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],28:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":26,"./encode":27}],29:[function(require,module,exports){
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype)

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":5}],30:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/lib/_stream_readable.js');
Stream.Writable = require('readable-stream/lib/_stream_writable.js');
Stream.Duplex = require('readable-stream/lib/_stream_duplex.js');
Stream.Transform = require('readable-stream/lib/_stream_transform.js');
Stream.PassThrough = require('readable-stream/lib/_stream_passthrough.js');
Stream.finished = require('readable-stream/lib/internal/streams/end-of-stream.js')
Stream.pipeline = require('readable-stream/lib/internal/streams/pipeline.js')

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":9,"inherits":19,"readable-stream/lib/_stream_duplex.js":32,"readable-stream/lib/_stream_passthrough.js":33,"readable-stream/lib/_stream_readable.js":34,"readable-stream/lib/_stream_transform.js":35,"readable-stream/lib/_stream_writable.js":36,"readable-stream/lib/internal/streams/end-of-stream.js":40,"readable-stream/lib/internal/streams/pipeline.js":42}],31:[function(require,module,exports){
'use strict';

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var codes = {};

function createErrorType(code, message, Base) {
  if (!Base) {
    Base = Error;
  }

  function getMessage(arg1, arg2, arg3) {
    if (typeof message === 'string') {
      return message;
    } else {
      return message(arg1, arg2, arg3);
    }
  }

  var NodeError =
  /*#__PURE__*/
  function (_Base) {
    _inheritsLoose(NodeError, _Base);

    function NodeError(arg1, arg2, arg3) {
      return _Base.call(this, getMessage(arg1, arg2, arg3)) || this;
    }

    return NodeError;
  }(Base);

  NodeError.prototype.name = Base.name;
  NodeError.prototype.code = code;
  codes[code] = NodeError;
} // https://github.com/nodejs/node/blob/v10.8.0/lib/internal/errors.js


function oneOf(expected, thing) {
  if (Array.isArray(expected)) {
    var len = expected.length;
    expected = expected.map(function (i) {
      return String(i);
    });

    if (len > 2) {
      return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(', '), ", or ") + expected[len - 1];
    } else if (len === 2) {
      return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
    } else {
      return "of ".concat(thing, " ").concat(expected[0]);
    }
  } else {
    return "of ".concat(thing, " ").concat(String(expected));
  }
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith


function startsWith(str, search, pos) {
  return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith


function endsWith(str, search, this_len) {
  if (this_len === undefined || this_len > str.length) {
    this_len = str.length;
  }

  return str.substring(this_len - search.length, this_len) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes


function includes(str, search, start) {
  if (typeof start !== 'number') {
    start = 0;
  }

  if (start + search.length > str.length) {
    return false;
  } else {
    return str.indexOf(search, start) !== -1;
  }
}

createErrorType('ERR_INVALID_OPT_VALUE', function (name, value) {
  return 'The value "' + value + '" is invalid for option "' + name + '"';
}, TypeError);
createErrorType('ERR_INVALID_ARG_TYPE', function (name, expected, actual) {
  // determiner: 'must be' or 'must not be'
  var determiner;

  if (typeof expected === 'string' && startsWith(expected, 'not ')) {
    determiner = 'must not be';
    expected = expected.replace(/^not /, '');
  } else {
    determiner = 'must be';
  }

  var msg;

  if (endsWith(name, ' argument')) {
    // For cases like 'first argument'
    msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  } else {
    var type = includes(name, '.') ? 'property' : 'argument';
    msg = "The \"".concat(name, "\" ").concat(type, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  }

  msg += ". Received type ".concat(typeof actual);
  return msg;
}, TypeError);
createErrorType('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF');
createErrorType('ERR_METHOD_NOT_IMPLEMENTED', function (name) {
  return 'The ' + name + ' method is not implemented';
});
createErrorType('ERR_STREAM_PREMATURE_CLOSE', 'Premature close');
createErrorType('ERR_STREAM_DESTROYED', function (name) {
  return 'Cannot call ' + name + ' after a stream was destroyed';
});
createErrorType('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times');
createErrorType('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable');
createErrorType('ERR_STREAM_WRITE_AFTER_END', 'write after end');
createErrorType('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError);
createErrorType('ERR_UNKNOWN_ENCODING', function (arg) {
  return 'Unknown encoding: ' + arg;
}, TypeError);
createErrorType('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event');
module.exports.codes = codes;

},{}],32:[function(require,module,exports){
(function (process){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.
'use strict';
/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];

  for (var key in obj) {
    keys.push(key);
  }

  return keys;
};
/*</replacement>*/


module.exports = Duplex;

var Readable = require('./_stream_readable');

var Writable = require('./_stream_writable');

require('inherits')(Duplex, Readable);

{
  // Allow the keys array to be GC'ed.
  var keys = objectKeys(Writable.prototype);

  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);
  Readable.call(this, options);
  Writable.call(this, options);
  this.allowHalfOpen = true;

  if (options) {
    if (options.readable === false) this.readable = false;
    if (options.writable === false) this.writable = false;

    if (options.allowHalfOpen === false) {
      this.allowHalfOpen = false;
      this.once('end', onend);
    }
  }
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
});
Object.defineProperty(Duplex.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});
Object.defineProperty(Duplex.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
}); // the no-half-open enforcer

function onend() {
  // If the writable side ended, then we're ok.
  if (this._writableState.ended) return; // no more data can be written.
  // But allow more writes to happen in this tick.

  process.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }

    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});
}).call(this)}).call(this,require('_process'))
},{"./_stream_readable":34,"./_stream_writable":36,"_process":24,"inherits":19}],33:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.
'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

require('inherits')(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);
  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":35,"inherits":19}],34:[function(require,module,exports){
(function (process,global){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';

module.exports = Readable;
/*<replacement>*/

var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;
/*<replacement>*/

var EE = require('events').EventEmitter;

var EElistenerCount = function EElistenerCount(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/


var Stream = require('./internal/streams/stream');
/*</replacement>*/


var Buffer = require('buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
/*<replacement>*/


var debugUtil = require('util');

var debug;

if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function debug() {};
}
/*</replacement>*/


var BufferList = require('./internal/streams/buffer_list');

var destroyImpl = require('./internal/streams/destroy');

var _require = require('./internal/streams/state'),
    getHighWaterMark = _require.getHighWaterMark;

var _require$codes = require('../errors').codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT; // Lazy loaded to improve the startup performance.


var StringDecoder;
var createReadableStreamAsyncIterator;
var from;

require('inherits')(Readable, Stream);

var errorOrDestroy = destroyImpl.errorOrDestroy;
var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn); // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.

  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream, isDuplex) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode; // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"

  this.highWaterMark = getHighWaterMark(this, options, 'readableHighWaterMark', isDuplex); // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()

  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false; // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.

  this.sync = true; // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.

  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;
  this.paused = true; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // Should .destroy() be called after 'end' (and potentially 'finish')

  this.autoDestroy = !!options.autoDestroy; // has it been destroyed

  this.destroyed = false; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // the number of writers that are awaiting a drain event in .pipe()s

  this.awaitDrain = 0; // if true, a maybeReadMore has been scheduled

  this.readingMore = false;
  this.decoder = null;
  this.encoding = null;

  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');
  if (!(this instanceof Readable)) return new Readable(options); // Checking for a Stream.Duplex instance is faster here instead of inside
  // the ReadableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  this._readableState = new ReadableState(options, this, isDuplex); // legacy

  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined) {
      return false;
    }

    return this._readableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
  }
});
Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;

Readable.prototype._destroy = function (err, cb) {
  cb(err);
}; // Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.


Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;

      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }

      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
}; // Unshift should *always* be something directly out of read()


Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  debug('readableAddChunk', chunk);
  var state = stream._readableState;

  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);

    if (er) {
      errorOrDestroy(stream, er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
      } else if (state.destroyed) {
        return false;
      } else {
        state.reading = false;

        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
      maybeReadMore(stream, state);
    }
  } // We can push more data if we are below the highWaterMark.
  // Also, if we have no data yet, we can stand some more bytes.
  // This is to work around cases where hwm=0, such as the repl.


  return !state.ended && (state.length < state.highWaterMark || state.length === 0);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    state.awaitDrain = 0;
    stream.emit('data', chunk);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
    if (state.needReadable) emitReadable(stream);
  }

  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;

  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk);
  }

  return er;
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
}; // backwards compatibility.


Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  var decoder = new StringDecoder(enc);
  this._readableState.decoder = decoder; // If setEncoding(null), decoder.encoding equals utf8

  this._readableState.encoding = this._readableState.decoder.encoding; // Iterate over current buffer to convert already stored Buffers:

  var p = this._readableState.buffer.head;
  var content = '';

  while (p !== null) {
    content += decoder.write(p.data);
    p = p.next;
  }

  this._readableState.buffer.clear();

  if (content !== '') this._readableState.buffer.push(content);
  this._readableState.length = content.length;
  return this;
}; // Don't raise the hwm > 1GB


var MAX_HWM = 0x40000000;

function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    // TODO(ronag): Throw ERR_VALUE_OUT_OF_RANGE.
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }

  return n;
} // This function is designed to be inlinable, so please take care when making
// changes to the function body.


function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;

  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  } // If we're asking for more than the current hwm, then raise the hwm.


  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n; // Don't have enough

  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }

  return state.length;
} // you can override either this method, or the async _read(n) below.


Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;
  if (n !== 0) state.emittedReadable = false; // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.

  if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state); // if we've ended, and we're now clear, then finish it up.

  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  } // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.
  // if we need a readable event, then we need to do some reading.


  var doRead = state.needReadable;
  debug('need readable', doRead); // if we currently have less than the highWaterMark, then also read some

  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  } // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.


  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true; // if the length is currently zero, then we *need* a readable event.

    if (state.length === 0) state.needReadable = true; // call internal read method

    this._read(state.highWaterMark);

    state.sync = false; // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.

    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = state.length <= state.highWaterMark;
    n = 0;
  } else {
    state.length -= n;
    state.awaitDrain = 0;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true; // If we tried to read() past the EOF, then emit end on the next tick.

    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);
  return ret;
};

function onEofChunk(stream, state) {
  debug('onEofChunk');
  if (state.ended) return;

  if (state.decoder) {
    var chunk = state.decoder.end();

    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }

  state.ended = true;

  if (state.sync) {
    // if we are sync, wait until next tick to emit the data.
    // Otherwise we risk emitting data in the flow()
    // the readable code triggers during a read() call
    emitReadable(stream);
  } else {
    // emit 'readable' now to make sure it gets picked up.
    state.needReadable = false;

    if (!state.emittedReadable) {
      state.emittedReadable = true;
      emitReadable_(stream);
    }
  }
} // Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.


function emitReadable(stream) {
  var state = stream._readableState;
  debug('emitReadable', state.needReadable, state.emittedReadable);
  state.needReadable = false;

  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    process.nextTick(emitReadable_, stream);
  }
}

function emitReadable_(stream) {
  var state = stream._readableState;
  debug('emitReadable_', state.destroyed, state.length, state.ended);

  if (!state.destroyed && (state.length || state.ended)) {
    stream.emit('readable');
    state.emittedReadable = false;
  } // The stream needs another readable event if
  // 1. It is not flowing, as the flow mechanism will take
  //    care of it.
  // 2. It is not ended.
  // 3. It is below the highWaterMark, so we can schedule
  //    another readable later.


  state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
  flow(stream);
} // at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.


function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  // Attempt to read more data if we should.
  //
  // The conditions for reading more data are (one of):
  // - Not enough data buffered (state.length < state.highWaterMark). The loop
  //   is responsible for filling the buffer with enough data if such data
  //   is available. If highWaterMark is 0 and we are not in the flowing mode
  //   we should _not_ attempt to buffer any extra data. We'll get more data
  //   when the stream consumer calls read() instead.
  // - No data in the buffer, and the stream is in flowing mode. In this mode
  //   the loop below is responsible for ensuring read() is called. Failing to
  //   call read here would abort the flow and there's no other mechanism for
  //   continuing the flow if the stream consumer has just subscribed to the
  //   'data' event.
  //
  // In addition to the above conditions to keep reading data, the following
  // conditions prevent the data from being read:
  // - The stream has ended (state.ended).
  // - There is already a pending 'read' operation (state.reading). This is a
  //   case where the the stream has called the implementation defined _read()
  //   method, but they are processing the call asynchronously and have _not_
  //   called push() with new data. In this case we skip performing more
  //   read()s. The execution ends in this method again after the _read() ends
  //   up calling push() with more data.
  while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
    var len = state.length;
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length) // didn't get any data, stop spinning.
      break;
  }

  state.readingMore = false;
} // abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.


Readable.prototype._read = function (n) {
  errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED('_read()'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;

    case 1:
      state.pipes = [state.pipes, dest];
      break;

    default:
      state.pipes.push(dest);
      break;
  }

  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) process.nextTick(endFn);else src.once('end', endFn);
  dest.on('unpipe', onunpipe);

  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');

    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  } // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.


  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);
  var cleanedUp = false;

  function cleanup() {
    debug('cleanup'); // cleanup event handlers once the pipe is broken

    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);
    cleanedUp = true; // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.

    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);

  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    debug('dest.write', ret);

    if (ret === false) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', state.awaitDrain);
        state.awaitDrain++;
      }

      src.pause();
    }
  } // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.


  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) errorOrDestroy(dest, er);
  } // Make sure our error handler is attached before userland ones.


  prependListener(dest, 'error', onerror); // Both close and finish should trigger unpipe, but only once.

  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }

  dest.once('close', onclose);

  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }

  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  } // tell the dest that it's being piped to


  dest.emit('pipe', src); // start the flow if it hasn't been started already.

  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function pipeOnDrainFunctionResult() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;

    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = {
    hasUnpiped: false
  }; // if we're not piping anywhere, then do nothing.

  if (state.pipesCount === 0) return this; // just one destination.  most common case.

  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;
    if (!dest) dest = state.pipes; // got a match.

    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  } // slow case. multiple pipe destinations.


  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, {
        hasUnpiped: false
      });
    }

    return this;
  } // try to find the right one.


  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;
  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];
  dest.emit('unpipe', this, unpipeInfo);
  return this;
}; // set up data events if they are asked for
// Ensure readable listeners eventually get something


Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);
  var state = this._readableState;

  if (ev === 'data') {
    // update readableListening so that resume() may be a no-op
    // a few lines down. This is needed to support once('readable').
    state.readableListening = this.listenerCount('readable') > 0; // Try start flowing on next tick if stream isn't explicitly paused

    if (state.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.flowing = false;
      state.emittedReadable = false;
      debug('on readable', state.length, state.reading);

      if (state.length) {
        emitReadable(this);
      } else if (!state.reading) {
        process.nextTick(nReadingNextTick, this);
      }
    }
  }

  return res;
};

Readable.prototype.addListener = Readable.prototype.on;

Readable.prototype.removeListener = function (ev, fn) {
  var res = Stream.prototype.removeListener.call(this, ev, fn);

  if (ev === 'readable') {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

Readable.prototype.removeAllListeners = function (ev) {
  var res = Stream.prototype.removeAllListeners.apply(this, arguments);

  if (ev === 'readable' || ev === undefined) {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

function updateReadableListening(self) {
  var state = self._readableState;
  state.readableListening = self.listenerCount('readable') > 0;

  if (state.resumeScheduled && !state.paused) {
    // flowing needs to be set to true now, otherwise
    // the upcoming resume will not flow.
    state.flowing = true; // crude way to check if we should resume
  } else if (self.listenerCount('data') > 0) {
    self.resume();
  }
}

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
} // pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.


Readable.prototype.resume = function () {
  var state = this._readableState;

  if (!state.flowing) {
    debug('resume'); // we flow only if there is no one listening
    // for readable, but we still have to call
    // resume()

    state.flowing = !state.readableListening;
    resume(this, state);
  }

  state.paused = false;
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  debug('resume', state.reading);

  if (!state.reading) {
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);

  if (this._readableState.flowing !== false) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }

  this._readableState.paused = true;
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);

  while (state.flowing && stream.read() !== null) {
    ;
  }
} // wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.


Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;
  stream.on('end', function () {
    debug('wrapped end');

    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });
  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk); // don't skip over falsy values in objectMode

    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);

    if (!ret) {
      paused = true;
      stream.pause();
    }
  }); // proxy all the other methods.
  // important when wrapping filters and duplexes.

  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function methodWrap(method) {
        return function methodWrapReturnFunction() {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  } // proxy certain important events.


  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  } // when we try to consume some more bytes, simply unpause the
  // underlying stream.


  this._read = function (n) {
    debug('wrapped _read', n);

    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

if (typeof Symbol === 'function') {
  Readable.prototype[Symbol.asyncIterator] = function () {
    if (createReadableStreamAsyncIterator === undefined) {
      createReadableStreamAsyncIterator = require('./internal/streams/async_iterator');
    }

    return createReadableStreamAsyncIterator(this);
  };
}

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.highWaterMark;
  }
});
Object.defineProperty(Readable.prototype, 'readableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState && this._readableState.buffer;
  }
});
Object.defineProperty(Readable.prototype, 'readableFlowing', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.flowing;
  },
  set: function set(state) {
    if (this._readableState) {
      this._readableState.flowing = state;
    }
  }
}); // exposed for testing purposes only.

Readable._fromList = fromList;
Object.defineProperty(Readable.prototype, 'readableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.length;
  }
}); // Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.

function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;
  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.first();else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = state.buffer.consume(n, state.decoder);
  }
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;
  debug('endReadable', state.endEmitted);

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  debug('endReadableNT', state.endEmitted, state.length); // Check that we didn't get one last unshift.

  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');

    if (state.autoDestroy) {
      // In case of duplex streams we need a way to detect
      // if the writable side is ready for autoDestroy as well
      var wState = stream._writableState;

      if (!wState || wState.autoDestroy && wState.finished) {
        stream.destroy();
      }
    }
  }
}

if (typeof Symbol === 'function') {
  Readable.from = function (iterable, opts) {
    if (from === undefined) {
      from = require('./internal/streams/from');
    }

    return from(Readable, iterable, opts);
  };
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }

  return -1;
}
}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../errors":31,"./_stream_duplex":32,"./internal/streams/async_iterator":37,"./internal/streams/buffer_list":38,"./internal/streams/destroy":39,"./internal/streams/from":41,"./internal/streams/state":43,"./internal/streams/stream":44,"_process":24,"buffer":5,"events":9,"inherits":19,"string_decoder/":45,"util":4}],35:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.
'use strict';

module.exports = Transform;

var _require$codes = require('../errors').codes,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
    ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;

var Duplex = require('./_stream_duplex');

require('inherits')(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;
  var cb = ts.writecb;

  if (cb === null) {
    return this.emit('error', new ERR_MULTIPLE_CALLBACK());
  }

  ts.writechunk = null;
  ts.writecb = null;
  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);
  cb(er);
  var rs = this._readableState;
  rs.reading = false;

  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);
  Duplex.call(this, options);
  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  }; // start out asking for a readable event once data is transformed.

  this._readableState.needReadable = true; // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.

  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;
    if (typeof options.flush === 'function') this._flush = options.flush;
  } // When the writable side finishes, then flush out anything remaining.


  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function' && !this._readableState.destroyed) {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
}; // This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.


Transform.prototype._transform = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_transform()'));
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;

  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
}; // Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.


Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && !ts.transforming) {
    ts.transforming = true;

    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);
  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data); // TODO(BridgeAR): Write a test for these two error cases
  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided

  if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
  if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
  return stream.push(null);
}
},{"../errors":31,"./_stream_duplex":32,"inherits":19}],36:[function(require,module,exports){
(function (process,global){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.
'use strict';

module.exports = Writable;
/* <replacement> */

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
} // It seems a linked list but it is not
// there will be only 2 of these for each stream


function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/


var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;
/*<replacement>*/

var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/

var Stream = require('./internal/streams/stream');
/*</replacement>*/


var Buffer = require('buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

var destroyImpl = require('./internal/streams/destroy');

var _require = require('./internal/streams/state'),
    getHighWaterMark = _require.getHighWaterMark;

var _require$codes = require('../errors').codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
    ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
    ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
    ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;

var errorOrDestroy = destroyImpl.errorOrDestroy;

require('inherits')(Writable, Stream);

function nop() {}

function WritableState(options, stream, isDuplex) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream,
  // e.g. options.readableObjectMode vs. options.writableObjectMode, etc.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag to indicate whether or not this stream
  // contains buffers or objects.

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode; // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()

  this.highWaterMark = getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex); // if _final has been called

  this.finalCalled = false; // drain event flag.

  this.needDrain = false; // at the start of calling end()

  this.ending = false; // when end() has been called, and returned

  this.ended = false; // when 'finish' is emitted

  this.finished = false; // has it been destroyed

  this.destroyed = false; // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.

  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.

  this.length = 0; // a flag to see when we're in the middle of a write.

  this.writing = false; // when true all writes will be buffered until .uncork() call

  this.corked = 0; // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.

  this.sync = true; // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.

  this.bufferProcessing = false; // the callback that's passed to _write(chunk,cb)

  this.onwrite = function (er) {
    onwrite(stream, er);
  }; // the callback that the user supplies to write(chunk,encoding,cb)


  this.writecb = null; // the amount that is being written when _write is called.

  this.writelen = 0;
  this.bufferedRequest = null;
  this.lastBufferedRequest = null; // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted

  this.pendingcb = 0; // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams

  this.prefinished = false; // True if the error was already emitted and should not be thrown again

  this.errorEmitted = false; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // Should .destroy() be called after 'finish' (and potentially 'end')

  this.autoDestroy = !!options.autoDestroy; // count buffered requests

  this.bufferedRequestCount = 0; // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two

  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];

  while (current) {
    out.push(current);
    current = current.next;
  }

  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function writableStateBufferGetter() {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})(); // Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.


var realHasInstance;

if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function value(object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;
      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function realHasInstance(object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex'); // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.
  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the WritableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
  this._writableState = new WritableState(options, this, isDuplex); // legacy.

  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;
    if (typeof options.writev === 'function') this._writev = options.writev;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
} // Otherwise people can pipe Writable streams, which is just wrong.


Writable.prototype.pipe = function () {
  errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
};

function writeAfterEnd(stream, cb) {
  var er = new ERR_STREAM_WRITE_AFTER_END(); // TODO: defer error events consistently everywhere, not just the cb

  errorOrDestroy(stream, er);
  process.nextTick(cb, er);
} // Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.


function validChunk(stream, state, chunk, cb) {
  var er;

  if (chunk === null) {
    er = new ERR_STREAM_NULL_VALUES();
  } else if (typeof chunk !== 'string' && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer'], chunk);
  }

  if (er) {
    errorOrDestroy(stream, er);
    process.nextTick(cb, er);
    return false;
  }

  return true;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
  if (typeof cb !== 'function') cb = nop;
  if (state.ending) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }
  return ret;
};

Writable.prototype.cork = function () {
  this._writableState.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;
    if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

Object.defineProperty(Writable.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }

  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
}); // if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.

function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);

    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }

  var len = state.objectMode ? 1 : chunk.length;
  state.length += len;
  var ret = state.length < state.highWaterMark; // we must ensure that previous needDrain will not be reset to false.

  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };

    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }

    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED('write'));else if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    process.nextTick(cb, er); // this can emit finish, and it will always happen
    // after error

    process.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er); // this can emit finish, but finish must
    // always follow error

    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;
  if (typeof cb !== 'function') throw new ERR_MULTIPLE_CALLBACK();
  onwriteStateUpdate(state);
  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state) || stream.destroyed;

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
} // Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.


function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
} // if there's something in the buffer waiting, then process it


function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;
    var count = 0;
    var allBuffers = true;

    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }

    buffer.allBuffers = allBuffers;
    doWrite(stream, state, true, state.length, buffer, '', holder.finish); // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite

    state.pendingcb++;
    state.lastBufferedRequest = null;

    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }

    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;
      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--; // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.

      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding); // .end() fully uncorks

  if (state.corked) {
    state.corked = 1;
    this.uncork();
  } // ignore unnecessary end() calls.


  if (!state.ending) endWritable(this, state, cb);
  return this;
};

Object.defineProperty(Writable.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
});

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;

    if (err) {
      errorOrDestroy(stream, err);
    }

    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}

function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function' && !state.destroyed) {
      state.pendingcb++;
      state.finalCalled = true;
      process.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);

  if (need) {
    prefinish(stream, state);

    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');

      if (state.autoDestroy) {
        // In case of duplex streams we need a way to detect
        // if the readable side is ready for autoDestroy as well
        var rState = stream._readableState;

        if (!rState || rState.autoDestroy && rState.endEmitted) {
          stream.destroy();
        }
      }
    }
  }

  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);

  if (cb) {
    if (state.finished) process.nextTick(cb);else stream.once('finish', cb);
  }

  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;

  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  } // reuse the free corkReq.


  state.corkedRequestsFree.next = corkReq;
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._writableState === undefined) {
      return false;
    }

    return this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._writableState.destroyed = value;
  }
});
Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;

Writable.prototype._destroy = function (err, cb) {
  cb(err);
};
}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../errors":31,"./_stream_duplex":32,"./internal/streams/destroy":39,"./internal/streams/state":43,"./internal/streams/stream":44,"_process":24,"buffer":5,"inherits":19,"util-deprecate":48}],37:[function(require,module,exports){
(function (process){(function (){
'use strict';

var _Object$setPrototypeO;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var finished = require('./end-of-stream');

var kLastResolve = Symbol('lastResolve');
var kLastReject = Symbol('lastReject');
var kError = Symbol('error');
var kEnded = Symbol('ended');
var kLastPromise = Symbol('lastPromise');
var kHandlePromise = Symbol('handlePromise');
var kStream = Symbol('stream');

function createIterResult(value, done) {
  return {
    value: value,
    done: done
  };
}

function readAndResolve(iter) {
  var resolve = iter[kLastResolve];

  if (resolve !== null) {
    var data = iter[kStream].read(); // we defer if data is null
    // we can be expecting either 'end' or
    // 'error'

    if (data !== null) {
      iter[kLastPromise] = null;
      iter[kLastResolve] = null;
      iter[kLastReject] = null;
      resolve(createIterResult(data, false));
    }
  }
}

function onReadable(iter) {
  // we wait for the next tick, because it might
  // emit an error with process.nextTick
  process.nextTick(readAndResolve, iter);
}

function wrapForNext(lastPromise, iter) {
  return function (resolve, reject) {
    lastPromise.then(function () {
      if (iter[kEnded]) {
        resolve(createIterResult(undefined, true));
        return;
      }

      iter[kHandlePromise](resolve, reject);
    }, reject);
  };
}

var AsyncIteratorPrototype = Object.getPrototypeOf(function () {});
var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
  get stream() {
    return this[kStream];
  },

  next: function next() {
    var _this = this;

    // if we have detected an error in the meanwhile
    // reject straight away
    var error = this[kError];

    if (error !== null) {
      return Promise.reject(error);
    }

    if (this[kEnded]) {
      return Promise.resolve(createIterResult(undefined, true));
    }

    if (this[kStream].destroyed) {
      // We need to defer via nextTick because if .destroy(err) is
      // called, the error will be emitted via nextTick, and
      // we cannot guarantee that there is no error lingering around
      // waiting to be emitted.
      return new Promise(function (resolve, reject) {
        process.nextTick(function () {
          if (_this[kError]) {
            reject(_this[kError]);
          } else {
            resolve(createIterResult(undefined, true));
          }
        });
      });
    } // if we have multiple next() calls
    // we will wait for the previous Promise to finish
    // this logic is optimized to support for await loops,
    // where next() is only called once at a time


    var lastPromise = this[kLastPromise];
    var promise;

    if (lastPromise) {
      promise = new Promise(wrapForNext(lastPromise, this));
    } else {
      // fast path needed to support multiple this.push()
      // without triggering the next() queue
      var data = this[kStream].read();

      if (data !== null) {
        return Promise.resolve(createIterResult(data, false));
      }

      promise = new Promise(this[kHandlePromise]);
    }

    this[kLastPromise] = promise;
    return promise;
  }
}, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function () {
  return this;
}), _defineProperty(_Object$setPrototypeO, "return", function _return() {
  var _this2 = this;

  // destroy(err, cb) is a private API
  // we can guarantee we have that here, because we control the
  // Readable class this is attached to
  return new Promise(function (resolve, reject) {
    _this2[kStream].destroy(null, function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(createIterResult(undefined, true));
    });
  });
}), _Object$setPrototypeO), AsyncIteratorPrototype);

var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator(stream) {
  var _Object$create;

  var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
    value: stream,
    writable: true
  }), _defineProperty(_Object$create, kLastResolve, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kLastReject, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kError, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kEnded, {
    value: stream._readableState.endEmitted,
    writable: true
  }), _defineProperty(_Object$create, kHandlePromise, {
    value: function value(resolve, reject) {
      var data = iterator[kStream].read();

      if (data) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        resolve(createIterResult(data, false));
      } else {
        iterator[kLastResolve] = resolve;
        iterator[kLastReject] = reject;
      }
    },
    writable: true
  }), _Object$create));
  iterator[kLastPromise] = null;
  finished(stream, function (err) {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      var reject = iterator[kLastReject]; // reject if we are waiting for data in the Promise
      // returned by next() and store the error

      if (reject !== null) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        reject(err);
      }

      iterator[kError] = err;
      return;
    }

    var resolve = iterator[kLastResolve];

    if (resolve !== null) {
      iterator[kLastPromise] = null;
      iterator[kLastResolve] = null;
      iterator[kLastReject] = null;
      resolve(createIterResult(undefined, true));
    }

    iterator[kEnded] = true;
  });
  stream.on('readable', onReadable.bind(null, iterator));
  return iterator;
};

module.exports = createReadableStreamAsyncIterator;
}).call(this)}).call(this,require('_process'))
},{"./end-of-stream":40,"_process":24}],38:[function(require,module,exports){
'use strict';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require('buffer'),
    Buffer = _require.Buffer;

var _require2 = require('util'),
    inspect = _require2.inspect;

var custom = inspect && inspect.custom || 'inspect';

function copyBuffer(src, target, offset) {
  Buffer.prototype.copy.call(src, target, offset);
}

module.exports =
/*#__PURE__*/
function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  _createClass(BufferList, [{
    key: "push",
    value: function push(v) {
      var entry = {
        data: v,
        next: null
      };
      if (this.length > 0) this.tail.next = entry;else this.head = entry;
      this.tail = entry;
      ++this.length;
    }
  }, {
    key: "unshift",
    value: function unshift(v) {
      var entry = {
        data: v,
        next: this.head
      };
      if (this.length === 0) this.tail = entry;
      this.head = entry;
      ++this.length;
    }
  }, {
    key: "shift",
    value: function shift() {
      if (this.length === 0) return;
      var ret = this.head.data;
      if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
      --this.length;
      return ret;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.head = this.tail = null;
      this.length = 0;
    }
  }, {
    key: "join",
    value: function join(s) {
      if (this.length === 0) return '';
      var p = this.head;
      var ret = '' + p.data;

      while (p = p.next) {
        ret += s + p.data;
      }

      return ret;
    }
  }, {
    key: "concat",
    value: function concat(n) {
      if (this.length === 0) return Buffer.alloc(0);
      var ret = Buffer.allocUnsafe(n >>> 0);
      var p = this.head;
      var i = 0;

      while (p) {
        copyBuffer(p.data, ret, i);
        i += p.data.length;
        p = p.next;
      }

      return ret;
    } // Consumes a specified amount of bytes or characters from the buffered data.

  }, {
    key: "consume",
    value: function consume(n, hasStrings) {
      var ret;

      if (n < this.head.data.length) {
        // `slice` is the same for buffers and strings.
        ret = this.head.data.slice(0, n);
        this.head.data = this.head.data.slice(n);
      } else if (n === this.head.data.length) {
        // First chunk is a perfect match.
        ret = this.shift();
      } else {
        // Result spans more than one buffer.
        ret = hasStrings ? this._getString(n) : this._getBuffer(n);
      }

      return ret;
    }
  }, {
    key: "first",
    value: function first() {
      return this.head.data;
    } // Consumes a specified amount of characters from the buffered data.

  }, {
    key: "_getString",
    value: function _getString(n) {
      var p = this.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;

      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;else ret += str.slice(0, n);
        n -= nb;

        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = str.slice(nb);
          }

          break;
        }

        ++c;
      }

      this.length -= c;
      return ret;
    } // Consumes a specified amount of bytes from the buffered data.

  }, {
    key: "_getBuffer",
    value: function _getBuffer(n) {
      var ret = Buffer.allocUnsafe(n);
      var p = this.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;

      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;

        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = buf.slice(nb);
          }

          break;
        }

        ++c;
      }

      this.length -= c;
      return ret;
    } // Make sure the linked list only shows the minimal necessary information.

  }, {
    key: custom,
    value: function value(_, options) {
      return inspect(this, _objectSpread({}, options, {
        // Only inspect one level.
        depth: 0,
        // It should not recurse.
        customInspect: false
      }));
    }
  }]);

  return BufferList;
}();
},{"buffer":5,"util":4}],39:[function(require,module,exports){
(function (process){(function (){
'use strict'; // undocumented cb() API, needed for core, not for public API

function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err) {
      if (!this._writableState) {
        process.nextTick(emitErrorNT, this, err);
      } else if (!this._writableState.errorEmitted) {
        this._writableState.errorEmitted = true;
        process.nextTick(emitErrorNT, this, err);
      }
    }

    return this;
  } // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks


  if (this._readableState) {
    this._readableState.destroyed = true;
  } // if this is a duplex stream mark the writable part as destroyed as well


  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      if (!_this._writableState) {
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else if (!_this._writableState.errorEmitted) {
        _this._writableState.errorEmitted = true;
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else {
        process.nextTick(emitCloseNT, _this);
      }
    } else if (cb) {
      process.nextTick(emitCloseNT, _this);
      cb(err);
    } else {
      process.nextTick(emitCloseNT, _this);
    }
  });

  return this;
}

function emitErrorAndCloseNT(self, err) {
  emitErrorNT(self, err);
  emitCloseNT(self);
}

function emitCloseNT(self) {
  if (self._writableState && !self._writableState.emitClose) return;
  if (self._readableState && !self._readableState.emitClose) return;
  self.emit('close');
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finalCalled = false;
    this._writableState.prefinished = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

function errorOrDestroy(stream, err) {
  // We have tests that rely on errors being emitted
  // in the same tick, so changing this is semver major.
  // For now when you opt-in to autoDestroy we allow
  // the error to be emitted nextTick. In a future
  // semver major update we should change the default to this.
  var rState = stream._readableState;
  var wState = stream._writableState;
  if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);else stream.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy,
  errorOrDestroy: errorOrDestroy
};
}).call(this)}).call(this,require('_process'))
},{"_process":24}],40:[function(require,module,exports){
// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';

var ERR_STREAM_PREMATURE_CLOSE = require('../../../errors').codes.ERR_STREAM_PREMATURE_CLOSE;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    callback.apply(this, args);
  };
}

function noop() {}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function eos(stream, opts, callback) {
  if (typeof opts === 'function') return eos(stream, null, opts);
  if (!opts) opts = {};
  callback = once(callback || noop);
  var readable = opts.readable || opts.readable !== false && stream.readable;
  var writable = opts.writable || opts.writable !== false && stream.writable;

  var onlegacyfinish = function onlegacyfinish() {
    if (!stream.writable) onfinish();
  };

  var writableEnded = stream._writableState && stream._writableState.finished;

  var onfinish = function onfinish() {
    writable = false;
    writableEnded = true;
    if (!readable) callback.call(stream);
  };

  var readableEnded = stream._readableState && stream._readableState.endEmitted;

  var onend = function onend() {
    readable = false;
    readableEnded = true;
    if (!writable) callback.call(stream);
  };

  var onerror = function onerror(err) {
    callback.call(stream, err);
  };

  var onclose = function onclose() {
    var err;

    if (readable && !readableEnded) {
      if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }

    if (writable && !writableEnded) {
      if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
  };

  var onrequest = function onrequest() {
    stream.req.on('finish', onfinish);
  };

  if (isRequest(stream)) {
    stream.on('complete', onfinish);
    stream.on('abort', onclose);
    if (stream.req) onrequest();else stream.on('request', onrequest);
  } else if (writable && !stream._writableState) {
    // legacy streams
    stream.on('end', onlegacyfinish);
    stream.on('close', onlegacyfinish);
  }

  stream.on('end', onend);
  stream.on('finish', onfinish);
  if (opts.error !== false) stream.on('error', onerror);
  stream.on('close', onclose);
  return function () {
    stream.removeListener('complete', onfinish);
    stream.removeListener('abort', onclose);
    stream.removeListener('request', onrequest);
    if (stream.req) stream.req.removeListener('finish', onfinish);
    stream.removeListener('end', onlegacyfinish);
    stream.removeListener('close', onlegacyfinish);
    stream.removeListener('finish', onfinish);
    stream.removeListener('end', onend);
    stream.removeListener('error', onerror);
    stream.removeListener('close', onclose);
  };
}

module.exports = eos;
},{"../../../errors":31}],41:[function(require,module,exports){
module.exports = function () {
  throw new Error('Readable.from is not available in the browser')
};

},{}],42:[function(require,module,exports){
// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';

var eos;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    callback.apply(void 0, arguments);
  };
}

var _require$codes = require('../../../errors').codes,
    ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;

function noop(err) {
  // Rethrow the error if it exists to avoid swallowing it
  if (err) throw err;
}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function destroyer(stream, reading, writing, callback) {
  callback = once(callback);
  var closed = false;
  stream.on('close', function () {
    closed = true;
  });
  if (eos === undefined) eos = require('./end-of-stream');
  eos(stream, {
    readable: reading,
    writable: writing
  }, function (err) {
    if (err) return callback(err);
    closed = true;
    callback();
  });
  var destroyed = false;
  return function (err) {
    if (closed) return;
    if (destroyed) return;
    destroyed = true; // request.destroy just do .end - .abort is what we want

    if (isRequest(stream)) return stream.abort();
    if (typeof stream.destroy === 'function') return stream.destroy();
    callback(err || new ERR_STREAM_DESTROYED('pipe'));
  };
}

function call(fn) {
  fn();
}

function pipe(from, to) {
  return from.pipe(to);
}

function popCallback(streams) {
  if (!streams.length) return noop;
  if (typeof streams[streams.length - 1] !== 'function') return noop;
  return streams.pop();
}

function pipeline() {
  for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
    streams[_key] = arguments[_key];
  }

  var callback = popCallback(streams);
  if (Array.isArray(streams[0])) streams = streams[0];

  if (streams.length < 2) {
    throw new ERR_MISSING_ARGS('streams');
  }

  var error;
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1;
    var writing = i > 0;
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err;
      if (err) destroys.forEach(call);
      if (reading) return;
      destroys.forEach(call);
      callback(error);
    });
  });
  return streams.reduce(pipe);
}

module.exports = pipeline;
},{"../../../errors":31,"./end-of-stream":40}],43:[function(require,module,exports){
'use strict';

var ERR_INVALID_OPT_VALUE = require('../../../errors').codes.ERR_INVALID_OPT_VALUE;

function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
}

function getHighWaterMark(state, options, duplexKey, isDuplex) {
  var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);

  if (hwm != null) {
    if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
      var name = isDuplex ? duplexKey : 'highWaterMark';
      throw new ERR_INVALID_OPT_VALUE(name, hwm);
    }

    return Math.floor(hwm);
  } // Default value


  return state.objectMode ? 16 : 16 * 1024;
}

module.exports = {
  getHighWaterMark: getHighWaterMark
};
},{"../../../errors":31}],44:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":9}],45:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":29}],46:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":47,"punycode":25,"querystring":28}],47:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],48:[function(require,module,exports){
(function (global){(function (){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],49:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],50:[function(require,module,exports){
// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9

'use strict';

var isArgumentsObject = require('is-arguments');
var isGeneratorFunction = require('is-generator-function');
var whichTypedArray = require('which-typed-array');
var isTypedArray = require('is-typed-array');

function uncurryThis(f) {
  return f.call.bind(f);
}

var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';

var ObjectToString = uncurryThis(Object.prototype.toString);

var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);

if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}

if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}

function checkBoxedPrimitive(value, prototypeValueOf) {
  if (typeof value !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch(e) {
    return false;
  }
}

exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
	return (
		(
			typeof Promise !== 'undefined' &&
			input instanceof Promise
		) ||
		(
			input !== null &&
			typeof input === 'object' &&
			typeof input.then === 'function' &&
			typeof input.catch === 'function'
		)
	);
}
exports.isPromise = isPromise;

function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }

  return (
    isTypedArray(value) ||
    isDataView(value)
  );
}
exports.isArrayBufferView = isArrayBufferView;


function isUint8Array(value) {
  return whichTypedArray(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;

function isUint8ClampedArray(value) {
  return whichTypedArray(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;

function isUint16Array(value) {
  return whichTypedArray(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;

function isUint32Array(value) {
  return whichTypedArray(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;

function isInt8Array(value) {
  return whichTypedArray(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;

function isInt16Array(value) {
  return whichTypedArray(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;

function isInt32Array(value) {
  return whichTypedArray(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;

function isFloat32Array(value) {
  return whichTypedArray(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;

function isFloat64Array(value) {
  return whichTypedArray(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;

function isBigInt64Array(value) {
  return whichTypedArray(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;

function isBigUint64Array(value) {
  return whichTypedArray(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;

function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = (
  typeof Map !== 'undefined' &&
  isMapToString(new Map())
);

function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }

  return isMapToString.working
    ? isMapToString(value)
    : value instanceof Map;
}
exports.isMap = isMap;

function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = (
  typeof Set !== 'undefined' &&
  isSetToString(new Set())
);
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }

  return isSetToString.working
    ? isSetToString(value)
    : value instanceof Set;
}
exports.isSet = isSet;

function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = (
  typeof WeakMap !== 'undefined' &&
  isWeakMapToString(new WeakMap())
);
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }

  return isWeakMapToString.working
    ? isWeakMapToString(value)
    : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;

function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = (
  typeof WeakSet !== 'undefined' &&
  isWeakSetToString(new WeakSet())
);
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;

function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  isArrayBufferToString(new ArrayBuffer())
);
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }

  return isArrayBufferToString.working
    ? isArrayBufferToString(value)
    : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  typeof DataView !== 'undefined' &&
  isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
);
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }

  return isDataViewToString.working
    ? isDataViewToString(value)
    : value instanceof DataView;
}
exports.isDataView = isDataView;

// Store a copy of SharedArrayBuffer in case it's deleted elsewhere
var SharedArrayBufferCopy = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined;
function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBufferCopy === 'undefined') {
    return false;
  }

  if (typeof isSharedArrayBufferToString.working === 'undefined') {
    isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy());
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBufferCopy;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;

function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;

function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;

function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;

function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;

function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;

function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;

function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;

function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;

function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;

function isBoxedPrimitive(value) {
  return (
    isNumberObject(value) ||
    isStringObject(value) ||
    isBooleanObject(value) ||
    isBigIntObject(value) ||
    isSymbolObject(value)
  );
}
exports.isBoxedPrimitive = isBoxedPrimitive;

function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (
    isArrayBuffer(value) ||
    isSharedArrayBuffer(value)
  );
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;

['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function(method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});

},{"is-arguments":20,"is-generator-function":22,"is-typed-array":23,"which-typed-array":52}],51:[function(require,module,exports){
(function (process){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/,/g, '$|^')
    .toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function(set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types = require('./support/types');

function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
exports.types.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}

exports.promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb.bind(null, null, ret)) },
            function(rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)) });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;

}).call(this)}).call(this,require('_process'))
},{"./support/isBuffer":49,"./support/types":50,"_process":24,"inherits":19}],52:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('for-each');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasToStringTag = require('has-tostringtag/shams')();

var g = typeof globalThis === 'undefined' ? global : globalThis;
var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof g[typedArray] === 'function') {
			var arr = new g[typedArray]();
			if (Symbol.toStringTag in arr) {
				var proto = getPrototypeOf(arr);
				var descriptor = gOPD(proto, Symbol.toStringTag);
				if (!descriptor) {
					var superProto = getPrototypeOf(proto);
					descriptor = gOPD(superProto, Symbol.toStringTag);
				}
				toStrTags[typedArray] = descriptor.get;
			}
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var foundName = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!foundName) {
			try {
				var name = getter.call(value);
				if (name === typedArray) {
					foundName = name;
				}
			} catch (e) {}
		}
	});
	return foundName;
};

var isTypedArray = require('is-typed-array');

module.exports = function whichTypedArray(value) {
	if (!isTypedArray(value)) { return false; }
	if (!hasToStringTag || !(Symbol.toStringTag in value)) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":2,"call-bind/callBound":6,"es-abstract/helpers/getOwnPropertyDescriptor":8,"for-each":10,"has-tostringtag/shams":16,"is-typed-array":23}],53:[function(require,module,exports){
/*
 A JavaScript implementation of the SHA family of hashes, as
 defined in FIPS PUB 180-2 as well as the corresponding HMAC implementation
 as defined in FIPS PUB 198a

 Copyright Brian Turek 2008-2015
 Distributed under the BSD License
 See http://caligatio.github.com/jsSHA/ for more information

 Several functions taken from Paul Johnston
*/
'use strict';(function(T){function y(c,a,d){var b=0,f=[],k=0,g,e,n,h,m,u,r,p=!1,q=!1,t=[],v=[],x,w=!1;d=d||{};g=d.encoding||"UTF8";x=d.numRounds||1;n=J(a,g);if(x!==parseInt(x,10)||1>x)throw Error("numRounds must a integer >= 1");if("SHA-1"===c)m=512,u=K,r=U,h=160;else if(u=function(a,d){return L(a,d,c)},r=function(a,d,b,f){var k,e;if("SHA-224"===c||"SHA-256"===c)k=(d+65>>>9<<4)+15,e=16;else if("SHA-384"===c||"SHA-512"===c)k=(d+129>>>10<<5)+31,e=32;else throw Error("Unexpected error in SHA-2 implementation");
for(;a.length<=k;)a.push(0);a[d>>>5]|=128<<24-d%32;a[k]=d+b;b=a.length;for(d=0;d<b;d+=e)f=L(a.slice(d,d+e),f,c);if("SHA-224"===c)a=[f[0],f[1],f[2],f[3],f[4],f[5],f[6]];else if("SHA-256"===c)a=f;else if("SHA-384"===c)a=[f[0].a,f[0].b,f[1].a,f[1].b,f[2].a,f[2].b,f[3].a,f[3].b,f[4].a,f[4].b,f[5].a,f[5].b];else if("SHA-512"===c)a=[f[0].a,f[0].b,f[1].a,f[1].b,f[2].a,f[2].b,f[3].a,f[3].b,f[4].a,f[4].b,f[5].a,f[5].b,f[6].a,f[6].b,f[7].a,f[7].b];else throw Error("Unexpected error in SHA-2 implementation");
return a},"SHA-224"===c)m=512,h=224;else if("SHA-256"===c)m=512,h=256;else if("SHA-384"===c)m=1024,h=384;else if("SHA-512"===c)m=1024,h=512;else throw Error("Chosen SHA variant is not supported");e=z(c);this.setHMACKey=function(a,d,f){var k;if(!0===q)throw Error("HMAC key already set");if(!0===p)throw Error("Cannot set HMAC key after finalizing hash");if(!0===w)throw Error("Cannot set HMAC key after calling update");g=(f||{}).encoding||"UTF8";d=J(d,g)(a);a=d.binLen;d=d.value;k=m>>>3;f=k/4-1;if(k<
a/8){for(d=r(d,a,0,z(c));d.length<=f;)d.push(0);d[f]&=4294967040}else if(k>a/8){for(;d.length<=f;)d.push(0);d[f]&=4294967040}for(a=0;a<=f;a+=1)t[a]=d[a]^909522486,v[a]=d[a]^1549556828;e=u(t,e);b=m;q=!0};this.update=function(a){var c,d,g,h=0,p=m>>>5;c=n(a,f,k);a=c.binLen;d=c.value;c=a>>>5;for(g=0;g<c;g+=p)h+m<=a&&(e=u(d.slice(g,g+p),e),h+=m);b+=h;f=d.slice(h>>>5);k=a%m;w=!0};this.getHash=function(a,d){var g,m,n;if(!0===q)throw Error("Cannot call getHash after setting HMAC key");n=M(d);switch(a){case "HEX":g=
function(a){return N(a,n)};break;case "B64":g=function(a){return O(a,n)};break;case "BYTES":g=P;break;default:throw Error("format must be HEX, B64, or BYTES");}if(!1===p)for(e=r(f,k,b,e),m=1;m<x;m+=1)e=r(e,h,0,z(c));p=!0;return g(e)};this.getHMAC=function(a,d){var g,n,t;if(!1===q)throw Error("Cannot call getHMAC without first setting HMAC key");t=M(d);switch(a){case "HEX":g=function(a){return N(a,t)};break;case "B64":g=function(a){return O(a,t)};break;case "BYTES":g=P;break;default:throw Error("outputFormat must be HEX, B64, or BYTES");
}!1===p&&(n=r(f,k,b,e),e=u(v,z(c)),e=r(n,h,m,e));p=!0;return g(e)}}function b(c,a){this.a=c;this.b=a}function V(c,a,d){var b=c.length,f,k,e,l,n;a=a||[0];d=d||0;n=d>>>3;if(0!==b%2)throw Error("String of HEX type must be in byte increments");for(f=0;f<b;f+=2){k=parseInt(c.substr(f,2),16);if(isNaN(k))throw Error("String of HEX type contains invalid characters");l=(f>>>1)+n;for(e=l>>>2;a.length<=e;)a.push(0);a[e]|=k<<8*(3-l%4)}return{value:a,binLen:4*b+d}}function W(c,a,d){var b=[],f,k,e,l,b=a||[0];d=
d||0;k=d>>>3;for(f=0;f<c.length;f+=1)a=c.charCodeAt(f),l=f+k,e=l>>>2,b.length<=e&&b.push(0),b[e]|=a<<8*(3-l%4);return{value:b,binLen:8*c.length+d}}function X(c,a,d){var b=[],f=0,e,g,l,n,h,m,b=a||[0];d=d||0;a=d>>>3;if(-1===c.search(/^[a-zA-Z0-9=+\/]+$/))throw Error("Invalid character in base-64 string");g=c.indexOf("=");c=c.replace(/\=/g,"");if(-1!==g&&g<c.length)throw Error("Invalid '=' found in base-64 string");for(g=0;g<c.length;g+=4){h=c.substr(g,4);for(l=n=0;l<h.length;l+=1)e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(h[l]),
n|=e<<18-6*l;for(l=0;l<h.length-1;l+=1){m=f+a;for(e=m>>>2;b.length<=e;)b.push(0);b[e]|=(n>>>16-8*l&255)<<8*(3-m%4);f+=1}}return{value:b,binLen:8*f+d}}function N(c,a){var d="",b=4*c.length,f,e;for(f=0;f<b;f+=1)e=c[f>>>2]>>>8*(3-f%4),d+="0123456789abcdef".charAt(e>>>4&15)+"0123456789abcdef".charAt(e&15);return a.outputUpper?d.toUpperCase():d}function O(c,a){var d="",b=4*c.length,f,e,g;for(f=0;f<b;f+=3)for(g=f+1>>>2,e=c.length<=g?0:c[g],g=f+2>>>2,g=c.length<=g?0:c[g],g=(c[f>>>2]>>>8*(3-f%4)&255)<<16|
(e>>>8*(3-(f+1)%4)&255)<<8|g>>>8*(3-(f+2)%4)&255,e=0;4>e;e+=1)8*f+6*e<=32*c.length?d+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(g>>>6*(3-e)&63):d+=a.b64Pad;return d}function P(c){var a="",d=4*c.length,b,f;for(b=0;b<d;b+=1)f=c[b>>>2]>>>8*(3-b%4)&255,a+=String.fromCharCode(f);return a}function M(c){var a={outputUpper:!1,b64Pad:"="};c=c||{};a.outputUpper=c.outputUpper||!1;!0===c.hasOwnProperty("b64Pad")&&(a.b64Pad=c.b64Pad);if("boolean"!==typeof a.outputUpper)throw Error("Invalid outputUpper formatting option");
if("string"!==typeof a.b64Pad)throw Error("Invalid b64Pad formatting option");return a}function J(c,a){var d;switch(a){case "UTF8":case "UTF16BE":case "UTF16LE":break;default:throw Error("encoding must be UTF8, UTF16BE, or UTF16LE");}switch(c){case "HEX":d=V;break;case "TEXT":d=function(c,d,b){var e=[],l=[],n=0,h,m,u,r,p,e=d||[0];d=b||0;u=d>>>3;if("UTF8"===a)for(h=0;h<c.length;h+=1)for(b=c.charCodeAt(h),l=[],128>b?l.push(b):2048>b?(l.push(192|b>>>6),l.push(128|b&63)):55296>b||57344<=b?l.push(224|
b>>>12,128|b>>>6&63,128|b&63):(h+=1,b=65536+((b&1023)<<10|c.charCodeAt(h)&1023),l.push(240|b>>>18,128|b>>>12&63,128|b>>>6&63,128|b&63)),m=0;m<l.length;m+=1){p=n+u;for(r=p>>>2;e.length<=r;)e.push(0);e[r]|=l[m]<<8*(3-p%4);n+=1}else if("UTF16BE"===a||"UTF16LE"===a)for(h=0;h<c.length;h+=1){b=c.charCodeAt(h);"UTF16LE"===a&&(m=b&255,b=m<<8|b>>>8);p=n+u;for(r=p>>>2;e.length<=r;)e.push(0);e[r]|=b<<8*(2-p%4);n+=2}return{value:e,binLen:8*n+d}};break;case "B64":d=X;break;case "BYTES":d=W;break;default:throw Error("format must be HEX, TEXT, B64, or BYTES");
}return d}function w(c,a){return c<<a|c>>>32-a}function q(c,a){return c>>>a|c<<32-a}function v(c,a){var d=null,d=new b(c.a,c.b);return d=32>=a?new b(d.a>>>a|d.b<<32-a&4294967295,d.b>>>a|d.a<<32-a&4294967295):new b(d.b>>>a-32|d.a<<64-a&4294967295,d.a>>>a-32|d.b<<64-a&4294967295)}function Q(c,a){var d=null;return d=32>=a?new b(c.a>>>a,c.b>>>a|c.a<<32-a&4294967295):new b(0,c.a>>>a-32)}function Y(c,a,d){return c&a^~c&d}function Z(c,a,d){return new b(c.a&a.a^~c.a&d.a,c.b&a.b^~c.b&d.b)}function R(c,a,d){return c&
a^c&d^a&d}function aa(c,a,d){return new b(c.a&a.a^c.a&d.a^a.a&d.a,c.b&a.b^c.b&d.b^a.b&d.b)}function ba(c){return q(c,2)^q(c,13)^q(c,22)}function ca(c){var a=v(c,28),d=v(c,34);c=v(c,39);return new b(a.a^d.a^c.a,a.b^d.b^c.b)}function da(c){return q(c,6)^q(c,11)^q(c,25)}function ea(c){var a=v(c,14),d=v(c,18);c=v(c,41);return new b(a.a^d.a^c.a,a.b^d.b^c.b)}function fa(c){return q(c,7)^q(c,18)^c>>>3}function ga(c){var a=v(c,1),d=v(c,8);c=Q(c,7);return new b(a.a^d.a^c.a,a.b^d.b^c.b)}function ha(c){return q(c,
17)^q(c,19)^c>>>10}function ia(c){var a=v(c,19),d=v(c,61);c=Q(c,6);return new b(a.a^d.a^c.a,a.b^d.b^c.b)}function B(c,a){var d=(c&65535)+(a&65535);return((c>>>16)+(a>>>16)+(d>>>16)&65535)<<16|d&65535}function ja(c,a,d,b){var f=(c&65535)+(a&65535)+(d&65535)+(b&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(b>>>16)+(f>>>16)&65535)<<16|f&65535}function C(c,a,d,b,f){var e=(c&65535)+(a&65535)+(d&65535)+(b&65535)+(f&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(b>>>16)+(f>>>16)+(e>>>16)&65535)<<16|e&65535}function ka(c,
a){var d,e,f;d=(c.b&65535)+(a.b&65535);e=(c.b>>>16)+(a.b>>>16)+(d>>>16);f=(e&65535)<<16|d&65535;d=(c.a&65535)+(a.a&65535)+(e>>>16);e=(c.a>>>16)+(a.a>>>16)+(d>>>16);return new b((e&65535)<<16|d&65535,f)}function la(c,a,d,e){var f,k,g;f=(c.b&65535)+(a.b&65535)+(d.b&65535)+(e.b&65535);k=(c.b>>>16)+(a.b>>>16)+(d.b>>>16)+(e.b>>>16)+(f>>>16);g=(k&65535)<<16|f&65535;f=(c.a&65535)+(a.a&65535)+(d.a&65535)+(e.a&65535)+(k>>>16);k=(c.a>>>16)+(a.a>>>16)+(d.a>>>16)+(e.a>>>16)+(f>>>16);return new b((k&65535)<<16|
f&65535,g)}function ma(c,a,d,e,f){var k,g,l;k=(c.b&65535)+(a.b&65535)+(d.b&65535)+(e.b&65535)+(f.b&65535);g=(c.b>>>16)+(a.b>>>16)+(d.b>>>16)+(e.b>>>16)+(f.b>>>16)+(k>>>16);l=(g&65535)<<16|k&65535;k=(c.a&65535)+(a.a&65535)+(d.a&65535)+(e.a&65535)+(f.a&65535)+(g>>>16);g=(c.a>>>16)+(a.a>>>16)+(d.a>>>16)+(e.a>>>16)+(f.a>>>16)+(k>>>16);return new b((g&65535)<<16|k&65535,l)}function z(c){var a,d;if("SHA-1"===c)c=[1732584193,4023233417,2562383102,271733878,3285377520];else switch(a=[3238371032,914150663,
812702999,4144912697,4290775857,1750603025,1694076839,3204075428],d=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],c){case "SHA-224":c=a;break;case "SHA-256":c=d;break;case "SHA-384":c=[new b(3418070365,a[0]),new b(1654270250,a[1]),new b(2438529370,a[2]),new b(355462360,a[3]),new b(1731405415,a[4]),new b(41048885895,a[5]),new b(3675008525,a[6]),new b(1203062813,a[7])];break;case "SHA-512":c=[new b(d[0],4089235720),new b(d[1],2227873595),new b(d[2],4271175723),
new b(d[3],1595750129),new b(d[4],2917565137),new b(d[5],725511199),new b(d[6],4215389547),new b(d[7],327033209)];break;default:throw Error("Unknown SHA variant");}return c}function K(c,a){var d=[],b,e,k,g,l,n,h;b=a[0];e=a[1];k=a[2];g=a[3];l=a[4];for(h=0;80>h;h+=1)d[h]=16>h?c[h]:w(d[h-3]^d[h-8]^d[h-14]^d[h-16],1),n=20>h?C(w(b,5),e&k^~e&g,l,1518500249,d[h]):40>h?C(w(b,5),e^k^g,l,1859775393,d[h]):60>h?C(w(b,5),R(e,k,g),l,2400959708,d[h]):C(w(b,5),e^k^g,l,3395469782,d[h]),l=g,g=k,k=w(e,30),e=b,b=n;a[0]=
B(b,a[0]);a[1]=B(e,a[1]);a[2]=B(k,a[2]);a[3]=B(g,a[3]);a[4]=B(l,a[4]);return a}function U(c,a,b,e){var f;for(f=(a+65>>>9<<4)+15;c.length<=f;)c.push(0);c[a>>>5]|=128<<24-a%32;c[f]=a+b;b=c.length;for(a=0;a<b;a+=16)e=K(c.slice(a,a+16),e);return e}function L(c,a,d){var q,f,k,g,l,n,h,m,u,r,p,v,t,w,x,y,z,D,E,F,G,H,A=[],I;if("SHA-224"===d||"SHA-256"===d)r=64,v=1,H=Number,t=B,w=ja,x=C,y=fa,z=ha,D=ba,E=da,G=R,F=Y,I=e;else if("SHA-384"===d||"SHA-512"===d)r=80,v=2,H=b,t=ka,w=la,x=ma,y=ga,z=ia,D=ca,E=ea,G=aa,
F=Z,I=S;else throw Error("Unexpected error in SHA-2 implementation");d=a[0];q=a[1];f=a[2];k=a[3];g=a[4];l=a[5];n=a[6];h=a[7];for(p=0;p<r;p+=1)16>p?(u=p*v,m=c.length<=u?0:c[u],u=c.length<=u+1?0:c[u+1],A[p]=new H(m,u)):A[p]=w(z(A[p-2]),A[p-7],y(A[p-15]),A[p-16]),m=x(h,E(g),F(g,l,n),I[p],A[p]),u=t(D(d),G(d,q,f)),h=n,n=l,l=g,g=t(k,m),k=f,f=q,q=d,d=t(m,u);a[0]=t(d,a[0]);a[1]=t(q,a[1]);a[2]=t(f,a[2]);a[3]=t(k,a[3]);a[4]=t(g,a[4]);a[5]=t(l,a[5]);a[6]=t(n,a[6]);a[7]=t(h,a[7]);return a}var e,S;e=[1116352408,
1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,
430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];S=[new b(e[0],3609767458),new b(e[1],602891725),new b(e[2],3964484399),new b(e[3],2173295548),new b(e[4],4081628472),new b(e[5],3053834265),new b(e[6],2937671579),new b(e[7],3664609560),new b(e[8],2734883394),new b(e[9],1164996542),new b(e[10],1323610764),new b(e[11],3590304994),new b(e[12],4068182383),new b(e[13],991336113),new b(e[14],
633803317),new b(e[15],3479774868),new b(e[16],2666613458),new b(e[17],944711139),new b(e[18],2341262773),new b(e[19],2007800933),new b(e[20],1495990901),new b(e[21],1856431235),new b(e[22],3175218132),new b(e[23],2198950837),new b(e[24],3999719339),new b(e[25],766784016),new b(e[26],2566594879),new b(e[27],3203337956),new b(e[28],1034457026),new b(e[29],2466948901),new b(e[30],3758326383),new b(e[31],168717936),new b(e[32],1188179964),new b(e[33],1546045734),new b(e[34],1522805485),new b(e[35],2643833823),
new b(e[36],2343527390),new b(e[37],1014477480),new b(e[38],1206759142),new b(e[39],344077627),new b(e[40],1290863460),new b(e[41],3158454273),new b(e[42],3505952657),new b(e[43],106217008),new b(e[44],3606008344),new b(e[45],1432725776),new b(e[46],1467031594),new b(e[47],851169720),new b(e[48],3100823752),new b(e[49],1363258195),new b(e[50],3750685593),new b(e[51],3785050280),new b(e[52],3318307427),new b(e[53],3812723403),new b(e[54],2003034995),new b(e[55],3602036899),new b(e[56],1575990012),
new b(e[57],1125592928),new b(e[58],2716904306),new b(e[59],442776044),new b(e[60],593698344),new b(e[61],3733110249),new b(e[62],2999351573),new b(e[63],3815920427),new b(3391569614,3928383900),new b(3515267271,566280711),new b(3940187606,3454069534),new b(4118630271,4000239992),new b(116418474,1914138554),new b(174292421,2731055270),new b(289380356,3203993006),new b(460393269,320620315),new b(685471733,587496836),new b(852142971,1086792851),new b(1017036298,365543100),new b(1126000580,2618297676),
new b(1288033470,3409855158),new b(1501505948,4234509866),new b(1607167915,987167468),new b(1816402316,1246189591)];"function"===typeof define&&define.amd?define(function(){return y}):"undefined"!==typeof exports?"undefined"!==typeof module&&module.exports?module.exports=exports=y:exports=y:T.jsSHA=y})(this);

},{}],54:[function(require,module,exports){
(function (factory) {
    if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(factory);
    } else {
        // Browser globals (with support for web workers)
        var glob;

        try {
            glob = window;
        } catch (e) {
            glob = self;
        }

        glob.SparkMD5 = factory();
    }
}(function (undefined) {

    'use strict';

    /*
     * Fastest md5 implementation around (JKM md5).
     * Credits: Joseph Myers
     *
     * @see http://www.myersdaily.org/joseph/javascript/md5-text.html
     * @see http://jsperf.com/md5-shootout/7
     */

    /* this function is much faster,
      so if possible we use it. Some IEs
      are the only ones I know of that
      need the idiotic second function,
      generated by an if clause.  */
    var add32 = function (a, b) {
        return (a + b) & 0xFFFFFFFF;
    },
        hex_chr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];


    function cmn(q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    }

    function ff(a, b, c, d, x, s, t) {
        return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function gg(a, b, c, d, x, s, t) {
        return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function hh(a, b, c, d, x, s, t) {
        return cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function ii(a, b, c, d, x, s, t) {
        return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function md5cycle(x, k) {
        var a = x[0],
            b = x[1],
            c = x[2],
            d = x[3];

        a = ff(a, b, c, d, k[0], 7, -680876936);
        d = ff(d, a, b, c, k[1], 12, -389564586);
        c = ff(c, d, a, b, k[2], 17, 606105819);
        b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897);
        d = ff(d, a, b, c, k[5], 12, 1200080426);
        c = ff(c, d, a, b, k[6], 17, -1473231341);
        b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416);
        d = ff(d, a, b, c, k[9], 12, -1958414417);
        c = ff(c, d, a, b, k[10], 17, -42063);
        b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682);
        d = ff(d, a, b, c, k[13], 12, -40341101);
        c = ff(c, d, a, b, k[14], 17, -1502002290);
        b = ff(b, c, d, a, k[15], 22, 1236535329);

        a = gg(a, b, c, d, k[1], 5, -165796510);
        d = gg(d, a, b, c, k[6], 9, -1069501632);
        c = gg(c, d, a, b, k[11], 14, 643717713);
        b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691);
        d = gg(d, a, b, c, k[10], 9, 38016083);
        c = gg(c, d, a, b, k[15], 14, -660478335);
        b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438);
        d = gg(d, a, b, c, k[14], 9, -1019803690);
        c = gg(c, d, a, b, k[3], 14, -187363961);
        b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467);
        d = gg(d, a, b, c, k[2], 9, -51403784);
        c = gg(c, d, a, b, k[7], 14, 1735328473);
        b = gg(b, c, d, a, k[12], 20, -1926607734);

        a = hh(a, b, c, d, k[5], 4, -378558);
        d = hh(d, a, b, c, k[8], 11, -2022574463);
        c = hh(c, d, a, b, k[11], 16, 1839030562);
        b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060);
        d = hh(d, a, b, c, k[4], 11, 1272893353);
        c = hh(c, d, a, b, k[7], 16, -155497632);
        b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174);
        d = hh(d, a, b, c, k[0], 11, -358537222);
        c = hh(c, d, a, b, k[3], 16, -722521979);
        b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487);
        d = hh(d, a, b, c, k[12], 11, -421815835);
        c = hh(c, d, a, b, k[15], 16, 530742520);
        b = hh(b, c, d, a, k[2], 23, -995338651);

        a = ii(a, b, c, d, k[0], 6, -198630844);
        d = ii(d, a, b, c, k[7], 10, 1126891415);
        c = ii(c, d, a, b, k[14], 15, -1416354905);
        b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571);
        d = ii(d, a, b, c, k[3], 10, -1894986606);
        c = ii(c, d, a, b, k[10], 15, -1051523);
        b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359);
        d = ii(d, a, b, c, k[15], 10, -30611744);
        c = ii(c, d, a, b, k[6], 15, -1560198380);
        b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070);
        d = ii(d, a, b, c, k[11], 10, -1120210379);
        c = ii(c, d, a, b, k[2], 15, 718787259);
        b = ii(b, c, d, a, k[9], 21, -343485551);

        x[0] = add32(a, x[0]);
        x[1] = add32(b, x[1]);
        x[2] = add32(c, x[2]);
        x[3] = add32(d, x[3]);
    }

    function md5blk(s) {
        var md5blks = [],
            i; /* Andy King said do it this way. */

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    }

    function md5blk_array(a) {
        var md5blks = [],
            i; /* Andy King said do it this way. */

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
        }
        return md5blks;
    }

    function md51(s) {
        var n = s.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i,
            length,
            tail,
            tmp,
            lo,
            hi;

        for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk(s.substring(i - 64, i)));
        }
        s = s.substring(i - 64);
        length = s.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        }
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Beware that the final length might not fit in 32 bits so we take care of that
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;

        md5cycle(state, tail);
        return state;
    }

    function md51_array(a) {
        var n = a.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i,
            length,
            tail,
            tmp,
            lo,
            hi;

        for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
        }

        // Not sure if it is a bug, however IE10 will always produce a sub array of length 1
        // containing the last element of the parent array if the sub array specified starts
        // beyond the length of the parent array - weird.
        // https://connect.microsoft.com/IE/feedback/details/771452/typed-array-subarray-issue
        a = (i - 64) < n ? a.subarray(i - 64) : new Uint8Array(0);

        length = a.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= a[i] << ((i % 4) << 3);
        }

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Beware that the final length might not fit in 32 bits so we take care of that
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;

        md5cycle(state, tail);

        return state;
    }

    function rhex(n) {
        var s = '',
            j;
        for (j = 0; j < 4; j += 1) {
            s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
        }
        return s;
    }

    function hex(x) {
        var i;
        for (i = 0; i < x.length; i += 1) {
            x[i] = rhex(x[i]);
        }
        return x.join('');
    }

    // In some cases the fast add32 function cannot be used..
    if (hex(md51('hello')) !== '5d41402abc4b2a76b9719d911017c592') {
        add32 = function (x, y) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        };
    }

    // ---------------------------------------------------

    /**
     * ArrayBuffer slice polyfill.
     *
     * @see https://github.com/ttaubert/node-arraybuffer-slice
     */

    if (typeof ArrayBuffer !== 'undefined' && !ArrayBuffer.prototype.slice) {
        (function () {
            function clamp(val, length) {
                val = (val | 0) || 0;

                if (val < 0) {
                    return Math.max(val + length, 0);
                }

                return Math.min(val, length);
            }

            ArrayBuffer.prototype.slice = function (from, to) {
                var length = this.byteLength,
                    begin = clamp(from, length),
                    end = length,
                    num,
                    target,
                    targetArray,
                    sourceArray;

                if (to !== undefined) {
                    end = clamp(to, length);
                }

                if (begin > end) {
                    return new ArrayBuffer(0);
                }

                num = end - begin;
                target = new ArrayBuffer(num);
                targetArray = new Uint8Array(target);

                sourceArray = new Uint8Array(this, begin, num);
                targetArray.set(sourceArray);

                return target;
            };
        })();
    }

    // ---------------------------------------------------

    /**
     * Helpers.
     */

    function toUtf8(str) {
        if (/[\u0080-\uFFFF]/.test(str)) {
            str = unescape(encodeURIComponent(str));
        }

        return str;
    }

    function utf8Str2ArrayBuffer(str, returnUInt8Array) {
        var length = str.length,
           buff = new ArrayBuffer(length),
           arr = new Uint8Array(buff),
           i;

        for (i = 0; i < length; i++) {
            arr[i] = str.charCodeAt(i);
        }

        return returnUInt8Array ? arr : buff;
    }

    function arrayBuffer2Utf8Str(buff) {
        return String.fromCharCode.apply(null, new Uint8Array(buff));
    }

    function concatenateArrayBuffers(first, second, returnUInt8Array) {
        var result = new Uint8Array(first.byteLength + second.byteLength);

        result.set(new Uint8Array(first));
        result.set(new Uint8Array(second), first.byteLength);

        return returnUInt8Array ? result : result.buffer;
    }

    // ---------------------------------------------------

    /**
     * SparkMD5 OOP implementation.
     *
     * Use this class to perform an incremental md5, otherwise use the
     * static methods instead.
     */

    function SparkMD5() {
        // call reset to init the instance
        this.reset();
    }

    /**
     * Appends a string.
     * A conversion will be applied if an utf8 string is detected.
     *
     * @param {String} str The string to be appended
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.append = function (str) {
        // Converts the string to utf8 bytes if necessary
        // Then append as binary
        this.appendBinary(toUtf8(str));

        return this;
    };

    /**
     * Appends a binary string.
     *
     * @param {String} contents The binary string to be appended
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.appendBinary = function (contents) {
        this._buff += contents;
        this._length += contents.length;

        var length = this._buff.length,
            i;

        for (i = 64; i <= length; i += 64) {
            md5cycle(this._hash, md5blk(this._buff.substring(i - 64, i)));
        }

        this._buff = this._buff.substring(i - 64);

        return this;
    };

    /**
     * Finishes the incremental computation, reseting the internal state and
     * returning the result.
     * Use the raw parameter to obtain the raw result instead of the hex one.
     *
     * @param {Boolean} raw True to get the raw result, false to get the hex result
     *
     * @return {String|Array} The result
     */
    SparkMD5.prototype.end = function (raw) {
        var buff = this._buff,
            length = buff.length,
            i,
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ret;

        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff.charCodeAt(i) << ((i % 4) << 3);
        }

        this._finish(tail, length);
        ret = !!raw ? this._hash : hex(this._hash);

        this.reset();

        return ret;
    };

    /**
     * Resets the internal state of the computation.
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.reset = function () {
        this._buff = '';
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];

        return this;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @return {Object} The state
     */
    SparkMD5.prototype.getState = function () {
        return {
            buff: this._buff,
            length: this._length,
            hash: this._hash
        };
    };

    /**
     * Gets the internal state of the computation.
     *
     * @param {Object} state The state
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.setState = function (state) {
        this._buff = state.buff;
        this._length = state.length;
        this._hash = state.hash;

        return this;
    };

    /**
     * Releases memory used by the incremental buffer and other additional
     * resources. If you plan to use the instance again, use reset instead.
     */
    SparkMD5.prototype.destroy = function () {
        delete this._hash;
        delete this._buff;
        delete this._length;
    };

    /**
     * Finish the final calculation based on the tail.
     *
     * @param {Array}  tail   The tail (will be modified)
     * @param {Number} length The length of the remaining buffer
     */
    SparkMD5.prototype._finish = function (tail, length) {
        var i = length,
            tmp,
            lo,
            hi;

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(this._hash, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Do the final computation based on the tail and length
        // Beware that the final length may not fit in 32 bits so we take care of that
        tmp = this._length * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;
        md5cycle(this._hash, tail);
    };

    /**
     * Performs the md5 hash on a string.
     * A conversion will be applied if utf8 string is detected.
     *
     * @param {String}  str The string
     * @param {Boolean} raw True to get the raw result, false to get the hex result
     *
     * @return {String|Array} The result
     */
    SparkMD5.hash = function (str, raw) {
        // Converts the string to utf8 bytes if necessary
        // Then compute it using the binary function
        return SparkMD5.hashBinary(toUtf8(str), raw);
    };

    /**
     * Performs the md5 hash on a binary string.
     *
     * @param {String}  content The binary string
     * @param {Boolean} raw     True to get the raw result, false to get the hex result
     *
     * @return {String|Array} The result
     */
    SparkMD5.hashBinary = function (content, raw) {
        var hash = md51(content);

        return !!raw ? hash : hex(hash);
    };

    // ---------------------------------------------------

    /**
     * SparkMD5 OOP implementation for array buffers.
     *
     * Use this class to perform an incremental md5 ONLY for array buffers.
     */
    SparkMD5.ArrayBuffer = function () {
        // call reset to init the instance
        this.reset();
    };

    /**
     * Appends an array buffer.
     *
     * @param {ArrayBuffer} arr The array to be appended
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.append = function (arr) {
        var buff = concatenateArrayBuffers(this._buff.buffer, arr, true),
            length = buff.length,
            i;

        this._length += arr.byteLength;

        for (i = 64; i <= length; i += 64) {
            md5cycle(this._hash, md5blk_array(buff.subarray(i - 64, i)));
        }

        this._buff = (i - 64) < length ? new Uint8Array(buff.buffer.slice(i - 64)) : new Uint8Array(0);

        return this;
    };

    /**
     * Finishes the incremental computation, reseting the internal state and
     * returning the result.
     * Use the raw parameter to obtain the raw result instead of the hex one.
     *
     * @param {Boolean} raw True to get the raw result, false to get the hex result
     *
     * @return {String|Array} The result
     */
    SparkMD5.ArrayBuffer.prototype.end = function (raw) {
        var buff = this._buff,
            length = buff.length,
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            i,
            ret;

        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff[i] << ((i % 4) << 3);
        }

        this._finish(tail, length);
        ret = !!raw ? this._hash : hex(this._hash);

        this.reset();

        return ret;
    };

    /**
     * Resets the internal state of the computation.
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.reset = function () {
        this._buff = new Uint8Array(0);
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];

        return this;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @return {Object} The state
     */
    SparkMD5.ArrayBuffer.prototype.getState = function () {
        var state = SparkMD5.prototype.getState.call(this);

        // Convert buffer to a string
        state.buff = arrayBuffer2Utf8Str(state.buff);

        return state;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @param {Object} state The state
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.setState = function (state) {
        // Convert string to buffer
        state.buff = utf8Str2ArrayBuffer(state.buff, true);

        return SparkMD5.prototype.setState.call(this, state);
    };

    SparkMD5.ArrayBuffer.prototype.destroy = SparkMD5.prototype.destroy;

    SparkMD5.ArrayBuffer.prototype._finish = SparkMD5.prototype._finish;

    /**
     * Performs the md5 hash on an array buffer.
     *
     * @param {ArrayBuffer} arr The array buffer
     * @param {Boolean}     raw True to get the raw result, false to get the hex result
     *
     * @return {String|Array} The result
     */
    SparkMD5.ArrayBuffer.hash = function (arr, raw) {
        var hash = md51_array(new Uint8Array(arr));

        return !!raw ? hash : hex(hash);
    };

    return SparkMD5;
}));

},{}],55:[function(require,module,exports){
window.ALY = module.exports = require('./lib/core');
require('./lib/http/xhr');

require('./lib/services/oss');
require('./lib/services/opensearch');
require('./lib/services/batchcompute');

ALY.ECS = ALY.Service.defineService('ecs', ['2014-05-26']);
ALY.RDS = ALY.Service.defineService('rds', ['2014-08-15']);
ALY.SLB = ALY.Service.defineService('slb', ['2014-05-15']);
ALY.CDN = ALY.Service.defineService('cdn', ['2014-11-11']);
ALY.STS = ALY.Service.defineService('sts', ['2015-04-01']);
ALY.ESS = ALY.Service.defineService('ess', ['2014-08-28']);

},{"./lib/core":57,"./lib/http/xhr":60,"./lib/services/batchcompute":73,"./lib/services/opensearch":74,"./lib/services/oss":75}],56:[function(require,module,exports){
var ALY = require('./core');

ALY.Config = ALY.util.inherit({

  constructor: function Config(options) {
    if (options === undefined) options = {};

    ALY.util.each.call(this, this.keys, function (key, value) {
      this.set(key, options[key], value);
    });
  },

  clear: function clear() {
    /*jshint forin:false */
    ALY.util.each.call(this, this.keys, function (key) {
      delete this[key];
    });

    // reset credential provider
    this.set('credentials', undefined);
    this.set('credentialProvider', undefined);
  },

  getCredentials: function getCredentials() {
    return {
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      securityToken: this.securityToken
    };
  },

  /**
   * Sets a property on the configuration object, allowing for a
   * default value
   * @api private
   */
  set: function set(property, value, defaultValue) {
    if (value === undefined) {
      if (defaultValue === undefined) {
        defaultValue = this.keys[property];
      }
      if (typeof defaultValue === 'function') {
        this[property] = defaultValue.call(this);
      } else {
        this[property] = defaultValue;
      }
    } else {
      this[property] = value;
    }
  },

  keys: {
    accessKeyId: null,
    secretAccessKey: null,
    region: null,
    logger: null,
    apiVersions: {},
    apiVersion: null,
    endpoint: undefined,
    endpointFixed: undefined, // 目前仅对 ots 有效
    httpOptions: {},
    maxRetries: undefined,
    maxRedirects: 10,
    paramValidation: true,
    sslEnabled: true,
    computeChecksums: true,
    securityToken: '',
    cname: false,
    isRequestPayer: false
  }
});

},{"./core":57}],57:[function(require,module,exports){
/**
 * The main ALY namespace
 *
 * @!macro [new] nobrowser
 *   @note This feature is not supported in the browser environment of the SDK.
 */
var ALY = {};
module.exports = ALY;
require('./util');

ALY.util.update(ALY, {

  VERSION: '1.0.0',

  ServiceInterface: {},

  Signers: {},

  XML: {}

});

require('./service');

require('./config');
require('./http');
require('./sequential_executor');
require('./event_listeners');
require('./request');
require('./signers/request_signer');
require('./param_validator');

ALY.events = new ALY.SequentialExecutor();

},{"./config":56,"./event_listeners":58,"./http":59,"./param_validator":62,"./request":63,"./sequential_executor":64,"./service":65,"./signers/request_signer":83,"./util":86}],58:[function(require,module,exports){
var ALY = require('./core');
require('./sequential_executor');
require('./service_interface/json');
require('./service_interface/query');
require('./service_interface/rest');
require('./service_interface/rest_json');
require('./service_interface/rest_xml');
require('./service_interface/pop');
require('./service_interface/top');

ALY.EventListeners = {
  Core: {}
};

ALY.EventListeners = {
  Core: new ALY.SequentialExecutor().addNamedListeners(function(add, addAsync) {

    add('VALIDATE_PARAMETERS', 'validate', function VALIDATE_PARAMETERS(req) {
      var rules = req.service.api.operations[req.operation].input;
      new ALY.ParamValidator().validate(rules, req.params);
    });

    add('SET_CONTENT_LENGTH', 'afterBuild', function SET_CONTENT_LENGTH(req) {
      if (req.httpRequest.headers['Content-Length'] === undefined) {
        var length = ALY.util.string.byteLength(req.httpRequest.body);
        req.httpRequest.headers['Content-Length'] = length;
      }
    });

    add('SET_HTTP_HOST', 'afterBuild', function SET_HTTP_HOST(req) {
      req.httpRequest.headers['Host'] = req.httpRequest.endpoint.host;
    });

    addAsync('SIGN', 'sign', function SIGN(req, done) {
      if (!req.service.api.signatureVersion) return done(); // none

      var credentials = req.service.config.getCredentials();

      try {
        var date = ALY.util.date.getDate();
        var SignerClass = req.service.getSignerClass(req);
        var signer = new SignerClass(req.httpRequest, req.service.api.signingName);

        // add new authorization
        var isRequestPayer = req.service.config.isRequestPayer;
        signer.addAuthorization(credentials, date, isRequestPayer);
      } catch (e) {
        req.response.error = e;
      }
      done();
    });

    add('VALIDATE_RESPONSE', 'validateResponse', function VALIDATE_RESPONSE(resp) {
      if (this.service.successfulResponse(resp, this)) {
        resp.data = {};
        resp.error = null;
      } else {
        resp.data = null;
        resp.error = ALY.util.error(new Error(),
          {code: 'UnknownError', message: 'An unknown error occurred.'});
      }
    });

    addAsync('SEND', 'send', function SEND(resp, done) {
      function callback(httpResp) {
        resp.httpResponse.stream = httpResp;
        resp.httpResponse._abortCallback = done;

        httpResp.on('headers', function onHeaders(statusCode, headers) {
          resp.request.emit('httpHeaders', [statusCode, headers, resp]);

          if (!resp.request.httpRequest._streaming) {
            if (ALY.HttpClient.streamsApiVersion === 2) { // streams2 API check
              httpResp.on('readable', function onReadable() {
                var data = httpResp.read();
                if (data !== null) {
                  resp.request.emit('httpData', [data, resp]);
                }
              });
            } else { // legacy streams API
              httpResp.on('data', function onData(data) {
                resp.request.emit('httpData', [data, resp]);
              });
            }
          }
        });

        httpResp.on('end', function onEnd() {
          resp.request.emit('httpDone');
          done();
        });
      }

      function progress(httpResp) {
        httpResp.on('sendProgress', function onSendProgress(progress) {
          resp.request.emit('httpUploadProgress', [progress, resp]);
        });

        httpResp.on('receiveProgress', function onReceiveProgress(progress) {
          resp.request.emit('httpDownloadProgress', [progress, resp]);
        });
      }

      function error(err) {
        resp.error = ALY.util.error(err, {
          code: 'NetworkingError',
          region: resp.request.httpRequest.region,
          hostname: resp.request.httpRequest.endpoint.hostname,
          retryable: true
        });
        resp.request.emit('httpError', [resp.error, resp], function() {
          done();
        });
      }

      resp.error = null;
      resp.data = null;

      var http = ALY.HttpClient.getInstance();
      var httpOptions = resp.request.service.config.httpOptions || {};
      this.httpRequest.debug();
      var s = http.handleRequest(this.httpRequest, httpOptions, callback, error);
      progress(s);
    });

    add('HTTP_HEADERS', 'httpHeaders',
        function HTTP_HEADERS(statusCode, headers, resp) {
      resp.httpResponse.statusCode = statusCode;
      resp.httpResponse.headers = headers;
      resp.httpResponse.body = new ALY.util.Buffer('');
      resp.httpResponse.buffers = [];
      resp.httpResponse.numBytes = 0;
    });

    add('HTTP_DATA', 'httpData', function HTTP_DATA(chunk, resp) {
      if (chunk) {
        if (ALY.util.isNode()) {
          resp.httpResponse.numBytes += chunk.length;

          var total = resp.httpResponse.headers['content-length'];
          var progress = { loaded: resp.httpResponse.numBytes, total: total };
          resp.request.emit('httpDownloadProgress', [progress, resp]);
        }

        resp.httpResponse.buffers.push(new ALY.util.Buffer(chunk));
      }
    });

    add('HTTP_DONE', 'httpDone', function HTTP_DONE(resp) {
      // convert buffers array into single buffer
      if (resp.httpResponse.buffers && resp.httpResponse.buffers.length > 0) {
        var body = ALY.util.buffer.concat(resp.httpResponse.buffers);
        resp.httpResponse.body = body;
      }
      delete resp.httpResponse.numBytes;
      delete resp.httpResponse.buffers;
    });

    add('FINALIZE_ERROR', 'retry', function FINALIZE_ERROR(resp) {
      if (resp.httpResponse.statusCode) {
        resp.error.statusCode = resp.httpResponse.statusCode;
        if (resp.error.retryable === undefined) {
          resp.error.retryable = this.service.retryableError(resp.error, this);
        }
      }
    });

  }),

  Logger: new ALY.SequentialExecutor().addNamedListeners(function(add) {
    add('LOG_REQUEST', 'complete', function LOG_REQUEST(resp) {
      var req = resp.request;
      var logger = req.service.config.logger;
      if (!logger) return;

      function buildMessage() {
        var time = ALY.util.date.getDate().getTime();
        var delta = (time - req.startTime.getTime()) / 1000;
        var ansi = logger.isTTY ? true : false;
        var status = resp.httpResponse.statusCode;
        var params = require('util').inspect(req.params, true, true);

        var message = '';
        if (ansi) message += '\x1B[33m';
        message += '[ALY ' + req.service.serviceIdentifier + ' ' + status;
        message += ' ' + delta.toString() + 's ' + resp.retryCount + ' retries]';
        if (ansi) message += '\x1B[0;1m';
        message += ' ' + req.operation + '(' + params + ')';
        if (ansi) message += '\x1B[0m';
        return message;
      }

      var message = buildMessage();
      if (typeof logger.log === 'function') {
        logger.log(message);
      } else if (typeof logger.write === 'function') {
        logger.write(message + '\n');
      }
    });
  }),

  Json: new ALY.SequentialExecutor().addNamedListeners(function(add) {
    var svc = ALY.ServiceInterface.Json;
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  }),

  Rest: new ALY.SequentialExecutor().addNamedListeners(function(add) {
    var svc = ALY.ServiceInterface.Rest;
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  }),

  RestJson: new ALY.SequentialExecutor().addNamedListeners(function(add) {
    var svc = ALY.ServiceInterface.RestJson;
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  }),

  Pop: new ALY.SequentialExecutor().addNamedListeners(function(add) {
    var svc = ALY.ServiceInterface.Pop;
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  }),

  Top: new ALY.SequentialExecutor().addNamedListeners(function(add) {
    var svc = ALY.ServiceInterface.Top;
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  }),

  RestXml: new ALY.SequentialExecutor().addNamedListeners(function(add) {
    var svc = ALY.ServiceInterface.RestXml;
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  }),

  Query: new ALY.SequentialExecutor().addNamedListeners(function(add) {
    var svc = ALY.ServiceInterface.Query;
    add('BUILD', 'build', svc.buildRequest);
    add('EXTRACT_DATA', 'extractData', svc.extractData);
    add('EXTRACT_ERROR', 'extractError', svc.extractError);
  })
};

},{"./core":57,"./sequential_executor":64,"./service_interface/json":66,"./service_interface/pop":67,"./service_interface/query":68,"./service_interface/rest":69,"./service_interface/rest_json":70,"./service_interface/rest_xml":71,"./service_interface/top":72,"util":51}],59:[function(require,module,exports){
(function (process){(function (){
var ALY = require('./core');
var inherit = ALY.util.inherit;

ALY.Endpoint = inherit({

  constructor: function Endpoint(endpoint) {
    ALY.util.hideProperties(this, ['slashes', 'auth', 'hash', 'search', 'query']);

    if (typeof endpoint === 'undefined' || endpoint === null) {
      throw new Error('Invalid endpoint: ' + endpoint);
    }

    if (!endpoint.match(/^http/)) {
      throw new Error('错误的 endpoint 格式, 需要以 http 或者 https 开头');
    }

    ALY.util.update(this, ALY.util.urlParse(endpoint));

    // Ensure the port property is set as an integer
    if (this.port) {
      this.port = parseInt(this.port, 10);
    } else {
      this.port = this.protocol === 'https:' ? 443 : 80;
    }
  }

});

ALY.HttpRequest = inherit({

  constructor: function HttpRequest(endpoint, region) {
    this.method = 'POST';
    this.path = endpoint.path || '/';
    this.headers = {};
    this.body = '';
    this.endpoint = endpoint;
    this.region = region;
    this.setUserAgent();
  },

  setUserAgent: function setUserAgent() {
    //var prefix = ALY.util.isBrowser() ? 'X-Aly-' : '';
    //this.headers[prefix + 'User-Agent'] = ALY.util.userAgent();
    //this.headers['x-sdk-client'] = this.headers['User-Agent'] = ALY.util.userAgent();
    // pop 现在不支持 x-sdk-client 在浏览器设置
    this.headers['User-Agent'] = ALY.util.userAgent();
  },

  pathname: function pathname() {
    return this.path.split('?', 1)[0];
  },

  search: function search() {
    return this.path.split('?', 2)[1] || '';
  },

  debug: function () {
    if(process.env.DEBUG == 'aliyun') {
      console.log('-------- HttpRequest Start: --------');
      console.log('method:', this.method);
      console.log('path:', this.path);
      console.log('headers:');
      for(var i in this.headers) {
        if (i == 'constructor')
          continue;
        console.log(i, ':', this.headers[i]);
      };
    }
  }
});

ALY.HttpResponse = inherit({

  constructor: function HttpResponse() {
    this.statusCode = undefined;
    this.headers = {};
    this.body = undefined;
  }
});


ALY.HttpClient = inherit({});

ALY.HttpClient.getInstance = function getInstance() {
  /*jshint newcap:false */
  if (this.singleton === undefined) {
    this.singleton = new this();
  }
  return this.singleton;
};

}).call(this)}).call(this,require('_process'))
},{"./core":57,"_process":24}],60:[function(require,module,exports){
var ALY = require('../core');
var EventEmitter = require('events').EventEmitter;
require('../http');

/**
 * @api private
 */
ALY.XHRClient = ALY.util.inherit({
  handleRequest: function handleRequest(httpRequest, httpOptions, callback, errCallback) {
    var self = this;
    var endpoint = httpRequest.endpoint;
    var emitter = new EventEmitter();
    var href = endpoint.protocol + '//' + endpoint.hostname;
    if (endpoint.port != 80 && endpoint.port != 443) {
      href += ':' + endpoint.port;
    }
    href += httpRequest.path;

    var xhr = new XMLHttpRequest();
    httpRequest.stream = xhr;

    if (httpOptions.timeout) {
      xhr.timeout = httpOptions.timeout;
    }

    xhr.addEventListener('readystatechange', function() {
      try {
        if (xhr.status === 0) return; // 0 code is invalid
      }
      catch (e) { return; }

      if (this.readyState === this.HEADERS_RECEIVED) {
        try { xhr.responseType = 'arraybuffer'; } catch (e) {}
        emitter.statusCode = xhr.status;
        emitter.headers = self.parseHeaders(xhr.getAllResponseHeaders());
        emitter.emit('headers', emitter.statusCode, emitter.headers);
      } else if (this.readyState === this.DONE) {
        self.finishRequest(xhr, emitter);
      }
    }, false);
    xhr.upload.addEventListener('progress', function (evt) {
      emitter.emit('sendProgress', evt);
    });
    xhr.addEventListener('progress', function (evt) {
      emitter.emit('receiveProgress', evt);
    }, false);
    xhr.addEventListener('timeout', function () {
      errCallback(ALY.util.error(new Error('Timeout'), {code: 'TimeoutError'}));
    }, false);
    xhr.addEventListener('error', function () {
      errCallback(ALY.util.error(new Error('Network Failure'), {
        code: 'NetworkingError'
      }));
    }, false);

    callback(emitter);
    xhr.open(httpRequest.method, href, true);
    ALY.util.each(httpRequest.headers, function (key, value) {
      if (key !== 'Content-Length' && key !== 'User-Agent' && key !== 'Host' && key !== 'Date') {
        xhr.setRequestHeader(key, value);
      }
    });

    if (httpRequest.body && typeof httpRequest.body.buffer === 'object') {
      xhr.send(httpRequest.body.buffer); // typed arrays sent as ArrayBuffer
    } else {
      xhr.send(httpRequest.body);
    }

    return emitter;
  },

  parseHeaders: function parseHeaders(rawHeaders) {
    var headers = {};
    ALY.util.arrayEach(rawHeaders.split(/\r?\n/), function (line) {
      var key = line.split(':', 1)[0];
      var value = line.substring(key.length + 2);
      if (key.length > 0) headers[key] = value;
    });
    return headers;
  },

  finishRequest: function finishRequest(xhr, emitter) {
    var buffer;
    if (xhr.responseType === 'arraybuffer' && xhr.response) {
      var ab = xhr.response;
      buffer = new ALY.util.Buffer(ab.byteLength);
      var view = new Uint8Array(ab);
      for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
      }
    }

    try {
      if (!buffer && typeof xhr.responseText === 'string') {
        buffer = new ALY.util.Buffer(xhr.responseText);
      }
    } catch (e) {}

    if (buffer) emitter.emit('data', buffer);
    emitter.emit('end');
  }
});

/**
 * @api private
 */
ALY.HttpClient.prototype = ALY.XHRClient.prototype;

/**
 * @api private
 */
ALY.HttpClient.streamsApiVersion = 1;

},{"../core":57,"../http":59,"events":9}],61:[function(require,module,exports){
var ALY = require('../core');
var inherit = ALY.util.inherit;

/**
 * @api private
 */
ALY.JSON = {};

/**
 * @api private
 */
ALY.JSON.Builder = inherit({

  constructor: function JSONBuilder(rules, options) {
    this.rules = rules;
    this.timestampFormat = options.timestampFormat;
  },

  build: function build(params) {
    return JSON.stringify(this.translate(this.rules, params));
  },

  translate: function translate(rules, value) {
    if (value === null || value === undefined) return undefined;

    if (rules.type == 'structure') {

      // translate structures (hashes with pre-defined keys)
      var struct = {};
      ALY.util.each.call(this, value, function (memberName, memberValue) {
        var memberRules = rules.members[memberName] || {};
        var result = this.translate(memberRules, memberValue);
        if (result !== undefined) struct[memberName] = result;
      });
      return struct;

    } else if (rules.type == 'list') {

      // translate each member of the list
      var list = [];
      ALY.util.arrayEach.call(this, value, function (memberValue) {
        var memberRules = rules.members || {};
        var result = this.translate(memberRules, memberValue);
        if (result !== undefined) list.push(result);
      });
      return list;

    } else if (rules.type == 'map') {

      // translate maps (hashes with user supplied keys)
      var map = {};
      ALY.util.each.call(this, value, function (memberName, memberValue) {
        var memberRules = rules.members || {};
        var result = this.translate(memberRules, memberValue);
        if (result !== undefined) map[memberName] = result;
      });
      return map;

    } else if (rules.type == 'timestamp') {

      var timestampFormat = rules.format || this.timestampFormat;
      return ALY.util.date.format(value, timestampFormat);

    } else if (rules.type == 'integer') {
      return parseInt(value, 10);
    } else if (rules.type == 'float') {
      return parseFloat(value);
    } else {

      // all other shapes
      return value;

    }
  }

});

},{"../core":57}],62:[function(require,module,exports){
var ALY = require('./core');

/**
 * @api private
 */
ALY.ParamValidator = ALY.util.inherit({
  validate: function validate(rules, params, context) {
    var cRules = (rules || {}).members || {};
    var payload = rules ? rules.xml : null;
    if (payload) {
      cRules = ALY.util.merge(cRules, (cRules[payload] || {}).members || {});
      delete cRules[payload];
    }

    return this.validateStructure(cRules, params || {}, context || 'params');
  },

  validateStructure: function validateStructure(rules, params, context) {
    /*jshint maxcomplexity:12*/
    this.validateType(context, params, ['object'], 'structure');

    /*jshint forin:false*/
    for (var paramName in rules) {
      if (!rules.hasOwnProperty(paramName)) continue;
      var value = params[paramName];
      var notSet = value === undefined || value === null;
      if (notSet) {
        if (rules[paramName].default) {
          params[paramName] = rules[paramName].default;
        }
        else if (rules[paramName].required) {
          this.fail('MissingRequiredParameter',
              'Missing required key \'' + paramName + '\' in ' + context);
        }
      }
      //if (rules[paramName].location == 'uri' && value) {
      //  if (typeof value == 'string' && value.indexOf('/') == 0) {
      //    this.fail('UnexpectedParameter',
      //        'the value of ' + paramName + ' can not start with /');
      //  }
      //}
    }

    // validate hash members
    for (paramName in params) {
      if (!params.hasOwnProperty(paramName)) continue;

      var paramValue = params[paramName],
          paramRules = rules[paramName];

      if (paramRules !== undefined) {
        var memberContext = [context, paramName].join('.');
        this.validateMember(paramRules, paramValue, memberContext);
      } else {
        this.fail('UnexpectedParameter',
            'Unexpected key \'' + paramName + '\' found in ' + context);
      }
    }

    return true;
  },

  validateMember: function validateMember(rules, param, context) {
    var memberRules = rules.members || {};
    switch(rules.type) {
      case 'structure':
        return this.validateStructure(memberRules, param, context);
      case 'list':
        return this.validateList(memberRules, param, context);
      case 'map':
        return this.validateMap(memberRules, param, context);
      default:
        return this.validateScalar(rules, param, context);
    }
  },

  validateList: function validateList(rules, params, context) {
    this.validateType(context, params, [Array]);

    // validate array members
    for (var i = 0; i < params.length; i++) {
      this.validateMember(rules, params[i], context + '[' + i + ']');
    }
  },

  validateMap: function validateMap(rules, params, context) {
    this.validateType(context, params, ['object'], 'map');

    /*jshint forin:false*/
    for (var param in params) {
      if (!params.hasOwnProperty(param)) continue;
      this.validateMember(rules, params[param],
          context + '[\'' +  param + '\']');
    }
  },

  validateScalar: function validateScalar(rules, value, context) {
    /*jshint maxcomplexity:12*/
    switch (rules.type) {
      case null:
      case undefined:
      case 'string':
        return this.validateType(context, value, ['string']);
      case 'base64':
      case 'binary':
        return this.validatePayload(context, value);
      case 'integer':
      case 'float':
        return this.validateNumber(context, value);
      case 'boolean':
        return this.validateType(context, value, ['boolean']);
      case 'timestamp':
        return this.validateType(context, value, [Date,
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, 'number'],
          'Date object, ISO-8601 string, or a UNIX timestamp');
      case 'any':
        return ;
      default:
        return this.fail('UnkownType', 'Unhandled type ' +
            rules.type + ' for ' + context);
    }
  },

  fail: function fail(code, message) {
    throw ALY.util.error(new Error(message), {code: code});
  },

  validateType: function validateType(context, value, acceptedTypes, type) {
    /*jshint maxcomplexity:14*/
    if (value === null || value === undefined) return;

    var foundInvalidType = false;
    for (var i = 0; i < acceptedTypes.length; i++) {
      if (typeof acceptedTypes[i] === 'string') {
        if (typeof value === acceptedTypes[i]) return;
      } else if (acceptedTypes[i] instanceof RegExp) {
        if ((value || '').toString().match(acceptedTypes[i])) return;
      } else {
        if (value instanceof acceptedTypes[i]) return;
        if (ALY.util.isType(value, acceptedTypes[i])) return;
        if (!type && !foundInvalidType) acceptedTypes = acceptedTypes.slice();
        acceptedTypes[i] = ALY.util.typeName(acceptedTypes[i]);
      }
      foundInvalidType = true;
    }

    var acceptedType = type;
    if (!acceptedType) {
      /*jshint regexp:false*/
      acceptedType = acceptedTypes.join(', ').replace(/,([^,]+)$/, ', or$1');
    }

    var vowel = acceptedType.match(/^[aeiou]/i) ? 'n' : '';
    this.fail('InvalidParameterType', 'Expected ' + context + ' to be a' +
        vowel + ' ' + acceptedType);
  },

  validateNumber: function validateNumber(context, value) {
    if (value === null || value === undefined) return;
    if (typeof value === 'string') {
      var castedValue = parseFloat(value);
      if (castedValue.toString() === value) value = castedValue;
    }
    return this.validateType(context, value, ['number']);
  },

  validatePayload: function validatePayload(context, value) {
    /*jshint maxcomplexity:14*/
    if (value === null || value === undefined) return;
    if (typeof value === 'string') return;
    if (value && typeof value.byteLength === 'number') return; // typed arrays
    if (ALY.util.isNode()) { // special check for buffer/stream in Node.js
      var Stream = require('stream').Stream;
      if (ALY.util.Buffer.isBuffer(value) || value instanceof Stream) return;
    }

    var types = ['Buffer', 'Stream', 'File', 'Blob', 'ArrayBuffer', 'DataView'];
    if (value) {
      for (var i = 0; i < types.length; i++) {
        if (ALY.util.isType(value, types[i])) return;
        if (ALY.util.typeName(value.constructor) === types[i]) return;
      }
    }

    this.fail('InvalidParameterType', 'Expected ' + context + ' to be a ' +
        'string, Buffer, Stream, Blob, or typed array object');
  }
});

},{"./core":57,"stream":30}],63:[function(require,module,exports){
(function (process){(function (){
var ALY = require('./core');
var inherit = ALY.util.inherit;

function AcceptorStateMachine(states, state) {
  this.currentState = state || null;
  this.states = states || {};
}

AcceptorStateMachine.prototype.runTo = function runTo(finalState, done, bindObject, inputError) {
  if (typeof finalState === 'function') {
    inputError = bindObject; bindObject = done;
    done = finalState; finalState = null;
  }

  var self = this;
  var state = self.states[self.currentState];
  state.fn.call(bindObject || self, inputError, function(err) {
    if (err) {
      if (bindObject.logger) bindObject.logger.log(self.currentState, '->', state.fail, err);
      if (state.fail) self.currentState = state.fail;
      else return done ? done(err) : null;
    } else {
      if (bindObject.logger) bindObject.logger.log(self.currentState, '->', state.accept);
      if (state.accept) self.currentState = state.accept;
      else return done ? done() : null;
    }
    if (self.currentState === finalState) return done ? done(err) : null;

    self.runTo(finalState, done, bindObject, err);
  });
};

AcceptorStateMachine.prototype.addState = function addState(name, acceptState, failState, fn) {
  if (typeof acceptState === 'function') {
    fn = acceptState; acceptState = null; failState = null;
  } else if (typeof failState === 'function') {
    fn = failState; failState = null;
  }

  if (!this.currentState) this.currentState = name;
  this.states[name] = { accept: acceptState, fail: failState, fn: fn };
  return this;
};

var fsm = new AcceptorStateMachine();
fsm.setupStates = function() {
  var hardErrorStates = ['success', 'error', 'complete'];
  var transition = function transition(err, done) {
    try {
      var self = this;
      var origError = self.response.error;
      self.emit(self._asm.currentState, function() {
        if (self.response.error && origError != self.response.error) {
          if (hardErrorStates.indexOf(this._asm.currentState) >= 0) {
            this._hardError = true;
          }
        }
        done(self.response.error);
      });

    } catch (e) {
      this.response.error = e;
      if (hardErrorStates.indexOf(this._asm.currentState) >= 0) {
        this._hardError = true;
      }
      done(e);
    }
  };

  this.addState('validate', 'build', 'error', transition);
  this.addState('restart', 'build', 'error', function(err, done) {
    err = this.response.error;
    if (!err) return done();
    if (!err.retryable) return done(err);

    if (this.response.retryCount < this.service.config.maxRetries) {
      this.response.retryCount++;
      done();
    } else {
      done(err);
    }
  });
  this.addState('build', 'afterBuild', 'restart', transition);
  this.addState('afterBuild', 'sign', 'restart', transition);
  this.addState('sign', 'send', 'retry', transition);
  this.addState('retry', 'afterRetry', 'afterRetry', transition);
  this.addState('afterRetry', 'sign', 'error', transition);
  this.addState('send', 'validateResponse', 'retry', transition);
  this.addState('validateResponse', 'extractData', 'extractError', transition);
  this.addState('extractError', 'extractData', 'retry', transition);
  this.addState('extractData', 'success', 'retry', transition);
  this.addState('success', 'complete', 'complete', transition);
  this.addState('error', 'complete', 'complete', transition);
  this.addState('complete', null, 'uncaughtException', transition);
  this.addState('uncaughtException', function(err, done) {
    try {
      ALY.SequentialExecutor.prototype.unhandledErrorCallback.call(this, err);
    } catch (e) {
      if (this._hardError) throw err;
    }
    done(err);
  });
};
fsm.setupStates();

ALY.Request = inherit({

  /**
   * Creates a request for an operation on a given service with
   * a set of input parameters.
   *
   * @param service [ALY.Service] the service to perform the operation on
   * @param operation [String] the operation to perform on the service
   * @param params [Object] parameters to send to the operation.
   *   See the operation's documentation for the format of the
   *   parameters.
   */
  constructor: function Request(service, operation, params) {
    var endpoint = new ALY.Endpoint(service.config.endpoint);
    var region = service.config.region;

    this.service = service;
    this.operation = operation;
    this.params = params || {};
    this.httpRequest = new ALY.HttpRequest(endpoint, region);
    this.startTime = ALY.util.date.getDate();

    this.response = new ALY.Response(this);
    this.restartCount = 0;
    this._asm = new AcceptorStateMachine(fsm.states, 'validate');

    ALY.SequentialExecutor.call(this);
    this.emit = this.emitEvent;
  },

  /**
   * @!group Sending a Request
   */

  /**
   * @overload send(callback = null)
   *   Sends the request object.
   *
   *   @callback callback function(err, data)
   *     If a callback is supplied, it is called when a response is returned
   *     from the service.
   *     @param err [Error] the error object returned from the request.
   *       Set to `null` if the request is successful.
   *     @param data [Object] the de-serialized data returned from
   *       the request. Set to `null` if a request error occurs.
   *   @example Sending a request with a callback
   *     request = s3.putObject({Bucket: 'bucket', Key: 'key'});
   *     request.send(function(err, data) { console.log(err, data); });
   *   @example Sending a request with no callback (using event handlers)
   *     request = s3.putObject({Bucket: 'bucket', Key: 'key'});
   *     request.on('complete', function(response) { ... }); // register a callback
   *     request.send();
   */
  send: function send(callback) {
    if (callback) {
      this.on('complete', function (resp) {
        try {
          callback.call(resp, resp.error, resp.data);
        } catch (e) {
          resp.request._hardError = true;
          throw e;
        }
      });
    }
    this.runTo();

    return this.response;
  },

  build: function build(callback) {
    this._hardError = callback ? false : true;
    return this.runTo('send', callback);
  },

  runTo: function runTo(state, done) {
    this._asm.runTo(state, done, this);
    return this;
  },

  /**
   * Aborts a request, emitting the error and complete events.
   *
   * @!macro nobrowser
   * @example Aborting a request after sending
   *   var params = {
   *     Bucket: 'bucket', Key: 'key',
   *     Body: new Buffer(1024 * 1024 * 5) // 5MB payload
   *   };
   *   var request = s3.putObject(params);
   *   request.send(function (err, data) {
   *     if (err) console.log("Error:", err.code, err.message);
   *     else console.log(data);
   *   });
   *
   *   // abort request in 1 second
   *   setTimeout(request.abort.bind(request), 1000);
   *
   *   // prints "Error: RequestAbortedError Request aborted by user"
   * @return [ALY.Request] the same request object, for chaining.
   * @since v1.4.0
   */
  abort: function abort() {
    this.removeAllListeners('validateResponse');
    this.removeAllListeners('extractError');
    this.on('validateResponse', function addAbortedError(resp) {
      resp.error = ALY.util.error(new Error('Request aborted by user'), {
         code: 'RequestAbortedError', retryable: false
      });
    });

    if (this.httpRequest.stream) { // abort HTTP stream
      this.httpRequest.stream.abort();
      this.httpRequest._abortCallback();
    }

    return this;
  },

  /**
   * Iterates over each page of results given a pageable request, calling
   * the provided callback with each page of data. After all pages have been
   * retrieved, the callback is called with `null` data.
   *
   * @note This operation can generate multiple requests to a service.
   * @example Iterating over multiple pages of objects in an S3 bucket
   *   var pages = 1;
   *   s3.listObjects().eachPage(function(err, data) {
   *     if (err) return;
   *     console.log("Page", pages++);
   *     console.log(data);
   *   });
   * @callback callback function(err, data)
   *   Called with each page of resulting data from the request.
   *
   *   @param err [Error] an error object, if an error occurred.
   *   @param data [Object] a single page of response data. If there is no
   *     more data, this object will be `null`.
   *   @return [Boolean] if the callback returns `false`, pagination will
   *     stop.
   *
   * @api experimental
   * @see ALY.Request.eachItem
   * @see ALY.Response.nextPage
   * @since v1.4.0
   */
  eachPage: function eachPage(callback) {
    function wrappedCallback(response) {
      var result = callback.call(response, response.error, response.data);
      if (result === false) return;

      if (response.hasNextPage()) {
        response.nextPage().on('complete', wrappedCallback).send();
      } else {
        callback.call(response, null, null);
      }
    }

    this.on('complete', wrappedCallback).send();
  },

  /**
   * Enumerates over individual items of a request, paging the responses if
   * necessary.
   *
   * @api experimental
   * @since v1.4.0
   */
  eachItem: function eachItem(callback) {
    function wrappedCallback(err, data) {
      if (err) return callback(err, null);
      if (data === null) return callback(null, null);

      var config = this.request.service.paginationConfig(this.request.operation);
      var resultKey = config.resultKey;
      if (Array.isArray(resultKey)) resultKey = resultKey[0];
      var results = ALY.util.jamespath.query(resultKey, data);
      ALY.util.arrayEach(results, function(result) {
        ALY.util.arrayEach(result, function(item) { callback(null, item); });
      });
    }

    this.eachPage(wrappedCallback);
  },

  /**
   * @return [Boolean] whether the operation can return multiple pages of
   *   response data.
   * @api experimental
   * @see ALY.Response.eachPage
   * @since v1.4.0
   */
  isPageable: function isPageable() {
    return this.service.paginationConfig(this.operation) ? true : false;
  },

  /**
   * Converts the request object into a readable stream that
   * can be read from or piped into a writable stream.
   *
   * @note The data read from a readable stream contains only
   *   the raw HTTP body contents.
   * @example Manually reading from a stream
   *   request.createReadStream().on('data', function(data) {
   *     console.log("Got data:", data.toString());
   *   });
   * @example Piping a request body into a file
   *   var out = fs.createWriteStream('/path/to/outfile.jpg');
   *   s3.service.getObject(params).createReadStream().pipe(out);
   * @return [Stream] the readable stream object that can be piped
   *   or read from (by registering 'data' event listeners).
   */
  createReadStream: function createReadStream() {
    var streams = require('stream');
    var req = this;
    var stream = null;
    var legacyStreams = false;

    if (ALY.HttpClient.streamsApiVersion === 2) {
      stream = new streams.Readable();
      stream._read = function() { stream.push(''); };
    } else {
      stream = new streams.Stream();
      stream.readable = true;
    }

    stream.sent = false;
    stream.on('newListener', function(event) {
      if (!stream.sent && (event === 'data' || event === 'readable')) {
        if (event === 'data') legacyStreams = true;
        stream.sent = true;
        process.nextTick(function() { req.send(function() { }); });
      }
    });

    this.on('httpHeaders', function streamHeaders(statusCode, headers, resp) {
      if (statusCode < 300) {
        this.httpRequest._streaming = true;

        req.removeListener('httpData', ALY.EventListeners.Core.HTTP_DATA);
        req.removeListener('httpError', ALY.EventListeners.Core.HTTP_ERROR);
        req.on('httpError', function streamHttpError(error, resp) {
          resp.error = error;
          resp.error.retryable = false;
        });

        var httpStream = resp.httpResponse.stream;
        stream.response = resp;
        stream._read = function() {
          var data;
          /*jshint boss:true*/
          while (data = httpStream.read()) {
            stream.push(data);
          }
          stream.push('');
        };

        var events = ['end', 'error', (legacyStreams ? 'data' : 'readable')];
        ALY.util.arrayEach(events, function(event) {
          httpStream.on(event, function(arg) {
            stream.emit(event, arg);
          });
        });
      }
    });

    this.on('error', function(err) {
      stream.emit('error', err);
    });

    return stream;
  },

  /**
   * @param [Array,Response] args This should be the response object,
   *   or an array of args to send to the event.
   * @api private
   */
  emitEvent: function emit(eventName, args, done) {
    if (typeof args === 'function') { done = args; args = null; }
    if (!done) done = this.unhandledErrorCallback;
    if (!args) args = this.eventParameters(eventName, this.response);

    var origEmit = ALY.SequentialExecutor.prototype.emit;
    origEmit.call(this, eventName, args, function (err) {
      if (err) this.response.error = err;
      done.call(this, err);
    });
  },

  /**
   * @api private
   */
  eventParameters: function eventParameters(eventName) {
    switch (eventName) {
      case 'validate':
      case 'sign':
      case 'build':
      case 'afterBuild':
        return [this];
      case 'error':
        return [this.response.error, this.response];
      default:
        return [this.response];
    }
  }
});

ALY.util.mixin(ALY.Request, ALY.SequentialExecutor);

ALY.Response = inherit({

  /**
   * @api private
   */
  constructor: function Response(request) {
    this.request = request;
    this.data = null;
    this.error = null;
    this.retryCount = 0;
    this.redirectCount = 0;
    this.httpResponse = new ALY.HttpResponse();
  },

  nextPage: function nextPage(callback) {
    var config;
    var service = this.request.service;
    var operation = this.request.operation;
    try {
      config = service.paginationConfig(operation, true);
    } catch (e) { this.error = e; }

    if (!this.hasNextPage()) {
      if (callback) callback(this.error, null);
      else if (this.error) throw this.error;
      return null;
    }

    var params = ALY.util.copy(this.request.params);
    if (!this.nextPageTokens) {
      return callback ? callback(null, null) : null;
    } else {
      var inputTokens = config.inputToken;
      if (typeof inputTokens === 'string') inputTokens = [inputTokens];
      for (var i = 0; i < inputTokens.length; i++) {
        params[inputTokens[i]] = this.nextPageTokens[i];
      }
      return service.makeRequest(this.request.operation, params, callback);
    }
  },

  /**
   * @return [Boolean] whether more pages of data can be returned by further
   *   requests
   * @api experimental
   * @since v1.4.0
   */
  hasNextPage: function hasNextPage() {
    this.cacheNextPageTokens();
    if (this.nextPageTokens) return true;
    if (this.nextPageTokens === undefined) return undefined;
    else return false;
  },

  /**
   * @api private
   */
  cacheNextPageTokens: function cacheNextPageTokens() {
    if (this.hasOwnProperty('nextPageTokens')) return this.nextPageTokens;
    this.nextPageTokens = undefined;

    var config = this.request.service.paginationConfig(this.request.operation);
    if (!config) return this.nextPageTokens;

    this.nextPageTokens = null;
    if (config.moreResults) {
      if (!ALY.util.jamespath.find(config.moreResults, this.data)) {
        return this.nextPageTokens;
      }
    }

    var exprs = config.outputToken;
    if (typeof exprs === 'string') exprs = [exprs];
    ALY.util.arrayEach.call(this, exprs, function (expr) {
      var output = ALY.util.jamespath.find(expr, this.data);
      if (output) {
        this.nextPageTokens = this.nextPageTokens || [];
        this.nextPageTokens.push(output);
      }
    });

    return this.nextPageTokens;
  }

});

}).call(this)}).call(this,require('_process'))
},{"./core":57,"_process":24,"stream":30}],64:[function(require,module,exports){
(function (process){(function (){
var ALY = require('./core');
var domain = ALY.util.nodeRequire('domain');

/**
 * @!method on(eventName, callback)
 *   Registers an event listener callback for the event given by `eventName`.
 *   Parameters passed to the callback function depend on the individual event
 *   being triggered. See the event documentation for those parameters.
 *
 *   @param eventName [String] the event name to register the listener for
 *   @param callback [Function] the listener callback function
 *   @return [ALY.SequentialExecutor] the same object for chaining
 */
ALY.SequentialExecutor = ALY.util.inherit({

  constructor: function SequentialExecutor() {
    this.domain = domain && domain.active;
    this._events = {};
  },

  /**
   * @api private
   */
  listeners: function listeners(eventName) {
    return this._events[eventName] ? this._events[eventName].slice(0) : [];
  },

  on: function on(eventName, listener) {
    if (this._events[eventName]) {
      this._events[eventName].push(listener);
    } else {
      this._events[eventName] = [listener];
    }
    return this;
  },

  onAsync: function onAsync(eventName, listener) {
    listener._isAsync = true;
    return this.on(eventName, listener);
  },

  removeListener: function removeListener(eventName, listener) {
    var listeners = this._events[eventName];
    if (listeners) {
      var length = listeners.length;
      var position = -1;
      for (var i = 0; i < length; ++i) {
        if (listeners[i] === listener) {
          position = i;
        }
      }
      if (position > -1) {
        listeners.splice(position, 1);
      }
    }
    return this;
  },

  removeAllListeners: function removeAllListeners(eventName) {
    if (eventName) {
      delete this._events[eventName];
    } else {
      this._events = {};
    }
    return this;
  },

  /**
   * @api private
   */
  emit: function emit(eventName, eventArgs, doneCallback) {
    if (!doneCallback) doneCallback = this.unhandledErrorCallback;
    if (domain && this.domain instanceof domain.Domain)
      this.domain.enter();

    if(process.env.DEBUG == 'aliyun') {
      console.log('emit', eventName);
    }
    var listeners = this.listeners(eventName);
    var count = listeners.length;
    this.callListeners(listeners, eventArgs, doneCallback);
    return count > 0;
  },

  /**
   * @api private
   */
  callListeners: function callListeners(listeners, args, doneCallback) {
    if (listeners.length === 0) {
      doneCallback.call(this);
      if (domain && this.domain instanceof domain.Domain)
        this.domain.exit();
    } else {
      var listener = listeners.shift();
      if (listener._isAsync) {

        // asynchronous listener
        var callNextListener = function(err) {
          if (err) {
            doneCallback.call(this, err);
            if (domain && this.domain instanceof domain.Domain)
              this.domain.exit();
          } else {
            this.callListeners(listeners, args, doneCallback);
          }
        }.bind(this);
        listener.apply(this, args.concat([callNextListener]));

      } else {

        // synchronous listener
        try {
          listener.apply(this, args);
          this.callListeners(listeners, args, doneCallback);
        } catch (err) {
          doneCallback.call(this, err);
          if (domain && this.domain instanceof domain.Domain)
            this.domain.exit();
        }

      }
    }
  },

  /**
   * Adds or copies a set of listeners from another list of
   * listeners or SequentialExecutor object.
   *
   * @param listeners [map<String,Array<Function>>, ALY.SequentialExecutor]
   *   a list of events and callbacks, or an event emitter object
   *   containing listeners to add to this emitter object.
   * @return [ALY.SequentialExecutor] the emitter object, for chaining.
   * @example Adding listeners from a map of listeners
   *   emitter.addListeners({
   *     event1: [function() { ... }, function() { ... }],
   *     event2: [function() { ... }]
   *   });
   *   emitter.emit('event1'); // emitter has event1
   *   emitter.emit('event2'); // emitter has event2
   * @example Adding listeners from another emitter object
   *   var emitter1 = new ALY.SequentialExecutor();
   *   emitter1.on('event1', function() { ... });
   *   emitter1.on('event2', function() { ... });
   *   var emitter2 = new ALY.SequentialExecutor();
   *   emitter2.addListeners(emitter1);
   *   emitter2.emit('event1'); // emitter2 has event1
   *   emitter2.emit('event2'); // emitter2 has event2
   */
  addListeners: function addListeners(listeners) {
    var self = this;

    // extract listeners if parameter is an SequentialExecutor object
    if (listeners._events) listeners = listeners._events;

    ALY.util.each(listeners, function(event, callbacks) {
      if (typeof callbacks === 'function') callbacks = [callbacks];
      ALY.util.arrayEach(callbacks, function(callback) {
        self.on(event, callback);
      });
    });

    return self;
  },

  /**
   * Registers an event with {on} and saves the callback handle function
   * as a property on the emitter object using a given `name`.
   *
   * @param name [String] the property name to set on this object containing
   *   the callback function handle so that the listener can be removed in
   *   the future.
   * @param (see on)
   * @return (see on)
   * @example Adding a named listener DATA_CALLBACK
   *   var listener = function() { doSomething(); };
   *   emitter.addNamedListener('DATA_CALLBACK', 'data', listener);
   *
   *   // the following prints: true
   *   console.log(emitter.DATA_CALLBACK == listener);
   */
  addNamedListener: function addNamedListener(name, eventName, callback) {
    this[name] = callback;
    this.addListener(eventName, callback);
    return this;
  },

  /**
   * @api private
   */
  addNamedAsyncListener: function addNamedAsyncListener(name, eventName, callback) {
    callback._isAsync = true;
    return this.addNamedListener(name, eventName, callback);
  },

  /**
   * Helper method to add a set of named listeners using
   * {addNamedListener}. The callback contains a parameter
   * with a handle to the `addNamedListener` method.
   *
   * @callback callback function(add)
   *   The callback function is called immediately in order to provide
   *   the `add` function to the block. This simplifies the addition of
   *   a large group of named listeners.
   *   @param add [Function] the {addNamedListener} function to call
   *     when registering listeners.
   * @example Adding a set of named listeners
   *   emitter.addNamedListeners(function(add) {
   *     add('DATA_CALLBACK', 'data', function() { ... });
   *     add('OTHER', 'otherEvent', function() { ... });
   *     add('LAST', 'lastEvent', function() { ... });
   *   });
   *
   *   // these properties are now set:
   *   emitter.DATA_CALLBACK;
   *   emitter.OTHER;
   *   emitter.LAST;
   */
  addNamedListeners: function addNamedListeners(callback) {
    var self = this;
    callback(
      function() {
        self.addNamedListener.apply(self, arguments);
      },
      function() {
        self.addNamedAsyncListener.apply(self, arguments);
      }
    );
    return this;
  },

  /**
   * @api private
   */
  unhandledErrorCallback: function unhandledErrorCallback(err) {
    if (err) {
      if (domain && this.domain instanceof domain.Domain) {
        err.domainEmitter = this;
        err.domain = this.domain;
        err.domainThrown = false;
        this.domain.emit('error', err);
      } else {
        throw err;
      }
    }
  }
});

/**
 * {on} is the prefered method.
 * @api private
 */
ALY.SequentialExecutor.prototype.addListener = ALY.SequentialExecutor.prototype.on;
ALY.SequentialExecutor.prototype.addAsyncListener = ALY.SequentialExecutor.prototype.onAsync;

}).call(this)}).call(this,require('_process'))
},{"./core":57,"_process":24}],65:[function(require,module,exports){
(function (__dirname){(function (){
var ALY = require('./core');
var inherit = ALY.util.inherit;

/**
 * The service class representing an ALY service.
 *
 * @abstract
 *
 * @!attribute apiVersions
 *   @return [Array<String>] the list of API versions supported by this service.
 *   @readonly
 */
ALY.Service = inherit({
  /**
   * Create a new service object with a configuration object
   *
   * @param config [map] a map of configuration options
   */
  constructor: function Service(config) {
    if (!this.loadServiceClass) {
      throw ALY.util.error(new Error(),
        'Service must be constructed with `new\' operator');
    }
    var ServiceClass = this.loadServiceClass(config || {});
    if (ServiceClass) return new ServiceClass(config);
    this.initialize(config);
  },

  /**
   * @api private
   */
  initialize: function initialize(config) {
    this.config = new ALY.Config(config);
  },

  /**
   * @api private
   */
  loadServiceClass: function loadServiceClass(serviceConfig) {
    if (!ALY.util.isEmpty(this.api)) {
      return;
    } else if (!this.constructor.services) {
      return;
    } else {
      return this.getLatestServiceClass(serviceConfig.apiVersion);
    }
  },

  /**
   * @api private
   */
  getLatestServiceClass: function getLatestServiceClass(version) {
    if (this.constructor.services[version] === null) {
      ALY.Service.defineServiceApi(this.constructor, version);
    }

    return this.constructor.services[version];
  },

  /**
   * @api private
   */
  api: {},

  /**
   * @api private
   */
  defaultRetryCount: 3,

  /**
   * Calls an operation on a service with the given input parameters.
   *
   * @param operation [String] the name of the operation to call on the service.
   * @param params [map] a map of input options for the operation
   * @callback callback function(err, data)
   *   If a callback is supplied, it is called when a response is returned
   *   from the service.
   *   @param err [Error] the error object returned from the request.
   *     Set to `null` if the request is successful.
   *   @param data [Object] the de-serialized data returned from
   *     the request. Set to `null` if a request error occurs.
   */
  makeRequest: function makeRequest(operation, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = null;
    }

    params = params || {};
    if (this.config.params) { // copy only toplevel bound params
      var rules = this.api.operations[operation];
      if (rules) {
        params = ALY.util.copy(params);
        ALY.util.each(this.config.params, function(key, value) {
          if (rules.input.members[key]) {
            if (params[key] === undefined || params[key] === null) {
              params[key] = value;
            }
          }
        });
      }
    }

    var request = new ALY.Request(this, operation, params);
    this.addAllRequestListeners(request);

    if (callback) request.send(callback);
    return request;
  },

  /**
   * Calls an operation on a service with the given input parameters, without
   * any authentication data. This method is useful for "public" API operations.
   *
   * @param operation [String] the name of the operation to call on the service.
   * @param params [map] a map of input options for the operation
   * @callback callback function(err, data)
   *   If a callback is supplied, it is called when a response is returned
   *   from the service.
   *   @param err [Error] the error object returned from the request.
   *     Set to `null` if the request is successful.
   *   @param data [Object] the de-serialized data returned from
   *     the request. Set to `null` if a request error occurs.
   */
  makeUnauthenticatedRequest: function makeUnauthenticatedRequest(operation, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = {};
    }

    var request = this.makeRequest(operation, params);
    request.removeListener('sign', ALY.EventListeners.Core.SIGN);
    if (this.api.format === 'query') { // query services turn into GET requests
      request.addListener('build', function convertToGET(request) {
        request.httpRequest.method = 'GET';
        request.httpRequest.path = '/?' + request.httpRequest.body;
        request.httpRequest.body = '';

        // don't need these headers on a GET request
        delete request.httpRequest.headers['Content-Length'];
        delete request.httpRequest.headers['Content-Type'];
      });
    }

    return callback ? request.send(callback) : request;
  },

  /**
   * @api private
   */
  addAllRequestListeners: function addAllRequestListeners(request) {
    var list = [ALY.events, ALY.EventListeners.Core,
                this.serviceInterface()];
    for (var i = 0; i < list.length; i++) {
      if (list[i]) request.addListeners(list[i]);
    }

    // disable parameter validation
    if (!this.config.paramValidation) {
      request.removeListener('validate',
        ALY.EventListeners.Core.VALIDATE_PARAMETERS);
    }

    if (this.config.logger) { // add logging events
      request.addListeners(ALY.EventListeners.Logger);
    }

    this.setupRequestListeners(request);
  },

  /**
   * Override this method to setup any custom request listeners for each
   * new request to the service.
   *
   * @abstract
   */
  setupRequestListeners: function setupRequestListeners() {
  },

  /**
   * Gets the signer class for a given request
   * @api private
   */
  getSignerClass: function getSignerClass() {
    var version = this.api.signatureVersion;
    return ALY.Signers.RequestSigner.getVersion(version);
  },

  /**
   * @api private
   */
  serviceInterface: function serviceInterface() {
    switch (this.api.format) {
      case 'query': return ALY.EventListeners.Query;
      case 'json': return ALY.EventListeners.Json;
      case 'rest': return ALY.EventListeners.Rest;
      case 'rest-json': return ALY.EventListeners.RestJson;
      case 'pop': return ALY.EventListeners.Pop;
      case 'top': return ALY.EventListeners.Top;
      case 'rest-xml': return ALY.EventListeners.RestXml;
    }
    if (this.api.format) {
      throw new Error('Invalid service `format\' ' +
        this.api.format + ' in API config');
    }
  },

  /**
   * @api private
   */
  successfulResponse: function successfulResponse(resp) {
    return resp.httpResponse.statusCode < 300;
  },

  /**
   * How many times a failed request should be retried before giving up.
   * the defaultRetryCount can be overriden by service classes.
   *
   * @api private
   */
  numRetries: function numRetries() {
    if (this.config.maxRetries !== undefined) {
      return this.config.maxRetries;
    } else {
      return this.defaultRetryCount;
    }
  },

  /**
   * @api private
   */
  retryDelays: function retryDelays() {
    var retryCount = this.numRetries();
    var delays = [];
    for (var i = 0; i < retryCount; ++i) {
      delays[i] = Math.pow(2, i) * 30;
    }
    return delays;
  },

  /**
   * @api private
   */
  retryableError: function retryableError(error) {
    if (this.networkingError(error)) return true;
    if (this.throttledError(error)) return true;
    if (error.statusCode >= 500) return true;
    return false;
  },

  /**
   * @api private
   */
  networkingError: function networkingError(error) {
    return error.code == 'NetworkingError';
  },

  /**
   * @api private
   */
  throttledError: function throttledError(error) {
    // this logic varies between services
    return (error.code == 'ProvisionedThroughputExceededException');
  },

  /**
   * @api private
   */
  isRegionCN: function isRegionCN() {
    if (!this.config.region) return false;
    return this.config.region.match(/^cn-/) ? true : false;
  },

  /**
   * @api private
   */
  isRegionV4: function isRegionV4() {
    return this.isRegionCN();
  },

  /**
   * @api private
   */
  paginationConfig: function paginationConfig(operation, throwException) {
    function fail(name) {
      if (throwException) {
        var e = new Error();
        throw ALY.util.error(e, 'No pagination configuration for ' + name);
      }
      return null;
    }

    if (!this.api.pagination) return fail('service');
    if (!this.api.pagination[operation]) return fail(operation);
    return this.api.pagination[operation];
  }
});

ALY.util.update(ALY.Service, {

  /**
   * Adds one method for each operation described in the api configuration
   *
   * @api private
   */
  defineMethods: function defineMethods(svc) {
    ALY.util.each(svc.prototype.api.operations, function iterator(method) {
      if (svc.prototype[method]) return;
      svc.prototype[method] = function (params, callback) {
        return this.makeRequest(method, params, callback);
      };
    });
  },

  defineService: function defineService(serviceIdentifier, versions, features) {
    if (!Array.isArray(versions)) {
      features = versions;
      versions = [];
    }

    var svc = inherit(ALY.Service, features || {});

    if (typeof serviceIdentifier === 'string') {
      // create versions hash
      var services = {};
      for (var i = 0; i < versions.length; i++) {
        services[versions[i]] = null;
      }

      svc.services = svc.services || services;
      svc.apiVersions = Object.keys(svc.services).sort();
      svc.serviceIdentifier = svc.serviceIdentifier || serviceIdentifier;
    } else { // defineService called with an API
      svc.prototype.api = serviceIdentifier;
      ALY.Service.defineMethods(svc);
    }

    return svc;
  },

  /**
   * @api private
   */
  defineServiceApi: function defineServiceApi(superclass, version) {
    var svc = inherit(superclass, {
      serviceIdentifier: superclass.serviceIdentifier
    });

    if (typeof version === 'string') {
      var file = superclass.serviceIdentifier + '-' + version;
      var path = __dirname + '/../apis/' + file + '.json';
      try {
        if(ALY.util.isBrowser()) {
          svc.prototype.api = require(file + '.json');
        }
        else {
          var fs = require('fs');
          svc.prototype.api = JSON.parse(fs.readFileSync(path));
        }
      } catch (err) {
        throw ALY.util.error(err, {
          message: 'Could not find API configuration ' + file
        });
      }

      if (!superclass.services.hasOwnProperty(version)) {
        superclass.apiVersions.push(version);
      }
      superclass.services[version] = svc;
    } else {
      setApi(version);
    }

    ALY.Service.defineMethods(svc);
    return svc;
  }
});

}).call(this)}).call(this,"/lib")
},{"./core":57,"fs":1}],66:[function(require,module,exports){
var ALY = require('../core');
require('../json/builder');

/**
 * @api private
 */
ALY.ServiceInterface.Json = {
  buildRequest: function buildRequest(req) {
    var httpRequest = req.httpRequest;
    var api = req.service.api;
    var target = api.targetPrefix + '.' + api.operations[req.operation].name;
    var version = api.jsonVersion || '1.0';

    var rules = api.operations[req.operation].input;
    var builder = new ALY.JSON.Builder(rules, api);

    httpRequest.path = '/';
    httpRequest.body = builder.build(req.params || {});
  },

  extractError: function extractError(resp) {
    var error = {};
    var httpResponse = resp.httpResponse;

    if (httpResponse.body.length > 0) {
      var e = JSON.parse(httpResponse.body.toString());
      if (e.__type || e.code || e.Code) {
        error.code = (e.__type || e.code || e.Code).split('#').pop();
      } else {
        error.code = 'UnknownError';
      }
      if (error.code === 'RequestEntityTooLarge') {
        error.message = 'Request body must be less than 1 MB';
      } else {
        error.message = (e.message || e.Message || null);
      }
    } else {
      error.code = httpResponse.statusCode;
      error.message = null;
    }

    resp.error = ALY.util.error(new Error(), error);
  },

  extractData: function extractData(resp) {
    resp.data = JSON.parse(resp.httpResponse.body.toString() || '{}');
  }

};

},{"../core":57,"../json/builder":61}],67:[function(require,module,exports){
var ALY = require('../core');
require('./rest');
require('./json');

function randomNumbers(count) {
  var num = '';
  for (var i = 0; i < count; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return num;
}

/**
 * @api private
 */
ALY.ServiceInterface.Pop = {
  buildRequest: function buildRequest(req) {
    ALY.ServiceInterface.Rest.buildRequest(req);
    ALY.ServiceInterface.Pop.populateBody(req);
  },

  extractError: function extractError(resp) {
    ALY.ServiceInterface.Json.extractError(resp);
  },

  extractData: function extractData(resp) {
    resp.data = JSON.parse(resp.httpResponse.body.toString());
  },

  populateBody: function populateBody(req) {
    req.httpRequest.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

    var body = req.params;
    var date = ALY.util.date.getDate();

    body.Format = "JSON";
    body.Version = req.service.api.apiVersion;
    body.AccessKeyId = req.service.config.accessKeyId;
    body.SignatureVersion = "1.0";
    body.SignatureMethod = "HMAC-SHA1";
    body.SignatureNonce = String(date.getTime()) + randomNumbers(4);
    body.Timestamp = ALY.util.date.iso8601(date);

    // sign
    var headers = [];

    ALY.util.each(body, function (name) {
      headers.push(name);
    });

    headers.sort(function (a, b) {
      return a < b ? -1 : 1;
    });

    var canonicalizedQueryString = "";
    ALY.util.arrayEach.call(this, headers, function (name) {
      canonicalizedQueryString += "&" + name + "=" + ALY.util.popEscape(body[name]);
    });

    var stringToSign = 'POST&%2F&' + ALY.util.popEscape(canonicalizedQueryString.substr(1));
    body.Signature = ALY.util.crypto.hmac(req.service.config.secretAccessKey + '&', stringToSign, 'base64', 'sha1');

    // body
    var bodyString = ALY.util.queryParamsToString(body);

    req.httpRequest.body = bodyString;
  },

  buildJSON: function buildJSON(params, rules, api) {
    var builder = new ALY.JSON.Builder(rules, api);
    return builder.build(params);
  }

};

},{"../core":57,"./json":66,"./rest":69}],68:[function(require,module,exports){
var ALY = require('../core');
var inherit = ALY.util.inherit;

// 目前 query 是针对 top 调用的
ALY.ServiceInterface.Query = {
  buildRequest: function buildRequest(req) {
    var operation = req.service.api.operations[req.operation];
    var httpRequest = req.httpRequest;
    httpRequest.method = 'GET';
    httpRequest.headers['Content-Type'] =
      'application/x-www-form-urlencoded; charset=utf-8';
    httpRequest.params = {
      Action: operation.name,
      Version: req.service.api.apiVersion,
      Timestamp: ALY.util.date.iso8601(ALY.util.date.getDate()),
      Format: 'json',
      AccessKeyId: req.service.config.accessKeyId,
      SignatureVersion: '1.0',
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: ALY.util.uuid()
    };

    // convert the request parameters into a list of query params,
    // e.g. Deeply.NestedParam.0.Name=value
    var rules = operation.input;
    if (rules) rules = rules.members;
    var builder = new ALY.QueryParamSerializer(rules, req.service.api);
    builder.serialize(req.params, function(name, value) {
      httpRequest.params[name] = value;
    });
    httpRequest.path = '/?' + ALY.util.queryParamsToString(httpRequest.params);
  },

  extractError: function extractError(resp) {
    var data = JSON.parse(resp.httpResponse.body.toString());

    if (data.Code) {
      resp.error = ALY.util.error(new Error(), {
        code: data.Code,
        message: data.Message,
        RequestId: data.RequestId
      });
    } else {
      resp.error = ALY.util.error(new Error(), {
        code: resp.httpResponse.statusCode,
        message: null,
        RequestId: data.RequestId
      });
    }
  },

  extractData: function extractData(resp) {
    resp.data = resp.httpResponse.body.toString();
  }
};

/**
 * @api private
 */
ALY.QueryParamSerializer = inherit({

  constructor: function QueryParamSerializer(rules, options) {
    this.rules = rules;
    this.timestampFormat = options ? options.timestampFormat : 'iso8601';
  },

  serialize: function serialize(params, fn) {
    this.serializeStructure('', params, this.rules, fn);
  },

  serializeStructure: function serializeStructure(prefix, struct, rules, fn) {
    var that = this;
    ALY.util.each(struct, function (name, member) {
      var n = rules[name].name || name;
      var memberName = prefix ? prefix + '.' + n : n;
      that.serializeMember(memberName, member, rules[name], fn);
    });
  },

  serializeMap: function serialzeMap(name, map, rules, fn) {
    var i = 1;
    var that = this;
    ALY.util.each(map, function (key, value) {
      var prefix = rules.flattened ? '.' : '.entry.';
      var position = prefix + (i++) + '.';
      var keyName = position + (rules.keys.name || 'key');
      var valueName = position + (rules.members.name || 'value');
      that.serializeMember(name + keyName, key, rules.keys, fn);
      that.serializeMember(name + valueName, value, rules.members, fn);
    });
  },

  serializeList: function serializeList(name, list, rules, fn) {
    var that = this;
    var memberRules = rules.members || {};
    ALY.util.arrayEach(list, function (v, n) {
      var suffix = '.' + (n + 1);
      if (rules.flattened) {
        if (memberRules.name) {
          var parts = name.split('.');
          parts.pop();
          parts.push(memberRules.name);
          name = parts.join('.');
        }
      } else {
        suffix = '.member' + suffix;
      }
      that.serializeMember(name + suffix, v, memberRules, fn);
    });
  },

  serializeMember: function serializeMember(name, value, rules, fn) {
    if (value === null || value === undefined) return;
    if (rules.type === 'structure') {
      this.serializeStructure(name, value, rules.members, fn);
    } else if (rules.type === 'list') {
      this.serializeList(name, value, rules, fn);
    } else if (rules.type === 'map') {
      this.serializeMap(name, value, rules, fn);
    } else if (rules.type === 'timestamp') {
      var timestampFormat = rules.format || this.timestampFormat;
      fn.call(this, name, ALY.util.date.format(value, timestampFormat));
    } else {
      fn.call(this, name, String(value));
    }
  }

});

},{"../core":57}],69:[function(require,module,exports){
var ALY = require('../core');

/**
 * @api private
 */
ALY.ServiceInterface.Rest = {
  buildRequest: function buildRequest(req) {
    ALY.ServiceInterface.Rest.populateMethod(req);
    ALY.ServiceInterface.Rest.populateURI(req);
    ALY.ServiceInterface.Rest.populateHeaders(req);
  },

  extractError: function extractError() {
  },

  extractData: function extractData(resp) {
    var req = resp.request;
    var data = {};
    var r = resp.httpResponse;
    var operation = req.service.api.operations[req.operation];
    var rules = (operation.output || {}).members || {};

    // normalize headers names to lower-cased keys for matching
    var headers = {};
    ALY.util.each(r.headers, function (k, v) {
      headers[k.toLowerCase()] = v;
    });

    ALY.util.each(rules, function (name, rule) {
      if (rule.location === 'header') {
        var header = (rule.name || name).toLowerCase();
        if (rule.type == 'map') {
          data[name] = {};
          ALY.util.each(r.headers, function (k, v) {
            var result = k.match(new RegExp('^' + rule.name + '(.+)', 'i'));
            if (result !== null) {
              data[name][result[1]] = v;
            }
          });
        }
        if (headers[header] !== undefined) {
          data[name] = headers[header];
        }
      }
      if (rule.location === 'status') {
        data[name] = parseInt(r.statusCode, 10);
      }
    });

    resp.data = data;
  },

  populateMethod: function populateMethod(req) {
    req.httpRequest.method = req.service.api.operations[req.operation].http.method;
  },

  populateURI: function populateURI(req) {
    var operation = req.service.api.operations[req.operation];
    var uri = operation.http.uri;
    var pathPattern = uri.split(/\?/)[0];
    var rules = (operation.input || {}).members || {};

    var escapePathParam = req.service.escapePathParam ||
      ALY.ServiceInterface.Rest.escapePathParam;
    var escapeQuerystringParam = req.service.escapeQuerystringParam ||
      ALY.ServiceInterface.Rest.escapeQuerystringParam;

    ALY.util.each.call(this, rules, function (name, rule) {
      if (rule.location == 'uri' && req.params[name] != null) {
        // if the value is being inserted into the path portion of the
        // URI, then we need to use a different (potentially) escaping
        // pattern, this is especially true for S3 path params like Key.
        var value = pathPattern.match('{' + name + '}') ?
          escapePathParam(req.params[name]) :
          escapeQuerystringParam(req.params[name]);

        uri = uri.replace('{' + name + '}', value);
      }
    });

    var path = uri.split('?')[0];
    var querystring = uri.split('?')[1];

    if (querystring) {
      var parts = [];
      ALY.util.arrayEach(querystring.split('&'), function (part) {
        if (!part.match('{\\w+}')) parts.push(part);
      });
      uri = (parts.length > 0 ? path + '?' + parts.join('&') : path);
    } else {
      uri = path;
    }

    req.httpRequest.path = uri;
  },

  escapePathParam: function escapePathParam(value) {
    return ALY.util.uriEscape(String(value));
  },

  escapeQuerystringParam: function escapeQuerystringParam(value) {
    return ALY.util.uriEscape(String(value));
  },

  populateHeaders: function populateHeaders(req) {
    var operation = req.service.api.operations[req.operation];
    var rules = (operation.input || {}).members || {};

    ALY.util.each.call(this, rules, function (name, rule) {
      if (rule.location === 'header' && req.params[name]) {
        if (rule.type === 'map') {
          ALY.util.each(req.params[name], function (key, value) {
            req.httpRequest.headers[rule.name + key] = value;
          });
        } else {
          var value = req.params[name];
          if (rule.type === 'timestamp') {
            var timestampFormat = rule.format || req.service.api.timestampFormat;
            value = ALY.util.date.format(value, timestampFormat);
          }
          req.httpRequest.headers[rule.name || name] = value;
        }
      }
    });

    if(req.service.config.securityToken) {
      req.httpRequest.headers["x-oss-security-token"] = req.service.config.securityToken;
    }

  }
};

},{"../core":57}],70:[function(require,module,exports){
var ALY = require('../core');
require('./rest');
require('./json');

/**
 * @api private
 */
ALY.ServiceInterface.RestJson = {
  buildRequest: function buildRequest(req) {
    ALY.ServiceInterface.Rest.buildRequest(req);
    ALY.ServiceInterface.RestJson.populateBody(req);
  },

  extractError: function extractError(resp) {
    ALY.ServiceInterface.Json.extractError(resp);
  },

  extractData: function extractData(resp) {
    var req = resp.request;
    var rules = req.service.api.operations[req.operation].output || {};
    if (rules.payload && rules.members[rules.payload]) {
      if (rules.members[rules.payload].streaming) {
        resp.data[rules.payload] = resp.httpResponse.body;
      } else {
        resp.data[rules.payload] = resp.httpResponse.body.toString();
      }
    } else {
      var data = resp.data;
      ALY.ServiceInterface.Json.extractData(resp);
      resp.data = ALY.util.merge(data, resp.data);
    }
  },

  populateBody: function populateBody(req) {
    var input = req.service.api.operations[req.operation].input;
    var payload = input.payload;
    var params = {};

    if (typeof payload === 'string') {

      var rules = input.members[payload];
      params = req.params[payload];

      if (params === undefined) return;

      if (rules.type === 'structure') {
        req.httpRequest.body = this.buildJSON(params, input, req.service.api);
      } else {
        // non-xml paylaod
        req.httpRequest.body = params;
      }

    } else if (payload) {

      ALY.util.arrayEach(payload, function (param) {
        if (req.params[param] !== undefined) {
          params[param] = req.params[param];
        }
      });
      req.httpRequest.body = this.buildJSON(params, input, req.service.api);

    }
  },

  buildJSON: function buildJSON(params, rules, api) {
    var builder = new ALY.JSON.Builder(rules, api);
    return builder.build(params);
  }

};

},{"../core":57,"./json":66,"./rest":69}],71:[function(require,module,exports){
var ALY = require('../core');
require('../xml/builder');
require('../xml/parser');
require('./rest');

/**
 * @api private
 */
ALY.ServiceInterface.RestXml = {
  buildRequest: function buildRequest(req) {
    ALY.ServiceInterface.Rest.buildRequest(req);
    ALY.ServiceInterface.RestXml.populateBody(req);
  },

  extractError: function extractError(resp) {
    try {
      var data = new ALY.XML.Parser({}).parse(resp.httpResponse.body.toString());
      if (data.Errors) data = data.Errors;
      if (data.Error) data = data.Error;
      if (data.Code) {
        resp.error = ALY.util.error(new Error(), {
          code: data.Code,
          message: data.Message
        });
      } else {
        resp.error = ALY.util.error(new Error(), {
          code: resp.httpResponse.statusCode,
          message: null
        });
      }
    }
    catch(err) {
      resp.error = ALY.util.error(new Error(), {
        code: resp.httpResponse.statusCode,
        message: resp.httpResponse.body.toString()
      });
    }
  },

  extractData: function extractData(resp) {
    ALY.ServiceInterface.Rest.extractData(resp);

    var req = resp.request;
    var httpResponse = resp.httpResponse;
    var operation = req.service.api.operations[req.operation];
    var rules = operation.output.members;

    var output = operation.output;
    var payload = output.payload;

    if (payload) {
      if (rules[payload].streaming) {
        resp.data[payload] = httpResponse.body;
      } else {
        resp.data[payload] = httpResponse.body.toString();
      }
    } else if (httpResponse.body.length > 0) {
      try {
        var parser = new ALY.XML.Parser(operation.output || {});
        ALY.util.update(resp.data, parser.parse(httpResponse.body.toString()));
      }
      catch(err) {
        // ignore parse error
      }
    }

    // extract request id
    resp.data.RequestId = httpResponse.headers['x-oss-request-id'] ||
                          httpResponse.headers['x-oss-requestid'];
  },

  populateBody: function populateBody(req) {
    var input = req.service.api.operations[req.operation].input;
    var payload = input.payload;
    var rules = {};
    var builder = null;
    var params = req.params;

    if (typeof payload === 'string') {

      rules = input.members[payload];
      params = params[payload];

      if (params === undefined) return;

      if (rules.type === 'structure') {
        builder = new ALY.XML.Builder(payload, rules.members, req.service.api);
        req.httpRequest.body = builder.toXML(params);
      } else {
        // non-xml paylaod
        req.httpRequest.body = params;
      }

    } else if (payload) {

      ALY.util.arrayEach(payload, function (member) {
        rules[member] = input.members[member];
      });

      builder = new ALY.XML.Builder(input.wrapper, rules, req.service.api);
      req.httpRequest.body = builder.toXML(params);

    }

  }
};

},{"../core":57,"../xml/builder":87,"../xml/parser":88,"./rest":69}],72:[function(require,module,exports){
var ALY = require('../core');
require('./rest');
require('./json');

/**
 * @api private
 */
ALY.ServiceInterface.Top = {
  buildRequest: function buildRequest(req) {
    ALY.ServiceInterface.Top.populateMethod(req);
    ALY.ServiceInterface.Top.populateBodyAndURI(req);
  },

  extractError: function extractError(resp) {
    ALY.ServiceInterface.Json.extractError(resp);
  },

  extractData: function extractData(resp) {
    resp.data = JSON.parse(resp.httpResponse.body.toString());
  },

  populateMethod: function populateBodyAndURI(req) {
    req.httpRequest.method = req.service.api.operations[req.operation].http.method;
  },

  populateBodyAndURI: function populateBody(req) {
    req.httpRequest.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
    req.httpRequest.headers['Cache-Control'] = "no-cache";
    req.httpRequest.headers['Connection'] = "Keep-Alive";

    var application_parameter = req.params;

    // convert json object to json string
    ALY.util.each(application_parameter, function (name) {
      var value = application_parameter[name];
      if(value !== null && typeof value === 'object') {
        application_parameter[name] = JSON.stringify(value);
      }
    });

    var sys_parameters = {
      format: "json",
      app_key: req.service.config.accessKeyId,
      sign_method: "md5",
      v: "2.0",
      timestamp: ALY.util.date.unixMilliseconds(ALY.util.date.getDate()),
      partner_id: "taobao-sdk-python-20151223",
      method: application_parameter.method
    };

    delete application_parameter.method;

    // sign
    var sign_parameter = [];

    ALY.util.each(sys_parameters, function (name) {
      sign_parameter.push(name);
    });

    ALY.util.each(application_parameter, function (name) {
      sign_parameter.push(name);
    });

    sign_parameter.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });

    var canonicalizedQueryString = "";
    ALY.util.arrayEach.call(this, sign_parameter, function (name) {
      canonicalizedQueryString += name + (sys_parameters[name] || application_parameter[name]);
    });

    var stringToSign = req.service.config.secretAccessKey + canonicalizedQueryString + req.service.config.secretAccessKey;

    sys_parameters.sign = ALY.util.crypto.md5(stringToSign, 'hex').toUpperCase();

    req.httpRequest.body = ALY.util.queryParamsToString(application_parameter);

    req.httpRequest.path = "/router/rest?" + ALY.util.queryParamsToString(sys_parameters);
  },

  buildJSON: function buildJSON(params, rules, api) {
    var builder = new ALY.JSON.Builder(rules, api);
    return builder.build(params);
  }

};

},{"../core":57,"./json":66,"./rest":69}],73:[function(require,module,exports){
var ALY = require('../core');
var parseURL = require('url').parse;

ALY.BatchCompute = ALY.Service.defineService('batchcompute', ['2015-06-30','2015-11-11'], {
    /**
     * @api private
     */
    initialize: function initialize(options) {
        ALY.Service.prototype.initialize.call(this, options);
    },
    setupRequestListeners: function setupRequestListeners(request) {

        var that = this;
        var svc = ALY.ServiceInterface.RestJson;

        request.addListener('build', this.addContentType);

        request.removeListener('extractData', svc.extractData);

        request.addListener('extractError', this.extractError);
        request.addListener('extractData', function (response) {
            that.extractData(response, request['operation']);
        });
    },


    addContentType: function(req){
        var httpRequest = req.httpRequest;
        var headers = httpRequest.headers;

        headers['x-acs-version'] = req.service.config.apiVersion;

        if(req.operation==='updateJobPriority'){
            httpRequest.body = JSON.parse(httpRequest.body).priority+'';
            headers['Content-Type'] = 'application/octet-stream';
            //headers['Content-Length']= httpRequest.body.length;
        }
    },


    extractData: function extractData(resp, operation) {

        resp.data = JSON.parse(resp.httpResponse.body.toString().trim() || '{}');

        var result = resp.data;
        delete result['RequestId'];


        var headers = resp.httpResponse.headers;
        var reqId = headers['x-acs-request-id'] || headers['request-id'];


        resp.data = {
            code: resp.httpResponse.statusCode,
            message: headers.status,
            headers: headers,
            requestId: reqId || ''
        };

        if(headers['x-acs-version']==='2015-06-30') {

            switch (operation) {
                case 'listJobs':
                    resp.data.data = this.getFormatters().formatJobList(result);
                    break;
                case 'getJob':
                    resp.data.data = this.getFormatters().formatJob(result);
                    break;
                case 'getJobDescription':
                    resp.data.data = this.getFormatters().formatJobDescription(result);
                    break;
                case 'listTasks':
                    resp.data.data = this.getFormatters().formatTaskList(result);
                    break;
                case 'listImages':
                    resp.data.data = this.getFormatters().formatImageList(result);
                    break;
                case 'createJob':
                    resp.data.data = this.getFormatters().formatJob(result);
                    break;
            }
        }
        else{
            resp.data.data = result;
        }

    },
    getFormatters: function () {

        function getState(state) {
            switch (state) {
                case 0:
                    return 'Init';
                case 1:
                    return 'Waiting';
                case 2:
                    return 'Running';
                case 3:
                    return 'Finished';
                case 4:
                    return 'Failed';
                case 5:
                    return 'Stopped';
                default:
                    return 'Unkowned';
            }
        }

        return {
            formatJob: function (v) {

                v['JobId'] = v['ResourceId'];
                v['JobName'] = v['Name'];
                v['CreationTime'] = v['CreateTime'];

                delete v['Name'];
                delete v['ResourceId'];
                delete v['CreateTime'];

                if (v['State'] == 'Terminated') v['State'] = 'Finished';

                return v;
            },
            formatJobList: function (data) {
                var that = this;
                var t = [];
                Object.keys(data).forEach(function (k) {
                    t.push(that.formatJob(data[k]));
                });

                t.sort(function (a, b) {
                    return a['JobId'] > b['JobId'] ? 1 : -1;
                });
                return t;
            },
            formatTaskList: function (data) {
                /*{ CountTask:
                 { EndTime: 1435520792,
                 InstanceStatusVector: [Object],
                 StartTime: 1435519721,
                 State: 5,
                 UnfinishedInstances: [Object] } },
                 */
                var t = [];
                Object.keys(data).forEach(function (k) {
                    var v = data[k];
                    v['TaskName'] = k;
                    v['State'] = getState(v['State']);
                    v['InstanceList'] = v['InstanceStatusVector'];

                    delete v['InstanceStatusVector'];
                    delete v['UnfinishedInstances'];

                    if (v['InstanceList']) {
                        v['InstanceList'].forEach(function (n) {
                            n.State = getState(n.State);
                            delete n['WorkerStartTime'];
                            delete n['WorkerEndTime'];
                        });
                    }
                    t.push(data[k]);
                });

                //sort by StartTime, TaskName
                t.sort(function (a, b) {
                    if (a['StartTime'] == 0) {
                        if (b['StartTime'] == 0) {
                            return a['TaskName'] > b['TaskName'] ? 1 : -1;
                        } else {
                            return -1;
                        }
                    } else {
                        if (b['StartTime'] == 0) {
                            return -1;
                        } else {
                            return a['StartTime'] > b['StartTime'] ? 1 : -1;
                        }
                    }
                });
                return t;
            },
            formatImageList: function (data) {
                var t = [];

                Object.keys(data).forEach(function (k) {
                    var v = data[k];
                    v['ImageId'] = k;
                    v['ImageName'] = v['Name'];

                    delete v['Name'];

                    t.push(data[k]);
                });

                t.sort(function (a, b) {
                    return a['ImageId'] > b['ImageId'] ? 1 : -1;
                });
                return t;
            },
            formatJobDescription: function (data) {
                var taskMap = data.TaskDag.TaskDescMap;
                Object.keys(taskMap).forEach(function (k) {
                    var v = taskMap[k];
                    delete v['BlockDeviceMapping'];
                    delete v['CreateSnapshotAfterTerminated'];
                    delete v['LoadImage'];
                    delete v['SaveImage'];
                    delete v['LoadPreparedData'];
                    delete v['MaxReplica'];
                    delete v['MinReplica'];
                });
                return data;
            }

        };
    },


    extractError: function extractError(resp) {

        var headers = resp.httpResponse.headers;

        var body = resp.httpResponse.body;
        var error = body.toString();

        try {
            error = JSON.parse(error);
        } catch (e) {
            error = {};
        }

        resp.error = ALY.util.error(new Error(error.Message), {
            code: error.Code || error.ErrorCode,
            headers: headers,
            requestId: headers['x-acs-request-id'] || headers['request-id']
        });
    }
});

module.exports = ALY.BatchCompute;

},{"../core":57,"url":46}],74:[function(require,module,exports){
var ALY = require('../core');
var parseURL = require('url').parse;

ALY.OpenSearch = ALY.Service.defineService('opensearch', ['2015-01-01'], {
  /**
   * @api private
   */
  initialize: function initialize(options) {
    ALY.Service.prototype.initialize.call(this, options);
  },

  setupRequestListeners: function setupRequestListeners(request) {
    request.addListener('build', this.addContentType);
    request.addListener('build', this.buildContent);
    //request.addListener('build', this.populateURI);
    //
    //request.addListener('build', this.computeContentMd5);
    //request.addListener('build', this.computeSha256);

    request.removeListener('validate',
        ALY.EventListeners.Core.VALIDATE_REGION);

    request.addListener('extractError', this.extractError);
    request.addListener('extractData', this.extractData);

    //request.addListener('afterBuild', function (req) {
    //    //Host in request.header
    //    console.log(req.httpRequest.headers['projectName'], req.params['projectName']);
    //
    //    req.httpRequest.headers['Host'] = req.params['projectName']
    //       +'.'+req.httpRequest.endpoint.hostname;
    //    //头中的 projectName 不需要
    //    delete req.httpRequest.headers['projectName'];
    //});
  },

  populateURI: function populateURI(req) {
    var hostname = req.httpRequest.endpoint.hostname;

    var projectName = req.params['projectName'];
    var host = projectName + '.' + hostname;

    if (!/^[0-9.]+$/.test(hostname)) {
      //不是ip,  是域名, 则需要拼接project名
      var protocol = req.httpRequest.endpoint.protocol;
      var port = req.httpRequest.endpoint.port;

      //real endpoint
      var endpointObj = parseURL(protocol + '//' + host + ':' + port);

      ALY.util.update(req.httpRequest, {endpoint: endpointObj});
      // ALY.util.update(req.service, {endpoint: endpointObj });
    }

    //final host， 不管是ip还是域名，都要拼接project名
    req.httpRequest.headers['Host'] = host;

    //头中的 projectName 不需要
    delete req.httpRequest.headers['projectName'];
  },

  addContentType: function addContentType(req) {
    var httpRequest = req.httpRequest;

    httpRequest.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
  },

  buildContent: function buildContent(req) {
    var input = req.service.api.operations[req.operation].input;
    var payload = input.payload;
    var params = {};

    // todo: payload 是否有可能为 string
    if (typeof payload === 'string') {

      var rules = input.members[payload];
      params = req.params[payload];

      if (params === undefined) return;

      if (rules.type === 'structure') {
        req.httpRequest.body = this.buildJSON(params, input, req.service.api);
      } else {
        // non-xml paylaod
        req.httpRequest.body = params;
      }

    } else if (payload) {
      var arr = [];

      ALY.util.arrayEach(payload, function (param) {
        if (req.params[param] !== undefined) {
          params[param] = req.params[param];
          if(param == 'items') {
            arr.push(param + '=' + encodeURIComponent(JSON.stringify(req.params[param])));
          }
          else {
            arr.push(param + '=' + req.params[param]);
          }
        }
      });

      req.httpRequest.body = arr.join('&');
    }

  },

  willComputeChecksums: function willComputeChecksums(req) {

    // // TODO: compute checksums for Stream objects
    // if (!ALY.util.Buffer.isBuffer(req.httpRequest.body) &&
    //     typeof req.httpRequest.body !== 'string') {
    //     return false;
    // }

    var rules = req.service.api.operations[req.operation].input;

    // // V4 signer uses SHA256 signatures so only compute MD5 if it is required
    // if (req.service.getSignerClass(req) === ALY.Signers.V4) {
    //     if (rules.ContentMD5 && !rules.ContentMD5.required) return false;
    // }

    if (rules.ContentMD5) return true;
  },

  computeContentMd5: function computeContentMd5(req) {
    if (req.service.willComputeChecksums(req)) {
      var md5 = ALY.util.crypto.md5(req.httpRequest.body, 'hex').toUpperCase();
      req.httpRequest.headers['Content-MD5'] = md5;
    }
  },

  computeSha256: function computeSha256(req) {
    if (req.service.getSignerClass(req) === ALY.Signers.V4) {
      req.httpRequest.headers['X-Amz-Content-Sha256'] =
          ALY.util.crypto.sha256(req.httpRequest.body || '', 'hex');
    }
  },

  escapePathParam: function escapePathParam(value) {
    return ALY.util.uriEscapePath(String(value));
  },


  successfulResponse: function successfulResponse(resp) {
    //var req = resp.request;
    var httpResponse = resp.httpResponse;
    return httpResponse.statusCode < 300;
  },

  retryableError: function retryableError(error, request) {

    var _super = ALY.Service.prototype.retryableError;
    return _super.call(this, error, request);

  },

  extractData: function extractData(resp) {
    ALY.ServiceInterface.Rest.extractData(resp);

    var req = resp.request;
    var rules = req.service.api.operations[req.operation].output || {};
    if (rules.payload && rules.members[rules.payload]) {
      if (rules.members[rules.payload].streaming) {
        resp.data[rules.payload] = resp.httpResponse.body;
      } else {
        resp.data[rules.payload] = resp.httpResponse.body.toString();
      }
    } else {
      var data = resp.data;
      ALY.ServiceInterface.Json.extractData(resp);
      resp.data = ALY.util.merge(data, resp.data);
    }
  },

  extractError: function extractError(resp) {
    var error = {};
    var httpResponse = resp.httpResponse;

    if (httpResponse.body.length > 0) {
      var e = JSON.parse(httpResponse.body.toString());
      if (e.__type || e.code) {
        error.code = (e.__type || e.code).split('#').pop();
      } else {
        error.code = 'UnknownError';
      }
      if (error.code === 'RequestEntityTooLarge') {
        error.message = 'Request body must be less than 1 MB';
      } else {
        error.message = (e.message || e.Message || null);
      }
    } else {
      error.code = httpResponse.statusCode;
      error.message = null;
    }

    resp.error = ALY.util.error(new Error(), error);
  }

});

module.exports = ALY.OpenSearch;

},{"../core":57,"url":46}],75:[function(require,module,exports){
var ALY = require('../core');

var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
var ipv6Regex = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;



ALY.OSS = ALY.Service.defineService('oss', ['2013-10-15'], {
  /**
   * @api private
   */
  initialize: function initialize(options) {
    ALY.Service.prototype.initialize.call(this, options);
  },

  hostIsIP: function hostIsIP(hostName){
    return ipv4Regex.test(hostName) || ipv6Regex.test(hostName);
  },
  setupRequestListeners: function setupRequestListeners(request) {
    request.addListener('build', this.addContentType);
    request.addListener('build', this.populateURI);
    request.addListener('build', this.computeContentMd5);
    request.addListener('extractError', this.extractError);
    request.addListener('extractData', this.extractData);
  },

  populateURI: function populateURI(req) {
    var httpRequest = req.httpRequest;
    var b = req.params.Bucket;
  
    if (b) {
      // support cname
      var cname = req.service.config.cname || false
      if (cname) {
        httpRequest.endpoint.host = httpRequest.endpoint.hostname;
        httpRequest.virtualHostedBucket = b;
        httpRequest.path = httpRequest.path.replace(new RegExp('^/' + b), '');

        if (httpRequest.path[0] !== '/') {
          httpRequest.path = '/' + httpRequest.path;
        }
        return
      }

      // is IP
      if(!req.service.hostIsIP(httpRequest.endpoint.hostname)){
        // 确保 host 只被 set 一次，因为 endpoint 只在 service 唯一
        httpRequest.endpoint.host = httpRequest.endpoint.hostname = b + '.' + httpRequest.endpoint.hostname;
        httpRequest.virtualHostedBucket = b;
        httpRequest.path = httpRequest.path.replace(new RegExp('^/' + b), '');
      }
      
      if (httpRequest.path[0] !== '/') {
        httpRequest.path = '/' + httpRequest.path;
      }
    }
  },

  addContentType: function addContentType(req) {
    var httpRequest = req.httpRequest;
    if (!httpRequest.headers['Content-Type']) { // always have a Content-Type
      httpRequest.headers['Content-Type'] = 'application/octet-stream';
    }
    if (ALY.util.isBrowser() && window.navigator.userAgent.match(/Firefox/)) {
      if (!httpRequest.headers['Content-Type'].match(/;/)) {
        var charset = '; charset=UTF-8';
        httpRequest.headers['Content-Type'] += charset;
      }
    }
  },

  willComputeChecksums: function willComputeChecksums(req) {
    // TODO: compute checksums for Stream objects
    //if (!ALY.util.Buffer.isBuffer(req.httpRequest.body) &&
    //  typeof req.httpRequest.body !== 'string') {
    //  return false;
    //}

    var rules = req.service.api.operations[req.operation].input.members;

    if (rules.ContentMD5 && !req.params.ContentMD5) return true;
  },

  computeContentMd5: function computeContentMd5(req) {
    if (req.service.willComputeChecksums(req)) {
      var md5 = ALY.util.crypto.md5(req.httpRequest.body, 'base64');
      req.httpRequest.headers['Content-MD5'] = md5;
    }
  },

  /**
   * OSS requires that path params not escape forward slashes.
   *
   * @api private
   */
  escapePathParam: function escapePathParam(value) {
    return ALY.util.uriEscapePath(String(value));
  },

  /**
   * @return [Boolean] whether response contains an error
   * @api private
   */
  successfulResponse: function successfulResponse(resp) {
    var req = resp.request;
    var httpResponse = resp.httpResponse;
    if (req.operation === 'completeMultipartUpload' &&
      httpResponse.body.toString().match('<Error>'))
      return false;
    else
      return httpResponse.statusCode < 300;
  },

  /**
   * @return [Boolean] whether the error can be retried
   * @api private
   */
  retryableError: function retryableError(error, request) {
    if (request.operation == 'completeMultipartUpload' &&
      error.statusCode === 200) {
      return true;
    } else {
      var _super = ALY.Service.prototype.retryableError;
      return _super.call(this, error, request);
    }
  },

  /**
   * Provides a specialized parser for getBucketLocation -- all other
   * operations are parsed by the super class.
   *
   * @api private
   */
  extractData: function extractData(resp) {
    var req = resp.request;
    if (req.operation === 'getBucketLocation') {
      /*jshint regexp:false*/
      var match = resp.httpResponse.body.toString().match(/>(.+)<\/Location/);
      if (match) {
        delete resp.data['_'];
        resp.data.LocationConstraint = match[1];
      }
    }

    for(var k in resp.httpResponse.headers){
      if(k.indexOf('x-oss-')==0){
        var arr = k.substring('x-oss-'.length).split('-');
        for(var i=0;i<arr.length;i++){
          arr[i] = arr[i][0].toUpperCase()+arr[i].substring(1);
        }
        resp.data[arr.join('')] = resp.httpResponse.headers[k];
      }
      else if(k=='content-md5'){
        resp.data['ContentMD5'] = resp.httpResponse.headers['content-md5'];
      }
    }

    // extract request id
    resp.data.RequestId = resp.httpResponse.headers['x-oss-request-id'] ||
        resp.httpResponse.headers['x-oss-requestid'];
  },

  /**
   * Extracts an error object from the http response.
   *
   * @api private
   */
  extractError: function extractError(resp) {
    var codes = {
      304: 'NotModified',
      403: 'Forbidden',
      400: 'BadRequest',
      404: 'NotFound'
    };

    var code = resp.httpResponse.statusCode;
    var body = resp.httpResponse.body;
    if (codes[code] && body.length === 0) {
      resp.error = ALY.util.error(new Error(), {
        code: codes[resp.httpResponse.statusCode],
        message: null,
        headers: resp.httpResponse.headers
      });
    } else {
      var data;
      try {
        data = new ALY.XML.Parser({}).parse(body.toString());
        resp.error = ALY.util.error(new Error(), {
          code: data.Code || code,
          message: data.Message || null,
          headers: resp.httpResponse.headers
        });
      }
      catch(e) {
        data = body.toString();
        resp.error = ALY.util.error(new Error(), {
          code: code,
          message: data,
          headers: resp.httpResponse.headers
        });
      }
    }
  },

  getSignedUrl: function getSignedUrl(operation, params, callback) {
    params = ALY.util.copy(params || {});
    var expires = params.Expires || 900;
    delete params.Expires; // we can't validate this
    var request = this.makeRequest(operation, params);

    var expiresHeader = 'presigned-expires';

    function signedUrlBuilder() {
      delete request.httpRequest.headers['User-Agent'];

      if (request.service.getSignerClass() === ALY.Signers.V4) {
        //if (expires > 604800) { // one week expiry is invalid
        //  var message = 'getSignedUrl() does not support expiry time greater ' +
        //    'than a week with SigV4 signing.';
        //  throw ALY.util.error(new Error(), {
        //    code: 'InvalidExpiryTime', message: message, retryable: false
        //  });
        //}
        request.httpRequest.headers[expiresHeader] = expires;
      } else {
        request.httpRequest.headers[expiresHeader] = parseInt(
          ALY.util.date.unixSeconds() + expires, 10).toString();
      }
    }

    function signedUrlSigner() {
      var queryParams = {};

      ALY.util.each(request.httpRequest.headers, function (key, value) {
        if (key === expiresHeader) key = 'Expires';
        queryParams[key] = value;
      });
      delete request.httpRequest.headers[expiresHeader];

      var auth = queryParams['Authorization'].split(' ');
      if (auth[0] === 'OSS') {
        auth = auth[1].split(':');
        queryParams['OSSAccessKeyId'] = auth[0];
        queryParams['Signature'] = auth[1];
      }
      delete queryParams['Authorization'];
      delete queryParams['Host'];

      // build URL
      var endpoint = request.httpRequest.endpoint;
      var parsedUrl = ALY.util.urlParse(request.httpRequest.path);
      var querystring = ALY.util.queryParamsToString(queryParams);
      endpoint.pathname = parsedUrl.pathname;
      endpoint.search = !parsedUrl.search ? querystring :
        parsedUrl.search + '&' + querystring;
    }

    request.on('build', signedUrlBuilder);
    request.on('sign', signedUrlSigner);
    request.removeListener('build', this.addContentType);
    request.removeAllListeners('afterBuild');
    if (!params.Body) { // no Content-MD5/SHA-256 if body is not provided
      request.removeListener('build', this.computeContentMd5);
    }

    if (callback) {
      request.build(function() {
        if (request.response.error) callback(request.response.error, null);
        else callback(null, ALY.util.urlFormat(request.httpRequest.endpoint));
      });
    } else {
      request.build();
      return ALY.util.urlFormat(request.httpRequest.endpoint);
    }
  }
});

module.exports = ALY.OSS;

},{"../core":57}],76:[function(require,module,exports){
(function (process){(function (){
var ALY = require('../core');
var inherit = ALY.util.inherit;
//var API_VERSION = '2015-11-11';
//var API_VERSION = '2015-06-30';

/**
 * @api private
 */
ALY.Signers.BatchCompute = inherit(ALY.Signers.RequestSigner, {

  //entry
  addAuthorization: function addAuthorization(credentials, date) {
    var headers = this.request.headers;

    //headers['Date'] = ALY.util.date.rfc822(date);
    headers['x-acs-date'] = ALY.util.date.rfc822(date);
    //headers['Date'] = new Date().toGMTString();


    //var bodyStr;
    //var body = this.request.body;
    //if(body){
    //  bodyStr = typeof(body)=='object'? JSON.stringify(body):body;
    //  headers['Content-MD5'] = ALY.util.crypto.md5(bodyStr,'hex').toUpperCase();
    //}

    headers['x-acs-signature-method'] = 'HMAC-SHA1';
    headers['x-acs-signature-version'] = '1.0';
    //headers['x-acs-version'] = API_VERSION;
    headers['x-sdk-client'] = 'node.js/1.0.0';
    headers['Accept'] = 'application/json';

    var signature = this.sign(credentials.secretAccessKey, this.stringToSign());
    var auth = 'acs ' + credentials.accessKeyId + ':' + signature;

    headers['Authorization'] = auth;
  },

  stringToSign: function stringToSign() {
    var r = this.request;

    //fix signature not match in browser
    if (r.method !== 'GET' && r.method !== 'HEAD') {
      r.headers['Content-Type'] = r.headers['Content-Type'] || 'text/plain;charset=UTF-8';
    }

    var parts = [];
    parts.push(r.method);
    parts.push(r.headers['Accept'] || '');
    parts.push(r.headers['Content-MD5'] || '');
    parts.push(r.headers['Content-Type'] || '');
    parts.push(r.headers['x-acs-date'] || r.headers['Date'] || '');

    var headers = this.canonicalizedAmzHeaders();
    if (headers) parts.push(headers);
    parts.push(this.canonicalizedResource());

    return parts.join('\n');
  },

  canonicalizedAmzHeaders: function canonicalizedAmzHeaders() {

    var acsHeaders = [];

    ALY.util.each(this.request.headers, function (name) {
      if (name.match(/^x-acs-/i))
        acsHeaders.push(name);
    });

    acsHeaders.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });

    var parts = [];
    ALY.util.arrayEach.call(this, acsHeaders, function (name) {
      parts.push(name.toLowerCase() + ':' + String(this.request.headers[name]));
    });

    return parts.join('\n');

  },

  canonicalizedResource: function canonicalizedResource() {

    var r = this.request;

    var parts = r.path.split('?');
    var path = parts[0];
    var querystring = parts[1];

    var resource = '';


    resource += decodeURIComponent(path);


    if (querystring) {

      // collect a list of sub resources and query params that need to be signed
      var resources = [];

      var arr = querystring.replace(/(^&*)|(&*$)/g, '').split('&');


      ALY.util.arrayEach.call(this, arr, function (param) {
        var kv = param.split('=');

        var name = kv[0];

        var value = (kv.length > 1) ? decodeURIComponent(kv[1]) : '';
        /*jshint undef:false */

        var resource = {name: name};
        if (value !== undefined) {
          resource.value = value;
        }
        resources.push(resource);

      });

      resources.sort(function (a, b) {
        return a.name < b.name ? -1 : 1;
      });

      if (resources.length) {

        querystring = [];
        ALY.util.arrayEach(resources, function (resource) {
          if (resource.value === undefined)
            querystring.push(resource.name);
          else {

            if (resource.value != null && resource.value != '') {
              querystring.push(resource.name + '=' + resource.value);
            } else {
              querystring.push(resource.name);
            }
          }
        });

        resource += '?' + querystring.join('&');
      }

    }

    return resource;

  },

  sign: function sign(secret, string) {
    if (process.env.DEBUG == 'aliyun') {
      console.log('----------- sign string start -----------');
      console.log(string);
      console.log('----------- sign string end -----------');
    }
    return ALY.util.crypto.hmac(secret, string, 'base64', 'sha1');
  }
});

module.exports = ALY.Signers.BatchCompute;

}).call(this)}).call(this,require('_process'))
},{"../core":57,"_process":24}],77:[function(require,module,exports){
(function (process){(function (){
var ALY = require('../core');
var inherit = ALY.util.inherit;

function randomNumbers(count) {
  var num = '';
  for (var i = 0; i < count; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return num;
}

/**
 * @api private
 */
ALY.Signers.CMS = inherit(ALY.Signers.RequestSigner, {

  addAuthorization: function addAuthorization(credentials, date) {
    // if (!this.request.headers['presigned-expires']) {
    //   this.request.headers['Date'] = ALY.util.date.rfc822(date);
    // }

    // if (credentials.sessionToken) {
    //   // presigned URLs require this header to be lowercased
    //   this.request.headers['x-amz-security-token'] = credentials.sessionToken;
    // }
    var date = new Date();

    var globalQuery = {
      'Format': 'JSON',
      'Version': '2015-10-20',
      'AccessKeyId': credentials.accessKeyId,
      'SignatureMethod': 'HMAC-SHA1',
      'SignatureVersion': '1.0',
      'SignatureNonce': String(date.getTime()) + randomNumbers(4),
      'Timestamp': date.toISOString().replace(/\.\d{3}/, '')
    };

    var parts = [];
    Object.keys(globalQuery).forEach(function(key) {
      parts.push(key + '=' + encodeURIComponent(globalQuery[key]));
    });
    this.request.path += (this.request.path.indexOf('?') == -1? '?' : '&') + parts.join('&');

    var signature = this.sign(credentials.secretAccessKey, this.stringToSign());
    this.request.path += '&Signature=' + encodeURIComponent(signature);
    // var auth = 'OSS ' + credentials.accessKeyId + ':' + signature;

    // this.request.headers['Authorization'] = auth;
  },

  stringToSign: function stringToSign() {
    var r = this.request;

    var s = r.method + '&%2F&' + encodeURIComponent(this.canonicalizedQueryString());

    return s;
  },

  canonicalizedQueryString: function canonicalizedQueryString() {
    var that = this;
    var r = this.request;
    var querystring = r.path.split('?')[1];
    var resource = '';
    if (r.body) {
      querystring += '&' + r.body;
    }

    if (querystring) {

      // collect a list of sub resources and query params that need to be signed
      var resources = [];

      ALY.util.arrayEach.call(this, querystring.split('&'), function (param) {
        var pos = param.indexOf('=');
        var name = param.slice(0, pos);
        var value = param.slice(pos + 1);

        var resource = { name: name };
        if (value !== undefined) {
          resource.value = decodeURIComponent(value);
        }

        resources.push(resource);
      });

      resources.sort(function (a, b) { return a.name < b.name ? -1 : 1; });

      if (resources.length) {

        querystring = [];
        ALY.util.arrayEach(resources, function (resource) {
          if (resource.value === undefined)
            querystring.push(that.cmsEscape(resource.name));
          else
            querystring.push(that.cmsEscape(resource.name) + '=' + that.cmsEscape(resource.value));
        });

        resource += querystring.join('&');
      }
    }

    return resource;
  },

  cmsEscape: function(clearString) {
    // http://v8.googlecode.com/svn/trunk/src/uri.js
    return encodeURIComponent(clearString)
        .replace(/\!/gi, '%21')
        .replace(/\'/gi, '%27')
        .replace(/\(/gi, '%28')
        .replace(/\)/gi, '%29')
        .replace(/\*/gi, '%2A')
  },

  sign: function sign(secret, string) {
    if(process.env.DEBUG == 'aliyun') {
      console.log('----------- sign string start -----------');
      console.log(string);
      console.log('----------- sign string end -----------');
    }
    return ALY.util.crypto.hmac(secret + '&', string, 'base64', 'sha1');
  }
});

module.exports = ALY.Signers.CMS;
}).call(this)}).call(this,require('_process'))
},{"../core":57,"_process":24}],78:[function(require,module,exports){
(function (process){(function (){
var ALY = require('../core');
var inherit = ALY.util.inherit;

function randomNumbers(count) {
  var num = '';
  for (var i = 0; i < count; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return num;
}

/**
 * @api private
 */
ALY.Signers.OpenSearch = inherit(ALY.Signers.RequestSigner, {

  addAuthorization: function addAuthorization(credentials, date) {
    // if (!this.request.headers['presigned-expires']) {
    //   this.request.headers['Date'] = ALY.util.date.rfc822(date);
    // }

    // if (credentials.sessionToken) {
    //   // presigned URLs require this header to be lowercased
    //   this.request.headers['x-amz-security-token'] = credentials.sessionToken;
    // }
    var date = new Date();

    var globalQuery = {
      'Version': 'v2',
      'AccessKeyId': credentials.accessKeyId,
      'SignatureMethod': 'HMAC-SHA1',
      'SignatureVersion': '1.0',
      'SignatureNonce': String(date.getTime()) + randomNumbers(4),
      'Timestamp': date.toISOString().replace(/\.\d{3}/, '')
    };

    var parts = [];
    Object.keys(globalQuery).forEach(function(key) {
      parts.push(key + '=' + encodeURIComponent(globalQuery[key]));
    });
    this.request.path += (this.request.path.indexOf('?') == -1? '?' : '&') + parts.join('&');

    var signature = this.sign(credentials.secretAccessKey, this.stringToSign());
    this.request.path += '&Signature=' + encodeURIComponent(signature);
    // var auth = 'OSS ' + credentials.accessKeyId + ':' + signature;

    // this.request.headers['Authorization'] = auth;
  },

  stringToSign: function stringToSign() {
    var r = this.request;

    var s = r.method + '&%2F&' + encodeURIComponent(this.canonicalizedQueryString());

    return s;
  },

  canonicalizedQueryString: function canonicalizedQueryString() {

    var r = this.request;
    var querystring = r.path.split('?')[1];
    var resource = '';
    if (r.body) {
      querystring += '&' + r.body;
    }

    if (querystring) {

      // collect a list of sub resources and query params that need to be signed
      var resources = [];

      ALY.util.arrayEach.call(this, querystring.split('&'), function (param) {
        var pos = param.indexOf('=');
        var name = param.slice(0, pos);
        var value = param.slice(pos + 1);

        var resource = { name: name };
        if (value !== undefined) {
          resource.value = decodeURIComponent(value);
        }

        resources.push(resource);
      });

      resources.sort(function (a, b) { return a.name < b.name ? -1 : 1; });

      if (resources.length) {

        querystring = [];
        ALY.util.arrayEach(resources, function (resource) {
          if (resource.value === undefined)
            querystring.push(ALY.util.opensearchEscape(resource.name));
          else
            querystring.push(ALY.util.opensearchEscape(resource.name) + '=' + ALY.util.opensearchEscape(resource.value));
        });

        resource += querystring.join('&');
      }
    }

    return resource;
  },

  sign: function sign(secret, string) {
    if(process.env.DEBUG == 'aliyun') {
      console.log('----------- sign string start -----------');
      console.log(string);
      console.log('----------- sign string end -----------');
    }
    return ALY.util.crypto.hmac(secret + '&', string, 'base64', 'sha1');
  }
});

module.exports = ALY.Signers.OpenSearch;
}).call(this)}).call(this,require('_process'))
},{"../core":57,"_process":24}],79:[function(require,module,exports){
(function (process){(function (){
var ALY = require('../core');
var inherit = ALY.util.inherit;

/**
 * @api private
 */
ALY.Signers.OSS = inherit(ALY.Signers.RequestSigner, {

  subResources: {
    "acl": 1,
    "uploads": 1,
    "location": 1,
    "cors": 1,
    "logging": 1,
    "website": 1,
    "referer": 1,
    "lifecycle": 1,
    "delete": 1,
    "append": 1,
    "tagging": 1,
    "objectMeta": 1,
    "uploadId": 1,
    "partNumber": 1,
    "security-token": 1,
    "position": 1,
    "img": 1,
    "style": 1,
    "styleName": 1,
    "replication": 1,
    "replicationProgress": 1,
    "replicationLocation": 1,
    'restore': 1,
    "cname": 1,
    "bucketInfo": 1,
    "comp": 1,
    "qos": 1,
    "live": 1,
    "status": 1,
    "vod": 1,
    "startTime": 1,
    "endTime": 1,
    "symlink": 1,
    "x-oss-process": 1,
    "response-content-type": 1,
    "response-content-language": 1,
    "response-expires": 1,
    "response-cache-control": 1,
    "response-content-disposition": 1,
    "response-content-encoding": 1
  },

  // when building the stringToSign, these querystring params should be
  // part of the canonical resource string with their NON-encoded values
  responseHeaders: {
    'response-content-type': 1,
    'response-content-language': 1,
    'response-expires': 1,
    'response-cache-control': 1,
    'response-content-disposition': 1,
    'response-content-encoding': 1
  },

  addAuthorization: function addAuthorization(credentials, date, isRequestPayer) {

    if(isRequestPayer) {
      this.request.headers['x-oss-request-payer'] = 'requester';
    }

    if (!this.request.headers['presigned-expires']) {
      // 在浏览器中不能设置 date header
      if (ALY.util.isBrowser()) {
        this.request.headers['x-oss-date'] = ALY.util.date.rfc822(date);
      }
      else {
        this.request.headers['Date'] = ALY.util.date.rfc822(date);
      }
    }

    var signature = this.sign(credentials.secretAccessKey, this.stringToSign());
    var auth = 'OSS ' + credentials.accessKeyId + ':' + signature;

    this.request.headers['Authorization'] = auth;
  },

  stringToSign: function stringToSign() {
    var r = this.request;

    var parts = [];
    parts.push(r.method);
    parts.push(r.headers['Content-MD5'] || '');
    parts.push(r.headers['Content-Type'] || '');

    // This is the "Date" header, but we use X-Amz-Date.
    // The S3 signing mechanism requires us to pass an empty
    // string for this Date header regardless.
    // this works:
    // getSignedUrl use 'presigned-expires'
    // other request use 'Date'
    parts.push(r.headers['presigned-expires'] || r.headers['x-oss-date'] || r.headers['Date'] || '');

    var headers = this.canonicalizedHeaders();
    if (headers) parts.push(headers);
    parts.push(this.canonicalizedResource());

    return parts.join('\n');

  },

  canonicalizedHeaders: function canonicalizedHeaders() {

    var headers = [];

    ALY.util.each(this.request.headers, function (name) {
      if (name.match(/^x-oss-/i))
        headers.push(name);
    });

    headers.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });

    var parts = [];
    ALY.util.arrayEach.call(this, headers, function (name) {
      parts.push(name.toLowerCase() + ':' + String(this.request.headers[name]));
    });

    return parts.join('\n');

  },

  canonicalizedResource: function canonicalizedResource() {

    var r = this.request;

    var parts = r.path.split('?');
    var path = parts[0];
    var querystring = parts[1];

    var resource = '';

    if (r.virtualHostedBucket)
      resource += '/' + r.virtualHostedBucket;

    // OSS 遗留问题，header 中的 Key 不能 url encode
    resource += decodeURIComponent(path);

    if (querystring) {

      // collect a list of sub resources and query params that need to be signed
      var resources = [];

      ALY.util.arrayEach.call(this, querystring.split('&'), function (param) {
        var name = param.split('=')[0];
        var value = param.split('=')[1];
        if (this.subResources[name] || this.responseHeaders[name]) {
          var subresource = {name: name};
          if (value !== undefined) {
            if (this.subResources[name]) {
              subresource.value = value;
            } else {
              subresource.value = decodeURIComponent(value);
            }
          }
          resources.push(subresource);
        }
      });

      resources.sort(function (a, b) {
        return a.name < b.name ? -1 : 1;
      });

      if (resources.length) {

        querystring = [];
        ALY.util.arrayEach(resources, function (res) {
          if (res.value === undefined)
            querystring.push(res.name);
          else
            querystring.push(res.name + '=' + res.value);
        });

        resource += '?' + querystring.join('&');
      }

    }

    return resource;
  },

  sign: function sign(secret, string) {
    if (process.env.DEBUG == 'aliyun') {
      console.log('----------- sign string start -----------');
      console.log(string);
      console.log('----------- sign string end -----------');
    }
    return ALY.util.crypto.hmac(secret, string, 'base64', 'sha1');
  }
});

module.exports = ALY.Signers.OSS;

}).call(this)}).call(this,require('_process'))
},{"../core":57,"_process":24}],80:[function(require,module,exports){
(function (process){(function (){
var ALY = require('../core');
var inherit = ALY.util.inherit;

/**
 * @api private
 */
ALY.Signers.OTS = inherit(ALY.Signers.RequestSigner, {

  subResources: {
    'acl': 1,
    'cors': 1,
    'lifecycle': 1,
    'delete': 1,
    'location': 1,
    'logging': 1,
    'notification': 1,
    'partNumber': 1,
    'policy': 1,
    'requestPayment': 1,
    'restore': 1,
    'tagging': 1,
    'torrent': 1,
    'uploadId': 1,
    'uploads': 1,
    'versionId': 1,
    'versioning': 1,
    'versions': 1,
    'website': 1
  },

  // when building the stringToSign, these querystring params should be
  // part of the canonical resource string with their NON-encoded values
  responseHeaders: {
    'response-content-type': 1,
    'response-content-language': 1,
    'response-expires': 1,
    'response-cache-control': 1,
    'response-content-disposition': 1,
    'response-content-encoding': 1
  },

  addAuthorization: function addAuthorization(credentials, date) {
    this.request.headers['x-ots-date'] = ALY.util.date.rfc822(date);
    this.request.headers['x-ots-accesskeyid'] = credentials.accessKeyId;

    var signature = this.sign(credentials.secretAccessKey, this.stringToSign());

    this.request.headers['x-ots-signature'] = signature;
  },

  stringToSign: function stringToSign() {
    var r = this.request;

    var parts = [];

    parts.push(r.path);

    parts.push(r.method + '\n');

    var headers = this.canonicalizedHeaders();
    if (headers) parts.push(headers);
    //parts.push(this.canonicalizedResource());

    return parts.join('\n') + '\n';
  },

  canonicalizedHeaders: function canonicalizedHeaders() {

    var headers = [];

    ALY.util.each(this.request.headers, function (name) {
      if (name.match(/^x-ots-/i))
        headers.push(name);
    });

    headers.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });

    var parts = [];
    ALY.util.arrayEach.call(this, headers, function (name) {
      parts.push(name.toLowerCase() + ':' + String(this.request.headers[name]));
    });

    return parts.join('\n');

  },

  canonicalizedResource: function canonicalizedResource() {

    var r = this.request;

    var parts = r.path.split('?');
    var path = parts[0];
    var querystring = parts[1];

    var resource = '';

    if (r.virtualHostedBucket)
      resource += '/' + r.virtualHostedBucket;

    // OSS 遗留问题，header 中的 Key 不能 url encode
    resource += decodeURIComponent(path);

    if (querystring) {

      // collect a list of sub resources and query params that need to be signed
      var resources = [];

      ALY.util.arrayEach.call(this, querystring.split('&'), function (param) {
        var name = param.split('=')[0];
        var value = param.split('=')[1];
        if (this.subResources[name] || this.responseHeaders[name]) {
          var subresource = { name: name };
          if (value !== undefined) {
            if (this.subResources[name]) {
              subresource.value = value;
            } else {
              subresource.value = decodeURIComponent(value);
            }
          }
          resources.push(subresource);
        }
      });

      resources.sort(function (a, b) { return a.name < b.name ? -1 : 1; });

      if (resources.length) {

        querystring = [];
        ALY.util.arrayEach(resources, function (res) {
          if (res.value === undefined)
            querystring.push(res.name);
          else
            querystring.push(res.name + '=' + res.value);
        });

        resource += '?' + querystring.join('&');
      }

    }

    return resource;

  },

  sign: function sign(secret, string) {
    if(process.env.DEBUG == 'aliyun') {
      console.log('----------- sign string start -----------');
      console.log(string);
      console.log('----------- sign string end -----------');
    }
    return ALY.util.crypto.hmac(secret, string, 'base64', 'sha1');
  }
});

module.exports = ALY.Signers.OSS;

}).call(this)}).call(this,require('_process'))
},{"../core":57,"_process":24}],81:[function(require,module,exports){
var ALY = require('../core');
var inherit = ALY.util.inherit;

ALY.Signers.POP = inherit(ALY.Signers.RequestSigner, {

  addAuthorization: function addAuthorization(credentials, date) {
  },

});

module.exports = ALY.Signers.POP;

},{"../core":57}],82:[function(require,module,exports){
(function (process){(function (){
var ALY = require('../core');
var inherit = ALY.util.inherit;

/**
 * @api private
 */
ALY.Signers.PopJson = inherit(ALY.Signers.RequestSigner, {

  //entry
  addAuthorization: function addAuthorization(credentials, date) {
    var headers = this.request.headers;

    headers['x-acs-date'] = ALY.util.date.rfc822(date);

    headers['x-acs-signature-method'] = 'HMAC-SHA1';
    headers['x-acs-signature-version'] = '1.0';
    //headers['x-acs-version'] = API_VERSION;
    headers['x-sdk-client'] = 'node.js/1.0.0';
    headers['Accept'] = 'application/json';

    var signature = this.sign(credentials.secretAccessKey, this.stringToSign());

    headers['Authorization'] = 'acs ' + credentials.accessKeyId + ':' + signature;
  },

  stringToSign: function stringToSign() {
    var r = this.request;

    //fix signature not match in browser
    if (r.method !== 'GET' && r.method !== 'HEAD') {
      r.headers['Content-Type'] = 'application/json;charset=utf-8';
    }

    var parts = [];
    parts.push(r.method);
    parts.push(r.headers['Accept'] || '');
    parts.push(r.headers['Content-MD5'] || '');
    parts.push(r.headers['Content-Type'] || '');
    parts.push(r.headers['x-acs-date'] || r.headers['Date'] || '');

    var headers = this.canonicalizedAcsHeaders();
    if (headers) parts.push(headers);
    parts.push(this.canonicalizedResource());

    return parts.join('\n');
  },

  canonicalizedAcsHeaders: function canonicalizedAcsHeaders() {

    var acsHeaders = [];

    ALY.util.each(this.request.headers, function (name) {
      if (name.match(/^x-acs-/i))
        acsHeaders.push(name);
    });

    acsHeaders.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });

    var parts = [];
    ALY.util.arrayEach.call(this, acsHeaders, function (name) {
      parts.push(name.toLowerCase() + ':' + String(this.request.headers[name]));
    });

    return parts.join('\n');

  },

  canonicalizedResource: function canonicalizedResource() {

    var r = this.request;

    var parts = r.path.split('?');
    var path = parts[0];
    var querystring = parts[1];

    var resource = '';

    resource += decodeURIComponent(path);

    if (querystring) {

      // collect a list of sub resources and query params that need to be signed
      var resources = [];

      var arr = querystring.replace(/(^&*)|(&*$)/g, '').split('&');

      ALY.util.arrayEach.call(this, arr, function (param) {
        var kv = param.split('=');

        var name = kv[0];

        var value = (kv.length > 1) ? decodeURIComponent(kv[1]) : '';
        /*jshint undef:false */

        var resource = {name: name};
        if (value !== undefined) {
          resource.value = value;
        }
        resources.push(resource);

      });

      resources.sort(function (a, b) {
        return a.name < b.name ? -1 : 1;
      });

      if (resources.length) {

        querystring = [];
        ALY.util.arrayEach(resources, function (resource) {
          if (resource.value === undefined)
            querystring.push(resource.name);
          else {

            if (resource.value !== null && resource.value !== '') {
              querystring.push(resource.name + '=' + resource.value);
            } else {
              querystring.push(resource.name);
            }
          }
        });

        resource += '?' + querystring.join('&');
      }

    }

    return resource;

  },

  sign: function sign(secret, string) {
    if (process.env.DEBUG === 'aliyun') {
      console.log('----------- sign string start -----------');
      console.log(string);
      console.log('----------- sign string end -----------');
    }
    return ALY.util.crypto.hmac(secret, string, 'base64', 'sha1');
  }
});

module.exports = ALY.Signers.PopJson;
}).call(this)}).call(this,require('_process'))
},{"../core":57,"_process":24}],83:[function(require,module,exports){
var ALY = require('../core');
var inherit = ALY.util.inherit;

/**
 * @api private
 */
ALY.Signers.RequestSigner = inherit({
  constructor: function RequestSigner(request) {
    this.request = request;
  }
});

ALY.Signers.RequestSigner.getVersion = function getVersion(version) {
  switch (version) {
    case 'oss': return ALY.Signers.OSS;
    case 'ots': return ALY.Signers.OTS;
    case 'sls': return ALY.Signers.SLS;
    case 'top': return ALY.Signers.TOP;
    case 'pop': return ALY.Signers.POP;
    case 'pop-json': return ALY.Signers.PopJson;
    case 'opensearch': return ALY.Signers.OpenSearch;
    case 'batchcompute': return ALY.Signers.BatchCompute;
    case 'cms': return ALY.Signers.CMS;
  }
  throw new Error('Unknown signing version ' + version);
};

require('./oss');
require('./ots');
require('./sls');
require('./opensearch');
require('./top');
require('./pop');
require('./pop_json');
require('./batchcompute');
require('./cms');
},{"../core":57,"./batchcompute":76,"./cms":77,"./opensearch":78,"./oss":79,"./ots":80,"./pop":81,"./pop_json":82,"./sls":84,"./top":85}],84:[function(require,module,exports){
(function (process){(function (){
var ALY = require('../core');
var inherit = ALY.util.inherit;
/**
 * @api private
 */
ALY.Signers.SLS = inherit(ALY.Signers.RequestSigner, {


  // when building the stringToSign, these querystring params should be
  // part of the canonical resource string with their NON-encoded values
  responseHeaders: {
    'response-content-type': 1,
    'response-content-language': 1,
    'response-expires': 1,
    'response-cache-control': 1,
    'response-content-disposition': 1,
    'response-content-encoding': 1
  },

  addAuthorization: function addAuthorization(credentials, date) {
    this.request.headers['Date'] = ALY.util.date.rfc822(date);
    if(credentials.securityToken)
        this.request.headers['x-acs-security-token'] = credentials.securityToken;

    var signature = this.sign(credentials.secretAccessKey, this.stringToSign());
    var auth = 'LOG ' + credentials.accessKeyId + ':' + signature;

    this.request.headers['Authorization'] = auth;
  },

  stringToSign: function stringToSign() {
    var r = this.request;

    var parts = [];
    parts.push(r.method);
    parts.push(r.headers['Content-MD5'] || '');
    parts.push(r.headers['Content-Type'] || '');

    // This is the "Date" header, but we use X-Amz-Date.
    // The S3 signing mechanism requires us to pass an empty
    // string for this Date header regardless.
    // this works:
    // getSignedUrl use 'presigned-expires'
    // other request use 'Date'
    parts.push(r.headers['Date'] || '');

    var headers = this.canonicalizedAmzHeaders();
    if (headers) parts.push(headers);
    parts.push(this.canonicalizedResource());

    return parts.join('\n');

  },

  canonicalizedAmzHeaders: function canonicalizedAmzHeaders() {

    var amzHeaders = [];

    ALY.util.each(this.request.headers, function (name) {
      if (name.match(/^x-log-/i) || name=='x-acs-security-token')
        amzHeaders.push(name);
    });

    amzHeaders.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });

    var parts = [];
    ALY.util.arrayEach.call(this, amzHeaders, function (name) {
      parts.push(name.toLowerCase() + ':' + String(this.request.headers[name]));
    });

    return parts.join('\n');

  },

  canonicalizedResource: function canonicalizedResource() {

    var r = this.request;

    var parts = r.path.split('?');
    var path = parts[0];
    var querystring = parts[1];

    var resource = '';


    resource += decodeURIComponent(path);


    if (querystring) {

      // collect a list of sub resources and query params that need to be signed
      var resources = [];

      var arr = querystring.replace(/(^&*)|(&*$)/g,'').split('&');


      ALY.util.arrayEach.call(this, arr, function (param) {
        var kv = param.split('=');

        var name = kv[0];
        //修复topic中带有 / 等字符，签名报错
        var value = (kv.length>1)? decodeURIComponent(kv[1]):'';
        /*jshint undef:false */

        var resource = { name: name };
        if (value !== undefined) {
          resource.value = value;
        }
        resources.push(resource);

      });

      resources.sort(function (a, b) { return a.name < b.name ? -1 : 1; });

      if (resources.length) {

        querystring = [];
        ALY.util.arrayEach(resources, function (resource) {
          if (resource.value === undefined)
            querystring.push(resource.name);
          else
            querystring.push(resource.name + '=' + resource.value);
        });

        resource += '?' + querystring.join('&');
      }

    }

    return resource;

  },

  sign: function sign(secret, string) {
    if(process.env.DEBUG == 'aliyun') {
      console.log('----------- sign string start -----------');
      console.log(string);
      console.log('----------- sign string end -----------');
    }
    return ALY.util.crypto.hmac(secret, string, 'base64', 'sha1');
  }
});

module.exports = ALY.Signers.SLS;

}).call(this)}).call(this,require('_process'))
},{"../core":57,"_process":24}],85:[function(require,module,exports){
var ALY = require('../core');
var inherit = ALY.util.inherit;

ALY.Signers.TOP = inherit(ALY.Signers.RequestSigner, {

  // sign 已经在 service_interface/top 中实现了
  addAuthorization: function addAuthorization(credentials, date) {

  }

});

module.exports = ALY.Signers.TOP;

},{"../core":57}],86:[function(require,module,exports){
(function (process){(function (){
/*global escape:true */

var ALY = require('./core');
//var cryptoLib = require('crypto');
var jsSHA = require('../bower_components/jsSHA/src/sha.js');
var SparkMD5 = require('../bower_components/spark-md5/spark-md5.js');

/* jshint -W079 */
var Buffer = require('buffer').Buffer;
/* jshint +W079 */

/**
 * A set of utility methods for use with the ALY SDK.
 *
 * @!attribute abort
 *   Return this value from an iterator function {each} or {arrayEach}
 *   to break out of the iteration.
 *   @example Breaking out of an iterator function
 *     ALY.util.each({a: 1, b: 2, c: 3}, function(key, value) {
 *       if (key == 'b') return ALY.util.abort;
 *     });
 *   @see each
 *   @see arrayEach
 * @api private
 */
ALY.util = {
  engine: function engine() {
    if (ALY.util.isBrowser() && typeof navigator !== 'undefined') {
      return navigator.userAgent;
    } else {
      return process.platform + '/' + process.version;
    }
  },

  userAgent: function userAgent() {
    // 在 浏览器中不能设置 ua
    return "";
  },

  isBrowser: function isBrowser() { return typeof window !== 'undefined'; },
  isNode: function isNode() { return !ALY.util.isBrowser(); },
  nodeRequire: function nodeRequire(module) {
    if (ALY.util.isNode()) return require(module);
  },

  // todo: atob, btoa
  hexToBase64: function (str) {
    return btoa(String.fromCharCode.apply(null,
            str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
    );
  },

  topEscape: function(clearString) {
    var output = '';
    var x = 0;
    clearString = clearString.toString();
    var regex = /(^[a-zA-Z0-9-_.~]*)/;
    while (x < clearString.length) {
      var match = regex.exec(clearString.substr(x));
      if (match != null && match.length > 1 && match[1] != '') {
        output += match[1];
        x += match[1].length;
      } else {
        if (clearString[x] == ' ')
          output += '%20';
        else {
          var charCode = clearString.charCodeAt(x);
          var hexVal = charCode.toString(16);
          output += '%' + ( hexVal.length < 2 ? '0' : '' ) + hexVal.toUpperCase();
        }
        x++;
      }
    }
    return output;
  },

  popEscape: function(clearString) {
    clearString = clearString.toString();
    clearString = encodeURIComponent(clearString)
        .replace(/\!/gi, '%21')
        .replace(/\'/gi, '%27')
        .replace(/\(/gi, '%28')
        .replace(/\)/gi, '%29')
        .replace(/\*/gi, '%2A')
    return clearString;
  },

  opensearchEscape: function(clearString) {
    // http://v8.googlecode.com/svn/trunk/src/uri.js
    return encodeURIComponent(clearString)
      .replace(/\!/gi, '%21')
      .replace(/\'/gi, '%27')
      .replace(/\(/gi, '%28')
      .replace(/\)/gi, '%29')
      .replace(/\*/gi, '%2A')
  },

  uriEscape: function uriEscape(string) {
    /*jshint undef:false */
    var output = encodeURIComponent(string);
    output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);

    // percent-encodes some extra non-standard characters in a URI
    output = output.replace(/[*]/g, function(ch) {
      return '%' + ch.charCodeAt(0).toString(16).toUpperCase();
    });

    return output;
  },

  uriEscapePath: function uriEscapePath(string) {
    var parts = [];
    ALY.util.arrayEach(string.split('/'), function (part) {
      parts.push(ALY.util.uriEscape(part));
    });
    return parts.join('/');
  },

  urlParse: function urlParse(url) {
    return require('url').parse(url);
  },

  urlFormat: function urlFormat(url) {
    return require('url').format(url);
  },

  uuid: function generateUUID(){
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
      d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  },

  queryParamsToString: function queryParamsToString(params) {
    var items = [];
    var escape = ALY.util.uriEscape;
    var sortedKeys = Object.keys(params).sort();

    ALY.util.arrayEach(sortedKeys, function(name) {
      var value = params[name];
      var ename = escape(name);
      var result = ename;
      if (Array.isArray(value)) {
        var vals = [];
        ALY.util.arrayEach(value, function(item) { vals.push(escape(item)); });
        result = ename + '=' + vals.sort().join('&' + ename + '=');
      } else if (value !== undefined && value !== null) {
        result = ename + '=' + escape(value);
      }
      items.push(result);
    });

    return items.join('&');
  },

  readFileSync: function readFileSync(path) {
    if (typeof window !== 'undefined') return null;
    return require('fs').readFileSync(path, 'utf-8');
  },

  base64: {

    encode: function encode64(string) {
      return new Buffer(string).toString('base64');
    },

    decode: function decode64(string) {
      return new Buffer(string, 'base64').toString();
    }

  },

  Buffer: Buffer,

  buffer: {
    /**
     * Concatenates a list of Buffer objects.
     */
    concat: function(buffers) {
      var length = 0,
          offset = 0,
          buffer = null, i;

      for (i = 0; i < buffers.length; i++) {
        length += buffers[i].length;
      }

      buffer = new Buffer(length);

      for (i = 0; i < buffers.length; i++) {
        buffers[i].copy(buffer, offset);
        offset += buffers[i].length;
      }

      return buffer;
    }
  },

  string: {
    byteLength: function byteLength(string) {
      if (string === null || string === undefined) return 0;
      if (typeof string === 'string') string = new Buffer(string);

      if (typeof string.byteLength === 'number') {
        return string.byteLength;
      } else if (typeof string.length === 'number') {
        return string.length;
      } else if (typeof string.size === 'number') {
        return string.size;
      } else if (typeof string.path === 'string') {
        return require('fs').lstatSync(string.path).size;
      } else {
        throw ALY.util.error(new Error('Cannot determine length of ' + string),
          { object: string });
      }
    }
  },

  jamespath: {
    query: function query(expression, data) {
      if (!data) return [];

      var results = [];
      var expressions = expression.split(/\s+or\s+/);
      ALY.util.arrayEach.call(this, expressions, function (expr) {
        var objects = [data];
        var tokens = expr.split('.');
        ALY.util.arrayEach.call(this, tokens, function (token) {
          var match = token.match('^(.+?)(?:\\[(-?\\d+|\\*)\\])?$');
          var newObjects = [];
          ALY.util.arrayEach.call(this, objects, function (obj) {
            if (match[1] === '*') {
              ALY.util.arrayEach.call(this, obj, function (value) {
                newObjects.push(value);
              });
            } else if (obj.hasOwnProperty(match[1])) {
              newObjects.push(obj[match[1]]);
            }
          });
          objects = newObjects;

          // handle indexing (token[0], token[-1])
          if (match[2]) {
            newObjects = [];
            ALY.util.arrayEach.call(this, objects, function (obj) {
              if (Array.isArray(obj)) {
                if (match[2] === '*') {
                  newObjects = newObjects.concat(obj);
                } else {
                  var idx = parseInt(match[2], 10);
                  if (idx < 0) idx = obj.length + idx; // negative indexing
                  newObjects.push(obj[idx]);
                }
              }
            });
            objects = newObjects;
          }

          if (objects.length === 0) return ALY.util.abort;
        });

        if (objects.length > 0) {
          results = objects;
          return ALY.util.abort;
        }
      });

      return results;
    },

    find: function find(expression, data) {
      return ALY.util.jamespath.query(expression, data)[0];
    }
  },

  /**
   * Date and time utility functions.
   */
  date: {

    /**
     * @return [Date] the current JavaScript date object. Since all
     *   ALY services rely on this date object, you can override
     *   this function to provide a special time value to ALY service
     *   requests.
     */
    getDate: function getDate() { return new Date(); },

    // for taobao open platform
    top: function top(date, fmt) {
      fmt = fmt || '%Y-%M-%dT%H:%m:%sZ';

      function pad(value) {
        return (value.toString().length < 2) ? '0' + value : value;
      };

      return fmt.replace(/%([a-zA-Z])/g, function (_, fmtCode) {
        switch (fmtCode) {
          case 'Y':
            return date.getUTCFullYear();
          case 'M':
            return pad(date.getUTCMonth() + 1);
          case 'd':
            return pad(date.getUTCDate());
          case 'H':
            return pad(date.getUTCHours());
          case 'm':
            return pad(date.getUTCMinutes());
          case 's':
            return pad(date.getUTCSeconds());
          default:
            throw new Error('Unsupported format code: ' + fmtCode);
        }
      });
    },

    /**
     * @return [String] the date in ISO-8601 format
     */
    iso8601: function iso8601(date) {
      if (date === undefined) { date = ALY.util.date.getDate(); }
      return date.toISOString();
    },

    /**
     * @return [String] the date in RFC 822 format
     */
    rfc822: function rfc822(date) {
      if (date === undefined) { date = ALY.util.date.getDate(); }
      return date.toUTCString();
    },

    unixSeconds: function unixSeconds(date) {
      if (date === undefined) { date = ALY.util.date.getDate(); }
      return Math.floor(date.getTime() / 1000);
    },

    unixMilliseconds: function unixMilliseconds(date) {
      if (date === undefined) { date = ALY.util.date.getDate(); }
      return date.getTime();
    },

    /**
     * @param [String,number,Date] date
     * @return [Date]
     */
    from: function format(date) {
      if (typeof date === 'number') {
        if(date.toString().length == 10) {
          return new Date(date * 1000); // unix timestamp in seconds
        }
        return new Date(date); // unix timestamp in mill seconds
      }
      else if(Object.prototype.toString.call(date) === '[object Date]') {
        return date;
      }
      else {
        return new Date(date);
      }
    },

    /**
     * Given a Date or date-like value, this function formats the
     * date into a string of the requested value.
     * @param [String,number,Date] date
     * @param [String] formatter Valid formats are:
     #   * 'iso8601'
     #   * 'rfc822'
     #   * 'unixSeconds'
     #   * 'unixMilliseconds'
     * @return [String]
     */
    format: function format(date, formatter) {
      if (!formatter) formatter = 'unixSeconds';
      return ALY.util.date[formatter](ALY.util.date.from(date));
    }

  },

  crypto: {
    crc32Table: [
     0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419,
     0x706AF48F, 0xE963A535, 0x9E6495A3, 0x0EDB8832, 0x79DCB8A4,
     0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07,
     0x90BF1D91, 0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE,
     0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7, 0x136C9856,
     0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9,
     0xFA0F3D63, 0x8D080DF5, 0x3B6E20C8, 0x4C69105E, 0xD56041E4,
     0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
     0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3,
     0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 0x26D930AC, 0x51DE003A,
     0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599,
     0xB8BDA50F, 0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924,
     0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D, 0x76DC4190,
     0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F,
     0x9FBFE4A5, 0xE8B8D433, 0x7807C9A2, 0x0F00F934, 0x9609A88E,
     0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
     0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED,
     0x1B01A57B, 0x8208F4C1, 0xF50FC457, 0x65B0D9C6, 0x12B7E950,
     0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3,
     0xFBD44C65, 0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2,
     0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 0x4369E96A,
     0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5,
     0xAA0A4C5F, 0xDD0D7CC9, 0x5005713C, 0x270241AA, 0xBE0B1010,
     0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
     0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17,
     0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 0xEDB88320, 0x9ABFB3B6,
     0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615,
     0x73DC1683, 0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8,
     0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 0xF00F9344,
     0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB,
     0x196C3671, 0x6E6B06E7, 0xFED41B76, 0x89D32BE0, 0x10DA7A5A,
     0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
     0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1,
     0xA6BC5767, 0x3FB506DD, 0x48B2364B, 0xD80D2BDA, 0xAF0A1B4C,
     0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF,
     0x4669BE79, 0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236,
     0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 0xC5BA3BBE,
     0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31,
     0x2CD99E8B, 0x5BDEAE1D, 0x9B64C2B0, 0xEC63F226, 0x756AA39C,
     0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
     0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B,
     0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 0x86D3D2D4, 0xF1D4E242,
     0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1,
     0x18B74777, 0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C,
     0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 0xA00AE278,
     0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7,
     0x4969474D, 0x3E6E77DB, 0xAED16A4A, 0xD9D65ADC, 0x40DF0B66,
     0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
     0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605,
     0xCDD70693, 0x54DE5729, 0x23D967BF, 0xB3667A2E, 0xC4614AB8,
     0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B,
     0x2D02EF8D],

    crc32: function crc32(data) {
      /*jshint bitwise:false*/
      var tbl = ALY.util.crypto.crc32Table;
      var crc = 0 ^ -1;

      if (typeof data === 'string') {
        data = new Buffer(data);
      }

      for (var i = 0; i < data.length; i++) {
        var code = data.readUInt8(i);
        crc = (crc>>>8) ^ tbl[(crc^code)&0xFF];
      }
      return (crc ^ -1) >>> 0;
    },

    hmac: function hmac(key, string, digest, fn) {
      if (!digest) digest = 'binary';

      if (digest === 'buffer') {
        digest = undefined;
        // todo: 不支持 buffer 类型的 hash
        return "";
      }

      if (!fn) fn = 'sha256';

      if (typeof string != 'string') {
        //string = new Buffer(string);
        // todo: 目前只支持 string
        return "";
      }

      var shaObj;
      switch (fn) {
        case "md5":
          // todo: 不支持 md5
          return "";
        case "sha1":
          shaObj = new jsSHA("SHA-1", "TEXT");
          break;
        case "sha256":
          shaObj = new jsSHA("SHA-256", "TEXT");
          break;
        case "sha512":
          shaObj = new jsSHA("SHA-512", "TEXT");
          break;
        default:
          return "";
      }

      shaObj.setHMACKey(key, "TEXT");

      shaObj.update(string);

      switch(digest) {
        case "binary":
          return shaObj.getHMAC("BYTES");
        case "hex":
          return shaObj.getHMAC("HEX");
        case "base64":
          return shaObj.getHMAC("B64");
        default:
          return "";
      }
    },

    // https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding
    md5: function md5(data, digest) {
      var hash = "";

      if (!digest) { digest = 'binary'; }

      if (digest === 'buffer') {
        digest = undefined;
        // todo: 不支持 buffer 类型的 hash
        return "";
      }

      if (typeof data === 'string') {
        switch(digest) {
          case "binary":
            return SparkMD5.hash(data, true);
          case "hex":
            return SparkMD5.hash(data);
          case "base64":
            return ALY.util.hexToBase64(SparkMD5.hash(data));
          default:
            return "";
        }
      }
      else {  // array buffer
        switch(digest) {
          case "binary":
            return SparkMD5.ArrayBuffer.hash(data, true);
          case "hex":
            return SparkMD5.ArrayBuffer.hash(data);
          case "base64":
            return ALY.util.hexToBase64(SparkMD5.ArrayBuffer.hash(data));
          default:
            return "";
        }
      }
    },

    // 目前不支持 sha256 hash
    sha256: function sha256(string, digest) {
      //if (!digest) { digest = 'binary'; }
      //if (digest === 'buffer') { digest = undefined; }
      //if (typeof string === 'string') string = new Buffer(string);
      //return ALY.util.crypto.createHash('sha256').update(string).digest(digest);
      return "";
    },

    toHex: function toHex(data) {
      var out = [];
      for (var i = 0; i < data.length; i++) {
        out.push(('0' + data.charCodeAt(i).toString(16)).substr(-2, 2));
      }
      return out.join('');
    }

  },

  /** @!ignore */

  /* Abort constant */
  abort: {},

  each: function each(object, iterFunction) {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        var ret = iterFunction.call(this, key, object[key]);
        if (ret === ALY.util.abort) break;
      }
    }
  },

  arrayEach: function arrayEach(array, iterFunction) {
    for (var idx in array) {
      if (array.hasOwnProperty(idx)) {
        var ret = iterFunction.call(this, array[idx], parseInt(idx, 10));
        if (ret === ALY.util.abort) break;
      }
    }
  },

  update: function update(obj1, obj2) {
    ALY.util.each(obj2, function iterator(key, item) {
      obj1[key] = item;
    });
    return obj1;
  },

  merge: function merge(obj1, obj2) {
    return ALY.util.update(ALY.util.copy(obj1), obj2);
  },

  copy: function copy(object) {
    if (object === null || object === undefined) return object;
    var dupe = {};
    /*jshint forin:false */
    for (var key in object) {
      dupe[key] = object[key];
    }
    return dupe;
  },

  isEmpty: function isEmpty(obj) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        return false;
      }
    }
    return true;
  },

  isType: function isType(obj, type) {
    // handle cross-"frame" objects
    if (typeof type === 'function') type = ALY.util.typeName(type);
    return Object.prototype.toString.call(obj) === '[object ' + type + ']';
  },

  typeName: function typeName(type) {
    if (type.hasOwnProperty('name')) return type.name;
    var str = type.toString();
    var match = str.match(/^\s*function (.+)\(/);
    return match ? match[1] : str;
  },

  error: function error(err, options) {
    var originalError = null;
    if (typeof err.message === 'string' && err.message !== '') {
      if (typeof options === 'string' || (options && options.message)) {
        originalError = ALY.util.copy(err);
        originalError.message = err.message;
      }
    }
    err.message = err.message || null;

    if (typeof options === 'string') {
      err.message = options;
    } else {
      ALY.util.update(err, options);
    }

    if (typeof Object.defineProperty === 'function') {
      Object.defineProperty(err, 'name', {writable: true, enumerable: false});
      Object.defineProperty(err, 'message', {enumerable: true});
    }

    err.name = err.name || err.code || 'Error';
    err.time = new Date();

    if (originalError) err.originalError = originalError;

    return err;
  },

  /**
   * @api private
   */
  inherit: function inherit(klass, features) {
    var newObject = null;
    if (features === undefined) {
      features = klass;
      klass = Object;
      newObject = {};
    } else {
      /*jshint newcap:false */
      /*jshint camelcase:false */
      var ctor = function __ctor_wrapper__() {};
      ctor.prototype = klass.prototype;
      newObject = new ctor();
    }

    // constructor not supplied, create pass-through ctor
    if (features.constructor === Object) {
      features.constructor = function() {
        if (klass !== Object) {
          return klass.apply(this, arguments);
        }
      };
    }

    features.constructor.prototype = newObject;
    ALY.util.update(features.constructor.prototype, features);
    features.constructor.__super__ = klass;
    return features.constructor;
  },

  /**
   * @api private
   */
  mixin: function mixin() {
    var klass = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
      /*jshint forin:false*/
      for (var prop in arguments[i].prototype) {
        var fn = arguments[i].prototype[prop];
        if (prop != 'constructor') {
          klass.prototype[prop] = fn;
        }
      }
    }
    return klass;
  },

  /**
   * @api private
   */
  hideProperties: function hideProperties(obj, props) {
    if (typeof Object.defineProperty !== 'function') return;

    ALY.util.arrayEach(props, function (key) {
      Object.defineProperty(obj, key, {
        enumerable: false, writable: true, configurable: true });
    });
  }
};

module.exports = ALY.util;

}).call(this)}).call(this,require('_process'))
},{"../bower_components/jsSHA/src/sha.js":53,"../bower_components/spark-md5/spark-md5.js":54,"./core":57,"_process":24,"buffer":5,"fs":1,"url":46}],87:[function(require,module,exports){
var ALY = require('../core');
var builder = require('xmlbuilder');
var inherit = ALY.util.inherit;

/**
 * @api private
 */
ALY.XML.Builder = inherit({

  constructor: function XMLBuilder(root, rules, options) {
    this.root = root;
    this.rules = rules;
    this.xmlns = options.xmlnamespace;
    this.timestampFormat = options.timestampFormat;
  },

  toXML: function toXML(params) {
    var xml = builder.create(this.root);
    if (this.xmlns) xml.att('xmlns', this.xmlns);
    this.serializeStructure(this.rules, params, xml);
    return xml.root().toString();
  },

  serializeStructure: function serializeStructure(rules, params, xml) {
    ALY.util.each.call(this, rules || {}, function (memberName, memberRules) {
      var value = params[memberName];
      if (value !== undefined) {
        if (memberRules.attribute) {
          xml.att(memberRules.name, value);
        } else {
          this.serializeMember(memberName, memberRules, value, xml);
        }
      }
    });
  },

  serializeList: function serializeList(name, rules, list, xml) {
    if (rules.flattened) {
      ALY.util.arrayEach.call(this, list, function (value) {
        this.serializeMember(rules.name || name, rules.members, value, xml);
      });
    } else {
      xml = xml.ele(rules.name || name);
      ALY.util.arrayEach.call(this, list, function (value) {
        var memberName = rules.members.name || 'member';
        this.serializeMember(memberName, rules.members, value, xml);
      });
    }
  },

  serializeMember: function serializeMember(memberName, rules, params, xml) {
    if (params === null || params === undefined) return;

    var name = memberName;
    if (rules.type === 'structure') {
      xml = xml.ele(name);
      this.serializeStructure(rules.members, params, xml);
    } else if (rules.type === 'list') {
      this.serializeList(name, rules, params, xml);
    } else if (rules.type === 'timestamp') {
      var timestampFormat = rules.format || this.timestampFormat;
      var date = ALY.util.date.format(params, timestampFormat);
      xml = xml.ele(name, String(date));
    } else {
      xml = xml.ele(name, String(params));
    }
    this.applyNamespaces(xml, rules);
  },

  applyNamespaces: function applyNamespaces(xml, rules) {
    if (rules.xmlns) {
      var attr = 'xmlns';
      if (rules.xmlns.prefix) attr += ':' + rules.xmlns.prefix;
      xml.att(attr, rules.xmlns.uri);
    }
  }


});

},{"../core":57,"xmlbuilder":125}],88:[function(require,module,exports){
var ALY = require('../core');
var inherit = ALY.util.inherit;
var xml2js = require('xml2js');

/**
 * @api private
 */
ALY.XML.Parser = inherit({

  constructor: function XMLParser(rules) {
    this.rules = (rules || {}).members || {};
  },

  // options passed to xml2js parser
  options: {
    explicitCharkey: false, // undocumented
    trim: false,            // trim the leading/trailing whitespace from text nodes
    normalize: false,       // trim interior whitespace inside text nodes
    explicitRoot: false,    // return the root node in the resulting object?
    emptyTag: null,         // the default value for empty nodes
    explicitArray: true,    // always put child nodes in an array
    ignoreAttrs: false,     // ignore attributes, only create text nodes
    mergeAttrs: false,      // merge attributes and child elements
    validator: null         // a callable validator
  },

  parse: function parse(xml) {

    var result = null;
    var error = null;
    var parser = new xml2js.Parser(this.options);
    parser.parseString(xml, function (e, r) {
      error = e;
      result = r;
    });

    if (result) {
      delete result.xmlns;
      return this.parseStructure(result, this.rules);
    } else if (error) {
      throw ALY.util.error(error, {code: 'XMLParserError'});
    } else { // empty xml document
      return this.parseStructure({}, this.rules);
    }

  },

  parseStructure: function parseStructure(structure, rules) {
    var data = {};

    // force array members to always be present
    ALY.util.each.call(this, rules, function(memberName, memberRules) {
      if (memberRules.type == 'list') {
        data[memberRules.name || memberName] = [];
      }
    });

    ALY.util.each.call(this, structure, function (xmlName, value) {
      if (xmlName == '$') {
        ALY.util.each.call(this, value, function (attrName, attrValue) {
          if (rules[attrName]) {
            var rule = rules[attrName];
            data[rule.name || xmlName] = this.parseMember([attrValue], rule);
          }
        });
      } else {
        var rule = rules[xmlName] || {};
        data[rule.name || xmlName] = this.parseMember(value, rule);
      }
    });

    return data;
  },

  parseMap: function parseMap(map, rules) {
    var data = {};
    var keyRules = rules.keys || {};
    var valueRules = rules.members || {};
    var keyName = keyRules.name || 'key';
    var valueName = valueRules.name || 'value';
    if (!rules.flattened) {
      map = map[0].entry;
    }
    ALY.util.arrayEach.call(this, map, function (entry) {
      var value = this.parseMember(entry[valueName], valueRules);
      data[entry[keyName][0]] = value;
    });
    return data;
  },

  parseList: function parseList(list, rules) {
    var data = [];
    var memberRules = rules.members || {};
    var memberName = memberRules.name || 'member';
    if (rules.flattened) {
      ALY.util.arrayEach.call(this, list, function (value) {
        data.push(this.parseMember([value], memberRules));
      });
    } else {
      ALY.util.arrayEach.call(this, list, function (member) {
        ALY.util.arrayEach.call(this, member[memberName], function (value) {
          data.push(this.parseMember([value], memberRules));
        });
      });
    }
    return data;
  },

  parseMember: function parseMember(values, rules) {
    /*jshint maxcomplexity:20*/

    if (values[0] === null) {
      if (rules.type === 'structure') return {};
      if (rules.type === 'list') return [];
      if (rules.type === 'map') return {};
      return null;
    }

    if (values[0]['$'] && values[0]['$'].encoding == 'base64') {
      return ALY.util.base64.decode(values[0]['_']);
    }

    if (!rules.type) {
      if (typeof values[0] === 'string') {
        rules.type = 'string';
      } else if (values[0]['_']) {
        rules.type = 'string';
        values = [values[0]['_']];
      } else {
        rules.type = 'structure';
      }
    }

    if (rules.type === 'string') {

      return values[0];

    } else if (rules.type === 'structure') {

      return this.parseStructure(values[0], rules.members || {});

    } else if (rules.type === 'list') {

      return this.parseList(values, rules);

    } else if (rules.type === 'map') {

      return this.parseMap(values, rules);

    } else if (rules.type === 'integer') {

      return parseInt(values[0], 10);

    } else if (rules.type === 'float') {

      return parseFloat(values[0]);

    } else if (rules.type === 'timestamp') {

      return this.parseTimestamp(values[0]);

    } else if (rules.type === 'boolean') {

      return values[0] === 'true';

    } else {

      var msg = 'unhandled type: ' + rules.type;
      throw ALY.util.error(new Error(msg), {code: 'XMLParserError'});

    }

  },

  parseTimestamp: function parseTimestamp(value) {

    if (value.match(/^\d+$/)) { // unix timestamp

      return new Date(value * 1000);

    } else if (value.match(/^\d{4}/)) { // iso8601

      return new Date(value);

    } else if (value.match(/^\w{3},/)) { // rfc822

      return new Date(value);

    } else {

      throw ALY.util.error(
        new Error('unhandled timestamp format: ' + value),
        {code: 'TimestampParserError'});

    }

  }

});

},{"../core":57,"xml2js":92}],89:[function(require,module,exports){
(function (Buffer){(function (){
// wrapper for non-node envs
;(function (sax) {

sax.parser = function (strict, opt) { return new SAXParser(strict, opt) }
sax.SAXParser = SAXParser
sax.SAXStream = SAXStream
sax.createStream = createStream

// When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
// When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
// since that's the earliest that a buffer overrun could occur.  This way, checks are
// as rare as required, but as often as necessary to ensure never crossing this bound.
// Furthermore, buffers are only tested at most once per write(), so passing a very
// large string into write() might have undesirable effects, but this is manageable by
// the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
// edge case, result in creating at most one complete copy of the string passed in.
// Set to Infinity to have unlimited buffers.
sax.MAX_BUFFER_LENGTH = 64 * 1024

var buffers = [
  "comment", "sgmlDecl", "textNode", "tagName", "doctype",
  "procInstName", "procInstBody", "entity", "attribName",
  "attribValue", "cdata", "script"
]

sax.EVENTS = // for discoverability.
  [ "text"
  , "processinginstruction"
  , "sgmldeclaration"
  , "doctype"
  , "comment"
  , "attribute"
  , "opentag"
  , "closetag"
  , "opencdata"
  , "cdata"
  , "closecdata"
  , "error"
  , "end"
  , "ready"
  , "script"
  , "opennamespace"
  , "closenamespace"
  ]

function SAXParser (strict, opt) {
  if (!(this instanceof SAXParser)) return new SAXParser(strict, opt)

  var parser = this
  clearBuffers(parser)
  parser.q = parser.c = ""
  parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH
  parser.opt = opt || {}
  parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags
  parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase"
  parser.tags = []
  parser.closed = parser.closedRoot = parser.sawRoot = false
  parser.tag = parser.error = null
  parser.strict = !!strict
  parser.noscript = !!(strict || parser.opt.noscript)
  parser.state = S.BEGIN
  parser.ENTITIES = Object.create(sax.ENTITIES)
  parser.attribList = []

  // namespaces form a prototype chain.
  // it always points at the current tag,
  // which protos to its parent tag.
  if (parser.opt.xmlns) parser.ns = Object.create(rootNS)

  // mostly just for error reporting
  parser.trackPosition = parser.opt.position !== false
  if (parser.trackPosition) {
    parser.position = parser.line = parser.column = 0
  }
  emit(parser, "onready")
}

if (!Object.create) Object.create = function (o) {
  function f () { this.__proto__ = o }
  f.prototype = o
  return new f
}

if (!Object.getPrototypeOf) Object.getPrototypeOf = function (o) {
  return o.__proto__
}

if (!Object.keys) Object.keys = function (o) {
  var a = []
  for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
  return a
}

function checkBufferLength (parser) {
  var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
    , maxActual = 0
  for (var i = 0, l = buffers.length; i < l; i ++) {
    var len = parser[buffers[i]].length
    if (len > maxAllowed) {
      // Text/cdata nodes can get big, and since they're buffered,
      // we can get here under normal conditions.
      // Avoid issues by emitting the text node now,
      // so at least it won't get any bigger.
      switch (buffers[i]) {
        case "textNode":
          closeText(parser)
        break

        case "cdata":
          emitNode(parser, "oncdata", parser.cdata)
          parser.cdata = ""
        break

        case "script":
          emitNode(parser, "onscript", parser.script)
          parser.script = ""
        break

        default:
          error(parser, "Max buffer length exceeded: "+buffers[i])
      }
    }
    maxActual = Math.max(maxActual, len)
  }
  // schedule the next check for the earliest possible buffer overrun.
  parser.bufferCheckPosition = (sax.MAX_BUFFER_LENGTH - maxActual)
                             + parser.position
}

function clearBuffers (parser) {
  for (var i = 0, l = buffers.length; i < l; i ++) {
    parser[buffers[i]] = ""
  }
}

function flushBuffers (parser) {
  closeText(parser)
  if (parser.cdata !== "") {
    emitNode(parser, "oncdata", parser.cdata)
    parser.cdata = ""
  }
  if (parser.script !== "") {
    emitNode(parser, "onscript", parser.script)
    parser.script = ""
  }
}

SAXParser.prototype =
  { end: function () { end(this) }
  , write: write
  , resume: function () { this.error = null; return this }
  , close: function () { return this.write(null) }
  , flush: function () { flushBuffers(this) }
  }

try {
  var Stream = require("stream").Stream
} catch (ex) {
  var Stream = function () {}
}


var streamWraps = sax.EVENTS.filter(function (ev) {
  return ev !== "error" && ev !== "end"
})

function createStream (strict, opt) {
  return new SAXStream(strict, opt)
}

function SAXStream (strict, opt) {
  if (!(this instanceof SAXStream)) return new SAXStream(strict, opt)

  Stream.apply(this)

  this._parser = new SAXParser(strict, opt)
  this.writable = true
  this.readable = true


  var me = this

  this._parser.onend = function () {
    me.emit("end")
  }

  this._parser.onerror = function (er) {
    me.emit("error", er)

    // if didn't throw, then means error was handled.
    // go ahead and clear error, so we can write again.
    me._parser.error = null
  }

  this._decoder = null;

  streamWraps.forEach(function (ev) {
    Object.defineProperty(me, "on" + ev, {
      get: function () { return me._parser["on" + ev] },
      set: function (h) {
        if (!h) {
          me.removeAllListeners(ev)
          return me._parser["on"+ev] = h
        }
        me.on(ev, h)
      },
      enumerable: true,
      configurable: false
    })
  })
}

SAXStream.prototype = Object.create(Stream.prototype,
  { constructor: { value: SAXStream } })

SAXStream.prototype.write = function (data) {
  if (typeof Buffer === 'function' &&
      typeof Buffer.isBuffer === 'function' &&
      Buffer.isBuffer(data)) {
    if (!this._decoder) {
      var SD = require('string_decoder').StringDecoder
      this._decoder = new SD('utf8')
    }
    data = this._decoder.write(data);
  }

  this._parser.write(data.toString())
  this.emit("data", data)
  return true
}

SAXStream.prototype.end = function (chunk) {
  if (chunk && chunk.length) this.write(chunk)
  this._parser.end()
  return true
}

SAXStream.prototype.on = function (ev, handler) {
  var me = this
  if (!me._parser["on"+ev] && streamWraps.indexOf(ev) !== -1) {
    me._parser["on"+ev] = function () {
      var args = arguments.length === 1 ? [arguments[0]]
               : Array.apply(null, arguments)
      args.splice(0, 0, ev)
      me.emit.apply(me, args)
    }
  }

  return Stream.prototype.on.call(me, ev, handler)
}



// character classes and tokens
var whitespace = "\r\n\t "
  // this really needs to be replaced with character classes.
  // XML allows all manner of ridiculous numbers and digits.
  , number = "0124356789"
  , letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  // (Letter | "_" | ":")
  , quote = "'\""
  , entity = number+letter+"#"
  , attribEnd = whitespace + ">"
  , CDATA = "[CDATA["
  , DOCTYPE = "DOCTYPE"
  , XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"
  , XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/"
  , rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }

// turn all the string character sets into character class objects.
whitespace = charClass(whitespace)
number = charClass(number)
letter = charClass(letter)

// http://www.w3.org/TR/REC-xml/#NT-NameStartChar
// This implementation works on strings, a single character at a time
// as such, it cannot ever support astral-plane characters (10000-EFFFF)
// without a significant breaking change to either this  parser, or the
// JavaScript language.  Implementation of an emoji-capable xml parser
// is left as an exercise for the reader.
var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/

var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/

quote = charClass(quote)
entity = charClass(entity)
attribEnd = charClass(attribEnd)

function charClass (str) {
  return str.split("").reduce(function (s, c) {
    s[c] = true
    return s
  }, {})
}

function isRegExp (c) {
  return Object.prototype.toString.call(c) === '[object RegExp]'
}

function is (charclass, c) {
  return isRegExp(charclass) ? !!c.match(charclass) : charclass[c]
}

function not (charclass, c) {
  return !is(charclass, c)
}

var S = 0
sax.STATE =
{ BEGIN                     : S++
, TEXT                      : S++ // general stuff
, TEXT_ENTITY               : S++ // &amp and such.
, OPEN_WAKA                 : S++ // <
, SGML_DECL                 : S++ // <!BLARG
, SGML_DECL_QUOTED          : S++ // <!BLARG foo "bar
, DOCTYPE                   : S++ // <!DOCTYPE
, DOCTYPE_QUOTED            : S++ // <!DOCTYPE "//blah
, DOCTYPE_DTD               : S++ // <!DOCTYPE "//blah" [ ...
, DOCTYPE_DTD_QUOTED        : S++ // <!DOCTYPE "//blah" [ "foo
, COMMENT_STARTING          : S++ // <!-
, COMMENT                   : S++ // <!--
, COMMENT_ENDING            : S++ // <!-- blah -
, COMMENT_ENDED             : S++ // <!-- blah --
, CDATA                     : S++ // <![CDATA[ something
, CDATA_ENDING              : S++ // ]
, CDATA_ENDING_2            : S++ // ]]
, PROC_INST                 : S++ // <?hi
, PROC_INST_BODY            : S++ // <?hi there
, PROC_INST_ENDING          : S++ // <?hi "there" ?
, OPEN_TAG                  : S++ // <strong
, OPEN_TAG_SLASH            : S++ // <strong /
, ATTRIB                    : S++ // <a
, ATTRIB_NAME               : S++ // <a foo
, ATTRIB_NAME_SAW_WHITE     : S++ // <a foo _
, ATTRIB_VALUE              : S++ // <a foo=
, ATTRIB_VALUE_QUOTED       : S++ // <a foo="bar
, ATTRIB_VALUE_CLOSED       : S++ // <a foo="bar"
, ATTRIB_VALUE_UNQUOTED     : S++ // <a foo=bar
, ATTRIB_VALUE_ENTITY_Q     : S++ // <foo bar="&quot;"
, ATTRIB_VALUE_ENTITY_U     : S++ // <foo bar=&quot;
, CLOSE_TAG                 : S++ // </a
, CLOSE_TAG_SAW_WHITE       : S++ // </a   >
, SCRIPT                    : S++ // <script> ...
, SCRIPT_ENDING             : S++ // <script> ... <
}

sax.ENTITIES =
{ "amp" : "&"
, "gt" : ">"
, "lt" : "<"
, "quot" : "\""
, "apos" : "'"
, "AElig" : 198
, "Aacute" : 193
, "Acirc" : 194
, "Agrave" : 192
, "Aring" : 197
, "Atilde" : 195
, "Auml" : 196
, "Ccedil" : 199
, "ETH" : 208
, "Eacute" : 201
, "Ecirc" : 202
, "Egrave" : 200
, "Euml" : 203
, "Iacute" : 205
, "Icirc" : 206
, "Igrave" : 204
, "Iuml" : 207
, "Ntilde" : 209
, "Oacute" : 211
, "Ocirc" : 212
, "Ograve" : 210
, "Oslash" : 216
, "Otilde" : 213
, "Ouml" : 214
, "THORN" : 222
, "Uacute" : 218
, "Ucirc" : 219
, "Ugrave" : 217
, "Uuml" : 220
, "Yacute" : 221
, "aacute" : 225
, "acirc" : 226
, "aelig" : 230
, "agrave" : 224
, "aring" : 229
, "atilde" : 227
, "auml" : 228
, "ccedil" : 231
, "eacute" : 233
, "ecirc" : 234
, "egrave" : 232
, "eth" : 240
, "euml" : 235
, "iacute" : 237
, "icirc" : 238
, "igrave" : 236
, "iuml" : 239
, "ntilde" : 241
, "oacute" : 243
, "ocirc" : 244
, "ograve" : 242
, "oslash" : 248
, "otilde" : 245
, "ouml" : 246
, "szlig" : 223
, "thorn" : 254
, "uacute" : 250
, "ucirc" : 251
, "ugrave" : 249
, "uuml" : 252
, "yacute" : 253
, "yuml" : 255
, "copy" : 169
, "reg" : 174
, "nbsp" : 160
, "iexcl" : 161
, "cent" : 162
, "pound" : 163
, "curren" : 164
, "yen" : 165
, "brvbar" : 166
, "sect" : 167
, "uml" : 168
, "ordf" : 170
, "laquo" : 171
, "not" : 172
, "shy" : 173
, "macr" : 175
, "deg" : 176
, "plusmn" : 177
, "sup1" : 185
, "sup2" : 178
, "sup3" : 179
, "acute" : 180
, "micro" : 181
, "para" : 182
, "middot" : 183
, "cedil" : 184
, "ordm" : 186
, "raquo" : 187
, "frac14" : 188
, "frac12" : 189
, "frac34" : 190
, "iquest" : 191
, "times" : 215
, "divide" : 247
, "OElig" : 338
, "oelig" : 339
, "Scaron" : 352
, "scaron" : 353
, "Yuml" : 376
, "fnof" : 402
, "circ" : 710
, "tilde" : 732
, "Alpha" : 913
, "Beta" : 914
, "Gamma" : 915
, "Delta" : 916
, "Epsilon" : 917
, "Zeta" : 918
, "Eta" : 919
, "Theta" : 920
, "Iota" : 921
, "Kappa" : 922
, "Lambda" : 923
, "Mu" : 924
, "Nu" : 925
, "Xi" : 926
, "Omicron" : 927
, "Pi" : 928
, "Rho" : 929
, "Sigma" : 931
, "Tau" : 932
, "Upsilon" : 933
, "Phi" : 934
, "Chi" : 935
, "Psi" : 936
, "Omega" : 937
, "alpha" : 945
, "beta" : 946
, "gamma" : 947
, "delta" : 948
, "epsilon" : 949
, "zeta" : 950
, "eta" : 951
, "theta" : 952
, "iota" : 953
, "kappa" : 954
, "lambda" : 955
, "mu" : 956
, "nu" : 957
, "xi" : 958
, "omicron" : 959
, "pi" : 960
, "rho" : 961
, "sigmaf" : 962
, "sigma" : 963
, "tau" : 964
, "upsilon" : 965
, "phi" : 966
, "chi" : 967
, "psi" : 968
, "omega" : 969
, "thetasym" : 977
, "upsih" : 978
, "piv" : 982
, "ensp" : 8194
, "emsp" : 8195
, "thinsp" : 8201
, "zwnj" : 8204
, "zwj" : 8205
, "lrm" : 8206
, "rlm" : 8207
, "ndash" : 8211
, "mdash" : 8212
, "lsquo" : 8216
, "rsquo" : 8217
, "sbquo" : 8218
, "ldquo" : 8220
, "rdquo" : 8221
, "bdquo" : 8222
, "dagger" : 8224
, "Dagger" : 8225
, "bull" : 8226
, "hellip" : 8230
, "permil" : 8240
, "prime" : 8242
, "Prime" : 8243
, "lsaquo" : 8249
, "rsaquo" : 8250
, "oline" : 8254
, "frasl" : 8260
, "euro" : 8364
, "image" : 8465
, "weierp" : 8472
, "real" : 8476
, "trade" : 8482
, "alefsym" : 8501
, "larr" : 8592
, "uarr" : 8593
, "rarr" : 8594
, "darr" : 8595
, "harr" : 8596
, "crarr" : 8629
, "lArr" : 8656
, "uArr" : 8657
, "rArr" : 8658
, "dArr" : 8659
, "hArr" : 8660
, "forall" : 8704
, "part" : 8706
, "exist" : 8707
, "empty" : 8709
, "nabla" : 8711
, "isin" : 8712
, "notin" : 8713
, "ni" : 8715
, "prod" : 8719
, "sum" : 8721
, "minus" : 8722
, "lowast" : 8727
, "radic" : 8730
, "prop" : 8733
, "infin" : 8734
, "ang" : 8736
, "and" : 8743
, "or" : 8744
, "cap" : 8745
, "cup" : 8746
, "int" : 8747
, "there4" : 8756
, "sim" : 8764
, "cong" : 8773
, "asymp" : 8776
, "ne" : 8800
, "equiv" : 8801
, "le" : 8804
, "ge" : 8805
, "sub" : 8834
, "sup" : 8835
, "nsub" : 8836
, "sube" : 8838
, "supe" : 8839
, "oplus" : 8853
, "otimes" : 8855
, "perp" : 8869
, "sdot" : 8901
, "lceil" : 8968
, "rceil" : 8969
, "lfloor" : 8970
, "rfloor" : 8971
, "lang" : 9001
, "rang" : 9002
, "loz" : 9674
, "spades" : 9824
, "clubs" : 9827
, "hearts" : 9829
, "diams" : 9830
}

Object.keys(sax.ENTITIES).forEach(function (key) {
    var e = sax.ENTITIES[key]
    var s = typeof e === 'number' ? String.fromCharCode(e) : e
    sax.ENTITIES[key] = s
})

for (var S in sax.STATE) sax.STATE[sax.STATE[S]] = S

// shorthand
S = sax.STATE

function emit (parser, event, data) {
  parser[event] && parser[event](data)
}

function emitNode (parser, nodeType, data) {
  if (parser.textNode) closeText(parser)
  emit(parser, nodeType, data)
}

function closeText (parser) {
  parser.textNode = textopts(parser.opt, parser.textNode)
  if (parser.textNode) emit(parser, "ontext", parser.textNode)
  parser.textNode = ""
}

function textopts (opt, text) {
  if (opt.trim) text = text.trim()
  if (opt.normalize) text = text.replace(/\s+/g, " ")
  return text
}

function error (parser, er) {
  closeText(parser)
  if (parser.trackPosition) {
    er += "\nLine: "+parser.line+
          "\nColumn: "+parser.column+
          "\nChar: "+parser.c
  }
  er = new Error(er)
  parser.error = er
  emit(parser, "onerror", er)
  return parser
}

function end (parser) {
  if (!parser.closedRoot) strictFail(parser, "Unclosed root tag")
  if ((parser.state !== S.BEGIN) && (parser.state !== S.TEXT)) error(parser, "Unexpected end")
  closeText(parser)
  parser.c = ""
  parser.closed = true
  emit(parser, "onend")
  SAXParser.call(parser, parser.strict, parser.opt)
  return parser
}

function strictFail (parser, message) {
  if (typeof parser !== 'object' || !(parser instanceof SAXParser))
    throw new Error('bad call to strictFail');
  if (parser.strict) error(parser, message)
}

function newTag (parser) {
  if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]()
  var parent = parser.tags[parser.tags.length - 1] || parser
    , tag = parser.tag = { name : parser.tagName, attributes : {} }

  // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
  if (parser.opt.xmlns) tag.ns = parent.ns
  parser.attribList.length = 0
}

function qname (name, attribute) {
  var i = name.indexOf(":")
    , qualName = i < 0 ? [ "", name ] : name.split(":")
    , prefix = qualName[0]
    , local = qualName[1]

  // <x "xmlns"="http://foo">
  if (attribute && name === "xmlns") {
    prefix = "xmlns"
    local = ""
  }

  return { prefix: prefix, local: local }
}

function attrib (parser) {
  if (!parser.strict) parser.attribName = parser.attribName[parser.looseCase]()

  if (parser.attribList.indexOf(parser.attribName) !== -1 ||
      parser.tag.attributes.hasOwnProperty(parser.attribName)) {
    return parser.attribName = parser.attribValue = ""
  }

  if (parser.opt.xmlns) {
    var qn = qname(parser.attribName, true)
      , prefix = qn.prefix
      , local = qn.local

    if (prefix === "xmlns") {
      // namespace binding attribute; push the binding into scope
      if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
        strictFail( parser
                  , "xml: prefix must be bound to " + XML_NAMESPACE + "\n"
                  + "Actual: " + parser.attribValue )
      } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
        strictFail( parser
                  , "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\n"
                  + "Actual: " + parser.attribValue )
      } else {
        var tag = parser.tag
          , parent = parser.tags[parser.tags.length - 1] || parser
        if (tag.ns === parent.ns) {
          tag.ns = Object.create(parent.ns)
        }
        tag.ns[local] = parser.attribValue
      }
    }

    // defer onattribute events until all attributes have been seen
    // so any new bindings can take effect; preserve attribute order
    // so deferred events can be emitted in document order
    parser.attribList.push([parser.attribName, parser.attribValue])
  } else {
    // in non-xmlns mode, we can emit the event right away
    parser.tag.attributes[parser.attribName] = parser.attribValue
    emitNode( parser
            , "onattribute"
            , { name: parser.attribName
              , value: parser.attribValue } )
  }

  parser.attribName = parser.attribValue = ""
}

function openTag (parser, selfClosing) {
  if (parser.opt.xmlns) {
    // emit namespace binding events
    var tag = parser.tag

    // add namespace info to tag
    var qn = qname(parser.tagName)
    tag.prefix = qn.prefix
    tag.local = qn.local
    tag.uri = tag.ns[qn.prefix] || ""

    if (tag.prefix && !tag.uri) {
      strictFail(parser, "Unbound namespace prefix: "
                       + JSON.stringify(parser.tagName))
      tag.uri = qn.prefix
    }

    var parent = parser.tags[parser.tags.length - 1] || parser
    if (tag.ns && parent.ns !== tag.ns) {
      Object.keys(tag.ns).forEach(function (p) {
        emitNode( parser
                , "onopennamespace"
                , { prefix: p , uri: tag.ns[p] } )
      })
    }

    // handle deferred onattribute events
    // Note: do not apply default ns to attributes:
    //   http://www.w3.org/TR/REC-xml-names/#defaulting
    for (var i = 0, l = parser.attribList.length; i < l; i ++) {
      var nv = parser.attribList[i]
      var name = nv[0]
        , value = nv[1]
        , qualName = qname(name, true)
        , prefix = qualName.prefix
        , local = qualName.local
        , uri = prefix == "" ? "" : (tag.ns[prefix] || "")
        , a = { name: name
              , value: value
              , prefix: prefix
              , local: local
              , uri: uri
              }

      // if there's any attributes with an undefined namespace,
      // then fail on them now.
      if (prefix && prefix != "xmlns" && !uri) {
        strictFail(parser, "Unbound namespace prefix: "
                         + JSON.stringify(prefix))
        a.uri = prefix
      }
      parser.tag.attributes[name] = a
      emitNode(parser, "onattribute", a)
    }
    parser.attribList.length = 0
  }

  parser.tag.isSelfClosing = !!selfClosing

  // process the tag
  parser.sawRoot = true
  parser.tags.push(parser.tag)
  emitNode(parser, "onopentag", parser.tag)
  if (!selfClosing) {
    // special case for <script> in non-strict mode.
    if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
      parser.state = S.SCRIPT
    } else {
      parser.state = S.TEXT
    }
    parser.tag = null
    parser.tagName = ""
  }
  parser.attribName = parser.attribValue = ""
  parser.attribList.length = 0
}

function closeTag (parser) {
  if (!parser.tagName) {
    strictFail(parser, "Weird empty close tag.")
    parser.textNode += "</>"
    parser.state = S.TEXT
    return
  }

  if (parser.script) {
    if (parser.tagName !== "script") {
      parser.script += "</" + parser.tagName + ">"
      parser.tagName = ""
      parser.state = S.SCRIPT
      return
    }
    emitNode(parser, "onscript", parser.script)
    parser.script = ""
  }

  // first make sure that the closing tag actually exists.
  // <a><b></c></b></a> will close everything, otherwise.
  var t = parser.tags.length
  var tagName = parser.tagName
  if (!parser.strict) tagName = tagName[parser.looseCase]()
  var closeTo = tagName
  while (t --) {
    var close = parser.tags[t]
    if (close.name !== closeTo) {
      // fail the first time in strict mode
      strictFail(parser, "Unexpected close tag")
    } else break
  }

  // didn't find it.  we already failed for strict, so just abort.
  if (t < 0) {
    strictFail(parser, "Unmatched closing tag: "+parser.tagName)
    parser.textNode += "</" + parser.tagName + ">"
    parser.state = S.TEXT
    return
  }
  parser.tagName = tagName
  var s = parser.tags.length
  while (s --> t) {
    var tag = parser.tag = parser.tags.pop()
    parser.tagName = parser.tag.name
    emitNode(parser, "onclosetag", parser.tagName)

    var x = {}
    for (var i in tag.ns) x[i] = tag.ns[i]

    var parent = parser.tags[parser.tags.length - 1] || parser
    if (parser.opt.xmlns && tag.ns !== parent.ns) {
      // remove namespace bindings introduced by tag
      Object.keys(tag.ns).forEach(function (p) {
        var n = tag.ns[p]
        emitNode(parser, "onclosenamespace", { prefix: p, uri: n })
      })
    }
  }
  if (t === 0) parser.closedRoot = true
  parser.tagName = parser.attribValue = parser.attribName = ""
  parser.attribList.length = 0
  parser.state = S.TEXT
}

function parseEntity (parser) {
  var entity = parser.entity
    , entityLC = entity.toLowerCase()
    , num
    , numStr = ""
  if (parser.ENTITIES[entity])
    return parser.ENTITIES[entity]
  if (parser.ENTITIES[entityLC])
    return parser.ENTITIES[entityLC]
  entity = entityLC
  if (entity.charAt(0) === "#") {
    if (entity.charAt(1) === "x") {
      entity = entity.slice(2)
      num = parseInt(entity, 16)
      numStr = num.toString(16)
    } else {
      entity = entity.slice(1)
      num = parseInt(entity, 10)
      numStr = num.toString(10)
    }
  }
  entity = entity.replace(/^0+/, "")
  if (numStr.toLowerCase() !== entity) {
    strictFail(parser, "Invalid character entity")
    return "&"+parser.entity + ";"
  }

  return String.fromCodePoint(num)
}

function write (chunk) {
  var parser = this
  if (this.error) throw this.error
  if (parser.closed) return error(parser,
    "Cannot write after close. Assign an onready handler.")
  if (chunk === null) return end(parser)
  var i = 0, c = ""
  while (parser.c = c = chunk.charAt(i++)) {
    if (parser.trackPosition) {
      parser.position ++
      if (c === "\n") {
        parser.line ++
        parser.column = 0
      } else parser.column ++
    }
    switch (parser.state) {

      case S.BEGIN:
        if (c === "<") {
          parser.state = S.OPEN_WAKA
          parser.startTagPosition = parser.position
        } else if (not(whitespace,c)) {
          // have to process this as a text node.
          // weird, but happens.
          strictFail(parser, "Non-whitespace before first tag.")
          parser.textNode = c
          parser.state = S.TEXT
        }
      continue

      case S.TEXT:
        if (parser.sawRoot && !parser.closedRoot) {
          var starti = i-1
          while (c && c!=="<" && c!=="&") {
            c = chunk.charAt(i++)
            if (c && parser.trackPosition) {
              parser.position ++
              if (c === "\n") {
                parser.line ++
                parser.column = 0
              } else parser.column ++
            }
          }
          parser.textNode += chunk.substring(starti, i-1)
        }
        if (c === "<") {
          parser.state = S.OPEN_WAKA
          parser.startTagPosition = parser.position
        } else {
          if (not(whitespace, c) && (!parser.sawRoot || parser.closedRoot))
            strictFail(parser, "Text data outside of root node.")
          if (c === "&") parser.state = S.TEXT_ENTITY
          else parser.textNode += c
        }
      continue

      case S.SCRIPT:
        // only non-strict
        if (c === "<") {
          parser.state = S.SCRIPT_ENDING
        } else parser.script += c
      continue

      case S.SCRIPT_ENDING:
        if (c === "/") {
          parser.state = S.CLOSE_TAG
        } else {
          parser.script += "<" + c
          parser.state = S.SCRIPT
        }
      continue

      case S.OPEN_WAKA:
        // either a /, ?, !, or text is coming next.
        if (c === "!") {
          parser.state = S.SGML_DECL
          parser.sgmlDecl = ""
        } else if (is(whitespace, c)) {
          // wait for it...
        } else if (is(nameStart,c)) {
          parser.state = S.OPEN_TAG
          parser.tagName = c
        } else if (c === "/") {
          parser.state = S.CLOSE_TAG
          parser.tagName = ""
        } else if (c === "?") {
          parser.state = S.PROC_INST
          parser.procInstName = parser.procInstBody = ""
        } else {
          strictFail(parser, "Unencoded <")
          // if there was some whitespace, then add that in.
          if (parser.startTagPosition + 1 < parser.position) {
            var pad = parser.position - parser.startTagPosition
            c = new Array(pad).join(" ") + c
          }
          parser.textNode += "<" + c
          parser.state = S.TEXT
        }
      continue

      case S.SGML_DECL:
        if ((parser.sgmlDecl+c).toUpperCase() === CDATA) {
          emitNode(parser, "onopencdata")
          parser.state = S.CDATA
          parser.sgmlDecl = ""
          parser.cdata = ""
        } else if (parser.sgmlDecl+c === "--") {
          parser.state = S.COMMENT
          parser.comment = ""
          parser.sgmlDecl = ""
        } else if ((parser.sgmlDecl+c).toUpperCase() === DOCTYPE) {
          parser.state = S.DOCTYPE
          if (parser.doctype || parser.sawRoot) strictFail(parser,
            "Inappropriately located doctype declaration")
          parser.doctype = ""
          parser.sgmlDecl = ""
        } else if (c === ">") {
          emitNode(parser, "onsgmldeclaration", parser.sgmlDecl)
          parser.sgmlDecl = ""
          parser.state = S.TEXT
        } else if (is(quote, c)) {
          parser.state = S.SGML_DECL_QUOTED
          parser.sgmlDecl += c
        } else parser.sgmlDecl += c
      continue

      case S.SGML_DECL_QUOTED:
        if (c === parser.q) {
          parser.state = S.SGML_DECL
          parser.q = ""
        }
        parser.sgmlDecl += c
      continue

      case S.DOCTYPE:
        if (c === ">") {
          parser.state = S.TEXT
          emitNode(parser, "ondoctype", parser.doctype)
          parser.doctype = true // just remember that we saw it.
        } else {
          parser.doctype += c
          if (c === "[") parser.state = S.DOCTYPE_DTD
          else if (is(quote, c)) {
            parser.state = S.DOCTYPE_QUOTED
            parser.q = c
          }
        }
      continue

      case S.DOCTYPE_QUOTED:
        parser.doctype += c
        if (c === parser.q) {
          parser.q = ""
          parser.state = S.DOCTYPE
        }
      continue

      case S.DOCTYPE_DTD:
        parser.doctype += c
        if (c === "]") parser.state = S.DOCTYPE
        else if (is(quote,c)) {
          parser.state = S.DOCTYPE_DTD_QUOTED
          parser.q = c
        }
      continue

      case S.DOCTYPE_DTD_QUOTED:
        parser.doctype += c
        if (c === parser.q) {
          parser.state = S.DOCTYPE_DTD
          parser.q = ""
        }
      continue

      case S.COMMENT:
        if (c === "-") parser.state = S.COMMENT_ENDING
        else parser.comment += c
      continue

      case S.COMMENT_ENDING:
        if (c === "-") {
          parser.state = S.COMMENT_ENDED
          parser.comment = textopts(parser.opt, parser.comment)
          if (parser.comment) emitNode(parser, "oncomment", parser.comment)
          parser.comment = ""
        } else {
          parser.comment += "-" + c
          parser.state = S.COMMENT
        }
      continue

      case S.COMMENT_ENDED:
        if (c !== ">") {
          strictFail(parser, "Malformed comment")
          // allow <!-- blah -- bloo --> in non-strict mode,
          // which is a comment of " blah -- bloo "
          parser.comment += "--" + c
          parser.state = S.COMMENT
        } else parser.state = S.TEXT
      continue

      case S.CDATA:
        if (c === "]") parser.state = S.CDATA_ENDING
        else parser.cdata += c
      continue

      case S.CDATA_ENDING:
        if (c === "]") parser.state = S.CDATA_ENDING_2
        else {
          parser.cdata += "]" + c
          parser.state = S.CDATA
        }
      continue

      case S.CDATA_ENDING_2:
        if (c === ">") {
          if (parser.cdata) emitNode(parser, "oncdata", parser.cdata)
          emitNode(parser, "onclosecdata")
          parser.cdata = ""
          parser.state = S.TEXT
        } else if (c === "]") {
          parser.cdata += "]"
        } else {
          parser.cdata += "]]" + c
          parser.state = S.CDATA
        }
      continue

      case S.PROC_INST:
        if (c === "?") parser.state = S.PROC_INST_ENDING
        else if (is(whitespace, c)) parser.state = S.PROC_INST_BODY
        else parser.procInstName += c
      continue

      case S.PROC_INST_BODY:
        if (!parser.procInstBody && is(whitespace, c)) continue
        else if (c === "?") parser.state = S.PROC_INST_ENDING
        else parser.procInstBody += c
      continue

      case S.PROC_INST_ENDING:
        if (c === ">") {
          emitNode(parser, "onprocessinginstruction", {
            name : parser.procInstName,
            body : parser.procInstBody
          })
          parser.procInstName = parser.procInstBody = ""
          parser.state = S.TEXT
        } else {
          parser.procInstBody += "?" + c
          parser.state = S.PROC_INST_BODY
        }
      continue

      case S.OPEN_TAG:
        if (is(nameBody, c)) parser.tagName += c
        else {
          newTag(parser)
          if (c === ">") openTag(parser)
          else if (c === "/") parser.state = S.OPEN_TAG_SLASH
          else {
            if (not(whitespace, c)) strictFail(
              parser, "Invalid character in tag name")
            parser.state = S.ATTRIB
          }
        }
      continue

      case S.OPEN_TAG_SLASH:
        if (c === ">") {
          openTag(parser, true)
          closeTag(parser)
        } else {
          strictFail(parser, "Forward-slash in opening tag not followed by >")
          parser.state = S.ATTRIB
        }
      continue

      case S.ATTRIB:
        // haven't read the attribute name yet.
        if (is(whitespace, c)) continue
        else if (c === ">") openTag(parser)
        else if (c === "/") parser.state = S.OPEN_TAG_SLASH
        else if (is(nameStart, c)) {
          parser.attribName = c
          parser.attribValue = ""
          parser.state = S.ATTRIB_NAME
        } else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_NAME:
        if (c === "=") parser.state = S.ATTRIB_VALUE
        else if (c === ">") {
          strictFail(parser, "Attribute without value")
          parser.attribValue = parser.attribName
          attrib(parser)
          openTag(parser)
        }
        else if (is(whitespace, c)) parser.state = S.ATTRIB_NAME_SAW_WHITE
        else if (is(nameBody, c)) parser.attribName += c
        else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_NAME_SAW_WHITE:
        if (c === "=") parser.state = S.ATTRIB_VALUE
        else if (is(whitespace, c)) continue
        else {
          strictFail(parser, "Attribute without value")
          parser.tag.attributes[parser.attribName] = ""
          parser.attribValue = ""
          emitNode(parser, "onattribute",
                   { name : parser.attribName, value : "" })
          parser.attribName = ""
          if (c === ">") openTag(parser)
          else if (is(nameStart, c)) {
            parser.attribName = c
            parser.state = S.ATTRIB_NAME
          } else {
            strictFail(parser, "Invalid attribute name")
            parser.state = S.ATTRIB
          }
        }
      continue

      case S.ATTRIB_VALUE:
        if (is(whitespace, c)) continue
        else if (is(quote, c)) {
          parser.q = c
          parser.state = S.ATTRIB_VALUE_QUOTED
        } else {
          strictFail(parser, "Unquoted attribute value")
          parser.state = S.ATTRIB_VALUE_UNQUOTED
          parser.attribValue = c
        }
      continue

      case S.ATTRIB_VALUE_QUOTED:
        if (c !== parser.q) {
          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_Q
          else parser.attribValue += c
          continue
        }
        attrib(parser)
        parser.q = ""
        parser.state = S.ATTRIB_VALUE_CLOSED
      continue

      case S.ATTRIB_VALUE_CLOSED:
        if (is(whitespace, c)) {
          parser.state = S.ATTRIB
        } else if (c === ">") openTag(parser)
        else if (c === "/") parser.state = S.OPEN_TAG_SLASH
        else if (is(nameStart, c)) {
          strictFail(parser, "No whitespace between attributes")
          parser.attribName = c
          parser.attribValue = ""
          parser.state = S.ATTRIB_NAME
        } else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_VALUE_UNQUOTED:
        if (not(attribEnd,c)) {
          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_U
          else parser.attribValue += c
          continue
        }
        attrib(parser)
        if (c === ">") openTag(parser)
        else parser.state = S.ATTRIB
      continue

      case S.CLOSE_TAG:
        if (!parser.tagName) {
          if (is(whitespace, c)) continue
          else if (not(nameStart, c)) {
            if (parser.script) {
              parser.script += "</" + c
              parser.state = S.SCRIPT
            } else {
              strictFail(parser, "Invalid tagname in closing tag.")
            }
          } else parser.tagName = c
        }
        else if (c === ">") closeTag(parser)
        else if (is(nameBody, c)) parser.tagName += c
        else if (parser.script) {
          parser.script += "</" + parser.tagName
          parser.tagName = ""
          parser.state = S.SCRIPT
        } else {
          if (not(whitespace, c)) strictFail(parser,
            "Invalid tagname in closing tag")
          parser.state = S.CLOSE_TAG_SAW_WHITE
        }
      continue

      case S.CLOSE_TAG_SAW_WHITE:
        if (is(whitespace, c)) continue
        if (c === ">") closeTag(parser)
        else strictFail(parser, "Invalid characters in closing tag")
      continue

      case S.TEXT_ENTITY:
      case S.ATTRIB_VALUE_ENTITY_Q:
      case S.ATTRIB_VALUE_ENTITY_U:
        switch(parser.state) {
          case S.TEXT_ENTITY:
            var returnState = S.TEXT, buffer = "textNode"
          break

          case S.ATTRIB_VALUE_ENTITY_Q:
            var returnState = S.ATTRIB_VALUE_QUOTED, buffer = "attribValue"
          break

          case S.ATTRIB_VALUE_ENTITY_U:
            var returnState = S.ATTRIB_VALUE_UNQUOTED, buffer = "attribValue"
          break
        }
        if (c === ";") {
          parser[buffer] += parseEntity(parser)
          parser.entity = ""
          parser.state = returnState
        }
        else if (is(entity, c)) parser.entity += c
        else {
          strictFail(parser, "Invalid character entity")
          parser[buffer] += "&" + parser.entity + c
          parser.entity = ""
          parser.state = returnState
        }
      continue

      default:
        throw new Error(parser, "Unknown state: " + parser.state)
    }
  } // while
  // cdata blocks can get very big under normal conditions. emit and move on.
  // if (parser.state === S.CDATA && parser.cdata) {
  //   emitNode(parser, "oncdata", parser.cdata)
  //   parser.cdata = ""
  // }
  if (parser.position >= parser.bufferCheckPosition) checkBufferLength(parser)
  return parser
}

/*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
if (!String.fromCodePoint) {
        (function() {
                var stringFromCharCode = String.fromCharCode;
                var floor = Math.floor;
                var fromCodePoint = function() {
                        var MAX_SIZE = 0x4000;
                        var codeUnits = [];
                        var highSurrogate;
                        var lowSurrogate;
                        var index = -1;
                        var length = arguments.length;
                        if (!length) {
                                return '';
                        }
                        var result = '';
                        while (++index < length) {
                                var codePoint = Number(arguments[index]);
                                if (
                                        !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
                                        codePoint < 0 || // not a valid Unicode code point
                                        codePoint > 0x10FFFF || // not a valid Unicode code point
                                        floor(codePoint) != codePoint // not an integer
                                ) {
                                        throw RangeError('Invalid code point: ' + codePoint);
                                }
                                if (codePoint <= 0xFFFF) { // BMP code point
                                        codeUnits.push(codePoint);
                                } else { // Astral code point; split in surrogate halves
                                        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                                        codePoint -= 0x10000;
                                        highSurrogate = (codePoint >> 10) + 0xD800;
                                        lowSurrogate = (codePoint % 0x400) + 0xDC00;
                                        codeUnits.push(highSurrogate, lowSurrogate);
                                }
                                if (index + 1 == length || codeUnits.length > MAX_SIZE) {
                                        result += stringFromCharCode.apply(null, codeUnits);
                                        codeUnits.length = 0;
                                }
                        }
                        return result;
                };
                if (Object.defineProperty) {
                        Object.defineProperty(String, 'fromCodePoint', {
                                'value': fromCodePoint,
                                'configurable': true,
                                'writable': true
                        });
                } else {
                        String.fromCodePoint = fromCodePoint;
                }
        }());
}

})(typeof exports === "undefined" ? sax = {} : exports);

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":5,"stream":30,"string_decoder":45}],90:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
(function() {
  var xml2js;

  xml2js = require('../lib/xml2js');

  exports.stripBOM = function(str) {
    if (str[0] === '\uFEFF') {
      return str.substring(1);
    } else {
      return str;
    }
  };

}).call(this);

},{"../lib/xml2js":92}],91:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
(function() {
  var prefixMatch;

  prefixMatch = new RegExp(/(?!xmlns)^.*:/);

  exports.normalize = function(str) {
    return str.toLowerCase();
  };

  exports.firstCharLowerCase = function(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  };

  exports.stripPrefix = function(str) {
    return str.replace(prefixMatch, '');
  };

}).call(this);

},{}],92:[function(require,module,exports){
(function (process){(function (){
// Generated by CoffeeScript 1.7.1
(function() {
  var bom, builder, events, isEmpty, processName, processors, sax,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  sax = require('sax');

  events = require('events');

  builder = require('xmlbuilder');

  bom = require('./bom');

  processors = require('./processors');

  isEmpty = function(thing) {
    return typeof thing === "object" && (thing != null) && Object.keys(thing).length === 0;
  };

  processName = function(processors, processedName) {
    var process, _i, _len;
    for (_i = 0, _len = processors.length; _i < _len; _i++) {
      process = processors[_i];
      processedName = process(processedName);
    }
    return processedName;
  };

  exports.processors = processors;

  exports.defaults = {
    "0.1": {
      explicitCharkey: false,
      trim: true,
      normalize: true,
      normalizeTags: false,
      attrkey: "@",
      charkey: "#",
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: false,
      explicitRoot: false,
      validator: null,
      xmlns: false,
      explicitChildren: false,
      childkey: '@@',
      charsAsChildren: false,
      async: false,
      strict: true,
      attrNameProcessors: null,
      tagNameProcessors: null
    },
    "0.2": {
      explicitCharkey: false,
      trim: false,
      normalize: false,
      normalizeTags: false,
      attrkey: "$",
      charkey: "_",
      explicitArray: true,
      ignoreAttrs: false,
      mergeAttrs: false,
      explicitRoot: true,
      validator: null,
      xmlns: false,
      explicitChildren: false,
      childkey: '$$',
      charsAsChildren: false,
      async: false,
      strict: true,
      attrNameProcessors: null,
      tagNameProcessors: null,
      rootName: 'root',
      xmldec: {
        'version': '1.0',
        'encoding': 'UTF-8',
        'standalone': true
      },
      doctype: null,
      renderOpts: {
        'pretty': true,
        'indent': '  ',
        'newline': '\n'
      },
      headless: false
    }
  };

  exports.ValidationError = (function(_super) {
    __extends(ValidationError, _super);

    function ValidationError(message) {
      this.message = message;
    }

    return ValidationError;

  })(Error);

  exports.Builder = (function() {
    function Builder(opts) {
      var key, value, _ref;
      this.options = {};
      _ref = exports.defaults["0.2"];
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        value = _ref[key];
        this.options[key] = value;
      }
      for (key in opts) {
        if (!__hasProp.call(opts, key)) continue;
        value = opts[key];
        this.options[key] = value;
      }
    }

    Builder.prototype.buildObject = function(rootObj) {
      var attrkey, charkey, render, rootElement, rootName;
      attrkey = this.options.attrkey;
      charkey = this.options.charkey;
      if ((Object.keys(rootObj).length === 1) && (this.options.rootName === exports.defaults['0.2'].rootName)) {
        rootName = Object.keys(rootObj)[0];
        rootObj = rootObj[rootName];
      } else {
        rootName = this.options.rootName;
      }
      render = function(element, obj) {
        var attr, child, entry, index, key, value, _ref, _ref1;
        if (typeof obj !== 'object') {
          element.txt(obj);
        } else {
          for (key in obj) {
            if (!__hasProp.call(obj, key)) continue;
            child = obj[key];
            if (key === attrkey) {
              if (typeof child === "object") {
                for (attr in child) {
                  value = child[attr];
                  element = element.att(attr, value);
                }
              }
            } else if (key === charkey) {
              element = element.txt(child);
            } else if (typeof child === 'object' && ((child != null ? child.constructor : void 0) != null) && ((child != null ? (_ref = child.constructor) != null ? _ref.name : void 0 : void 0) != null) && (child != null ? (_ref1 = child.constructor) != null ? _ref1.name : void 0 : void 0) === 'Array') {
              for (index in child) {
                if (!__hasProp.call(child, index)) continue;
                entry = child[index];
                if (typeof entry === 'string') {
                  element = element.ele(key, entry).up();
                } else {
                  element = arguments.callee(element.ele(key), entry).up();
                }
              }
            } else if (typeof child === "object") {
              element = arguments.callee(element.ele(key), child).up();
            } else {
              element = element.ele(key, child.toString()).up();
            }
          }
        }
        return element;
      };
      rootElement = builder.create(rootName, this.options.xmldec, this.options.doctype, {
        headless: this.options.headless
      });
      return render(rootElement, rootObj).end(this.options.renderOpts);
    };

    return Builder;

  })();

  exports.Parser = (function(_super) {
    __extends(Parser, _super);

    function Parser(opts) {
      this.parseString = __bind(this.parseString, this);
      this.reset = __bind(this.reset, this);
      this.assignOrPush = __bind(this.assignOrPush, this);
      var key, value, _ref;
      if (!(this instanceof exports.Parser)) {
        return new exports.Parser(opts);
      }
      this.options = {};
      _ref = exports.defaults["0.2"];
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        value = _ref[key];
        this.options[key] = value;
      }
      for (key in opts) {
        if (!__hasProp.call(opts, key)) continue;
        value = opts[key];
        this.options[key] = value;
      }
      if (this.options.xmlns) {
        this.options.xmlnskey = this.options.attrkey + "ns";
      }
      if (this.options.normalizeTags) {
        if (!this.options.tagNameProcessors) {
          this.options.tagNameProcessors = [];
        }
        this.options.tagNameProcessors.unshift(processors.normalize);
      }
      this.reset();
    }

    Parser.prototype.assignOrPush = function(obj, key, newValue) {
      if (!(key in obj)) {
        if (!this.options.explicitArray) {
          return obj[key] = newValue;
        } else {
          return obj[key] = [newValue];
        }
      } else {
        if (!(obj[key] instanceof Array)) {
          obj[key] = [obj[key]];
        }
        return obj[key].push(newValue);
      }
    };

    Parser.prototype.reset = function() {
      var attrkey, charkey, ontext, stack;
      this.removeAllListeners();
      this.saxParser = sax.parser(this.options.strict, {
        trim: false,
        normalize: false,
        xmlns: this.options.xmlns
      });
      this.saxParser.errThrown = false;
      this.saxParser.onerror = (function(_this) {
        return function(error) {
          _this.saxParser.resume();
          if (!_this.saxParser.errThrown) {
            _this.saxParser.errThrown = true;
            return _this.emit("error", error);
          }
        };
      })(this);
      this.saxParser.ended = false;
      this.EXPLICIT_CHARKEY = this.options.explicitCharkey;
      this.resultObject = null;
      stack = [];
      attrkey = this.options.attrkey;
      charkey = this.options.charkey;
      this.saxParser.onopentag = (function(_this) {
        return function(node) {
          var key, newValue, obj, processedKey, _ref;
          obj = {};
          obj[charkey] = "";
          if (!_this.options.ignoreAttrs) {
            _ref = node.attributes;
            for (key in _ref) {
              if (!__hasProp.call(_ref, key)) continue;
              if (!(attrkey in obj) && !_this.options.mergeAttrs) {
                obj[attrkey] = {};
              }
              newValue = node.attributes[key];
              processedKey = _this.options.attrNameProcessors ? processName(_this.options.attrNameProcessors, key) : key;
              if (_this.options.mergeAttrs) {
                _this.assignOrPush(obj, processedKey, newValue);
              } else {
                obj[attrkey][processedKey] = newValue;
              }
            }
          }
          obj["#name"] = _this.options.tagNameProcessors ? processName(_this.options.tagNameProcessors, node.name) : node.name;
          if (_this.options.xmlns) {
            obj[_this.options.xmlnskey] = {
              uri: node.uri,
              local: node.local
            };
          }
          return stack.push(obj);
        };
      })(this);
      this.saxParser.onclosetag = (function(_this) {
        return function() {
          var cdata, emptyStr, err, node, nodeName, obj, old, s, xpath;
          obj = stack.pop();
          nodeName = obj["#name"];
          delete obj["#name"];
          cdata = obj.cdata;
          delete obj.cdata;
          s = stack[stack.length - 1];
          if (obj[charkey].match(/^\s*$/) && !cdata) {
            emptyStr = obj[charkey];
            delete obj[charkey];
          } else {
            if (_this.options.trim) {
              obj[charkey] = obj[charkey].trim();
            }
            if (_this.options.normalize) {
              obj[charkey] = obj[charkey].replace(/\s{2,}/g, " ").trim();
            }
            if (Object.keys(obj).length === 1 && charkey in obj && !_this.EXPLICIT_CHARKEY) {
              obj = obj[charkey];
            }
          }
          if (isEmpty(obj)) {
            obj = _this.options.emptyTag !== void 0 ? _this.options.emptyTag : emptyStr;
          }
          if (_this.options.validator != null) {
            xpath = "/" + ((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = stack.length; _i < _len; _i++) {
                node = stack[_i];
                _results.push(node["#name"]);
              }
              return _results;
            })()).concat(nodeName).join("/");
            try {
              obj = _this.options.validator(xpath, s && s[nodeName], obj);
            } catch (_error) {
              err = _error;
              _this.emit("error", err);
            }
          }
          if (_this.options.explicitChildren && !_this.options.mergeAttrs && typeof obj === 'object') {
            node = {};
            if (_this.options.attrkey in obj) {
              node[_this.options.attrkey] = obj[_this.options.attrkey];
              delete obj[_this.options.attrkey];
            }
            if (!_this.options.charsAsChildren && _this.options.charkey in obj) {
              node[_this.options.charkey] = obj[_this.options.charkey];
              delete obj[_this.options.charkey];
            }
            if (Object.getOwnPropertyNames(obj).length > 0) {
              node[_this.options.childkey] = obj;
            }
            obj = node;
          }
          if (stack.length > 0) {
            return _this.assignOrPush(s, nodeName, obj);
          } else {
            if (_this.options.explicitRoot) {
              old = obj;
              obj = {};
              obj[nodeName] = old;
            }
            _this.resultObject = obj;
            _this.saxParser.ended = true;
            return _this.emit("end", _this.resultObject);
          }
        };
      })(this);
      ontext = (function(_this) {
        return function(text) {
          var s;
          s = stack[stack.length - 1];
          if (s) {
            s[charkey] += text;
            return s;
          }
        };
      })(this);
      this.saxParser.ontext = ontext;
      return this.saxParser.oncdata = (function(_this) {
        return function(text) {
          var s;
          s = ontext(text);
          if (s) {
            return s.cdata = true;
          }
        };
      })(this);
    };

    Parser.prototype.parseString = function(str, cb) {
      var err;
      if ((cb != null) && typeof cb === "function") {
        this.on("end", function(result) {
          this.reset();
          if (this.options.async) {
            return process.nextTick(function() {
              return cb(null, result);
            });
          } else {
            return cb(null, result);
          }
        });
        this.on("error", function(err) {
          this.reset();
          if (this.options.async) {
            return process.nextTick(function() {
              return cb(err);
            });
          } else {
            return cb(err);
          }
        });
      }
      if (str.toString().trim() === '') {
        this.emit("end", null);
        return true;
      }
      try {
        return this.saxParser.write(bom.stripBOM(str.toString())).close();
      } catch (_error) {
        err = _error;
        if (!(this.saxParser.errThrown || this.saxParser.ended)) {
          this.emit('error', err);
          return this.saxParser.errThrown = true;
        }
      }
    };

    return Parser;

  })(events.EventEmitter);

  exports.parseString = function(str, a, b) {
    var cb, options, parser;
    if (b != null) {
      if (typeof b === 'function') {
        cb = b;
      }
      if (typeof a === 'object') {
        options = a;
      }
    } else {
      if (typeof a === 'function') {
        cb = a;
      }
      options = {};
    }
    parser = new exports.Parser(options);
    return parser.parseString(str, cb);
  };

}).call(this);

}).call(this)}).call(this,require('_process'))
},{"./bom":90,"./processors":91,"_process":24,"events":9,"sax":89,"xmlbuilder":125}],93:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  module.exports = {
    Disconnected: 1,
    Preceding: 2,
    Following: 4,
    Contains: 8,
    ContainedBy: 16,
    ImplementationSpecific: 32
  };

}).call(this);

},{}],94:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  module.exports = {
    Element: 1,
    Attribute: 2,
    Text: 3,
    CData: 4,
    EntityReference: 5,
    EntityDeclaration: 6,
    ProcessingInstruction: 7,
    Comment: 8,
    Document: 9,
    DocType: 10,
    DocumentFragment: 11,
    NotationDeclaration: 12,
    // Numeric codes up to 200 are reserved to W3C for possible future use.
    // Following are types internal to this library:
    Declaration: 201,
    Raw: 202,
    AttributeDeclaration: 203,
    ElementDeclaration: 204,
    Dummy: 205
  };

}).call(this);

},{}],95:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  // Copies all enumerable own properties from `sources` to `target`
  var assign, getValue, isArray, isEmpty, isFunction, isObject, isPlainObject,
    hasProp = {}.hasOwnProperty;

  assign = function(target, ...sources) {
    var i, key, len, source;
    if (isFunction(Object.assign)) {
      Object.assign.apply(null, arguments);
    } else {
      for (i = 0, len = sources.length; i < len; i++) {
        source = sources[i];
        if (source != null) {
          for (key in source) {
            if (!hasProp.call(source, key)) continue;
            target[key] = source[key];
          }
        }
      }
    }
    return target;
  };

  // Determines if `val` is a Function object
  isFunction = function(val) {
    return !!val && Object.prototype.toString.call(val) === '[object Function]';
  };

  // Determines if `val` is an Object
  isObject = function(val) {
    var ref;
    return !!val && ((ref = typeof val) === 'function' || ref === 'object');
  };

  // Determines if `val` is an Array
  isArray = function(val) {
    if (isFunction(Array.isArray)) {
      return Array.isArray(val);
    } else {
      return Object.prototype.toString.call(val) === '[object Array]';
    }
  };

  // Determines if `val` is an empty Array or an Object with no own properties
  isEmpty = function(val) {
    var key;
    if (isArray(val)) {
      return !val.length;
    } else {
      for (key in val) {
        if (!hasProp.call(val, key)) continue;
        return false;
      }
      return true;
    }
  };

  // Determines if `val` is a plain Object
  isPlainObject = function(val) {
    var ctor, proto;
    return isObject(val) && (proto = Object.getPrototypeOf(val)) && (ctor = proto.constructor) && (typeof ctor === 'function') && (ctor instanceof ctor) && (Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object));
  };

  // Gets the primitive value of an object
  getValue = function(obj) {
    if (isFunction(obj.valueOf)) {
      return obj.valueOf();
    } else {
      return obj;
    }
  };

  module.exports.assign = assign;

  module.exports.isFunction = isFunction;

  module.exports.isObject = isObject;

  module.exports.isArray = isArray;

  module.exports.isEmpty = isEmpty;

  module.exports.isPlainObject = isPlainObject;

  module.exports.getValue = getValue;

}).call(this);

},{}],96:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  module.exports = {
    None: 0,
    OpenTag: 1,
    InsideTag: 2,
    CloseTag: 3
  };

}).call(this);

},{}],97:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLAttribute, XMLNode;

  NodeType = require('./NodeType');

  XMLNode = require('./XMLNode');

  // Represents an attribute
  module.exports = XMLAttribute = (function() {
    class XMLAttribute {
      // Initializes a new instance of `XMLAttribute`

      // `parent` the parent node
      // `name` attribute target
      // `value` attribute value
      constructor(parent, name, value) {
        this.parent = parent;
        if (this.parent) {
          this.options = this.parent.options;
          this.stringify = this.parent.stringify;
        }
        if (name == null) {
          throw new Error("Missing attribute name. " + this.debugInfo(name));
        }
        this.name = this.stringify.name(name);
        this.value = this.stringify.attValue(value);
        this.type = NodeType.Attribute;
        // DOM level 3
        this.isId = false;
        this.schemaTypeInfo = null;
      }

      // Creates and returns a deep clone of `this`
      clone() {
        return Object.create(this);
      }

      // Converts the XML fragment to string

      // `options.pretty` pretty prints the result
      // `options.indent` indentation for pretty print
      // `options.offset` how many indentations to add to every line for pretty print
      // `options.newline` newline sequence for pretty print
      toString(options) {
        return this.options.writer.attribute(this, this.options.writer.filterOptions(options));
      }

      
      // Returns debug string for this node
      debugInfo(name) {
        name = name || this.name;
        if (name == null) {
          return "parent: <" + this.parent.name + ">";
        } else {
          return "attribute: {" + name + "}, parent: <" + this.parent.name + ">";
        }
      }

      isEqualNode(node) {
        if (node.namespaceURI !== this.namespaceURI) {
          return false;
        }
        if (node.prefix !== this.prefix) {
          return false;
        }
        if (node.localName !== this.localName) {
          return false;
        }
        if (node.value !== this.value) {
          return false;
        }
        return true;
      }

    };

    // DOM level 1
    Object.defineProperty(XMLAttribute.prototype, 'nodeType', {
      get: function() {
        return this.type;
      }
    });

    Object.defineProperty(XMLAttribute.prototype, 'ownerElement', {
      get: function() {
        return this.parent;
      }
    });

    // DOM level 3
    Object.defineProperty(XMLAttribute.prototype, 'textContent', {
      get: function() {
        return this.value;
      },
      set: function(value) {
        return this.value = value || '';
      }
    });

    // DOM level 4
    Object.defineProperty(XMLAttribute.prototype, 'namespaceURI', {
      get: function() {
        return '';
      }
    });

    Object.defineProperty(XMLAttribute.prototype, 'prefix', {
      get: function() {
        return '';
      }
    });

    Object.defineProperty(XMLAttribute.prototype, 'localName', {
      get: function() {
        return this.name;
      }
    });

    Object.defineProperty(XMLAttribute.prototype, 'specified', {
      get: function() {
        return true;
      }
    });

    return XMLAttribute;

  }).call(this);

}).call(this);

},{"./NodeType":94,"./XMLNode":116}],98:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLCData, XMLCharacterData;

  NodeType = require('./NodeType');

  XMLCharacterData = require('./XMLCharacterData');

  // Represents a  CDATA node
  module.exports = XMLCData = class XMLCData extends XMLCharacterData {
    // Initializes a new instance of `XMLCData`

    // `text` CDATA text
    constructor(parent, text) {
      super(parent);
      if (text == null) {
        throw new Error("Missing CDATA text. " + this.debugInfo());
      }
      this.name = "#cdata-section";
      this.type = NodeType.CData;
      this.value = this.stringify.cdata(text);
    }

    // Creates and returns a deep clone of `this`
    clone() {
      return Object.create(this);
    }

    // Converts the XML fragment to string

    // `options.pretty` pretty prints the result
    // `options.indent` indentation for pretty print
    // `options.offset` how many indentations to add to every line for pretty print
    // `options.newline` newline sequence for pretty print
    toString(options) {
      return this.options.writer.cdata(this, this.options.writer.filterOptions(options));
    }

  };

}).call(this);

},{"./NodeType":94,"./XMLCharacterData":99}],99:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var XMLCharacterData, XMLNode;

  XMLNode = require('./XMLNode');

  // Represents a character data node
  module.exports = XMLCharacterData = (function() {
    class XMLCharacterData extends XMLNode {
      // Initializes a new instance of `XMLCharacterData`

      constructor(parent) {
        super(parent);
        this.value = '';
      }

      
      // Creates and returns a deep clone of `this`
      clone() {
        return Object.create(this);
      }

      // DOM level 1 functions to be implemented later
      substringData(offset, count) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      appendData(arg) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      insertData(offset, arg) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      deleteData(offset, count) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      replaceData(offset, count, arg) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      isEqualNode(node) {
        if (!super.isEqualNode(node)) {
          return false;
        }
        if (node.data !== this.data) {
          return false;
        }
        return true;
      }

    };

    // DOM level 1
    Object.defineProperty(XMLCharacterData.prototype, 'data', {
      get: function() {
        return this.value;
      },
      set: function(value) {
        return this.value = value || '';
      }
    });

    Object.defineProperty(XMLCharacterData.prototype, 'length', {
      get: function() {
        return this.value.length;
      }
    });

    // DOM level 3
    Object.defineProperty(XMLCharacterData.prototype, 'textContent', {
      get: function() {
        return this.value;
      },
      set: function(value) {
        return this.value = value || '';
      }
    });

    return XMLCharacterData;

  }).call(this);

}).call(this);

},{"./XMLNode":116}],100:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLCharacterData, XMLComment;

  NodeType = require('./NodeType');

  XMLCharacterData = require('./XMLCharacterData');

  // Represents a comment node
  module.exports = XMLComment = class XMLComment extends XMLCharacterData {
    // Initializes a new instance of `XMLComment`

    // `text` comment text
    constructor(parent, text) {
      super(parent);
      if (text == null) {
        throw new Error("Missing comment text. " + this.debugInfo());
      }
      this.name = "#comment";
      this.type = NodeType.Comment;
      this.value = this.stringify.comment(text);
    }

    // Creates and returns a deep clone of `this`
    clone() {
      return Object.create(this);
    }

    // Converts the XML fragment to string

    // `options.pretty` pretty prints the result
    // `options.indent` indentation for pretty print
    // `options.offset` how many indentations to add to every line for pretty print
    // `options.newline` newline sequence for pretty print
    toString(options) {
      return this.options.writer.comment(this, this.options.writer.filterOptions(options));
    }

  };

}).call(this);

},{"./NodeType":94,"./XMLCharacterData":99}],101:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var XMLDOMConfiguration, XMLDOMErrorHandler, XMLDOMStringList;

  XMLDOMErrorHandler = require('./XMLDOMErrorHandler');

  XMLDOMStringList = require('./XMLDOMStringList');

  // Implements the DOMConfiguration interface
  module.exports = XMLDOMConfiguration = (function() {
    class XMLDOMConfiguration {
      constructor() {
        var clonedSelf;
        this.defaultParams = {
          "canonical-form": false,
          "cdata-sections": false,
          "comments": false,
          "datatype-normalization": false,
          "element-content-whitespace": true,
          "entities": true,
          "error-handler": new XMLDOMErrorHandler(),
          "infoset": true,
          "validate-if-schema": false,
          "namespaces": true,
          "namespace-declarations": true,
          "normalize-characters": false,
          "schema-location": '',
          "schema-type": '',
          "split-cdata-sections": true,
          "validate": false,
          "well-formed": true
        };
        this.params = clonedSelf = Object.create(this.defaultParams);
      }

      // Gets the value of a parameter.

      // `name` name of the parameter
      getParameter(name) {
        if (this.params.hasOwnProperty(name)) {
          return this.params[name];
        } else {
          return null;
        }
      }

      // Checks if setting a parameter to a specific value is supported.

      // `name` name of the parameter
      // `value` parameter value
      canSetParameter(name, value) {
        return true;
      }

      // Sets the value of a parameter.

      // `name` name of the parameter
      // `value` new value or null if the user wishes to unset the parameter
      setParameter(name, value) {
        if (value != null) {
          return this.params[name] = value;
        } else {
          return delete this.params[name];
        }
      }

    };

    // Returns the list of parameter names
    Object.defineProperty(XMLDOMConfiguration.prototype, 'parameterNames', {
      get: function() {
        return new XMLDOMStringList(Object.keys(this.defaultParams));
      }
    });

    return XMLDOMConfiguration;

  }).call(this);

}).call(this);

},{"./XMLDOMErrorHandler":102,"./XMLDOMStringList":104}],102:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  // Represents the error handler for DOM operations
  var XMLDOMErrorHandler;

  module.exports = XMLDOMErrorHandler = class XMLDOMErrorHandler {
    // Initializes a new instance of `XMLDOMErrorHandler`

    constructor() {}

    // Called on the error handler when an error occurs.

    // `error` the error message as a string
    handleError(error) {
      throw new Error(error);
    }

  };

}).call(this);

},{}],103:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  // Implements the DOMImplementation interface
  var XMLDOMImplementation;

  module.exports = XMLDOMImplementation = class XMLDOMImplementation {
    // Tests if the DOM implementation implements a specific feature.

    // `feature` package name of the feature to test. In Level 1, the
    //           legal values are "HTML" and "XML" (case-insensitive).
    // `version` version number of the package name to test. 
    //           In Level 1, this is the string "1.0". If the version is 
    //           not specified, supporting any version of the feature will 
    //           cause the method to return true.
    hasFeature(feature, version) {
      return true;
    }

    // Creates a new document type declaration.

    // `qualifiedName` qualified name of the document type to be created
    // `publicId` public identifier of the external subset
    // `systemId` system identifier of the external subset
    createDocumentType(qualifiedName, publicId, systemId) {
      throw new Error("This DOM method is not implemented.");
    }

    // Creates a new document.

    // `namespaceURI` namespace URI of the document element to create
    // `qualifiedName` the qualified name of the document to be created
    // `doctype` the type of document to be created or null
    createDocument(namespaceURI, qualifiedName, doctype) {
      throw new Error("This DOM method is not implemented.");
    }

    // Creates a new HTML document.

    // `title` document title
    createHTMLDocument(title) {
      throw new Error("This DOM method is not implemented.");
    }

    // Returns a specialized object which implements the specialized APIs 
    // of the specified feature and version.

    // `feature` name of the feature requested.
    // `version` version number of the feature to test
    getFeature(feature, version) {
      throw new Error("This DOM method is not implemented.");
    }

  };

}).call(this);

},{}],104:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  // Represents a list of string entries
  var XMLDOMStringList;

  module.exports = XMLDOMStringList = (function() {
    class XMLDOMStringList {
      // Initializes a new instance of `XMLDOMStringList`
      // This is just a wrapper around an ordinary
      // JS array.

      // `arr` the array of string values
      constructor(arr) {
        this.arr = arr || [];
      }

      // Returns the indexth item in the collection.

      // `index` index into the collection
      item(index) {
        return this.arr[index] || null;
      }

      // Test if a string is part of this DOMStringList.

      // `str` the string to look for
      contains(str) {
        return this.arr.indexOf(str) !== -1;
      }

    };

    // Returns the number of strings in the list.
    Object.defineProperty(XMLDOMStringList.prototype, 'length', {
      get: function() {
        return this.arr.length;
      }
    });

    return XMLDOMStringList;

  }).call(this);

}).call(this);

},{}],105:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLDTDAttList, XMLNode;

  XMLNode = require('./XMLNode');

  NodeType = require('./NodeType');

  // Represents an attribute list
  module.exports = XMLDTDAttList = class XMLDTDAttList extends XMLNode {
    // Initializes a new instance of `XMLDTDAttList`

    // `parent` the parent `XMLDocType` element
    // `elementName` the name of the element containing this attribute
    // `attributeName` attribute name
    // `attributeType` type of the attribute
    // `defaultValueType` default value type (either #REQUIRED, #IMPLIED,
    //                    #FIXED or #DEFAULT)
    // `defaultValue` default value of the attribute
    //                (only used for #FIXED or #DEFAULT)
    constructor(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue) {
      super(parent);
      if (elementName == null) {
        throw new Error("Missing DTD element name. " + this.debugInfo());
      }
      if (attributeName == null) {
        throw new Error("Missing DTD attribute name. " + this.debugInfo(elementName));
      }
      if (!attributeType) {
        throw new Error("Missing DTD attribute type. " + this.debugInfo(elementName));
      }
      if (!defaultValueType) {
        throw new Error("Missing DTD attribute default. " + this.debugInfo(elementName));
      }
      if (defaultValueType.indexOf('#') !== 0) {
        defaultValueType = '#' + defaultValueType;
      }
      if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) {
        throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. " + this.debugInfo(elementName));
      }
      if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) {
        throw new Error("Default value only applies to #FIXED or #DEFAULT. " + this.debugInfo(elementName));
      }
      this.elementName = this.stringify.name(elementName);
      this.type = NodeType.AttributeDeclaration;
      this.attributeName = this.stringify.name(attributeName);
      this.attributeType = this.stringify.dtdAttType(attributeType);
      if (defaultValue) {
        this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
      }
      this.defaultValueType = defaultValueType;
    }

    // Converts the XML fragment to string

    // `options.pretty` pretty prints the result
    // `options.indent` indentation for pretty print
    // `options.offset` how many indentations to add to every line for pretty print
    // `options.newline` newline sequence for pretty print
    toString(options) {
      return this.options.writer.dtdAttList(this, this.options.writer.filterOptions(options));
    }

  };

}).call(this);

},{"./NodeType":94,"./XMLNode":116}],106:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLDTDElement, XMLNode;

  XMLNode = require('./XMLNode');

  NodeType = require('./NodeType');

  // Represents an attribute
  module.exports = XMLDTDElement = class XMLDTDElement extends XMLNode {
    // Initializes a new instance of `XMLDTDElement`

    // `parent` the parent `XMLDocType` element
    // `name` element name
    // `value` element content (defaults to #PCDATA)
    constructor(parent, name, value) {
      super(parent);
      if (name == null) {
        throw new Error("Missing DTD element name. " + this.debugInfo());
      }
      if (!value) {
        value = '(#PCDATA)';
      }
      if (Array.isArray(value)) {
        value = '(' + value.join(',') + ')';
      }
      this.name = this.stringify.name(name);
      this.type = NodeType.ElementDeclaration;
      this.value = this.stringify.dtdElementValue(value);
    }

    // Converts the XML fragment to string

    // `options.pretty` pretty prints the result
    // `options.indent` indentation for pretty print
    // `options.offset` how many indentations to add to every line for pretty print
    // `options.newline` newline sequence for pretty print
    toString(options) {
      return this.options.writer.dtdElement(this, this.options.writer.filterOptions(options));
    }

  };

}).call(this);

},{"./NodeType":94,"./XMLNode":116}],107:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLDTDEntity, XMLNode, isObject;

  ({isObject} = require('./Utility'));

  XMLNode = require('./XMLNode');

  NodeType = require('./NodeType');

  // Represents an entity declaration in the DTD
  module.exports = XMLDTDEntity = (function() {
    class XMLDTDEntity extends XMLNode {
      // Initializes a new instance of `XMLDTDEntity`

      // `parent` the parent `XMLDocType` element
      // `pe` whether this is a parameter entity or a general entity
      //      defaults to `false` (general entity)
      // `name` the name of the entity
      // `value` internal entity value or an object with external entity details
      // `value.pubID` public identifier
      // `value.sysID` system identifier
      // `value.nData` notation declaration
      constructor(parent, pe, name, value) {
        super(parent);
        if (name == null) {
          throw new Error("Missing DTD entity name. " + this.debugInfo(name));
        }
        if (value == null) {
          throw new Error("Missing DTD entity value. " + this.debugInfo(name));
        }
        this.pe = !!pe;
        this.name = this.stringify.name(name);
        this.type = NodeType.EntityDeclaration;
        if (!isObject(value)) {
          this.value = this.stringify.dtdEntityValue(value);
          this.internal = true;
        } else {
          if (!value.pubID && !value.sysID) {
            throw new Error("Public and/or system identifiers are required for an external entity. " + this.debugInfo(name));
          }
          if (value.pubID && !value.sysID) {
            throw new Error("System identifier is required for a public external entity. " + this.debugInfo(name));
          }
          this.internal = false;
          if (value.pubID != null) {
            this.pubID = this.stringify.dtdPubID(value.pubID);
          }
          if (value.sysID != null) {
            this.sysID = this.stringify.dtdSysID(value.sysID);
          }
          if (value.nData != null) {
            this.nData = this.stringify.dtdNData(value.nData);
          }
          if (this.pe && this.nData) {
            throw new Error("Notation declaration is not allowed in a parameter entity. " + this.debugInfo(name));
          }
        }
      }

      // Converts the XML fragment to string

      // `options.pretty` pretty prints the result
      // `options.indent` indentation for pretty print
      // `options.offset` how many indentations to add to every line for pretty print
      // `options.newline` newline sequence for pretty print
      toString(options) {
        return this.options.writer.dtdEntity(this, this.options.writer.filterOptions(options));
      }

    };

    // DOM level 1
    Object.defineProperty(XMLDTDEntity.prototype, 'publicId', {
      get: function() {
        return this.pubID;
      }
    });

    Object.defineProperty(XMLDTDEntity.prototype, 'systemId', {
      get: function() {
        return this.sysID;
      }
    });

    Object.defineProperty(XMLDTDEntity.prototype, 'notationName', {
      get: function() {
        return this.nData || null;
      }
    });

    // DOM level 3
    Object.defineProperty(XMLDTDEntity.prototype, 'inputEncoding', {
      get: function() {
        return null;
      }
    });

    Object.defineProperty(XMLDTDEntity.prototype, 'xmlEncoding', {
      get: function() {
        return null;
      }
    });

    Object.defineProperty(XMLDTDEntity.prototype, 'xmlVersion', {
      get: function() {
        return null;
      }
    });

    return XMLDTDEntity;

  }).call(this);

}).call(this);

},{"./NodeType":94,"./Utility":95,"./XMLNode":116}],108:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLDTDNotation, XMLNode;

  XMLNode = require('./XMLNode');

  NodeType = require('./NodeType');

  // Represents a NOTATION entry in the DTD
  module.exports = XMLDTDNotation = (function() {
    class XMLDTDNotation extends XMLNode {
      // Initializes a new instance of `XMLDTDNotation`

      // `parent` the parent `XMLDocType` element
      // `name` the name of the notation
      // `value` an object with external entity details
      // `value.pubID` public identifier
      // `value.sysID` system identifier
      constructor(parent, name, value) {
        super(parent);
        if (name == null) {
          throw new Error("Missing DTD notation name. " + this.debugInfo(name));
        }
        if (!value.pubID && !value.sysID) {
          throw new Error("Public or system identifiers are required for an external entity. " + this.debugInfo(name));
        }
        this.name = this.stringify.name(name);
        this.type = NodeType.NotationDeclaration;
        if (value.pubID != null) {
          this.pubID = this.stringify.dtdPubID(value.pubID);
        }
        if (value.sysID != null) {
          this.sysID = this.stringify.dtdSysID(value.sysID);
        }
      }

      // Converts the XML fragment to string

      // `options.pretty` pretty prints the result
      // `options.indent` indentation for pretty print
      // `options.offset` how many indentations to add to every line for pretty print
      // `options.newline` newline sequence for pretty print
      toString(options) {
        return this.options.writer.dtdNotation(this, this.options.writer.filterOptions(options));
      }

    };

    // DOM level 1
    Object.defineProperty(XMLDTDNotation.prototype, 'publicId', {
      get: function() {
        return this.pubID;
      }
    });

    Object.defineProperty(XMLDTDNotation.prototype, 'systemId', {
      get: function() {
        return this.sysID;
      }
    });

    return XMLDTDNotation;

  }).call(this);

}).call(this);

},{"./NodeType":94,"./XMLNode":116}],109:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLDeclaration, XMLNode, isObject;

  ({isObject} = require('./Utility'));

  XMLNode = require('./XMLNode');

  NodeType = require('./NodeType');

  // Represents the XML declaration
  module.exports = XMLDeclaration = class XMLDeclaration extends XMLNode {
    // Initializes a new instance of `XMLDeclaration`

    // `parent` the document object

    // `version` A version number string, e.g. 1.0
    // `encoding` Encoding declaration, e.g. UTF-8
    // `standalone` standalone document declaration: true or false
    constructor(parent, version, encoding, standalone) {
      super(parent);
      // arguments may also be passed as an object
      if (isObject(version)) {
        ({version, encoding, standalone} = version);
      }
      if (!version) {
        version = '1.0';
      }
      this.type = NodeType.Declaration;
      this.version = this.stringify.xmlVersion(version);
      if (encoding != null) {
        this.encoding = this.stringify.xmlEncoding(encoding);
      }
      if (standalone != null) {
        this.standalone = this.stringify.xmlStandalone(standalone);
      }
    }

    // Converts to string

    // `options.pretty` pretty prints the result
    // `options.indent` indentation for pretty print
    // `options.offset` how many indentations to add to every line for pretty print
    // `options.newline` newline sequence for pretty print
    toString(options) {
      return this.options.writer.declaration(this, this.options.writer.filterOptions(options));
    }

  };

}).call(this);

},{"./NodeType":94,"./Utility":95,"./XMLNode":116}],110:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDocType, XMLNamedNodeMap, XMLNode, isObject;

  ({isObject} = require('./Utility'));

  XMLNode = require('./XMLNode');

  NodeType = require('./NodeType');

  XMLDTDAttList = require('./XMLDTDAttList');

  XMLDTDEntity = require('./XMLDTDEntity');

  XMLDTDElement = require('./XMLDTDElement');

  XMLDTDNotation = require('./XMLDTDNotation');

  XMLNamedNodeMap = require('./XMLNamedNodeMap');

  // Represents doctype declaration
  module.exports = XMLDocType = (function() {
    class XMLDocType extends XMLNode {
      // Initializes a new instance of `XMLDocType`

      // `parent` the document object

      // `pubID` public identifier of the external subset
      // `sysID` system identifier of the external subset
      constructor(parent, pubID, sysID) {
        var child, i, len, ref;
        super(parent);
        this.type = NodeType.DocType;
        // set DTD name to the name of the root node
        if (parent.children) {
          ref = parent.children;
          for (i = 0, len = ref.length; i < len; i++) {
            child = ref[i];
            if (child.type === NodeType.Element) {
              this.name = child.name;
              break;
            }
          }
        }
        this.documentObject = parent;
        // arguments may also be passed as an object
        if (isObject(pubID)) {
          ({pubID, sysID} = pubID);
        }
        if (sysID == null) {
          [sysID, pubID] = [pubID, sysID];
        }
        if (pubID != null) {
          this.pubID = this.stringify.dtdPubID(pubID);
        }
        if (sysID != null) {
          this.sysID = this.stringify.dtdSysID(sysID);
        }
      }

      // Creates an element type declaration

      // `name` element name
      // `value` element content (defaults to #PCDATA)
      element(name, value) {
        var child;
        child = new XMLDTDElement(this, name, value);
        this.children.push(child);
        return this;
      }

      // Creates an attribute declaration

      // `elementName` the name of the element containing this attribute
      // `attributeName` attribute name
      // `attributeType` type of the attribute (defaults to CDATA)
      // `defaultValueType` default value type (either #REQUIRED, #IMPLIED, #FIXED or
      //                    #DEFAULT) (defaults to #IMPLIED)
      // `defaultValue` default value of the attribute
      //                (only used for #FIXED or #DEFAULT)
      attList(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
        var child;
        child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
        this.children.push(child);
        return this;
      }

      // Creates a general entity declaration

      // `name` the name of the entity
      // `value` internal entity value or an object with external entity details
      // `value.pubID` public identifier
      // `value.sysID` system identifier
      // `value.nData` notation declaration
      entity(name, value) {
        var child;
        child = new XMLDTDEntity(this, false, name, value);
        this.children.push(child);
        return this;
      }

      // Creates a parameter entity declaration

      // `name` the name of the entity
      // `value` internal entity value or an object with external entity details
      // `value.pubID` public identifier
      // `value.sysID` system identifier
      pEntity(name, value) {
        var child;
        child = new XMLDTDEntity(this, true, name, value);
        this.children.push(child);
        return this;
      }

      // Creates a NOTATION declaration

      // `name` the name of the notation
      // `value` an object with external entity details
      // `value.pubID` public identifier
      // `value.sysID` system identifier
      notation(name, value) {
        var child;
        child = new XMLDTDNotation(this, name, value);
        this.children.push(child);
        return this;
      }

      // Converts to string

      // `options.pretty` pretty prints the result
      // `options.indent` indentation for pretty print
      // `options.offset` how many indentations to add to every line for pretty print
      // `options.newline` newline sequence for pretty print
      toString(options) {
        return this.options.writer.docType(this, this.options.writer.filterOptions(options));
      }

      // Aliases
      ele(name, value) {
        return this.element(name, value);
      }

      att(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
        return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
      }

      ent(name, value) {
        return this.entity(name, value);
      }

      pent(name, value) {
        return this.pEntity(name, value);
      }

      not(name, value) {
        return this.notation(name, value);
      }

      up() {
        return this.root() || this.documentObject;
      }

      isEqualNode(node) {
        if (!super.isEqualNode(node)) {
          return false;
        }
        if (node.name !== this.name) {
          return false;
        }
        if (node.publicId !== this.publicId) {
          return false;
        }
        if (node.systemId !== this.systemId) {
          return false;
        }
        return true;
      }

    };

    // DOM level 1
    Object.defineProperty(XMLDocType.prototype, 'entities', {
      get: function() {
        var child, i, len, nodes, ref;
        nodes = {};
        ref = this.children;
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          if ((child.type === NodeType.EntityDeclaration) && !child.pe) {
            nodes[child.name] = child;
          }
        }
        return new XMLNamedNodeMap(nodes);
      }
    });

    Object.defineProperty(XMLDocType.prototype, 'notations', {
      get: function() {
        var child, i, len, nodes, ref;
        nodes = {};
        ref = this.children;
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          if (child.type === NodeType.NotationDeclaration) {
            nodes[child.name] = child;
          }
        }
        return new XMLNamedNodeMap(nodes);
      }
    });

    // DOM level 2
    Object.defineProperty(XMLDocType.prototype, 'publicId', {
      get: function() {
        return this.pubID;
      }
    });

    Object.defineProperty(XMLDocType.prototype, 'systemId', {
      get: function() {
        return this.sysID;
      }
    });

    Object.defineProperty(XMLDocType.prototype, 'internalSubset', {
      get: function() {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }
    });

    return XMLDocType;

  }).call(this);

}).call(this);

},{"./NodeType":94,"./Utility":95,"./XMLDTDAttList":105,"./XMLDTDElement":106,"./XMLDTDEntity":107,"./XMLDTDNotation":108,"./XMLNamedNodeMap":115,"./XMLNode":116}],111:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLDOMConfiguration, XMLDOMImplementation, XMLDocument, XMLNode, XMLStringWriter, XMLStringifier, isPlainObject;

  ({isPlainObject} = require('./Utility'));

  XMLDOMImplementation = require('./XMLDOMImplementation');

  XMLDOMConfiguration = require('./XMLDOMConfiguration');

  XMLNode = require('./XMLNode');

  NodeType = require('./NodeType');

  XMLStringifier = require('./XMLStringifier');

  XMLStringWriter = require('./XMLStringWriter');

  // Represents an XML builder
  module.exports = XMLDocument = (function() {
    class XMLDocument extends XMLNode {
      // Initializes a new instance of `XMLDocument`

      // `options.keepNullNodes` whether nodes with null values will be kept
      //     or ignored: true or false
      // `options.keepNullAttributes` whether attributes with null values will be
      //     kept or ignored: true or false
      // `options.ignoreDecorators` whether decorator strings will be ignored when
      //     converting JS objects: true or false
      // `options.separateArrayItems` whether array items are created as separate
      //     nodes when passed as an object value: true or false
      // `options.noDoubleEncoding` whether existing html entities are encoded:
      //     true or false
      // `options.stringify` a set of functions to use for converting values to
      //     strings
      // `options.writer` the default XML writer to use for converting nodes to
      //     string. If the default writer is not set, the built-in XMLStringWriter
      //     will be used instead.
      constructor(options) {
        super(null);
        this.name = "#document";
        this.type = NodeType.Document;
        this.documentURI = null;
        this.domConfig = new XMLDOMConfiguration();
        options || (options = {});
        if (!options.writer) {
          options.writer = new XMLStringWriter();
        }
        this.options = options;
        this.stringify = new XMLStringifier(options);
      }

      // Ends the document and passes it to the given XML writer

      // `writer` is either an XML writer or a plain object to pass to the
      // constructor of the default XML writer. The default writer is assigned when
      // creating the XML document. Following flags are recognized by the
      // built-in XMLStringWriter:
      //   `writer.pretty` pretty prints the result
      //   `writer.indent` indentation for pretty print
      //   `writer.offset` how many indentations to add to every line for pretty print
      //   `writer.newline` newline sequence for pretty print
      end(writer) {
        var writerOptions;
        writerOptions = {};
        if (!writer) {
          writer = this.options.writer;
        } else if (isPlainObject(writer)) {
          writerOptions = writer;
          writer = this.options.writer;
        }
        return writer.document(this, writer.filterOptions(writerOptions));
      }

      // Converts the XML document to string

      // `options.pretty` pretty prints the result
      // `options.indent` indentation for pretty print
      // `options.offset` how many indentations to add to every line for pretty print
      // `options.newline` newline sequence for pretty print
      toString(options) {
        return this.options.writer.document(this, this.options.writer.filterOptions(options));
      }

      // DOM level 1 functions to be implemented later
      createElement(tagName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createDocumentFragment() {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createTextNode(data) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createComment(data) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createCDATASection(data) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createProcessingInstruction(target, data) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createAttribute(name) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createEntityReference(name) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      getElementsByTagName(tagname) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      // DOM level 2 functions to be implemented later
      importNode(importedNode, deep) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createElementNS(namespaceURI, qualifiedName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createAttributeNS(namespaceURI, qualifiedName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      getElementsByTagNameNS(namespaceURI, localName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      getElementById(elementId) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      // DOM level 3 functions to be implemented later
      adoptNode(source) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      normalizeDocument() {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      renameNode(node, namespaceURI, qualifiedName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      // DOM level 4 functions to be implemented later
      getElementsByClassName(classNames) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createEvent(eventInterface) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createRange() {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createNodeIterator(root, whatToShow, filter) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      createTreeWalker(root, whatToShow, filter) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

    };

    // DOM level 1
    Object.defineProperty(XMLDocument.prototype, 'implementation', {
      value: new XMLDOMImplementation()
    });

    Object.defineProperty(XMLDocument.prototype, 'doctype', {
      get: function() {
        var child, i, len, ref;
        ref = this.children;
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          if (child.type === NodeType.DocType) {
            return child;
          }
        }
        return null;
      }
    });

    Object.defineProperty(XMLDocument.prototype, 'documentElement', {
      get: function() {
        return this.rootObject || null;
      }
    });

    // DOM level 3
    Object.defineProperty(XMLDocument.prototype, 'inputEncoding', {
      get: function() {
        return null;
      }
    });

    Object.defineProperty(XMLDocument.prototype, 'strictErrorChecking', {
      get: function() {
        return false;
      }
    });

    Object.defineProperty(XMLDocument.prototype, 'xmlEncoding', {
      get: function() {
        if (this.children.length !== 0 && this.children[0].type === NodeType.Declaration) {
          return this.children[0].encoding;
        } else {
          return null;
        }
      }
    });

    Object.defineProperty(XMLDocument.prototype, 'xmlStandalone', {
      get: function() {
        if (this.children.length !== 0 && this.children[0].type === NodeType.Declaration) {
          return this.children[0].standalone === 'yes';
        } else {
          return false;
        }
      }
    });

    Object.defineProperty(XMLDocument.prototype, 'xmlVersion', {
      get: function() {
        if (this.children.length !== 0 && this.children[0].type === NodeType.Declaration) {
          return this.children[0].version;
        } else {
          return "1.0";
        }
      }
    });

    // DOM level 4
    Object.defineProperty(XMLDocument.prototype, 'URL', {
      get: function() {
        return this.documentURI;
      }
    });

    Object.defineProperty(XMLDocument.prototype, 'origin', {
      get: function() {
        return null;
      }
    });

    Object.defineProperty(XMLDocument.prototype, 'compatMode', {
      get: function() {
        return null;
      }
    });

    Object.defineProperty(XMLDocument.prototype, 'characterSet', {
      get: function() {
        return null;
      }
    });

    Object.defineProperty(XMLDocument.prototype, 'contentType', {
      get: function() {
        return null;
      }
    });

    return XMLDocument;

  }).call(this);

}).call(this);

},{"./NodeType":94,"./Utility":95,"./XMLDOMConfiguration":101,"./XMLDOMImplementation":103,"./XMLNode":116,"./XMLStringWriter":121,"./XMLStringifier":122}],112:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, WriterState, XMLAttribute, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDocument, XMLDocumentCB, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStringWriter, XMLStringifier, XMLText, getValue, isFunction, isObject, isPlainObject,
    hasProp = {}.hasOwnProperty;

  ({isObject, isFunction, isPlainObject, getValue} = require('./Utility'));

  NodeType = require('./NodeType');

  XMLDocument = require('./XMLDocument');

  XMLElement = require('./XMLElement');

  XMLCData = require('./XMLCData');

  XMLComment = require('./XMLComment');

  XMLRaw = require('./XMLRaw');

  XMLText = require('./XMLText');

  XMLProcessingInstruction = require('./XMLProcessingInstruction');

  XMLDeclaration = require('./XMLDeclaration');

  XMLDocType = require('./XMLDocType');

  XMLDTDAttList = require('./XMLDTDAttList');

  XMLDTDEntity = require('./XMLDTDEntity');

  XMLDTDElement = require('./XMLDTDElement');

  XMLDTDNotation = require('./XMLDTDNotation');

  XMLAttribute = require('./XMLAttribute');

  XMLStringifier = require('./XMLStringifier');

  XMLStringWriter = require('./XMLStringWriter');

  WriterState = require('./WriterState');

  // Represents an XML builder
  module.exports = XMLDocumentCB = class XMLDocumentCB {
    // Initializes a new instance of `XMLDocumentCB`

    // `options.keepNullNodes` whether nodes with null values will be kept
    //     or ignored: true or false
    // `options.keepNullAttributes` whether attributes with null values will be
    //     kept or ignored: true or false
    // `options.ignoreDecorators` whether decorator strings will be ignored when
    //     converting JS objects: true or false
    // `options.separateArrayItems` whether array items are created as separate
    //     nodes when passed as an object value: true or false
    // `options.noDoubleEncoding` whether existing html entities are encoded:
    //     true or false
    // `options.stringify` a set of functions to use for converting values to
    //     strings
    // `options.writer` the default XML writer to use for converting nodes to
    //     string. If the default writer is not set, the built-in XMLStringWriter
    //     will be used instead.

    // `onData` the function to be called when a new chunk of XML is output. The
    //          string containing the XML chunk is passed to `onData` as its first
    //          argument, and the current indentation level as its second argument.
    // `onEnd`  the function to be called when the XML document is completed with
    //          `end`. `onEnd` does not receive any arguments.
    constructor(options, onData, onEnd) {
      var writerOptions;
      this.name = "?xml";
      this.type = NodeType.Document;
      options || (options = {});
      writerOptions = {};
      if (!options.writer) {
        options.writer = new XMLStringWriter();
      } else if (isPlainObject(options.writer)) {
        writerOptions = options.writer;
        options.writer = new XMLStringWriter();
      }
      this.options = options;
      this.writer = options.writer;
      this.writerOptions = this.writer.filterOptions(writerOptions);
      this.stringify = new XMLStringifier(options);
      this.onDataCallback = onData || function() {};
      this.onEndCallback = onEnd || function() {};
      this.currentNode = null;
      this.currentLevel = -1;
      this.openTags = {};
      this.documentStarted = false;
      this.documentCompleted = false;
      this.root = null;
    }

    // Creates a child element node from the given XMLNode

    // `node` the child node
    createChildNode(node) {
      var att, attName, attributes, child, i, len, ref, ref1;
      switch (node.type) {
        case NodeType.CData:
          this.cdata(node.value);
          break;
        case NodeType.Comment:
          this.comment(node.value);
          break;
        case NodeType.Element:
          attributes = {};
          ref = node.attribs;
          for (attName in ref) {
            if (!hasProp.call(ref, attName)) continue;
            att = ref[attName];
            attributes[attName] = att.value;
          }
          this.node(node.name, attributes);
          break;
        case NodeType.Dummy:
          this.dummy();
          break;
        case NodeType.Raw:
          this.raw(node.value);
          break;
        case NodeType.Text:
          this.text(node.value);
          break;
        case NodeType.ProcessingInstruction:
          this.instruction(node.target, node.value);
          break;
        default:
          throw new Error("This XML node type is not supported in a JS object: " + node.constructor.name);
      }
      ref1 = node.children;
      // write child nodes recursively
      for (i = 0, len = ref1.length; i < len; i++) {
        child = ref1[i];
        this.createChildNode(child);
        if (child.type === NodeType.Element) {
          this.up();
        }
      }
      return this;
    }

    // Creates a dummy node

    dummy() {
      // no-op, just return this
      return this;
    }

    // Creates a node

    // `name` name of the node
    // `attributes` an object containing name/value pairs of attributes
    // `text` element text
    node(name, attributes, text) {
      if (name == null) {
        throw new Error("Missing node name.");
      }
      if (this.root && this.currentLevel === -1) {
        throw new Error("Document can only have one root node. " + this.debugInfo(name));
      }
      this.openCurrent();
      name = getValue(name);
      if (attributes == null) {
        attributes = {};
      }
      attributes = getValue(attributes);
      // swap argument order: text <-> attributes
      if (!isObject(attributes)) {
        [text, attributes] = [attributes, text];
      }
      this.currentNode = new XMLElement(this, name, attributes);
      this.currentNode.children = false;
      this.currentLevel++;
      this.openTags[this.currentLevel] = this.currentNode;
      if (text != null) {
        this.text(text);
      }
      return this;
    }

    // Creates a child element node or an element type declaration when called
    // inside the DTD

    // `name` name of the node
    // `attributes` an object containing name/value pairs of attributes
    // `text` element text
    element(name, attributes, text) {
      var child, i, len, oldValidationFlag, ref, root;
      if (this.currentNode && this.currentNode.type === NodeType.DocType) {
        this.dtdElement(...arguments);
      } else {
        if (Array.isArray(name) || isObject(name) || isFunction(name)) {
          oldValidationFlag = this.options.noValidation;
          this.options.noValidation = true;
          root = new XMLDocument(this.options).element('TEMP_ROOT');
          root.element(name);
          this.options.noValidation = oldValidationFlag;
          ref = root.children;
          for (i = 0, len = ref.length; i < len; i++) {
            child = ref[i];
            this.createChildNode(child);
            if (child.type === NodeType.Element) {
              this.up();
            }
          }
        } else {
          this.node(name, attributes, text);
        }
      }
      return this;
    }

    // Adds or modifies an attribute

    // `name` attribute name
    // `value` attribute value
    attribute(name, value) {
      var attName, attValue;
      if (!this.currentNode || this.currentNode.children) {
        throw new Error("att() can only be used immediately after an ele() call in callback mode. " + this.debugInfo(name));
      }
      if (name != null) {
        name = getValue(name);
      }
      if (isObject(name)) { // expand if object
        for (attName in name) {
          if (!hasProp.call(name, attName)) continue;
          attValue = name[attName];
          this.attribute(attName, attValue);
        }
      } else {
        if (isFunction(value)) {
          value = value.apply();
        }
        if (this.options.keepNullAttributes && (value == null)) {
          this.currentNode.attribs[name] = new XMLAttribute(this, name, "");
        } else if (value != null) {
          this.currentNode.attribs[name] = new XMLAttribute(this, name, value);
        }
      }
      return this;
    }

    // Creates a text node

    // `value` element text
    text(value) {
      var node;
      this.openCurrent();
      node = new XMLText(this, value);
      this.onData(this.writer.text(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      return this;
    }

    // Creates a CDATA node

    // `value` element text without CDATA delimiters
    cdata(value) {
      var node;
      this.openCurrent();
      node = new XMLCData(this, value);
      this.onData(this.writer.cdata(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      return this;
    }

    // Creates a comment node

    // `value` comment text
    comment(value) {
      var node;
      this.openCurrent();
      node = new XMLComment(this, value);
      this.onData(this.writer.comment(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      return this;
    }

    // Adds unescaped raw text

    // `value` text
    raw(value) {
      var node;
      this.openCurrent();
      node = new XMLRaw(this, value);
      this.onData(this.writer.raw(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      return this;
    }

    // Adds a processing instruction

    // `target` instruction target
    // `value` instruction value
    instruction(target, value) {
      var i, insTarget, insValue, len, node;
      this.openCurrent();
      if (target != null) {
        target = getValue(target);
      }
      if (value != null) {
        value = getValue(value);
      }
      if (Array.isArray(target)) { // expand if array
        for (i = 0, len = target.length; i < len; i++) {
          insTarget = target[i];
          this.instruction(insTarget);
        }
      } else if (isObject(target)) { // expand if object
        for (insTarget in target) {
          if (!hasProp.call(target, insTarget)) continue;
          insValue = target[insTarget];
          this.instruction(insTarget, insValue);
        }
      } else {
        if (isFunction(value)) {
          value = value.apply();
        }
        node = new XMLProcessingInstruction(this, target, value);
        this.onData(this.writer.processingInstruction(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      }
      return this;
    }

    // Creates the xml declaration

    // `version` A version number string, e.g. 1.0
    // `encoding` Encoding declaration, e.g. UTF-8
    // `standalone` standalone document declaration: true or false
    declaration(version, encoding, standalone) {
      var node;
      this.openCurrent();
      if (this.documentStarted) {
        throw new Error("declaration() must be the first node.");
      }
      node = new XMLDeclaration(this, version, encoding, standalone);
      this.onData(this.writer.declaration(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      return this;
    }

    // Creates the document type declaration

    // `root`  the name of the root node
    // `pubID` the public identifier of the external subset
    // `sysID` the system identifier of the external subset
    doctype(root, pubID, sysID) {
      this.openCurrent();
      if (root == null) {
        throw new Error("Missing root node name.");
      }
      if (this.root) {
        throw new Error("dtd() must come before the root node.");
      }
      this.currentNode = new XMLDocType(this, pubID, sysID);
      this.currentNode.rootNodeName = root;
      this.currentNode.children = false;
      this.currentLevel++;
      this.openTags[this.currentLevel] = this.currentNode;
      return this;
    }

    // Creates an element type declaration

    // `name` element name
    // `value` element content (defaults to #PCDATA)
    dtdElement(name, value) {
      var node;
      this.openCurrent();
      node = new XMLDTDElement(this, name, value);
      this.onData(this.writer.dtdElement(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      return this;
    }

    // Creates an attribute declaration

    // `elementName` the name of the element containing this attribute
    // `attributeName` attribute name
    // `attributeType` type of the attribute (defaults to CDATA)
    // `defaultValueType` default value type (either #REQUIRED, #IMPLIED, #FIXED or
    //                    #DEFAULT) (defaults to #IMPLIED)
    // `defaultValue` default value of the attribute
    //                (only used for #FIXED or #DEFAULT)
    attList(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
      var node;
      this.openCurrent();
      node = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
      this.onData(this.writer.dtdAttList(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      return this;
    }

    // Creates a general entity declaration

    // `name` the name of the entity
    // `value` internal entity value or an object with external entity details
    // `value.pubID` public identifier
    // `value.sysID` system identifier
    // `value.nData` notation declaration
    entity(name, value) {
      var node;
      this.openCurrent();
      node = new XMLDTDEntity(this, false, name, value);
      this.onData(this.writer.dtdEntity(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      return this;
    }

    // Creates a parameter entity declaration

    // `name` the name of the entity
    // `value` internal entity value or an object with external entity details
    // `value.pubID` public identifier
    // `value.sysID` system identifier
    pEntity(name, value) {
      var node;
      this.openCurrent();
      node = new XMLDTDEntity(this, true, name, value);
      this.onData(this.writer.dtdEntity(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      return this;
    }

    // Creates a NOTATION declaration

    // `name` the name of the notation
    // `value` an object with external entity details
    // `value.pubID` public identifier
    // `value.sysID` system identifier
    notation(name, value) {
      var node;
      this.openCurrent();
      node = new XMLDTDNotation(this, name, value);
      this.onData(this.writer.dtdNotation(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
      return this;
    }

    // Gets the parent node
    up() {
      if (this.currentLevel < 0) {
        throw new Error("The document node has no parent.");
      }
      if (this.currentNode) {
        if (this.currentNode.children) {
          this.closeNode(this.currentNode);
        } else {
          this.openNode(this.currentNode);
        }
        this.currentNode = null;
      } else {
        this.closeNode(this.openTags[this.currentLevel]);
      }
      delete this.openTags[this.currentLevel];
      this.currentLevel--;
      return this;
    }

    // Ends the document
    end() {
      while (this.currentLevel >= 0) {
        this.up();
      }
      return this.onEnd();
    }

    // Opens the current parent node
    openCurrent() {
      if (this.currentNode) {
        this.currentNode.children = true;
        return this.openNode(this.currentNode);
      }
    }

    // Writes the opening tag of the current node or the entire node if it has
    // no child nodes
    openNode(node) {
      var att, chunk, name, ref;
      if (!node.isOpen) {
        if (!this.root && this.currentLevel === 0 && node.type === NodeType.Element) {
          this.root = node;
        }
        chunk = '';
        if (node.type === NodeType.Element) {
          this.writerOptions.state = WriterState.OpenTag;
          chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + '<' + node.name;
          ref = node.attribs;
          for (name in ref) {
            if (!hasProp.call(ref, name)) continue;
            att = ref[name];
            chunk += this.writer.attribute(att, this.writerOptions, this.currentLevel);
          }
          chunk += (node.children ? '>' : '/>') + this.writer.endline(node, this.writerOptions, this.currentLevel);
          this.writerOptions.state = WriterState.InsideTag; // if node.type is NodeType.DocType
        } else {
          this.writerOptions.state = WriterState.OpenTag;
          chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + '<!DOCTYPE ' + node.rootNodeName;
          
          // external identifier
          if (node.pubID && node.sysID) {
            chunk += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
          } else if (node.sysID) {
            chunk += ' SYSTEM "' + node.sysID + '"';
          }
          
          // internal subset
          if (node.children) {
            chunk += ' [';
            this.writerOptions.state = WriterState.InsideTag;
          } else {
            this.writerOptions.state = WriterState.CloseTag;
            chunk += '>';
          }
          chunk += this.writer.endline(node, this.writerOptions, this.currentLevel);
        }
        this.onData(chunk, this.currentLevel);
        return node.isOpen = true;
      }
    }

    // Writes the closing tag of the current node
    closeNode(node) {
      var chunk;
      if (!node.isClosed) {
        chunk = '';
        this.writerOptions.state = WriterState.CloseTag;
        if (node.type === NodeType.Element) {
          chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + '</' + node.name + '>' + this.writer.endline(node, this.writerOptions, this.currentLevel); // if node.type is NodeType.DocType
        } else {
          chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + ']>' + this.writer.endline(node, this.writerOptions, this.currentLevel);
        }
        this.writerOptions.state = WriterState.None;
        this.onData(chunk, this.currentLevel);
        return node.isClosed = true;
      }
    }

    // Called when a new chunk of XML is output

    // `chunk` a string containing the XML chunk
    // `level` current indentation level
    onData(chunk, level) {
      this.documentStarted = true;
      return this.onDataCallback(chunk, level + 1);
    }

    // Called when the XML document is completed
    onEnd() {
      this.documentCompleted = true;
      return this.onEndCallback();
    }

    // Returns debug string
    debugInfo(name) {
      if (name == null) {
        return "";
      } else {
        return "node: <" + name + ">";
      }
    }

    // Node aliases
    ele() {
      return this.element(...arguments);
    }

    nod(name, attributes, text) {
      return this.node(name, attributes, text);
    }

    txt(value) {
      return this.text(value);
    }

    dat(value) {
      return this.cdata(value);
    }

    com(value) {
      return this.comment(value);
    }

    ins(target, value) {
      return this.instruction(target, value);
    }

    dec(version, encoding, standalone) {
      return this.declaration(version, encoding, standalone);
    }

    dtd(root, pubID, sysID) {
      return this.doctype(root, pubID, sysID);
    }

    e(name, attributes, text) {
      return this.element(name, attributes, text);
    }

    n(name, attributes, text) {
      return this.node(name, attributes, text);
    }

    t(value) {
      return this.text(value);
    }

    d(value) {
      return this.cdata(value);
    }

    c(value) {
      return this.comment(value);
    }

    r(value) {
      return this.raw(value);
    }

    i(target, value) {
      return this.instruction(target, value);
    }

    // Attribute aliases
    att() {
      if (this.currentNode && this.currentNode.type === NodeType.DocType) {
        return this.attList(...arguments);
      } else {
        return this.attribute(...arguments);
      }
    }

    a() {
      if (this.currentNode && this.currentNode.type === NodeType.DocType) {
        return this.attList(...arguments);
      } else {
        return this.attribute(...arguments);
      }
    }

    // DTD aliases
    // att() and ele() are defined above
    ent(name, value) {
      return this.entity(name, value);
    }

    pent(name, value) {
      return this.pEntity(name, value);
    }

    not(name, value) {
      return this.notation(name, value);
    }

  };

}).call(this);

},{"./NodeType":94,"./Utility":95,"./WriterState":96,"./XMLAttribute":97,"./XMLCData":98,"./XMLComment":100,"./XMLDTDAttList":105,"./XMLDTDElement":106,"./XMLDTDEntity":107,"./XMLDTDNotation":108,"./XMLDeclaration":109,"./XMLDocType":110,"./XMLDocument":111,"./XMLElement":114,"./XMLProcessingInstruction":118,"./XMLRaw":119,"./XMLStringWriter":121,"./XMLStringifier":122,"./XMLText":123}],113:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLDummy, XMLNode;

  XMLNode = require('./XMLNode');

  NodeType = require('./NodeType');

  // Represents a  raw node
  module.exports = XMLDummy = class XMLDummy extends XMLNode {
    // Initializes a new instance of `XMLDummy`

    // `XMLDummy` is a special node representing a node with 
    // a null value. Dummy nodes are created while recursively
    // building the XML tree. Simply skipping null values doesn't
    // work because that would break the recursive chain.
    constructor(parent) {
      super(parent);
      this.type = NodeType.Dummy;
    }

    // Creates and returns a deep clone of `this`
    clone() {
      return Object.create(this);
    }

    // Converts the XML fragment to string

    // `options.pretty` pretty prints the result
    // `options.indent` indentation for pretty print
    // `options.offset` how many indentations to add to every line for pretty print
    // `options.newline` newline sequence for pretty print
    toString(options) {
      return '';
    }

  };

}).call(this);

},{"./NodeType":94,"./XMLNode":116}],114:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLAttribute, XMLElement, XMLNamedNodeMap, XMLNode, getValue, isFunction, isObject,
    hasProp = {}.hasOwnProperty;

  ({isObject, isFunction, getValue} = require('./Utility'));

  XMLNode = require('./XMLNode');

  NodeType = require('./NodeType');

  XMLAttribute = require('./XMLAttribute');

  XMLNamedNodeMap = require('./XMLNamedNodeMap');

  // Represents an element of the XML document
  module.exports = XMLElement = (function() {
    class XMLElement extends XMLNode {
      // Initializes a new instance of `XMLElement`

      // `parent` the parent node
      // `name` element name
      // `attributes` an object containing name/value pairs of attributes
      constructor(parent, name, attributes) {
        var child, j, len, ref;
        super(parent);
        if (name == null) {
          throw new Error("Missing element name. " + this.debugInfo());
        }
        this.name = this.stringify.name(name);
        this.type = NodeType.Element;
        this.attribs = {};
        this.schemaTypeInfo = null;
        if (attributes != null) {
          this.attribute(attributes);
        }
        // set properties if this is the root node
        if (parent.type === NodeType.Document) {
          this.isRoot = true;
          this.documentObject = parent;
          parent.rootObject = this;
          // set dtd name
          if (parent.children) {
            ref = parent.children;
            for (j = 0, len = ref.length; j < len; j++) {
              child = ref[j];
              if (child.type === NodeType.DocType) {
                child.name = this.name;
                break;
              }
            }
          }
        }
      }

      // Creates and returns a deep clone of `this`

      clone() {
        var att, attName, clonedSelf, ref;
        clonedSelf = Object.create(this);
        // remove document element
        if (clonedSelf.isRoot) {
          clonedSelf.documentObject = null;
        }
        // clone attributes
        clonedSelf.attribs = {};
        ref = this.attribs;
        for (attName in ref) {
          if (!hasProp.call(ref, attName)) continue;
          att = ref[attName];
          clonedSelf.attribs[attName] = att.clone();
        }
        // clone child nodes
        clonedSelf.children = [];
        this.children.forEach(function(child) {
          var clonedChild;
          clonedChild = child.clone();
          clonedChild.parent = clonedSelf;
          return clonedSelf.children.push(clonedChild);
        });
        return clonedSelf;
      }

      // Adds or modifies an attribute

      // `name` attribute name
      // `value` attribute value
      attribute(name, value) {
        var attName, attValue;
        if (name != null) {
          name = getValue(name);
        }
        if (isObject(name)) { // expand if object
          for (attName in name) {
            if (!hasProp.call(name, attName)) continue;
            attValue = name[attName];
            this.attribute(attName, attValue);
          }
        } else {
          if (isFunction(value)) {
            value = value.apply();
          }
          if (this.options.keepNullAttributes && (value == null)) {
            this.attribs[name] = new XMLAttribute(this, name, "");
          } else if (value != null) {
            this.attribs[name] = new XMLAttribute(this, name, value);
          }
        }
        return this;
      }

      // Removes an attribute

      // `name` attribute name
      removeAttribute(name) {
        var attName, j, len;
        // Also defined in DOM level 1
        // removeAttribute(name) removes an attribute by name.
        if (name == null) {
          throw new Error("Missing attribute name. " + this.debugInfo());
        }
        name = getValue(name);
        if (Array.isArray(name)) { // expand if array
          for (j = 0, len = name.length; j < len; j++) {
            attName = name[j];
            delete this.attribs[attName];
          }
        } else {
          delete this.attribs[name];
        }
        return this;
      }

      // Converts the XML fragment to string

      // `options.pretty` pretty prints the result
      // `options.indent` indentation for pretty print
      // `options.offset` how many indentations to add to every line for pretty print
      // `options.newline` newline sequence for pretty print
      // `options.allowEmpty` do not self close empty element tags
      toString(options) {
        return this.options.writer.element(this, this.options.writer.filterOptions(options));
      }

      // Aliases
      att(name, value) {
        return this.attribute(name, value);
      }

      a(name, value) {
        return this.attribute(name, value);
      }

      // DOM Level 1
      getAttribute(name) {
        if (this.attribs.hasOwnProperty(name)) {
          return this.attribs[name].value;
        } else {
          return null;
        }
      }

      setAttribute(name, value) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      getAttributeNode(name) {
        if (this.attribs.hasOwnProperty(name)) {
          return this.attribs[name];
        } else {
          return null;
        }
      }

      setAttributeNode(newAttr) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      removeAttributeNode(oldAttr) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      getElementsByTagName(name) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      // DOM Level 2
      getAttributeNS(namespaceURI, localName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      setAttributeNS(namespaceURI, qualifiedName, value) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      removeAttributeNS(namespaceURI, localName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      getAttributeNodeNS(namespaceURI, localName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      setAttributeNodeNS(newAttr) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      getElementsByTagNameNS(namespaceURI, localName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      hasAttribute(name) {
        return this.attribs.hasOwnProperty(name);
      }

      hasAttributeNS(namespaceURI, localName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      // DOM Level 3
      setIdAttribute(name, isId) {
        if (this.attribs.hasOwnProperty(name)) {
          return this.attribs[name].isId;
        } else {
          return isId;
        }
      }

      setIdAttributeNS(namespaceURI, localName, isId) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      setIdAttributeNode(idAttr, isId) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      // DOM Level 4
      getElementsByTagName(tagname) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      getElementsByTagNameNS(namespaceURI, localName) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      getElementsByClassName(classNames) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      isEqualNode(node) {
        var i, j, ref;
        if (!super.isEqualNode(node)) {
          return false;
        }
        if (node.namespaceURI !== this.namespaceURI) {
          return false;
        }
        if (node.prefix !== this.prefix) {
          return false;
        }
        if (node.localName !== this.localName) {
          return false;
        }
        if (node.attribs.length !== this.attribs.length) {
          return false;
        }
        for (i = j = 0, ref = this.attribs.length - 1; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
          if (!this.attribs[i].isEqualNode(node.attribs[i])) {
            return false;
          }
        }
        return true;
      }

    };

    // DOM level 1
    Object.defineProperty(XMLElement.prototype, 'tagName', {
      get: function() {
        return this.name;
      }
    });

    // DOM level 4
    Object.defineProperty(XMLElement.prototype, 'namespaceURI', {
      get: function() {
        return '';
      }
    });

    Object.defineProperty(XMLElement.prototype, 'prefix', {
      get: function() {
        return '';
      }
    });

    Object.defineProperty(XMLElement.prototype, 'localName', {
      get: function() {
        return this.name;
      }
    });

    Object.defineProperty(XMLElement.prototype, 'id', {
      get: function() {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }
    });

    Object.defineProperty(XMLElement.prototype, 'className', {
      get: function() {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }
    });

    Object.defineProperty(XMLElement.prototype, 'classList', {
      get: function() {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }
    });

    Object.defineProperty(XMLElement.prototype, 'attributes', {
      get: function() {
        if (!this.attributeMap || !this.attributeMap.nodes) {
          this.attributeMap = new XMLNamedNodeMap(this.attribs);
        }
        return this.attributeMap;
      }
    });

    return XMLElement;

  }).call(this);

}).call(this);

},{"./NodeType":94,"./Utility":95,"./XMLAttribute":97,"./XMLNamedNodeMap":115,"./XMLNode":116}],115:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  // Represents a map of nodes accessed by a string key
  var XMLNamedNodeMap;

  module.exports = XMLNamedNodeMap = (function() {
    class XMLNamedNodeMap {
      // Initializes a new instance of `XMLNamedNodeMap`
      // This is just a wrapper around an ordinary
      // JS object.

      // `nodes` the object containing nodes.
      constructor(nodes) {
        this.nodes = nodes;
      }

      // Creates and returns a deep clone of `this`

      clone() {
        // this class should not be cloned since it wraps
        // around a given object. The calling function should check
        // whether the wrapped object is null and supply a new object
        // (from the clone).
        return this.nodes = null;
      }

      // DOM Level 1
      getNamedItem(name) {
        return this.nodes[name];
      }

      setNamedItem(node) {
        var oldNode;
        oldNode = this.nodes[node.nodeName];
        this.nodes[node.nodeName] = node;
        return oldNode || null;
      }

      removeNamedItem(name) {
        var oldNode;
        oldNode = this.nodes[name];
        delete this.nodes[name];
        return oldNode || null;
      }

      item(index) {
        return this.nodes[Object.keys(this.nodes)[index]] || null;
      }

      // DOM level 2 functions to be implemented later
      getNamedItemNS(namespaceURI, localName) {
        throw new Error("This DOM method is not implemented.");
      }

      setNamedItemNS(node) {
        throw new Error("This DOM method is not implemented.");
      }

      removeNamedItemNS(namespaceURI, localName) {
        throw new Error("This DOM method is not implemented.");
      }

    };

    
    // DOM level 1
    Object.defineProperty(XMLNamedNodeMap.prototype, 'length', {
      get: function() {
        return Object.keys(this.nodes).length || 0;
      }
    });

    return XMLNamedNodeMap;

  }).call(this);

}).call(this);

},{}],116:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var DocumentPosition, NodeType, XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLNamedNodeMap, XMLNode, XMLNodeList, XMLProcessingInstruction, XMLRaw, XMLText, getValue, isEmpty, isFunction, isObject,
    hasProp = {}.hasOwnProperty,
    splice = [].splice;

  ({isObject, isFunction, isEmpty, getValue} = require('./Utility'));

  XMLElement = null;

  XMLCData = null;

  XMLComment = null;

  XMLDeclaration = null;

  XMLDocType = null;

  XMLRaw = null;

  XMLText = null;

  XMLProcessingInstruction = null;

  XMLDummy = null;

  NodeType = null;

  XMLNodeList = null;

  XMLNamedNodeMap = null;

  DocumentPosition = null;

  // Represents a generic XMl element
  module.exports = XMLNode = (function() {
    class XMLNode {
      // Initializes a new instance of `XMLNode`

      // `parent` the parent node
      constructor(parent1) {
        this.parent = parent1;
        if (this.parent) {
          this.options = this.parent.options;
          this.stringify = this.parent.stringify;
        }
        this.value = null;
        this.children = [];
        this.baseURI = null;
        // first execution, load dependencies that are otherwise
        // circular (so we can't load them at the top)
        if (!XMLElement) {
          XMLElement = require('./XMLElement');
          XMLCData = require('./XMLCData');
          XMLComment = require('./XMLComment');
          XMLDeclaration = require('./XMLDeclaration');
          XMLDocType = require('./XMLDocType');
          XMLRaw = require('./XMLRaw');
          XMLText = require('./XMLText');
          XMLProcessingInstruction = require('./XMLProcessingInstruction');
          XMLDummy = require('./XMLDummy');
          NodeType = require('./NodeType');
          XMLNodeList = require('./XMLNodeList');
          XMLNamedNodeMap = require('./XMLNamedNodeMap');
          DocumentPosition = require('./DocumentPosition');
        }
      }

      
      // Sets the parent node of this node and its children recursively

      // `parent` the parent node
      setParent(parent) {
        var child, j, len, ref1, results;
        this.parent = parent;
        if (parent) {
          this.options = parent.options;
          this.stringify = parent.stringify;
        }
        ref1 = this.children;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
          child = ref1[j];
          results.push(child.setParent(this));
        }
        return results;
      }

      // Creates a child element node

      // `name` node name or an object describing the XML tree
      // `attributes` an object containing name/value pairs of attributes
      // `text` element text
      element(name, attributes, text) {
        var childNode, item, j, k, key, lastChild, len, len1, val;
        lastChild = null;
        if (attributes === null && (text == null)) {
          [attributes, text] = [{}, null];
        }
        if (attributes == null) {
          attributes = {};
        }
        attributes = getValue(attributes);
        // swap argument order: text <-> attributes
        if (!isObject(attributes)) {
          [text, attributes] = [attributes, text];
        }
        if (name != null) {
          name = getValue(name);
        }
        // expand if array
        if (Array.isArray(name)) {
          for (j = 0, len = name.length; j < len; j++) {
            item = name[j];
            lastChild = this.element(item);
          }
        // evaluate if function
        } else if (isFunction(name)) {
          lastChild = this.element(name.apply());
        // expand if object
        } else if (isObject(name)) {
          for (key in name) {
            if (!hasProp.call(name, key)) continue;
            val = name[key];
            if (isFunction(val)) {
              // evaluate if function
              val = val.apply();
            }
            // assign attributes
            if (!this.options.ignoreDecorators && this.stringify.convertAttKey && key.indexOf(this.stringify.convertAttKey) === 0) {
              lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
            // skip empty arrays
            } else if (!this.options.separateArrayItems && Array.isArray(val) && isEmpty(val)) {
              lastChild = this.dummy();
            // empty objects produce one node
            } else if (isObject(val) && isEmpty(val)) {
              lastChild = this.element(key);
            // skip null and undefined nodes
            } else if (!this.options.keepNullNodes && (val == null)) {
              lastChild = this.dummy();
            
            // expand list by creating child nodes
            } else if (!this.options.separateArrayItems && Array.isArray(val)) {
              for (k = 0, len1 = val.length; k < len1; k++) {
                item = val[k];
                childNode = {};
                childNode[key] = item;
                lastChild = this.element(childNode);
              }
            
            // expand child nodes under parent
            } else if (isObject(val)) {
              // if the key is #text expand child nodes under this node to support mixed content
              if (!this.options.ignoreDecorators && this.stringify.convertTextKey && key.indexOf(this.stringify.convertTextKey) === 0) {
                lastChild = this.element(val);
              } else {
                lastChild = this.element(key);
                lastChild.element(val);
              }
            } else {
              
              // text node
              lastChild = this.element(key, val);
            }
          }
        // skip null nodes
        } else if (!this.options.keepNullNodes && text === null) {
          lastChild = this.dummy();
        } else {
          // text node
          if (!this.options.ignoreDecorators && this.stringify.convertTextKey && name.indexOf(this.stringify.convertTextKey) === 0) {
            lastChild = this.text(text);
          // cdata node
          } else if (!this.options.ignoreDecorators && this.stringify.convertCDataKey && name.indexOf(this.stringify.convertCDataKey) === 0) {
            lastChild = this.cdata(text);
          // comment node
          } else if (!this.options.ignoreDecorators && this.stringify.convertCommentKey && name.indexOf(this.stringify.convertCommentKey) === 0) {
            lastChild = this.comment(text);
          // raw text node
          } else if (!this.options.ignoreDecorators && this.stringify.convertRawKey && name.indexOf(this.stringify.convertRawKey) === 0) {
            lastChild = this.raw(text);
          // processing instruction
          } else if (!this.options.ignoreDecorators && this.stringify.convertPIKey && name.indexOf(this.stringify.convertPIKey) === 0) {
            lastChild = this.instruction(name.substr(this.stringify.convertPIKey.length), text);
          } else {
            // element node
            lastChild = this.node(name, attributes, text);
          }
        }
        if (lastChild == null) {
          throw new Error("Could not create any elements with: " + name + ". " + this.debugInfo());
        }
        return lastChild;
      }

      // Creates a child element node before the current node

      // `name` node name or an object describing the XML tree
      // `attributes` an object containing name/value pairs of attributes
      // `text` element text
      insertBefore(name, attributes, text) {
        var child, i, newChild, refChild, removed;
        // DOM level 1
        // insertBefore(newChild, refChild) inserts the child node newChild before refChild
        if (name != null ? name.type : void 0) {
          newChild = name;
          refChild = attributes;
          newChild.setParent(this);
          if (refChild) {
            // temporarily remove children starting *with* refChild
            i = children.indexOf(refChild);
            removed = children.splice(i);
            
            // add the new child
            children.push(newChild);
            
            // add back removed children after new child
            Array.prototype.push.apply(children, removed);
          } else {
            children.push(newChild);
          }
          return newChild;
        } else {
          if (this.isRoot) {
            throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
          }
          
          // temporarily remove children starting *with* this
          i = this.parent.children.indexOf(this);
          removed = this.parent.children.splice(i);
          
          // add the new child
          child = this.parent.element(name, attributes, text);
          
          // add back removed children after new child
          Array.prototype.push.apply(this.parent.children, removed);
          return child;
        }
      }

      // Creates a child element node after the current node

      // `name` node name or an object describing the XML tree
      // `attributes` an object containing name/value pairs of attributes
      // `text` element text
      insertAfter(name, attributes, text) {
        var child, i, removed;
        if (this.isRoot) {
          throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
        }
        
        // temporarily remove children starting *after* this
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i + 1);
        
        // add the new child
        child = this.parent.element(name, attributes, text);
        
        // add back removed children after new child
        Array.prototype.push.apply(this.parent.children, removed);
        return child;
      }

      // Deletes a child element node

      remove() {
        var i, ref1;
        if (this.isRoot) {
          throw new Error("Cannot remove the root element. " + this.debugInfo());
        }
        i = this.parent.children.indexOf(this);
        splice.apply(this.parent.children, [i, i - i + 1].concat(ref1 = [])), ref1;
        return this.parent;
      }

      // Creates a node

      // `name` name of the node
      // `attributes` an object containing name/value pairs of attributes
      // `text` element text
      node(name, attributes, text) {
        var child;
        if (name != null) {
          name = getValue(name);
        }
        attributes || (attributes = {});
        attributes = getValue(attributes);
        // swap argument order: text <-> attributes
        if (!isObject(attributes)) {
          [text, attributes] = [attributes, text];
        }
        child = new XMLElement(this, name, attributes);
        if (text != null) {
          child.text(text);
        }
        this.children.push(child);
        return child;
      }

      // Creates a text node

      // `value` element text
      text(value) {
        var child;
        if (isObject(value)) {
          this.element(value);
        }
        child = new XMLText(this, value);
        this.children.push(child);
        return this;
      }

      // Creates a CDATA node

      // `value` element text without CDATA delimiters
      cdata(value) {
        var child;
        child = new XMLCData(this, value);
        this.children.push(child);
        return this;
      }

      // Creates a comment node

      // `value` comment text
      comment(value) {
        var child;
        child = new XMLComment(this, value);
        this.children.push(child);
        return this;
      }

      // Creates a comment node before the current node

      // `value` comment text
      commentBefore(value) {
        var child, i, removed;
        // temporarily remove children starting *with* this
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i);
        // add the new child
        child = this.parent.comment(value);
        // add back removed children after new child
        Array.prototype.push.apply(this.parent.children, removed);
        return this;
      }

      // Creates a comment node after the current node

      // `value` comment text
      commentAfter(value) {
        var child, i, removed;
        // temporarily remove children starting *after* this
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i + 1);
        // add the new child
        child = this.parent.comment(value);
        // add back removed children after new child
        Array.prototype.push.apply(this.parent.children, removed);
        return this;
      }

      // Adds unescaped raw text

      // `value` text
      raw(value) {
        var child;
        child = new XMLRaw(this, value);
        this.children.push(child);
        return this;
      }

      // Adds a dummy node
      dummy() {
        var child;
        child = new XMLDummy(this);
        // Normally when a new node is created it is added to the child node collection.
        // However, dummy nodes are never added to the XML tree. They are created while
        // converting JS objects to XML nodes in order not to break the recursive function
        // chain. They can be thought of as invisible nodes. They can be traversed through
        // by using prev(), next(), up(), etc. functions but they do not exists in the tree.

        // @children.push child
        return child;
      }

      // Adds a processing instruction

      // `target` instruction target
      // `value` instruction value
      instruction(target, value) {
        var insTarget, insValue, instruction, j, len;
        if (target != null) {
          target = getValue(target);
        }
        if (value != null) {
          value = getValue(value);
        }
        if (Array.isArray(target)) { // expand if array
          for (j = 0, len = target.length; j < len; j++) {
            insTarget = target[j];
            this.instruction(insTarget);
          }
        } else if (isObject(target)) { // expand if object
          for (insTarget in target) {
            if (!hasProp.call(target, insTarget)) continue;
            insValue = target[insTarget];
            this.instruction(insTarget, insValue);
          }
        } else {
          if (isFunction(value)) {
            value = value.apply();
          }
          instruction = new XMLProcessingInstruction(this, target, value);
          this.children.push(instruction);
        }
        return this;
      }

      // Creates a processing instruction node before the current node

      // `target` instruction target
      // `value` instruction value
      instructionBefore(target, value) {
        var child, i, removed;
        // temporarily remove children starting *with* this
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i);
        // add the new child
        child = this.parent.instruction(target, value);
        // add back removed children after new child
        Array.prototype.push.apply(this.parent.children, removed);
        return this;
      }

      // Creates a processing instruction node after the current node

      // `target` instruction target
      // `value` instruction value
      instructionAfter(target, value) {
        var child, i, removed;
        // temporarily remove children starting *after* this
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i + 1);
        // add the new child
        child = this.parent.instruction(target, value);
        // add back removed children after new child
        Array.prototype.push.apply(this.parent.children, removed);
        return this;
      }

      // Creates the xml declaration

      // `version` A version number string, e.g. 1.0
      // `encoding` Encoding declaration, e.g. UTF-8
      // `standalone` standalone document declaration: true or false
      declaration(version, encoding, standalone) {
        var doc, xmldec;
        doc = this.document();
        xmldec = new XMLDeclaration(doc, version, encoding, standalone);
        // Replace XML declaration if exists, otherwise insert at top
        if (doc.children.length === 0) {
          doc.children.unshift(xmldec);
        } else if (doc.children[0].type === NodeType.Declaration) {
          doc.children[0] = xmldec;
        } else {
          doc.children.unshift(xmldec);
        }
        return doc.root() || doc;
      }

      // Creates the document type declaration

      // `pubID` the public identifier of the external subset
      // `sysID` the system identifier of the external subset
      dtd(pubID, sysID) {
        var child, doc, doctype, i, j, k, len, len1, ref1, ref2;
        doc = this.document();
        doctype = new XMLDocType(doc, pubID, sysID);
        ref1 = doc.children;
        // Replace DTD if exists
        for (i = j = 0, len = ref1.length; j < len; i = ++j) {
          child = ref1[i];
          if (child.type === NodeType.DocType) {
            doc.children[i] = doctype;
            return doctype;
          }
        }
        ref2 = doc.children;
        // insert before root node if the root node exists
        for (i = k = 0, len1 = ref2.length; k < len1; i = ++k) {
          child = ref2[i];
          if (child.isRoot) {
            doc.children.splice(i, 0, doctype);
            return doctype;
          }
        }
        // otherwise append to end
        doc.children.push(doctype);
        return doctype;
      }

      // Gets the parent node
      up() {
        if (this.isRoot) {
          throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
        }
        return this.parent;
      }

      // Gets the root node
      root() {
        var node;
        node = this;
        while (node) {
          if (node.type === NodeType.Document) {
            return node.rootObject;
          } else if (node.isRoot) {
            return node;
          } else {
            node = node.parent;
          }
        }
      }

      // Gets the node representing the XML document
      document() {
        var node;
        node = this;
        while (node) {
          if (node.type === NodeType.Document) {
            return node;
          } else {
            node = node.parent;
          }
        }
      }

      // Ends the document and converts string
      end(options) {
        return this.document().end(options);
      }

      // Gets the previous node
      prev() {
        var i;
        i = this.parent.children.indexOf(this);
        if (i < 1) {
          throw new Error("Already at the first node. " + this.debugInfo());
        }
        return this.parent.children[i - 1];
      }

      // Gets the next node
      next() {
        var i;
        i = this.parent.children.indexOf(this);
        if (i === -1 || i === this.parent.children.length - 1) {
          throw new Error("Already at the last node. " + this.debugInfo());
        }
        return this.parent.children[i + 1];
      }

      // Imports cloned root from another XML document

      // `doc` the XML document to insert nodes from
      importDocument(doc) {
        var child, clonedRoot, j, len, ref1;
        clonedRoot = doc.root().clone();
        clonedRoot.parent = this;
        clonedRoot.isRoot = false;
        this.children.push(clonedRoot);
        // set properties if imported element becomes the root node
        if (this.type === NodeType.Document) {
          clonedRoot.isRoot = true;
          clonedRoot.documentObject = this;
          this.rootObject = clonedRoot;
          // set dtd name
          if (this.children) {
            ref1 = this.children;
            for (j = 0, len = ref1.length; j < len; j++) {
              child = ref1[j];
              if (child.type === NodeType.DocType) {
                child.name = clonedRoot.name;
                break;
              }
            }
          }
        }
        return this;
      }

      
      // Returns debug string for this node
      debugInfo(name) {
        var ref1, ref2;
        name = name || this.name;
        if ((name == null) && !((ref1 = this.parent) != null ? ref1.name : void 0)) {
          return "";
        } else if (name == null) {
          return "parent: <" + this.parent.name + ">";
        } else if (!((ref2 = this.parent) != null ? ref2.name : void 0)) {
          return "node: <" + name + ">";
        } else {
          return "node: <" + name + ">, parent: <" + this.parent.name + ">";
        }
      }

      // Aliases
      ele(name, attributes, text) {
        return this.element(name, attributes, text);
      }

      nod(name, attributes, text) {
        return this.node(name, attributes, text);
      }

      txt(value) {
        return this.text(value);
      }

      dat(value) {
        return this.cdata(value);
      }

      com(value) {
        return this.comment(value);
      }

      ins(target, value) {
        return this.instruction(target, value);
      }

      doc() {
        return this.document();
      }

      dec(version, encoding, standalone) {
        return this.declaration(version, encoding, standalone);
      }

      e(name, attributes, text) {
        return this.element(name, attributes, text);
      }

      n(name, attributes, text) {
        return this.node(name, attributes, text);
      }

      t(value) {
        return this.text(value);
      }

      d(value) {
        return this.cdata(value);
      }

      c(value) {
        return this.comment(value);
      }

      r(value) {
        return this.raw(value);
      }

      i(target, value) {
        return this.instruction(target, value);
      }

      u() {
        return this.up();
      }

      // can be deprecated in a future release
      importXMLBuilder(doc) {
        return this.importDocument(doc);
      }

      // Adds or modifies an attribute.

      // `name` attribute name
      // `value` attribute value
      attribute(name, value) {
        throw new Error("attribute() applies to element nodes only.");
      }

      att(name, value) {
        return this.attribute(name, value);
      }

      a(name, value) {
        return this.attribute(name, value);
      }

      // Removes an attribute

      // `name` attribute name
      removeAttribute(name) {
        throw new Error("attribute() applies to element nodes only.");
      }

      // DOM level 1 functions to be implemented later
      replaceChild(newChild, oldChild) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      removeChild(oldChild) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      appendChild(newChild) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      hasChildNodes() {
        return this.children.length !== 0;
      }

      cloneNode(deep) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      normalize() {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      // DOM level 2
      isSupported(feature, version) {
        return true;
      }

      hasAttributes() {
        return this.attribs.length !== 0;
      }

      // DOM level 3 functions to be implemented later
      compareDocumentPosition(other) {
        var ref, res;
        ref = this;
        if (ref === other) {
          return 0;
        } else if (this.document() !== other.document()) {
          res = DocumentPosition.Disconnected | DocumentPosition.ImplementationSpecific;
          if (Math.random() < 0.5) {
            res |= DocumentPosition.Preceding;
          } else {
            res |= DocumentPosition.Following;
          }
          return res;
        } else if (ref.isAncestor(other)) {
          return DocumentPosition.Contains | DocumentPosition.Preceding;
        } else if (ref.isDescendant(other)) {
          return DocumentPosition.Contains | DocumentPosition.Following;
        } else if (ref.isPreceding(other)) {
          return DocumentPosition.Preceding;
        } else {
          return DocumentPosition.Following;
        }
      }

      isSameNode(other) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      lookupPrefix(namespaceURI) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      isDefaultNamespace(namespaceURI) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      lookupNamespaceURI(prefix) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      isEqualNode(node) {
        var i, j, ref1;
        if (node.nodeType !== this.nodeType) {
          return false;
        }
        if (node.children.length !== this.children.length) {
          return false;
        }
        for (i = j = 0, ref1 = this.children.length - 1; (0 <= ref1 ? j <= ref1 : j >= ref1); i = 0 <= ref1 ? ++j : --j) {
          if (!this.children[i].isEqualNode(node.children[i])) {
            return false;
          }
        }
        return true;
      }

      getFeature(feature, version) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      setUserData(key, data, handler) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      getUserData(key) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      // Returns true if other is an inclusive descendant of node,
      // and false otherwise.
      contains(other) {
        if (!other) {
          return false;
        }
        return other === this || this.isDescendant(other);
      }

      // An object A is called a descendant of an object B, if either A is 
      // a child of B or A is a child of an object C that is a descendant of B.
      isDescendant(node) {
        var child, isDescendantChild, j, len, ref1;
        ref1 = this.children;
        for (j = 0, len = ref1.length; j < len; j++) {
          child = ref1[j];
          if (node === child) {
            return true;
          }
          isDescendantChild = child.isDescendant(node);
          if (isDescendantChild) {
            return true;
          }
        }
        return false;
      }

      // An object A is called an ancestor of an object B if and only if
      // B is a descendant of A.
      isAncestor(node) {
        return node.isDescendant(this);
      }

      // An object A is preceding an object B if A and B are in the 
      // same tree and A comes before B in tree order.
      isPreceding(node) {
        var nodePos, thisPos;
        nodePos = this.treePosition(node);
        thisPos = this.treePosition(this);
        if (nodePos === -1 || thisPos === -1) {
          return false;
        } else {
          return nodePos < thisPos;
        }
      }

      // An object A is folllowing an object B if A and B are in the 
      // same tree and A comes after B in tree order.
      isFollowing(node) {
        var nodePos, thisPos;
        nodePos = this.treePosition(node);
        thisPos = this.treePosition(this);
        if (nodePos === -1 || thisPos === -1) {
          return false;
        } else {
          return nodePos > thisPos;
        }
      }

      // Returns the preorder position of the given node in the tree, or -1
      // if the node is not in the tree.
      treePosition(node) {
        var found, pos;
        pos = 0;
        found = false;
        this.foreachTreeNode(this.document(), function(childNode) {
          pos++;
          if (!found && childNode === node) {
            return found = true;
          }
        });
        if (found) {
          return pos;
        } else {
          return -1;
        }
      }

      
      // Depth-first preorder traversal through the XML tree
      foreachTreeNode(node, func) {
        var child, j, len, ref1, res;
        node || (node = this.document());
        ref1 = node.children;
        for (j = 0, len = ref1.length; j < len; j++) {
          child = ref1[j];
          if (res = func(child)) {
            return res;
          } else {
            res = this.foreachTreeNode(child, func);
            if (res) {
              return res;
            }
          }
        }
      }

    };

    // DOM level 1
    Object.defineProperty(XMLNode.prototype, 'nodeName', {
      get: function() {
        return this.name;
      }
    });

    Object.defineProperty(XMLNode.prototype, 'nodeType', {
      get: function() {
        return this.type;
      }
    });

    Object.defineProperty(XMLNode.prototype, 'nodeValue', {
      get: function() {
        return this.value;
      }
    });

    Object.defineProperty(XMLNode.prototype, 'parentNode', {
      get: function() {
        return this.parent;
      }
    });

    Object.defineProperty(XMLNode.prototype, 'childNodes', {
      get: function() {
        if (!this.childNodeList || !this.childNodeList.nodes) {
          this.childNodeList = new XMLNodeList(this.children);
        }
        return this.childNodeList;
      }
    });

    Object.defineProperty(XMLNode.prototype, 'firstChild', {
      get: function() {
        return this.children[0] || null;
      }
    });

    Object.defineProperty(XMLNode.prototype, 'lastChild', {
      get: function() {
        return this.children[this.children.length - 1] || null;
      }
    });

    Object.defineProperty(XMLNode.prototype, 'previousSibling', {
      get: function() {
        var i;
        i = this.parent.children.indexOf(this);
        return this.parent.children[i - 1] || null;
      }
    });

    Object.defineProperty(XMLNode.prototype, 'nextSibling', {
      get: function() {
        var i;
        i = this.parent.children.indexOf(this);
        return this.parent.children[i + 1] || null;
      }
    });

    Object.defineProperty(XMLNode.prototype, 'ownerDocument', {
      get: function() {
        return this.document() || null;
      }
    });

    // DOM level 3
    Object.defineProperty(XMLNode.prototype, 'textContent', {
      get: function() {
        var child, j, len, ref1, str;
        if (this.nodeType === NodeType.Element || this.nodeType === NodeType.DocumentFragment) {
          str = '';
          ref1 = this.children;
          for (j = 0, len = ref1.length; j < len; j++) {
            child = ref1[j];
            if (child.textContent) {
              str += child.textContent;
            }
          }
          return str;
        } else {
          return null;
        }
      },
      set: function(value) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }
    });

    return XMLNode;

  }).call(this);

}).call(this);

},{"./DocumentPosition":93,"./NodeType":94,"./Utility":95,"./XMLCData":98,"./XMLComment":100,"./XMLDeclaration":109,"./XMLDocType":110,"./XMLDummy":113,"./XMLElement":114,"./XMLNamedNodeMap":115,"./XMLNodeList":117,"./XMLProcessingInstruction":118,"./XMLRaw":119,"./XMLText":123}],117:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  // Represents a list of nodes
  var XMLNodeList;

  module.exports = XMLNodeList = (function() {
    class XMLNodeList {
      // Initializes a new instance of `XMLNodeList`
      // This is just a wrapper around an ordinary
      // JS array.

      // `nodes` the array containing nodes.
      constructor(nodes) {
        this.nodes = nodes;
      }

      // Creates and returns a deep clone of `this`

      clone() {
        // this class should not be cloned since it wraps
        // around a given array. The calling function should check
        // whether the wrapped array is null and supply a new array
        // (from the clone).
        return this.nodes = null;
      }

      // DOM Level 1
      item(index) {
        return this.nodes[index] || null;
      }

    };

    // DOM level 1
    Object.defineProperty(XMLNodeList.prototype, 'length', {
      get: function() {
        return this.nodes.length || 0;
      }
    });

    return XMLNodeList;

  }).call(this);

}).call(this);

},{}],118:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLCharacterData, XMLProcessingInstruction;

  NodeType = require('./NodeType');

  XMLCharacterData = require('./XMLCharacterData');

  // Represents a processing instruction
  module.exports = XMLProcessingInstruction = class XMLProcessingInstruction extends XMLCharacterData {
    // Initializes a new instance of `XMLProcessingInstruction`

    // `parent` the parent node
    // `target` instruction target
    // `value` instruction value
    constructor(parent, target, value) {
      super(parent);
      if (target == null) {
        throw new Error("Missing instruction target. " + this.debugInfo());
      }
      this.type = NodeType.ProcessingInstruction;
      this.target = this.stringify.insTarget(target);
      this.name = this.target;
      if (value) {
        this.value = this.stringify.insValue(value);
      }
    }

    // Creates and returns a deep clone of `this`
    clone() {
      return Object.create(this);
    }

    // Converts the XML fragment to string

    // `options.pretty` pretty prints the result
    // `options.indent` indentation for pretty print
    // `options.offset` how many indentations to add to every line for pretty print
    // `options.newline` newline sequence for pretty print
    toString(options) {
      return this.options.writer.processingInstruction(this, this.options.writer.filterOptions(options));
    }

    isEqualNode(node) {
      if (!super.isEqualNode(node)) {
        return false;
      }
      if (node.target !== this.target) {
        return false;
      }
      return true;
    }

  };

}).call(this);

},{"./NodeType":94,"./XMLCharacterData":99}],119:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLNode, XMLRaw;

  NodeType = require('./NodeType');

  XMLNode = require('./XMLNode');

  // Represents a  raw node
  module.exports = XMLRaw = class XMLRaw extends XMLNode {
    // Initializes a new instance of `XMLRaw`

    // `text` raw text
    constructor(parent, text) {
      super(parent);
      if (text == null) {
        throw new Error("Missing raw text. " + this.debugInfo());
      }
      this.type = NodeType.Raw;
      this.value = this.stringify.raw(text);
    }

    // Creates and returns a deep clone of `this`
    clone() {
      return Object.create(this);
    }

    // Converts the XML fragment to string

    // `options.pretty` pretty prints the result
    // `options.indent` indentation for pretty print
    // `options.offset` how many indentations to add to every line for pretty print
    // `options.newline` newline sequence for pretty print
    toString(options) {
      return this.options.writer.raw(this, this.options.writer.filterOptions(options));
    }

  };

}).call(this);

},{"./NodeType":94,"./XMLNode":116}],120:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, WriterState, XMLStreamWriter, XMLWriterBase,
    hasProp = {}.hasOwnProperty;

  NodeType = require('./NodeType');

  XMLWriterBase = require('./XMLWriterBase');

  WriterState = require('./WriterState');

  // Prints XML nodes to a stream
  module.exports = XMLStreamWriter = class XMLStreamWriter extends XMLWriterBase {
    // Initializes a new instance of `XMLStreamWriter`

    // `stream` output stream
    // `options.pretty` pretty prints the result
    // `options.indent` indentation string
    // `options.newline` newline sequence
    // `options.offset` a fixed number of indentations to add to every line
    // `options.allowEmpty` do not self close empty element tags
    // 'options.dontPrettyTextNodes' if any text is present in node, don't indent or LF
    // `options.spaceBeforeSlash` add a space before the closing slash of empty elements
    constructor(stream, options) {
      super(options);
      this.stream = stream;
    }

    endline(node, options, level) {
      if (node.isLastRootNode && options.state === WriterState.CloseTag) {
        return '';
      } else {
        return super.endline(node, options, level);
      }
    }

    document(doc, options) {
      var child, i, j, k, len1, len2, ref, ref1, results;
      ref = doc.children;
      // set a flag so that we don't insert a newline after the last root level node 
      for (i = j = 0, len1 = ref.length; j < len1; i = ++j) {
        child = ref[i];
        child.isLastRootNode = i === doc.children.length - 1;
      }
      options = this.filterOptions(options);
      ref1 = doc.children;
      results = [];
      for (k = 0, len2 = ref1.length; k < len2; k++) {
        child = ref1[k];
        results.push(this.writeChildNode(child, options, 0));
      }
      return results;
    }

    cdata(node, options, level) {
      return this.stream.write(super.cdata(node, options, level));
    }

    comment(node, options, level) {
      return this.stream.write(super.comment(node, options, level));
    }

    declaration(node, options, level) {
      return this.stream.write(super.declaration(node, options, level));
    }

    docType(node, options, level) {
      var child, j, len1, ref;
      level || (level = 0);
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      this.stream.write(this.indent(node, options, level));
      this.stream.write('<!DOCTYPE ' + node.root().name);
      // external identifier
      if (node.pubID && node.sysID) {
        this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
      } else if (node.sysID) {
        this.stream.write(' SYSTEM "' + node.sysID + '"');
      }
      // internal subset
      if (node.children.length > 0) {
        this.stream.write(' [');
        this.stream.write(this.endline(node, options, level));
        options.state = WriterState.InsideTag;
        ref = node.children;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          child = ref[j];
          this.writeChildNode(child, options, level + 1);
        }
        options.state = WriterState.CloseTag;
        this.stream.write(']');
      }
      // close tag
      options.state = WriterState.CloseTag;
      this.stream.write(options.spaceBeforeSlash + '>');
      this.stream.write(this.endline(node, options, level));
      options.state = WriterState.None;
      return this.closeNode(node, options, level);
    }

    element(node, options, level) {
      var att, attLen, child, childNodeCount, firstChildNode, j, len, len1, name, prettySuppressed, r, ratt, ref, ref1, ref2, rline;
      level || (level = 0);
      // open tag
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level) + '<' + node.name;
      // attributes
      if (options.pretty && options.width > 0) {
        len = r.length;
        ref = node.attribs;
        for (name in ref) {
          if (!hasProp.call(ref, name)) continue;
          att = ref[name];
          ratt = this.attribute(att, options, level);
          attLen = ratt.length;
          if (len + attLen > options.width) {
            rline = this.indent(node, options, level + 1) + ratt;
            r += this.endline(node, options, level) + rline;
            len = rline.length;
          } else {
            rline = ' ' + ratt;
            r += rline;
            len += rline.length;
          }
        }
      } else {
        ref1 = node.attribs;
        for (name in ref1) {
          if (!hasProp.call(ref1, name)) continue;
          att = ref1[name];
          r += this.attribute(att, options, level);
        }
      }
      this.stream.write(r);
      childNodeCount = node.children.length;
      firstChildNode = childNodeCount === 0 ? null : node.children[0];
      if (childNodeCount === 0 || node.children.every(function(e) {
        return (e.type === NodeType.Text || e.type === NodeType.Raw) && e.value === '';
      })) {
        // empty element
        if (options.allowEmpty) {
          this.stream.write('>');
          options.state = WriterState.CloseTag;
          this.stream.write('</' + node.name + '>');
        } else {
          options.state = WriterState.CloseTag;
          this.stream.write(options.spaceBeforeSlash + '/>');
        }
      } else if (options.pretty && childNodeCount === 1 && (firstChildNode.type === NodeType.Text || firstChildNode.type === NodeType.Raw) && (firstChildNode.value != null)) {
        // do not indent text-only nodes
        this.stream.write('>');
        options.state = WriterState.InsideTag;
        options.suppressPrettyCount++;
        prettySuppressed = true;
        this.writeChildNode(firstChildNode, options, level + 1);
        options.suppressPrettyCount--;
        prettySuppressed = false;
        options.state = WriterState.CloseTag;
        this.stream.write('</' + node.name + '>');
      } else {
        this.stream.write('>' + this.endline(node, options, level));
        options.state = WriterState.InsideTag;
        ref2 = node.children;
        // inner tags
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          child = ref2[j];
          this.writeChildNode(child, options, level + 1);
        }
        // close tag
        options.state = WriterState.CloseTag;
        this.stream.write(this.indent(node, options, level) + '</' + node.name + '>');
      }
      this.stream.write(this.endline(node, options, level));
      options.state = WriterState.None;
      return this.closeNode(node, options, level);
    }

    processingInstruction(node, options, level) {
      return this.stream.write(super.processingInstruction(node, options, level));
    }

    raw(node, options, level) {
      return this.stream.write(super.raw(node, options, level));
    }

    text(node, options, level) {
      return this.stream.write(super.text(node, options, level));
    }

    dtdAttList(node, options, level) {
      return this.stream.write(super.dtdAttList(node, options, level));
    }

    dtdElement(node, options, level) {
      return this.stream.write(super.dtdElement(node, options, level));
    }

    dtdEntity(node, options, level) {
      return this.stream.write(super.dtdEntity(node, options, level));
    }

    dtdNotation(node, options, level) {
      return this.stream.write(super.dtdNotation(node, options, level));
    }

  };

}).call(this);

},{"./NodeType":94,"./WriterState":96,"./XMLWriterBase":124}],121:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var XMLStringWriter, XMLWriterBase;

  XMLWriterBase = require('./XMLWriterBase');

  // Prints XML nodes as plain text
  module.exports = XMLStringWriter = class XMLStringWriter extends XMLWriterBase {
    // Initializes a new instance of `XMLStringWriter`

    // `options.pretty` pretty prints the result
    // `options.indent` indentation string
    // `options.newline` newline sequence
    // `options.offset` a fixed number of indentations to add to every line
    // `options.allowEmpty` do not self close empty element tags
    // 'options.dontPrettyTextNodes' if any text is present in node, don't indent or LF
    // `options.spaceBeforeSlash` add a space before the closing slash of empty elements
    constructor(options) {
      super(options);
    }

    document(doc, options) {
      var child, i, len, r, ref;
      options = this.filterOptions(options);
      r = '';
      ref = doc.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        r += this.writeChildNode(child, options, 0);
      }
      // remove trailing newline
      if (options.pretty && r.slice(-options.newline.length) === options.newline) {
        r = r.slice(0, -options.newline.length);
      }
      return r;
    }

  };

}).call(this);

},{"./XMLWriterBase":124}],122:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  // Converts values to strings
  var XMLStringifier,
    hasProp = {}.hasOwnProperty;

  module.exports = XMLStringifier = (function() {
    class XMLStringifier {
      // Initializes a new instance of `XMLStringifier`

      // `options.version` The version number string of the XML spec to validate against, e.g. 1.0
      // `options.noDoubleEncoding` whether existing html entities are encoded: true or false
      // `options.stringify` a set of functions to use for converting values to strings
      // `options.noValidation` whether values will be validated and escaped or returned as is
      constructor(options) {
        var key, ref, value;
        // Checks whether the given string contains legal characters
        // Fails with an exception on error

        // `str` the string to check
        this.assertLegalChar = this.assertLegalChar.bind(this);
        // Checks whether the given string contains legal characters for a name
        // Fails with an exception on error

        // `str` the string to check
        this.assertLegalName = this.assertLegalName.bind(this);
        options || (options = {});
        this.options = options;
        if (!this.options.version) {
          this.options.version = '1.0';
        }
        ref = options.stringify || {};
        for (key in ref) {
          if (!hasProp.call(ref, key)) continue;
          value = ref[key];
          this[key] = value;
        }
      }

      // Defaults
      name(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalName('' + val || '');
      }

      text(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalChar(this.textEscape('' + val || ''));
      }

      cdata(val) {
        if (this.options.noValidation) {
          return val;
        }
        val = '' + val || '';
        val = val.replace(']]>', ']]]]><![CDATA[>');
        return this.assertLegalChar(val);
      }

      comment(val) {
        if (this.options.noValidation) {
          return val;
        }
        val = '' + val || '';
        if (val.match(/--/)) {
          throw new Error("Comment text cannot contain double-hypen: " + val);
        }
        return this.assertLegalChar(val);
      }

      raw(val) {
        if (this.options.noValidation) {
          return val;
        }
        return '' + val || '';
      }

      attValue(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalChar(this.attEscape(val = '' + val || ''));
      }

      insTarget(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalChar('' + val || '');
      }

      insValue(val) {
        if (this.options.noValidation) {
          return val;
        }
        val = '' + val || '';
        if (val.match(/\?>/)) {
          throw new Error("Invalid processing instruction value: " + val);
        }
        return this.assertLegalChar(val);
      }

      xmlVersion(val) {
        if (this.options.noValidation) {
          return val;
        }
        val = '' + val || '';
        if (!val.match(/1\.[0-9]+/)) {
          throw new Error("Invalid version number: " + val);
        }
        return val;
      }

      xmlEncoding(val) {
        if (this.options.noValidation) {
          return val;
        }
        val = '' + val || '';
        if (!val.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)) {
          throw new Error("Invalid encoding: " + val);
        }
        return this.assertLegalChar(val);
      }

      xmlStandalone(val) {
        if (this.options.noValidation) {
          return val;
        }
        if (val) {
          return "yes";
        } else {
          return "no";
        }
      }

      dtdPubID(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalChar('' + val || '');
      }

      dtdSysID(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalChar('' + val || '');
      }

      dtdElementValue(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalChar('' + val || '');
      }

      dtdAttType(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalChar('' + val || '');
      }

      dtdAttDefault(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalChar('' + val || '');
      }

      dtdEntityValue(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalChar('' + val || '');
      }

      dtdNData(val) {
        if (this.options.noValidation) {
          return val;
        }
        return this.assertLegalChar('' + val || '');
      }

      assertLegalChar(str) {
        var regex, res;
        if (this.options.noValidation) {
          return str;
        }
        regex = '';
        if (this.options.version === '1.0') {
          // Valid characters from https://www.w3.org/TR/xml/#charsets
          // any Unicode character, excluding the surrogate blocks, FFFE, and FFFF.
          // #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
          // This ES5 compatible Regexp has been generated using the "regenerate" NPM module:
          //   let xml_10_InvalidChars = regenerate()
          //     .addRange(0x0000, 0x0008)
          //     .add(0x000B, 0x000C)
          //     .addRange(0x000E, 0x001F)
          //     .addRange(0xD800, 0xDFFF)
          //     .addRange(0xFFFE, 0xFFFF)
          regex = /[\0-\x08\x0B\f\x0E-\x1F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
          if (res = str.match(regex)) {
            throw new Error(`Invalid character in string: ${str} at index ${res.index}`);
          }
        } else if (this.options.version === '1.1') {
          // Valid characters from https://www.w3.org/TR/xml11/#charsets
          // any Unicode character, excluding the surrogate blocks, FFFE, and FFFF.
          // [#x1-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
          // This ES5 compatible Regexp has been generated using the "regenerate" NPM module:
          //   let xml_11_InvalidChars = regenerate()
          //     .add(0x0000)
          //     .addRange(0xD800, 0xDFFF)
          //     .addRange(0xFFFE, 0xFFFF)
          regex = /[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
          if (res = str.match(regex)) {
            throw new Error(`Invalid character in string: ${str} at index ${res.index}`);
          }
        }
        return str;
      }

      assertLegalName(str) {
        var regex;
        if (this.options.noValidation) {
          return str;
        }
        this.assertLegalChar(str);
        regex = /^([:A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])([\x2D\.0-:A-Z_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;
        if (!str.match(regex)) {
          throw new Error("Invalid character in name");
        }
        return str;
      }

      // Escapes special characters in text

      // See http://www.w3.org/TR/2000/WD-xml-c14n-20000119.html#charescaping

      // `str` the string to escape
      textEscape(str) {
        var ampregex;
        if (this.options.noValidation) {
          return str;
        }
        ampregex = this.options.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
        return str.replace(ampregex, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#xD;');
      }

      // Escapes special characters in attribute values

      // See http://www.w3.org/TR/2000/WD-xml-c14n-20000119.html#charescaping

      // `str` the string to escape
      attEscape(str) {
        var ampregex;
        if (this.options.noValidation) {
          return str;
        }
        ampregex = this.options.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
        return str.replace(ampregex, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/\t/g, '&#x9;').replace(/\n/g, '&#xA;').replace(/\r/g, '&#xD;');
      }

    };

    // strings to match while converting from JS objects
    XMLStringifier.prototype.convertAttKey = '@';

    XMLStringifier.prototype.convertPIKey = '?';

    XMLStringifier.prototype.convertTextKey = '#text';

    XMLStringifier.prototype.convertCDataKey = '#cdata';

    XMLStringifier.prototype.convertCommentKey = '#comment';

    XMLStringifier.prototype.convertRawKey = '#raw';

    return XMLStringifier;

  }).call(this);

}).call(this);

},{}],123:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, XMLCharacterData, XMLText;

  NodeType = require('./NodeType');

  XMLCharacterData = require('./XMLCharacterData');

  // Represents a text node
  module.exports = XMLText = (function() {
    class XMLText extends XMLCharacterData {
      // Initializes a new instance of `XMLText`

      // `text` element text
      constructor(parent, text) {
        super(parent);
        if (text == null) {
          throw new Error("Missing element text. " + this.debugInfo());
        }
        this.name = "#text";
        this.type = NodeType.Text;
        this.value = this.stringify.text(text);
      }

      // Creates and returns a deep clone of `this`
      clone() {
        return Object.create(this);
      }

      // Converts the XML fragment to string

      // `options.pretty` pretty prints the result
      // `options.indent` indentation for pretty print
      // `options.offset` how many indentations to add to every line for pretty print
      // `options.newline` newline sequence for pretty print
      toString(options) {
        return this.options.writer.text(this, this.options.writer.filterOptions(options));
      }

      // DOM level 1 functions to be implemented later
      splitText(offset) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

      // DOM level 3 functions to be implemented later
      replaceWholeText(content) {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }

    };

    // DOM level 3
    Object.defineProperty(XMLText.prototype, 'isElementContentWhitespace', {
      get: function() {
        throw new Error("This DOM method is not implemented." + this.debugInfo());
      }
    });

    Object.defineProperty(XMLText.prototype, 'wholeText', {
      get: function() {
        var next, prev, str;
        str = '';
        prev = this.previousSibling;
        while (prev) {
          str = prev.data + str;
          prev = prev.previousSibling;
        }
        str += this.data;
        next = this.nextSibling;
        while (next) {
          str = str + next.data;
          next = next.nextSibling;
        }
        return str;
      }
    });

    return XMLText;

  }).call(this);

}).call(this);

},{"./NodeType":94,"./XMLCharacterData":99}],124:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, WriterState, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLProcessingInstruction, XMLRaw, XMLText, XMLWriterBase, assign,
    hasProp = {}.hasOwnProperty;

  ({assign} = require('./Utility'));

  NodeType = require('./NodeType');

  XMLDeclaration = require('./XMLDeclaration');

  XMLDocType = require('./XMLDocType');

  XMLCData = require('./XMLCData');

  XMLComment = require('./XMLComment');

  XMLElement = require('./XMLElement');

  XMLRaw = require('./XMLRaw');

  XMLText = require('./XMLText');

  XMLProcessingInstruction = require('./XMLProcessingInstruction');

  XMLDummy = require('./XMLDummy');

  XMLDTDAttList = require('./XMLDTDAttList');

  XMLDTDElement = require('./XMLDTDElement');

  XMLDTDEntity = require('./XMLDTDEntity');

  XMLDTDNotation = require('./XMLDTDNotation');

  WriterState = require('./WriterState');

  // Base class for XML writers
  module.exports = XMLWriterBase = class XMLWriterBase {
    // Initializes a new instance of `XMLWriterBase`

    // `options.pretty` pretty prints the result
    // `options.indent` indentation string
    // `options.newline` newline sequence
    // `options.offset` a fixed number of indentations to add to every line
    // `options.width` maximum column width
    // `options.allowEmpty` do not self close empty element tags
    // 'options.dontPrettyTextNodes' if any text is present in node, don't indent or LF
    // `options.spaceBeforeSlash` add a space before the closing slash of empty elements
    constructor(options) {
      var key, ref, value;
      options || (options = {});
      this.options = options;
      ref = options.writer || {};
      for (key in ref) {
        if (!hasProp.call(ref, key)) continue;
        value = ref[key];
        this["_" + key] = this[key];
        this[key] = value;
      }
    }

    // Filters writer options and provides defaults

    // `options` writer options
    filterOptions(options) {
      var filteredOptions, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
      options || (options = {});
      options = assign({}, this.options, options);
      filteredOptions = {
        writer: this
      };
      filteredOptions.pretty = options.pretty || false;
      filteredOptions.allowEmpty = options.allowEmpty || false;
      filteredOptions.indent = (ref = options.indent) != null ? ref : '  ';
      filteredOptions.newline = (ref1 = options.newline) != null ? ref1 : '\n';
      filteredOptions.offset = (ref2 = options.offset) != null ? ref2 : 0;
      filteredOptions.width = (ref3 = options.width) != null ? ref3 : 0;
      filteredOptions.dontPrettyTextNodes = (ref4 = (ref5 = options.dontPrettyTextNodes) != null ? ref5 : options.dontprettytextnodes) != null ? ref4 : 0;
      filteredOptions.spaceBeforeSlash = (ref6 = (ref7 = options.spaceBeforeSlash) != null ? ref7 : options.spacebeforeslash) != null ? ref6 : '';
      if (filteredOptions.spaceBeforeSlash === true) {
        filteredOptions.spaceBeforeSlash = ' ';
      }
      filteredOptions.suppressPrettyCount = 0;
      filteredOptions.user = {};
      filteredOptions.state = WriterState.None;
      return filteredOptions;
    }

    // Returns the indentation string for the current level

    // `node` current node
    // `options` writer options
    // `level` current indentation level
    indent(node, options, level) {
      var indentLevel;
      if (!options.pretty || options.suppressPrettyCount) {
        return '';
      } else if (options.pretty) {
        indentLevel = (level || 0) + options.offset + 1;
        if (indentLevel > 0) {
          return new Array(indentLevel).join(options.indent);
        }
      }
      return '';
    }

    // Returns the newline string

    // `node` current node
    // `options` writer options
    // `level` current indentation level
    endline(node, options, level) {
      if (!options.pretty || options.suppressPrettyCount) {
        return '';
      } else {
        return options.newline;
      }
    }

    attribute(att, options, level) {
      var r;
      this.openAttribute(att, options, level);
      if (options.pretty && options.width > 0) {
        r = att.name + '="' + att.value + '"';
      } else {
        r = ' ' + att.name + '="' + att.value + '"';
      }
      this.closeAttribute(att, options, level);
      return r;
    }

    cdata(node, options, level) {
      var r;
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level) + '<![CDATA[';
      options.state = WriterState.InsideTag;
      r += node.value;
      options.state = WriterState.CloseTag;
      r += ']]>' + this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    comment(node, options, level) {
      var r;
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level) + '<!-- ';
      options.state = WriterState.InsideTag;
      r += node.value;
      options.state = WriterState.CloseTag;
      r += ' -->' + this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    declaration(node, options, level) {
      var r;
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level) + '<?xml';
      options.state = WriterState.InsideTag;
      r += ' version="' + node.version + '"';
      if (node.encoding != null) {
        r += ' encoding="' + node.encoding + '"';
      }
      if (node.standalone != null) {
        r += ' standalone="' + node.standalone + '"';
      }
      options.state = WriterState.CloseTag;
      r += options.spaceBeforeSlash + '?>';
      r += this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    docType(node, options, level) {
      var child, i, len1, r, ref;
      level || (level = 0);
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level);
      r += '<!DOCTYPE ' + node.root().name;
      // external identifier
      if (node.pubID && node.sysID) {
        r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
      } else if (node.sysID) {
        r += ' SYSTEM "' + node.sysID + '"';
      }
      // internal subset
      if (node.children.length > 0) {
        r += ' [';
        r += this.endline(node, options, level);
        options.state = WriterState.InsideTag;
        ref = node.children;
        for (i = 0, len1 = ref.length; i < len1; i++) {
          child = ref[i];
          r += this.writeChildNode(child, options, level + 1);
        }
        options.state = WriterState.CloseTag;
        r += ']';
      }
      // close tag
      options.state = WriterState.CloseTag;
      r += options.spaceBeforeSlash + '>';
      r += this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    element(node, options, level) {
      var att, attLen, child, childNodeCount, firstChildNode, i, j, len, len1, len2, name, prettySuppressed, r, ratt, ref, ref1, ref2, ref3, rline;
      level || (level = 0);
      prettySuppressed = false;
      // open tag
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level) + '<' + node.name;
      // attributes
      if (options.pretty && options.width > 0) {
        len = r.length;
        ref = node.attribs;
        for (name in ref) {
          if (!hasProp.call(ref, name)) continue;
          att = ref[name];
          ratt = this.attribute(att, options, level);
          attLen = ratt.length;
          if (len + attLen > options.width) {
            rline = this.indent(node, options, level + 1) + ratt;
            r += this.endline(node, options, level) + rline;
            len = rline.length;
          } else {
            rline = ' ' + ratt;
            r += rline;
            len += rline.length;
          }
        }
      } else {
        ref1 = node.attribs;
        for (name in ref1) {
          if (!hasProp.call(ref1, name)) continue;
          att = ref1[name];
          r += this.attribute(att, options, level);
        }
      }
      childNodeCount = node.children.length;
      firstChildNode = childNodeCount === 0 ? null : node.children[0];
      if (childNodeCount === 0 || node.children.every(function(e) {
        return (e.type === NodeType.Text || e.type === NodeType.Raw) && e.value === '';
      })) {
        // empty element
        if (options.allowEmpty) {
          r += '>';
          options.state = WriterState.CloseTag;
          r += '</' + node.name + '>' + this.endline(node, options, level);
        } else {
          options.state = WriterState.CloseTag;
          r += options.spaceBeforeSlash + '/>' + this.endline(node, options, level);
        }
      } else if (options.pretty && childNodeCount === 1 && (firstChildNode.type === NodeType.Text || firstChildNode.type === NodeType.Raw) && (firstChildNode.value != null)) {
        // do not indent text-only nodes
        r += '>';
        options.state = WriterState.InsideTag;
        options.suppressPrettyCount++;
        prettySuppressed = true;
        r += this.writeChildNode(firstChildNode, options, level + 1);
        options.suppressPrettyCount--;
        prettySuppressed = false;
        options.state = WriterState.CloseTag;
        r += '</' + node.name + '>' + this.endline(node, options, level);
      } else {
        // if ANY are a text node, then suppress pretty now
        if (options.dontPrettyTextNodes) {
          ref2 = node.children;
          for (i = 0, len1 = ref2.length; i < len1; i++) {
            child = ref2[i];
            if ((child.type === NodeType.Text || child.type === NodeType.Raw) && (child.value != null)) {
              options.suppressPrettyCount++;
              prettySuppressed = true;
              break;
            }
          }
        }
        // close the opening tag, after dealing with newline
        r += '>' + this.endline(node, options, level);
        options.state = WriterState.InsideTag;
        ref3 = node.children;
        // inner tags
        for (j = 0, len2 = ref3.length; j < len2; j++) {
          child = ref3[j];
          r += this.writeChildNode(child, options, level + 1);
        }
        // close tag
        options.state = WriterState.CloseTag;
        r += this.indent(node, options, level) + '</' + node.name + '>';
        if (prettySuppressed) {
          options.suppressPrettyCount--;
        }
        r += this.endline(node, options, level);
        options.state = WriterState.None;
      }
      this.closeNode(node, options, level);
      return r;
    }

    writeChildNode(node, options, level) {
      switch (node.type) {
        case NodeType.CData:
          return this.cdata(node, options, level);
        case NodeType.Comment:
          return this.comment(node, options, level);
        case NodeType.Element:
          return this.element(node, options, level);
        case NodeType.Raw:
          return this.raw(node, options, level);
        case NodeType.Text:
          return this.text(node, options, level);
        case NodeType.ProcessingInstruction:
          return this.processingInstruction(node, options, level);
        case NodeType.Dummy:
          return '';
        case NodeType.Declaration:
          return this.declaration(node, options, level);
        case NodeType.DocType:
          return this.docType(node, options, level);
        case NodeType.AttributeDeclaration:
          return this.dtdAttList(node, options, level);
        case NodeType.ElementDeclaration:
          return this.dtdElement(node, options, level);
        case NodeType.EntityDeclaration:
          return this.dtdEntity(node, options, level);
        case NodeType.NotationDeclaration:
          return this.dtdNotation(node, options, level);
        default:
          throw new Error("Unknown XML node type: " + node.constructor.name);
      }
    }

    processingInstruction(node, options, level) {
      var r;
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level) + '<?';
      options.state = WriterState.InsideTag;
      r += node.target;
      if (node.value) {
        r += ' ' + node.value;
      }
      options.state = WriterState.CloseTag;
      r += options.spaceBeforeSlash + '?>';
      r += this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    raw(node, options, level) {
      var r;
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level);
      options.state = WriterState.InsideTag;
      r += node.value;
      options.state = WriterState.CloseTag;
      r += this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    text(node, options, level) {
      var r;
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level);
      options.state = WriterState.InsideTag;
      r += node.value;
      options.state = WriterState.CloseTag;
      r += this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    dtdAttList(node, options, level) {
      var r;
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level) + '<!ATTLIST';
      options.state = WriterState.InsideTag;
      r += ' ' + node.elementName + ' ' + node.attributeName + ' ' + node.attributeType;
      if (node.defaultValueType !== '#DEFAULT') {
        r += ' ' + node.defaultValueType;
      }
      if (node.defaultValue) {
        r += ' "' + node.defaultValue + '"';
      }
      options.state = WriterState.CloseTag;
      r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    dtdElement(node, options, level) {
      var r;
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level) + '<!ELEMENT';
      options.state = WriterState.InsideTag;
      r += ' ' + node.name + ' ' + node.value;
      options.state = WriterState.CloseTag;
      r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    dtdEntity(node, options, level) {
      var r;
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level) + '<!ENTITY';
      options.state = WriterState.InsideTag;
      if (node.pe) {
        r += ' %';
      }
      r += ' ' + node.name;
      if (node.value) {
        r += ' "' + node.value + '"';
      } else {
        if (node.pubID && node.sysID) {
          r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
        } else if (node.sysID) {
          r += ' SYSTEM "' + node.sysID + '"';
        }
        if (node.nData) {
          r += ' NDATA ' + node.nData;
        }
      }
      options.state = WriterState.CloseTag;
      r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    dtdNotation(node, options, level) {
      var r;
      this.openNode(node, options, level);
      options.state = WriterState.OpenTag;
      r = this.indent(node, options, level) + '<!NOTATION';
      options.state = WriterState.InsideTag;
      r += ' ' + node.name;
      if (node.pubID && node.sysID) {
        r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
      } else if (node.pubID) {
        r += ' PUBLIC "' + node.pubID + '"';
      } else if (node.sysID) {
        r += ' SYSTEM "' + node.sysID + '"';
      }
      options.state = WriterState.CloseTag;
      r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
      options.state = WriterState.None;
      this.closeNode(node, options, level);
      return r;
    }

    openNode(node, options, level) {}

    closeNode(node, options, level) {}

    openAttribute(att, options, level) {}

    closeAttribute(att, options, level) {}

  };

}).call(this);

},{"./NodeType":94,"./Utility":95,"./WriterState":96,"./XMLCData":98,"./XMLComment":100,"./XMLDTDAttList":105,"./XMLDTDElement":106,"./XMLDTDEntity":107,"./XMLDTDNotation":108,"./XMLDeclaration":109,"./XMLDocType":110,"./XMLDummy":113,"./XMLElement":114,"./XMLProcessingInstruction":118,"./XMLRaw":119,"./XMLText":123}],125:[function(require,module,exports){
// Generated by CoffeeScript 2.4.1
(function() {
  var NodeType, WriterState, XMLDOMImplementation, XMLDocument, XMLDocumentCB, XMLStreamWriter, XMLStringWriter, assign, isFunction;

  ({assign, isFunction} = require('./Utility'));

  XMLDOMImplementation = require('./XMLDOMImplementation');

  XMLDocument = require('./XMLDocument');

  XMLDocumentCB = require('./XMLDocumentCB');

  XMLStringWriter = require('./XMLStringWriter');

  XMLStreamWriter = require('./XMLStreamWriter');

  NodeType = require('./NodeType');

  WriterState = require('./WriterState');

  // Creates a new document and returns the root node for
  // chain-building the document tree

  // `name` name of the root element

  // `xmldec.version` A version number string, e.g. 1.0
  // `xmldec.encoding` Encoding declaration, e.g. UTF-8
  // `xmldec.standalone` standalone document declaration: true or false

  // `doctype.pubID` public identifier of the external subset
  // `doctype.sysID` system identifier of the external subset

  // `options.headless` whether XML declaration and doctype will be included:
  //     true or false
  // `options.keepNullNodes` whether nodes with null values will be kept
  //     or ignored: true or false
  // `options.keepNullAttributes` whether attributes with null values will be
  //     kept or ignored: true or false
  // `options.ignoreDecorators` whether decorator strings will be ignored when
  //     converting JS objects: true or false
  // `options.separateArrayItems` whether array items are created as separate
  //     nodes when passed as an object value: true or false
  // `options.noDoubleEncoding` whether existing html entities are encoded:
  //     true or false
  // `options.stringify` a set of functions to use for converting values to
  //     strings
  // `options.writer` the default XML writer to use for converting nodes to
  //     string. If the default writer is not set, the built-in XMLStringWriter
  //     will be used instead.
  module.exports.create = function(name, xmldec, doctype, options) {
    var doc, root;
    if (name == null) {
      throw new Error("Root element needs a name.");
    }
    options = assign({}, xmldec, doctype, options);
    // create the document node
    doc = new XMLDocument(options);
    // add the root node
    root = doc.element(name);
    // prolog
    if (!options.headless) {
      doc.declaration(options);
      if ((options.pubID != null) || (options.sysID != null)) {
        doc.dtd(options);
      }
    }
    return root;
  };

  // Creates a new document and returns the document node for
  // chain-building the document tree

  // `options.keepNullNodes` whether nodes with null values will be kept
  //     or ignored: true or false
  // `options.keepNullAttributes` whether attributes with null values will be
  //     kept or ignored: true or false
  // `options.ignoreDecorators` whether decorator strings will be ignored when
  //     converting JS objects: true or false
  // `options.separateArrayItems` whether array items are created as separate
  //     nodes when passed as an object value: true or false
  // `options.noDoubleEncoding` whether existing html entities are encoded:
  //     true or false
  // `options.stringify` a set of functions to use for converting values to
  //     strings
  // `options.writer` the default XML writer to use for converting nodes to
  //     string. If the default writer is not set, the built-in XMLStringWriter
  //     will be used instead.

  // `onData` the function to be called when a new chunk of XML is output. The
  //          string containing the XML chunk is passed to `onData` as its single
  //          argument.
  // `onEnd`  the function to be called when the XML document is completed with
  //          `end`. `onEnd` does not receive any arguments.
  module.exports.begin = function(options, onData, onEnd) {
    if (isFunction(options)) {
      [onData, onEnd] = [options, onData];
      options = {};
    }
    if (onData) {
      return new XMLDocumentCB(options, onData, onEnd);
    } else {
      return new XMLDocument(options);
    }
  };

  module.exports.stringWriter = function(options) {
    return new XMLStringWriter(options);
  };

  module.exports.streamWriter = function(stream, options) {
    return new XMLStreamWriter(stream, options);
  };

  module.exports.implementation = new XMLDOMImplementation();

  module.exports.nodeType = NodeType;

  module.exports.writerState = WriterState;

}).call(this);

},{"./NodeType":94,"./Utility":95,"./WriterState":96,"./XMLDOMImplementation":103,"./XMLDocument":111,"./XMLDocumentCB":112,"./XMLStreamWriter":120,"./XMLStringWriter":121}],"ecs-2014-05-26.json":[function(require,module,exports){
module.exports={
  "format": "pop",
  "apiVersion": "2014-05-26",
  "checksumFormat": "md5",
  "endpointPrefix": "ecs",
  "serviceAbbreviation": "ECS",
  "serviceFullName": "Aliyun ECS",
  "signatureVersion": "pop",
  "timestampFormat": "top",
  "xmlnamespace": "",
  "operations": {
    "allocateEipAddress": {
      "name": "AllocateEipAddress",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "AllocateEipAddress"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "Bandwidth": {
            "type": "string"
          },
          "InternetChargeType": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          }
        }
      }
    },
    "allocatePublicIpAddress": {
      "name": "AllocatePublicIpAddress",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "AllocatePublicIpAddress"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "IpAddress": {
            "type": "string"
          },
          "VlanId": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "associateEipAddress": {
      "name": "AssociateEipAddress",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "AssociateEipAddress"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "AllocationId": {
            "required": true,
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "InstanceType": {
            "type": "string"
          }
        }
      }
    },
    "attachDisk": {
      "name": "AttachDisk",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "AttachDisk"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "DiskId": {
            "required": true,
            "type": "string"
          },
          "Device": {
            "type": "string"
          },
          "DeleteWithInstance": {
            "type": "boolean"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "authorizeSecurityGroup": {
      "name": "AuthorizeSecurityGroup",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "AuthorizeSecurityGroup"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "SecurityGroupId": {
            "required": true,
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "IpProtocol": {
            "required": true,
            "type": "string"
          },
          "PortRange": {
            "required": true,
            "type": "string"
          },
          "SourceGroupId": {
            "type": "string"
          },
          "SourceGroupOwnerId": {
            "type": "integer"
          },
          "SourceGroupOwnerAccount": {
            "type": "string"
          },
          "SourceCidrIp": {
            "type": "string"
          },
          "Policy": {
            "type": "string"
          },
          "Priority": {
            "type": "string"
          },
          "NicType": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "authorizeSecurityGroupEgress": {
      "name": "AuthorizeSecurityGroupEgress",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "AuthorizeSecurityGroupEgress"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "SecurityGroupId": {
            "required": true,
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "IpProtocol": {
            "required": true,
            "type": "string"
          },
          "PortRange": {
            "required": true,
            "type": "string"
          },
          "DestGroupId": {
            "type": "string"
          },
          "DestGroupOwnerId": {
            "type": "integer"
          },
          "DestGroupOwnerAccount": {
            "type": "string"
          },
          "DestCidrIp": {
            "type": "string"
          },
          "Policy": {
            "type": "string"
          },
          "Priority": {
            "type": "string"
          },
          "NicType": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "bindIpRange": {
      "name": "BindIpRange",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "BindIpRange"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "IpAddress": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "cancelCopyImage": {
      "name": "CancelCopyImage",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CancelCopyImage"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "checkAutoSnapshotPolicy": {
      "name": "CheckAutoSnapshotPolicy",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CheckAutoSnapshotPolicy"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "SystemDiskPolicyEnabled": {
            "type": "boolean"
          },
          "SystemDiskPolicyTimePeriod": {
            "type": "integer"
          },
          "SystemDiskPolicyRetentionDays": {
            "type": "integer"
          },
          "SystemDiskPolicyRetentionLastWeek": {
            "type": "boolean"
          },
          "DataDiskPolicyEnabled": {
            "type": "boolean"
          },
          "DataDiskPolicyTimePeriod": {
            "type": "integer"
          },
          "DataDiskPolicyRetentionDays": {
            "type": "integer"
          },
          "DataDiskPolicyRetentionLastWeek": {
            "type": "boolean"
          }
        }
      }
    },
    "checkDiskEnableAutoSnapshotValidation": {
      "name": "CheckDiskEnableAutoSnapshotValidation",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CheckDiskEnableAutoSnapshotValidation"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "DiskIds": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "copyImage": {
      "name": "CopyImage",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CopyImage"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "DestinationImageName": {
            "type": "string"
          },
          "DestinationDescription": {
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "DestinationRegionId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "createDisk": {
      "name": "CreateDisk",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateDisk"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ZoneId": {
            "required": true,
            "type": "string"
          },
          "SnapshotId": {
            "type": "string"
          },
          "DiskName": {
            "type": "string"
          },
          "Size": {
            "type": "integer"
          },
          "DiskCategory": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "createImage": {
      "name": "CreateImage",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateImage"
          },
          "DiskDeviceMapping": {
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "SnapshotId": {
            "type": "string"
          },
          "InstanceId": {
            "type": "string"
          },
          "ImageName": {
            "type": "string"
          },
          "ImageVersion": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "createInstance": {
      "name": "CreateInstance",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateInstance"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          },
          "InstanceType": {
            "required": true,
            "type": "string"
          },
          "SecurityGroupId": {
            "type": "string"
          },
          "InstanceName": {
            "type": "string"
          },
          "InternetChargeType": {
            "type": "string"
          },
          "AutoRenew": {
            "type": "boolean"
          },
          "AutoRenewPeriod": {
            "type": "integer"
          },
          "InternetMaxBandwidthIn": {
            "type": "integer"
          },
          "InternetMaxBandwidthOut": {
            "type": "integer"
          },
          "HostName": {
            "type": "string"
          },
          "Password": {
            "type": "string"
          },
          "ZoneId": {
            "type": "string"
          },
          "ClusterId": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "VlanId": {
            "type": "string"
          },
          "InnerIpAddress": {
            "type": "string"
          },
          "SystemDisk.Size": {
            "type": "integer"
          },
          "SystemDisk.Category": {
            "type": "string"
          },
          "SystemDisk.DiskName": {
            "type": "string"
          },
          "SystemDisk.Description": {
            "type": "string"
          },
          "DataDisk.1.Size": {
            "type": "integer"
          },
          "DataDisk.1.Category": {
            "type": "string"
          },
          "DataDisk.1.SnapshotId": {
            "type": "string"
          },
          "DataDisk.1.DiskName": {
            "type": "string"
          },
          "DataDisk.1.Description": {
            "type": "string"
          },
          "DataDisk.1.Device": {
            "type": "string"
          },
          "DataDisk.1.DeleteWithInstance": {
            "type": "boolean"
          },
          "DataDisk.2.Size": {
            "type": "integer"
          },
          "DataDisk.2.Category": {
            "type": "string"
          },
          "DataDisk.2.SnapshotId": {
            "type": "string"
          },
          "DataDisk.2.DiskName": {
            "type": "string"
          },
          "DataDisk.2.Description": {
            "type": "string"
          },
          "DataDisk.2.Device": {
            "type": "string"
          },
          "DataDisk.2.DeleteWithInstance": {
            "type": "boolean"
          },
          "DataDisk.3.Size": {
            "type": "integer"
          },
          "DataDisk.3.Category": {
            "type": "string"
          },
          "DataDisk.3.SnapshotId": {
            "type": "string"
          },
          "DataDisk.3.DiskName": {
            "type": "string"
          },
          "DataDisk.3.Description": {
            "type": "string"
          },
          "DataDisk.3.Device": {
            "type": "string"
          },
          "DataDisk.3.DeleteWithInstance": {
            "type": "boolean"
          },
          "DataDisk.4.Size": {
            "type": "integer"
          },
          "DataDisk.4.Category": {
            "type": "string"
          },
          "DataDisk.4.SnapshotId": {
            "type": "string"
          },
          "DataDisk.4.DiskName": {
            "type": "string"
          },
          "DataDisk.4.Description": {
            "type": "string"
          },
          "DataDisk.4.Device": {
            "type": "string"
          },
          "DataDisk.4.DeleteWithInstance": {
            "type": "boolean"
          },
          "NodeControllerId": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "VSwitchId": {
            "type": "string"
          },
          "PrivateIpAddress": {
            "type": "string"
          },
          "IoOptimized": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UseAdditionalService": {
            "type": "boolean"
          },
          "InstanceChargeType": {
            "type": "string"
          },
          "Period": {
            "type": "integer"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          },
          "UserData": {
            "type": "string"
          },
          "SpotStrategy": {
            "type": "string"
          }
        }
      }
    },
    "createRouteEntry": {
      "name": "CreateRouteEntry",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateRouteEntry"
          },
          "NextHopList": {
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RouteTableId": {
            "required": true,
            "type": "string"
          },
          "DestinationCidrBlock": {
            "required": true,
            "type": "string"
          },
          "NextHopId": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "NextHopType": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "createSecurityGroup": {
      "name": "CreateSecurityGroup",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateSecurityGroup"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "SecurityGroupName": {
            "type": "string"
          },
          "VpcId": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "createSnapshot": {
      "name": "CreateSnapshot",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateSnapshot"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "DiskId": {
            "required": true,
            "type": "string"
          },
          "SnapshotName": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "createVpc": {
      "name": "CreateVpc",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateVpc"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "CidrBlock": {
            "type": "string"
          },
          "VpcName": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "createVSwitch": {
      "name": "CreateVSwitch",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateVSwitch"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ZoneId": {
            "required": true,
            "type": "string"
          },
          "CidrBlock": {
            "required": true,
            "type": "string"
          },
          "VpcId": {
            "required": true,
            "type": "string"
          },
          "VSwitchName": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "deleteDisk": {
      "name": "DeleteDisk",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteDisk"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "DiskId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "deleteImage": {
      "name": "DeleteImage",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteImage"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "deleteInstance": {
      "name": "DeleteInstance",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteInstance"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Force": {
            "type": "boolean"
          }
        }
      }
    },
    "deleteRouteEntry": {
      "name": "DeleteRouteEntry",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteRouteEntry"
          },
          "NextHopList": {
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RouteTableId": {
            "required": true,
            "type": "string"
          },
          "DestinationCidrBlock": {
            "required": true,
            "type": "string"
          },
          "NextHopId": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "deleteSecurityGroup": {
      "name": "DeleteSecurityGroup",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteSecurityGroup"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "SecurityGroupId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "deleteSnapshot": {
      "name": "DeleteSnapshot",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteSnapshot"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "SnapshotId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "deleteVpc": {
      "name": "DeleteVpc",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteVpc"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "VpcId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "deleteVSwitch": {
      "name": "DeleteVSwitch",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteVSwitch"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "VSwitchId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeAutoSnapshotPolicy": {
      "name": "DescribeAutoSnapshotPolicy",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeAutoSnapshotPolicy"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeClusters": {
      "name": "DescribeClusters",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeClusters"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeDiskMonitorData": {
      "name": "DescribeDiskMonitorData",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeDiskMonitorData"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "DiskId": {
            "required": true,
            "type": "string"
          },
          "StartTime": {
            "required": true,
            "type": "string"
          },
          "EndTime": {
            "required": true,
            "type": "string"
          },
          "Period": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeDisks": {
      "name": "DescribeDisks",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeDisks"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ZoneId": {
            "type": "string"
          },
          "DiskIds": {
            "type": "string"
          },
          "InstanceId": {
            "type": "string"
          },
          "DiskType": {
            "type": "string"
          },
          "Category": {
            "type": "string"
          },
          "Status": {
            "type": "string"
          },
          "SnapshotId": {
            "type": "string"
          },
          "Portable": {
            "type": "boolean"
          },
          "DeleteWithInstance": {
            "type": "boolean"
          },
          "DeleteAutoSnapshot": {
            "type": "boolean"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "DiskName": {
            "type": "string"
          },
          "AutoSnapshotPolicyId": {
            "type": "string"
          },
          "EnableAutoSnapshot": {
            "type": "boolean"
          },
          "EnableAutomatedSnapshotPolicy": {
            "type": "boolean"
          },
          "DiskChargeType": {
            "type": "string"
          },
          "LockReason": {
            "type": "string"
          },
          "Filter.1.Key": {
            "type": "string"
          },
          "Filter.2.Key": {
            "type": "string"
          },
          "Filter.1.Value": {
            "type": "string"
          },
          "Filter.2.Value": {
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "describeEipAddresses": {
      "name": "DescribeEipAddresses",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeEipAddresses"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "Status": {
            "type": "string"
          },
          "EipAddress": {
            "type": "string"
          },
          "AllocationId": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Filter.1.Key": {
            "type": "string"
          },
          "Filter.2.Key": {
            "type": "string"
          },
          "Filter.1.Value": {
            "type": "string"
          },
          "Filter.2.Value": {
            "type": "string"
          },
          "LockReason": {
            "type": "string"
          },
          "AssociatedInstanceType": {
            "type": "string"
          },
          "AssociatedInstanceId": {
            "type": "string"
          },
          "ChargeType": {
            "type": "string"
          }
        }
      }
    },
    "describeEipMonitorData": {
      "name": "DescribeEipMonitorData",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeEipMonitorData"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "AllocationId": {
            "required": true,
            "type": "string"
          },
          "StartTime": {
            "required": true,
            "type": "string"
          },
          "EndTime": {
            "required": true,
            "type": "string"
          },
          "Period": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeImages": {
      "name": "DescribeImages",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeImages"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "Status": {
            "type": "string"
          },
          "ImageId": {
            "type": "string"
          },
          "ShowExpired": {
            "type": "boolean"
          },
          "SnapshotId": {
            "type": "string"
          },
          "ImageName": {
            "type": "string"
          },
          "ImageOwnerAlias": {
            "type": "string"
          },
          "InstanceType": {
            "type": "string"
          },
          "IsSupportIoOptimized": {
            "type": "boolean"
          },
          "OSType": {
            "type": "string"
          },
          "Architecture": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Filter.1.Key": {
            "type": "string"
          },
          "Filter.2.Key": {
            "type": "string"
          },
          "Filter.1.Value": {
            "type": "string"
          },
          "Filter.2.Value": {
            "type": "string"
          },
          "Usage": {
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "describeImageSharePermission": {
      "name": "DescribeImageSharePermission",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeImageSharePermission"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeInstanceAttribute": {
      "name": "DescribeInstanceAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeInstanceAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeInstanceMonitorData": {
      "name": "DescribeInstanceMonitorData",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeInstanceMonitorData"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "StartTime": {
            "required": true,
            "type": "string"
          },
          "EndTime": {
            "required": true,
            "type": "string"
          },
          "Period": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeInstancePhysicalAttribute": {
      "name": "DescribeInstancePhysicalAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeInstancePhysicalAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeInstances": {
      "name": "DescribeInstances",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeInstances"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "VpcId": {
            "type": "string"
          },
          "VSwitchId": {
            "type": "string"
          },
          "ZoneId": {
            "type": "string"
          },
          "InstanceNetworkType": {
            "type": "string"
          },
          "SecurityGroupId": {
            "type": "string"
          },
          "InstanceIds": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "InnerIpAddresses": {
            "type": "string"
          },
          "PrivateIpAddresses": {
            "type": "string"
          },
          "PublicIpAddresses": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "InstanceChargeType": {
            "type": "string"
          },
          "InternetChargeType": {
            "type": "string"
          },
          "InstanceName": {
            "type": "string"
          },
          "ImageId": {
            "type": "string"
          },
          "Status": {
            "type": "string"
          },
          "LockReason": {
            "type": "string"
          },
          "Filter.1.Key": {
            "type": "string"
          },
          "Filter.2.Key": {
            "type": "string"
          },
          "Filter.3.Key": {
            "type": "string"
          },
          "Filter.4.Key": {
            "type": "string"
          },
          "Filter.1.Value": {
            "type": "string"
          },
          "Filter.2.Value": {
            "type": "string"
          },
          "Filter.3.Value": {
            "type": "string"
          },
          "Filter.4.Value": {
            "type": "string"
          },
          "DeviceAvailable": {
            "type": "boolean"
          },
          "IoOptimized": {
            "type": "boolean"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          },
          "InstanceType": {
            "type": "string"
          },
          "InstanceTypeFamily": {
            "type": "string"
          }
        }
      }
    },
    "describeInstanceStatus": {
      "name": "DescribeInstanceStatus",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeInstanceStatus"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ZoneId": {
            "type": "string"
          },
          "ClusterId": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeInstanceTypes": {
      "name": "DescribeInstanceTypes",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeInstanceTypes"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "InstanceTypeFamily": {
            "type": "string"
          },
          "NextToken": {
            "type": "string"
          }
        }
      }
    },
    "describeInstanceVncPasswd": {
      "name": "DescribeInstanceVncPasswd",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeInstanceVncPasswd"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeInstanceVncUrl": {
      "name": "DescribeInstanceVncUrl",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeInstanceVncUrl"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeIntranetAttributeKb": {
      "name": "DescribeIntranetAttributeKb",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeIntranetAttributeKb"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeIpRanges": {
      "name": "DescribeIpRanges",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeIpRanges"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ClusterId": {
            "required": true,
            "type": "string"
          },
          "NicType": {
            "required": true,
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeLimitation": {
      "name": "DescribeLimitation",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeLimitation"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Limitation": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeRegions": {
      "name": "DescribeRegions",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeRegions"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeRouteTables": {
      "name": "DescribeRouteTables",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeRouteTables"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "VRouterId": {
            "type": "string"
          },
          "RouteTableId": {
            "type": "string"
          },
          "RouterType": {
            "type": "string"
          },
          "RouterId": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeSecurityGroupAttribute": {
      "name": "DescribeSecurityGroupAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeSecurityGroupAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "SecurityGroupId": {
            "required": true,
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "NicType": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Direction": {
            "type": "string"
          }
        }
      }
    },
    "describeSecurityGroups": {
      "name": "DescribeSecurityGroups",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeSecurityGroups"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "VpcId": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "SecurityGroupIds": {
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          },
          "NetworkType": {
            "type": "string"
          },
          "SecurityGroupId": {
            "type": "string"
          },
          "SecurityGroupName": {
            "type": "string"
          },
          "IsQueryEcsCount": {
            "type": "boolean"
          },
          "FuzzyQuery": {
            "type": "boolean"
          }
        }
      }
    },
    "describeSnapshots": {
      "name": "DescribeSnapshots",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeSnapshots"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "type": "string"
          },
          "DiskId": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "SnapshotIds": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "SnapshotName": {
            "type": "string"
          },
          "Status": {
            "type": "string"
          },
          "SnapshotType": {
            "type": "string"
          },
          "Filter.1.Key": {
            "type": "string"
          },
          "Filter.2.Key": {
            "type": "string"
          },
          "Filter.1.Value": {
            "type": "string"
          },
          "Filter.2.Value": {
            "type": "string"
          },
          "Usage": {
            "type": "string"
          },
          "SourceDiskType": {
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "describeVpcs": {
      "name": "DescribeVpcs",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeVpcs"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "VpcId": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "IsDefault": {
            "type": "boolean"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeVRouters": {
      "name": "DescribeVRouters",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeVRouters"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "VRouterId": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeVSwitches": {
      "name": "DescribeVSwitches",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeVSwitches"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "VpcId": {
            "required": true,
            "type": "string"
          },
          "VSwitchId": {
            "type": "string"
          },
          "ZoneId": {
            "type": "string"
          },
          "IsDefault": {
            "type": "boolean"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeZones": {
      "name": "DescribeZones",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeZones"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Verbose": {
            "type": "boolean"
          }
        }
      }
    },
    "detachDisk": {
      "name": "DetachDisk",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DetachDisk"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "DiskId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "joinSecurityGroup": {
      "name": "JoinSecurityGroup",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "JoinSecurityGroup"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "SecurityGroupId": {
            "required": true,
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "leaveSecurityGroup": {
      "name": "LeaveSecurityGroup",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "LeaveSecurityGroup"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "SecurityGroupId": {
            "required": true,
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyAutoSnapshotPolicy": {
      "name": "ModifyAutoSnapshotPolicy",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyAutoSnapshotPolicy"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "SystemDiskPolicyEnabled": {
            "type": "boolean"
          },
          "SystemDiskPolicyTimePeriod": {
            "type": "integer"
          },
          "SystemDiskPolicyRetentionDays": {
            "type": "integer"
          },
          "SystemDiskPolicyRetentionLastWeek": {
            "type": "boolean"
          },
          "DataDiskPolicyEnabled": {
            "type": "boolean"
          },
          "DataDiskPolicyTimePeriod": {
            "type": "integer"
          },
          "DataDiskPolicyRetentionDays": {
            "type": "integer"
          },
          "DataDiskPolicyRetentionLastWeek": {
            "type": "boolean"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyDiskAttribute": {
      "name": "ModifyDiskAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyDiskAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "DiskId": {
            "required": true,
            "type": "string"
          },
          "DiskName": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "DeleteWithInstance": {
            "type": "boolean"
          },
          "DeleteAutoSnapshot": {
            "type": "boolean"
          },
          "EnableAutoSnapshot": {
            "type": "boolean"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyEipAddressAttribute": {
      "name": "ModifyEipAddressAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyEipAddressAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "AllocationId": {
            "required": true,
            "type": "string"
          },
          "Bandwidth": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyImageAttribute": {
      "name": "ModifyImageAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyImageAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          },
          "ImageName": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyImageShareGroupPermission": {
      "name": "ModifyImageShareGroupPermission",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyImageShareGroupPermission"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          },
          "AddGroup.1": {
            "type": "string"
          },
          "RemoveGroup.1": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyImageSharePermission": {
      "name": "ModifyImageSharePermission",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyImageSharePermission"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          },
          "AddAccount.1": {
            "type": "string"
          },
          "AddAccount.2": {
            "type": "string"
          },
          "AddAccount.3": {
            "type": "string"
          },
          "AddAccount.4": {
            "type": "string"
          },
          "AddAccount.5": {
            "type": "string"
          },
          "AddAccount.6": {
            "type": "string"
          },
          "AddAccount.7": {
            "type": "string"
          },
          "AddAccount.8": {
            "type": "string"
          },
          "AddAccount.9": {
            "type": "string"
          },
          "AddAccount.10": {
            "type": "string"
          },
          "RemoveAccount.1": {
            "type": "string"
          },
          "RemoveAccount.2": {
            "type": "string"
          },
          "RemoveAccount.3": {
            "type": "string"
          },
          "RemoveAccount.4": {
            "type": "string"
          },
          "RemoveAccount.5": {
            "type": "string"
          },
          "RemoveAccount.6": {
            "type": "string"
          },
          "RemoveAccount.7": {
            "type": "string"
          },
          "RemoveAccount.8": {
            "type": "string"
          },
          "RemoveAccount.9": {
            "type": "string"
          },
          "RemoveAccount.10": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyInstanceAttribute": {
      "name": "ModifyInstanceAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyInstanceAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "Password": {
            "type": "string"
          },
          "HostName": {
            "type": "string"
          },
          "InstanceName": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserData": {
            "type": "string"
          }
        }
      }
    },
    "modifyInstanceNetworkSpec": {
      "name": "ModifyInstanceNetworkSpec",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyInstanceNetworkSpec"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "InternetMaxBandwidthOut": {
            "type": "integer"
          },
          "InternetMaxBandwidthIn": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyInstanceSpec": {
      "name": "ModifyInstanceSpec",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyInstanceSpec"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "InstanceType": {
            "type": "string"
          },
          "InternetMaxBandwidthOut": {
            "type": "integer"
          },
          "InternetMaxBandwidthIn": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Temporary.StartTime": {
            "type": "string"
          },
          "Temporary.EndTime": {
            "type": "string"
          },
          "Temporary.InternetMaxBandwidthOut": {
            "type": "integer"
          },
          "Async": {
            "type": "boolean"
          }
        }
      }
    },
    "modifyInstanceVncPasswd": {
      "name": "ModifyInstanceVncPasswd",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyInstanceVncPasswd"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "VncPassword": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyInstanceVpcAttribute": {
      "name": "ModifyInstanceVpcAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyInstanceVpcAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "VSwitchId": {
            "required": true,
            "type": "string"
          },
          "PrivateIpAddress": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyIntranetBandwidthKb": {
      "name": "ModifyIntranetBandwidthKb",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyIntranetBandwidthKb"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "IntranetMaxBandwidthIn": {
            "type": "integer"
          },
          "IntranetMaxBandwidthOut": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifySecurityGroupAttribute": {
      "name": "ModifySecurityGroupAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifySecurityGroupAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "SecurityGroupId": {
            "required": true,
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "SecurityGroupName": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifySnapshotAttribute": {
      "name": "ModifySnapshotAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifySnapshotAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "SnapshotId": {
            "required": true,
            "type": "string"
          },
          "SnapshotName": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          }
        }
      }
    },
    "modifyVpcAttribute": {
      "name": "ModifyVpcAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyVpcAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "VpcId": {
            "required": true,
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "VpcName": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "modifyVRouterAttribute": {
      "name": "ModifyVRouterAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyVRouterAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "VRouterId": {
            "required": true,
            "type": "string"
          },
          "VRouterName": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyVSwitchAttribute": {
      "name": "ModifyVSwitchAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyVSwitchAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "VSwitchId": {
            "required": true,
            "type": "string"
          },
          "VSwitchName": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "rebootInstance": {
      "name": "RebootInstance",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "RebootInstance"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "ForceStop": {
            "type": "boolean"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "reInitDisk": {
      "name": "ReInitDisk",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ReInitDisk"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "DiskId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "Password": {
            "type": "string"
          }
        }
      }
    },
    "releaseEipAddress": {
      "name": "ReleaseEipAddress",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ReleaseEipAddress"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "AllocationId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "releasePublicIpAddress": {
      "name": "ReleasePublicIpAddress",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ReleasePublicIpAddress"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "type": "string"
          },
          "PublicIpAddress": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "replaceSystemDisk": {
      "name": "ReplaceSystemDisk",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ReplaceSystemDisk"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          },
          "SystemDisk.Size": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UseAdditionalService": {
            "type": "boolean"
          },
          "Password": {
            "type": "string"
          }
        }
      }
    },
    "resetDisk": {
      "name": "ResetDisk",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ResetDisk"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "DiskId": {
            "required": true,
            "type": "string"
          },
          "SnapshotId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "resizeDisk": {
      "name": "ResizeDisk",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ResizeDisk"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "DiskId": {
            "required": true,
            "type": "string"
          },
          "NewSize": {
            "required": true,
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "revokeSecurityGroup": {
      "name": "RevokeSecurityGroup",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "RevokeSecurityGroup"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "SecurityGroupId": {
            "required": true,
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "IpProtocol": {
            "required": true,
            "type": "string"
          },
          "PortRange": {
            "required": true,
            "type": "string"
          },
          "SourceGroupId": {
            "type": "string"
          },
          "SourceGroupOwnerId": {
            "type": "integer"
          },
          "SourceGroupOwnerAccount": {
            "type": "string"
          },
          "SourceCidrIp": {
            "type": "string"
          },
          "Policy": {
            "type": "string"
          },
          "NicType": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "revokeSecurityGroupEgress": {
      "name": "RevokeSecurityGroupEgress",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "RevokeSecurityGroupEgress"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "SecurityGroupId": {
            "required": true,
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "IpProtocol": {
            "required": true,
            "type": "string"
          },
          "PortRange": {
            "required": true,
            "type": "string"
          },
          "DestGroupId": {
            "type": "string"
          },
          "DestGroupOwnerId": {
            "type": "integer"
          },
          "DestGroupOwnerAccount": {
            "type": "string"
          },
          "DestCidrIp": {
            "type": "string"
          },
          "Policy": {
            "type": "string"
          },
          "NicType": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "startInstance": {
      "name": "StartInstance",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "StartInstance"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "stopInstance": {
      "name": "StopInstance",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "StopInstance"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "ForceStop": {
            "type": "boolean"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "unassociateEipAddress": {
      "name": "UnassociateEipAddress",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "UnassociateEipAddress"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "AllocationId": {
            "required": true,
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "InstanceType": {
            "type": "string"
          }
        }
      }
    },
    "unbindIpRange": {
      "name": "UnbindIpRange",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "UnbindIpRange"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "IpAddress": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "addTags": {
      "name": "AddTags",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "AddTags"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ResourceType": {
            "required": true,
            "type": "string"
          },
          "ResourceId": {
            "required": true,
            "type": "string"
          },
          "Tag.1.Key": {
            "required": true,
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "required": true,
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "describeResourceByTags": {
      "name": "DescribeResourceByTags",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeResourceByTags"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "PageNumber": {
            "type": "integer"
          },
          "ResourceType": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "describeTags": {
      "name": "DescribeTags",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeTags"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "PageNumber": {
            "type": "integer"
          },
          "ResourceType": {
            "type": "string"
          },
          "ResourceId": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "removeTags": {
      "name": "RemoveTags",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "RemoveTags"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ResourceType": {
            "required": true,
            "type": "string"
          },
          "ResourceId": {
            "required": true,
            "type": "string"
          },
          "Tag.1.Key": {
            "type": "string"
          },
          "Tag.2.Key": {
            "type": "string"
          },
          "Tag.3.Key": {
            "type": "string"
          },
          "Tag.4.Key": {
            "type": "string"
          },
          "Tag.5.Key": {
            "type": "string"
          },
          "Tag.1.Value": {
            "type": "string"
          },
          "Tag.2.Value": {
            "type": "string"
          },
          "Tag.3.Value": {
            "type": "string"
          },
          "Tag.4.Value": {
            "type": "string"
          },
          "Tag.5.Value": {
            "type": "string"
          }
        }
      }
    },
    "describeTagKeys": {
      "name": "DescribeTagKeys",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeTagKeys"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "PageNumber": {
            "type": "integer"
          },
          "ResourceType": {
            "type": "string"
          },
          "ResourceId": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "renewInstance": {
      "name": "RenewInstance",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "RenewInstance"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "InstanceType": {
            "type": "string"
          },
          "InternetMaxBandwidthOut": {
            "type": "integer"
          },
          "InternetChargeType": {
            "type": "string"
          },
          "Period": {
            "required": true,
            "type": "integer"
          },
          "RebootTime": {
            "type": "string"
          },
          "CovertDiskPortable.1.DiskId": {
            "type": "string"
          },
          "CovertDiskPortable.2.DiskId": {
            "type": "string"
          },
          "CovertDiskPortable.3.DiskId": {
            "type": "string"
          },
          "CovertDiskPortable.4.DiskId": {
            "type": "string"
          }
        }
      }
    },
    "associateHaVip": {
      "name": "AssociateHaVip",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "AssociateHaVip"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "HaVipId": {
            "required": true,
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "createHaVip": {
      "name": "CreateHaVip",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateHaVip"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "VSwitchId": {
            "required": true,
            "type": "string"
          },
          "IpAddress": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          }
        }
      }
    },
    "deleteHaVip": {
      "name": "DeleteHaVip",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteHaVip"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "HaVipId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeHaVips": {
      "name": "DescribeHaVips",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeHaVips"
          },
          "Filter": {
            "required": true,
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          }
        }
      }
    },
    "modifyHaVipAttribute": {
      "name": "ModifyHaVipAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyHaVipAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "HaVipId": {
            "required": true,
            "type": "string"
          },
          "Description": {
            "type": "string"
          }
        }
      }
    },
    "unassociateHaVip": {
      "name": "UnassociateHaVip",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "UnassociateHaVip"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "HaVipId": {
            "required": true,
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "Force": {
            "type": "string"
          }
        }
      }
    },
    "activateRouterInterface": {
      "name": "ActivateRouterInterface",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ActivateRouterInterface"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "RouterInterfaceId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "connectRouterInterface": {
      "name": "ConnectRouterInterface",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ConnectRouterInterface"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "RouterInterfaceId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "createRouterInterface": {
      "name": "CreateRouterInterface",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateRouterInterface"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "Role": {
            "required": true,
            "type": "string"
          },
          "OppositeRegionId": {
            "required": true,
            "type": "string"
          },
          "Spec": {
            "required": true,
            "type": "string"
          },
          "RouterType": {
            "required": true,
            "type": "string"
          },
          "RouterId": {
            "required": true,
            "type": "string"
          },
          "OppositeInterfaceId": {
            "type": "string"
          },
          "OppositeRouterId": {
            "type": "string"
          },
          "OppositeRouterType": {
            "type": "string"
          },
          "OppositeInterfaceOwnerId": {
            "type": "string"
          },
          "HealthCheckSourceIp": {
            "type": "string"
          },
          "HealthCheckTargetIp": {
            "type": "string"
          },
          "AccessPointId": {
            "type": "string"
          },
          "OppositeAccessPointId": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "Name": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "deactivateRouterInterface": {
      "name": "DeactivateRouterInterface",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeactivateRouterInterface"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "RouterInterfaceId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "deleteRouterInterface": {
      "name": "DeleteRouterInterface",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteRouterInterface"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "RouterInterfaceId": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "describeRouterInterfaces": {
      "name": "DescribeRouterInterfaces",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeRouterInterfaces"
          },
          "Filter": {
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          }
        }
      }
    },
    "modifyRouterInterfaceAttribute": {
      "name": "ModifyRouterInterfaceAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyRouterInterfaceAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "RouterInterfaceId": {
            "required": true,
            "type": "string"
          },
          "Name": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "OppositeInterfaceId": {
            "type": "string"
          },
          "OppositeRouterId": {
            "type": "string"
          },
          "OppositeRouterType": {
            "type": "string"
          },
          "OppositeInterfaceOwnerId": {
            "type": "string"
          },
          "HealthCheckSourceIp": {
            "type": "string"
          },
          "HealthCheckTargetIp": {
            "type": "string"
          }
        }
      }
    },
    "modifyRouterInterfaceSpec": {
      "name": "ModifyRouterInterfaceSpec",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyRouterInterfaceSpec"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "RouterInterfaceId": {
            "required": true,
            "type": "string"
          },
          "Spec": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "describeInstanceTypeFamilies": {
      "name": "DescribeInstanceTypeFamilies",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeInstanceTypeFamilies"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "Generation": {
            "type": "string"
          }
        }
      }
    },
    "cancelTask": {
      "name": "CancelTask",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CancelTask"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "TaskId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeTaskAttribute": {
      "name": "DescribeTaskAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeTaskAttribute"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "TaskId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeTasks": {
      "name": "DescribeTasks",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeTasks"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "TaskIds": {
            "type": "string"
          },
          "TaskAction": {
            "type": "string"
          },
          "TaskStatus": {
            "type": "string"
          },
          "StartTime": {
            "type": "string"
          },
          "EndTime": {
            "type": "string"
          }
        }
      }
    },
    "exportImage": {
      "name": "ExportImage",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ExportImage"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          },
          "OSSBucket": {
            "required": true,
            "type": "string"
          },
          "OSSPrefix": {
            "type": "string"
          },
          "ImageFormat": {
            "type": "string"
          },
          "RoleName": {
            "type": "string"
          }
        }
      }
    },
    "importImage": {
      "name": "ImportImage",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ImportImage"
          },
          "DiskDeviceMapping": {
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ImageName": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "Architecture": {
            "type": "string"
          },
          "OSType": {
            "type": "string"
          },
          "Platform": {
            "type": "string"
          },
          "RoleName": {
            "type": "string"
          }
        }
      }
    },
    "cancelPhysicalConnection": {
      "name": "CancelPhysicalConnection",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CancelPhysicalConnection"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PhysicalConnectionId": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "createPhysicalConnection": {
      "name": "CreatePhysicalConnection",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreatePhysicalConnection"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "AccessPointId": {
            "required": true,
            "type": "string"
          },
          "Type": {
            "type": "string"
          },
          "LineOperator": {
            "required": true,
            "type": "string"
          },
          "bandwidth": {
            "type": "integer"
          },
          "PeerLocation": {
            "required": true,
            "type": "string"
          },
          "PortType": {
            "type": "string"
          },
          "RedundantPhysicalConnectionId": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "Name": {
            "type": "string"
          },
          "CircuitCode": {
            "type": "string"
          },
          "ClientToken": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "createVirtualBorderRouter": {
      "name": "CreateVirtualBorderRouter",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateVirtualBorderRouter"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PhysicalConnectionId": {
            "required": true,
            "type": "string"
          },
          "VbrOwnerId": {
            "type": "integer"
          },
          "VlanId": {
            "required": true,
            "type": "integer"
          },
          "CircuitCode": {
            "type": "string"
          },
          "LocalGatewayIp": {
            "type": "string"
          },
          "PeerGatewayIp": {
            "type": "string"
          },
          "PeeringSubnetMask": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "Name": {
            "type": "string"
          },
          "ClientToken": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "deletePhysicalConnection": {
      "name": "DeletePhysicalConnection",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeletePhysicalConnection"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PhysicalConnectionId": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "deleteVirtualBorderRouter": {
      "name": "DeleteVirtualBorderRouter",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteVirtualBorderRouter"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "VbrId": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "describeAccessPoints": {
      "name": "DescribeAccessPoints",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeAccessPoints"
          },
          "Filter": {
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "Type": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          }
        }
      }
    },
    "describePhysicalConnections": {
      "name": "DescribePhysicalConnections",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribePhysicalConnections"
          },
          "Filter": {
            "type": "repeatlist"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "describeVirtualBorderRouters": {
      "name": "DescribeVirtualBorderRouters",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeVirtualBorderRouters"
          },
          "Filter": {
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          }
        }
      }
    },
    "describeVirtualBorderRoutersForPhysicalConnection": {
      "name": "DescribeVirtualBorderRoutersForPhysicalConnection",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeVirtualBorderRoutersForPhysicalConnection"
          },
          "Filter": {
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PhysicalConnectionId": {
            "required": true,
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          }
        }
      }
    },
    "enablePhysicalConnection": {
      "name": "EnablePhysicalConnection",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "EnablePhysicalConnection"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PhysicalConnectionId": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "required": true,
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "modifyPhysicalConnectionAttribute": {
      "name": "ModifyPhysicalConnectionAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyPhysicalConnectionAttribute"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PhysicalConnectionId": {
            "required": true,
            "type": "string"
          },
          "LineOperator": {
            "type": "string"
          },
          "bandwidth": {
            "type": "integer"
          },
          "PeerLocation": {
            "type": "string"
          },
          "PortType": {
            "type": "string"
          },
          "RedundantPhysicalConnectionId": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "Name": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          },
          "CircuitCode": {
            "type": "string"
          }
        }
      }
    },
    "modifyVirtualBorderRouterAttribute": {
      "name": "ModifyVirtualBorderRouterAttribute",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyVirtualBorderRouterAttribute"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "VbrId": {
            "required": true,
            "type": "string"
          },
          "VlanId": {
            "type": "integer"
          },
          "CircuitCode": {
            "type": "string"
          },
          "LocalGatewayIp": {
            "type": "string"
          },
          "PeerGatewayIp": {
            "type": "string"
          },
          "PeeringSubnetMask": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "Name": {
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "recoverVirtualBorderRouter": {
      "name": "RecoverVirtualBorderRouter",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "RecoverVirtualBorderRouter"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "VbrId": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "terminatePhysicalConnection": {
      "name": "TerminatePhysicalConnection",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "TerminatePhysicalConnection"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "PhysicalConnectionId": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "terminateVirtualBorderRouter": {
      "name": "TerminateVirtualBorderRouter",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "TerminateVirtualBorderRouter"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "VbrId": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "describeImageSupportInstanceTypes": {
      "name": "DescribeImageSupportInstanceTypes",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeImageSupportInstanceTypes"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ImageId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "applyAutoSnapshotPolicy": {
      "name": "ApplyAutoSnapshotPolicy",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ApplyAutoSnapshotPolicy"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "regionId": {
            "required": true,
            "type": "string"
          },
          "autoSnapshotPolicyId": {
            "required": true,
            "type": "string"
          },
          "diskIds": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "cancelAutoSnapshotPolicy": {
      "name": "CancelAutoSnapshotPolicy",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CancelAutoSnapshotPolicy"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "regionId": {
            "required": true,
            "type": "string"
          },
          "diskIds": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "createAutoSnapshotPolicy": {
      "name": "CreateAutoSnapshotPolicy",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateAutoSnapshotPolicy"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "regionId": {
            "required": true,
            "type": "string"
          },
          "autoSnapshotPolicyName": {
            "type": "string"
          },
          "timePoints": {
            "required": true,
            "type": "string"
          },
          "repeatWeekdays": {
            "required": true,
            "type": "string"
          },
          "retentionDays": {
            "required": true,
            "type": "integer"
          }
        }
      }
    },
    "deleteAutoSnapshotPolicy": {
      "name": "DeleteAutoSnapshotPolicy",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteAutoSnapshotPolicy"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "regionId": {
            "required": true,
            "type": "string"
          },
          "autoSnapshotPolicyId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeAutoSnapshotPolicyEx": {
      "name": "DescribeAutoSnapshotPolicyEx",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeAutoSnapshotPolicyEx"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "type": "string"
          },
          "AutoSnapshotPolicyId": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          }
        }
      }
    },
    "modifyAutoSnapshotPolicyEx": {
      "name": "ModifyAutoSnapshotPolicyEx",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyAutoSnapshotPolicyEx"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "regionId": {
            "required": true,
            "type": "string"
          },
          "autoSnapshotPolicyId": {
            "required": true,
            "type": "string"
          },
          "autoSnapshotPolicyName": {
            "type": "string"
          },
          "timePoints": {
            "type": "string"
          },
          "repeatWeekdays": {
            "type": "string"
          },
          "retentionDays": {
            "type": "integer"
          }
        }
      }
    },
    "eipFillParams": {
      "name": "EipFillParams",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "EipFillParams"
          },
          "data": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "eipNotifyPaid": {
      "name": "EipNotifyPaid",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "EipNotifyPaid"
          },
          "data": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "eipFillProduct": {
      "name": "EipFillProduct",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "EipFillProduct"
          },
          "data": {
            "required": true,
            "type": "string"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "ClientToken": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "UserCidr": {
            "type": "string"
          }
        }
      }
    },
    "addBandwidthPackageIps": {
      "name": "AddBandwidthPackageIps",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "AddBandwidthPackageIps"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "BandwidthPackageId": {
            "required": true,
            "type": "string"
          },
          "IpCount": {
            "required": true,
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          }
        }
      }
    },
    "createForwardEntry": {
      "name": "CreateForwardEntry",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateForwardEntry"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ForwardTableId": {
            "required": true,
            "type": "string"
          },
          "ExternalIp": {
            "required": true,
            "type": "string"
          },
          "ExternalPort": {
            "required": true,
            "type": "string"
          },
          "InternalIp": {
            "required": true,
            "type": "string"
          },
          "InternalPort": {
            "required": true,
            "type": "string"
          },
          "IpProtocol": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "createNatGateway": {
      "name": "CreateNatGateway",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateNatGateway"
          },
          "BandwidthPackage": {
            "required": true,
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "VpcId": {
            "required": true,
            "type": "string"
          },
          "Name": {
            "type": "string"
          },
          "Description": {
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          }
        }
      }
    },
    "deleteBandwidthPackage": {
      "name": "DeleteBandwidthPackage",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteBandwidthPackage"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "BandwidthPackageId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "deleteForwardEntry": {
      "name": "DeleteForwardEntry",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteForwardEntry"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ForwardTableId": {
            "required": true,
            "type": "string"
          },
          "ForwardEntryId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "deleteNatGateway": {
      "name": "DeleteNatGateway",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteNatGateway"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "NatGatewayId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeBandwidthPackages": {
      "name": "DescribeBandwidthPackages",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeBandwidthPackages"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "BandwidthPackageId": {
            "type": "string"
          },
          "NatGatewayId": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          }
        }
      }
    },
    "describeForwardTableEntries": {
      "name": "DescribeForwardTableEntries",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeForwardTableEntries"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "ForwardTableId": {
            "required": true,
            "type": "string"
          },
          "ForwardEntryId": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          }
        }
      }
    },
    "describeNatGateways": {
      "name": "DescribeNatGateways",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeNatGateways"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "NatGatewayId": {
            "type": "string"
          },
          "VpcId": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          }
        }
      }
    },
    "modifyBandwidthPackageSpec": {
      "name": "ModifyBandwidthPackageSpec",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyBandwidthPackageSpec"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "BandwidthPackageId": {
            "required": true,
            "type": "string"
          },
          "Bandwidth": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "modifyForwardEntry": {
      "name": "ModifyForwardEntry",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyForwardEntry"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "ForwardTableId": {
            "required": true,
            "type": "string"
          },
          "ForwardEntryId": {
            "required": true,
            "type": "string"
          },
          "ExternalIp": {
            "type": "string"
          },
          "ExternalPort": {
            "type": "string"
          },
          "InternalIp": {
            "type": "string"
          },
          "InternalPort": {
            "type": "string"
          },
          "IpProtocol": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "removeBandwidthPackageIps": {
      "name": "RemoveBandwidthPackageIps",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "RemoveBandwidthPackageIps"
          },
          "RemovedIpAddresses": {
            "required": true,
            "type": "repeatlist"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "BandwidthPackageId": {
            "required": true,
            "type": "string"
          },
          "ClientToken": {
            "type": "string"
          }
        }
      }
    },
    "describeUserData": {
      "name": "DescribeUserData",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeUserData"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeNewProjectEipMonitorData": {
      "name": "DescribeNewProjectEipMonitorData",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeNewProjectEipMonitorData"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "AllocationId": {
            "required": true,
            "type": "string"
          },
          "StartTime": {
            "required": true,
            "type": "string"
          },
          "EndTime": {
            "required": true,
            "type": "string"
          },
          "Period": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "modifyInstanceAutoReleaseTime": {
      "name": "ModifyInstanceAutoReleaseTime",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "ModifyInstanceAutoReleaseTime"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "RegionId": {
            "type": "string"
          },
          "InstanceId": {
            "required": true,
            "type": "string"
          },
          "AutoReleaseTime": {
            "type": "string"
          },
          "OwnerAccount": {
            "type": "string"
          }
        }
      }
    },
    "describeSnapshotLinks": {
      "name": "DescribeSnapshotLinks",
      "http": {
        "method": "POST",
        "uri":"/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeSnapshotLinks"
          },
          "OwnerId": {
            "type": "integer"
          },
          "ResourceOwnerAccount": {
            "type": "string"
          },
          "ResourceOwnerId": {
            "type": "integer"
          },
          "OwnerAccount": {
            "type": "string"
          },
          "RegionId": {
            "required": true,
            "type": "string"
          },
          "DiskIds": {
            "type": "string"
          },
          "SnapshotLinkIds": {
            "type": "string"
          },
          "PageNumber": {
            "type": "integer"
          },
          "PageSize": {
            "type": "integer"
          }
        }
      }
    }
  }
}

},{}]},{},[55]);
