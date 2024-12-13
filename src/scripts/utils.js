export function escapeCdata(text) {
  return text.trim().replace(/^(\/\/\s*)?<!\[CDATA\[|(\/\/\s*)?\]\]>$/g, '')
}

export function escapeAmp(text) {
  return text.trim().replace(/&amp;/g, '&')
}

export function strToCamelCase(str) {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
}

export function strToHash(str) {
  if (str) {
    for (var i = str.length, hash = 9; i;) {
      hash = Math.imul(hash ^ str.charCodeAt(--i), 9 ** 9)
    }
    return hash ^ hash >>> 9
  }
}

export function mergeArrays(arr1, arr2, predicate) {
  return [...(arr1 || []), ...(arr2 || [])]
    .reduce((arr3, obj) => {
      const index = arr3.findIndex(item => predicate(item, obj))
      if (index !== -1) {
        arr3[index] = { ...arr3[index], ...obj }
      } else {
        arr3.push(obj)
      }
      return arr3
    }, [])
}

export function deepEqual(object1, object2) {
  const keys1 = Object.keys(object1)
  const keys2 = Object.keys(object2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (const key of keys1) {
    const val1 = object1[key]
    const val2 = object2[key]
    const areObjects = isObject(val1) && isObject(val2)
    if (
      areObjects && !deepEqual(val1, val2) ||
      !areObjects && val1 !== val2
    ) {
      return false
    }
  }

  return true
}

function isObject(object) {
  return object != null && typeof object === 'object'
}
