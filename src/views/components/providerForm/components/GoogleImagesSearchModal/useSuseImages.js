import { computed, unref } from 'vue'

export function useSuseImages(data) {
  const suseimages = computed(() => {
    const d = unref(data)
    return d.find((item) => item.value === 'suse-cloud')?.data ?? []
  })

  const nameMap = computed(() => {
    const images = suseimages.value
    const archReg = /-arm64|-x86-64/
    return images.reduce((t, c) => {
      const n = c.name.replace(archReg, '')
      const d = t.get(n) ?? []
      d.push(c)
      t.set(n, d)

      return t
    }, new Map())
  })

  const versionMap = computed(() => {
    const nameReg = /(.+)-(v[0-9a-z]+)/
    return [...nameMap.value.keys()].reduce((t, c) => {
      const m = c.match(nameReg)
      if (m) {
        const name = m[1]
        const buildVersion = m[2]

        const tmp = t.get(name) ?? []
        tmp.push(buildVersion)

        t.set(name, tmp)
      }

      return t
    }, new Map())
  })

  const versionOptionReg = /-([0-9]+)-(sp[0-9]+)/
  const versionOptions = computed(() => {
    const keys = [...versionMap.value.keys()]
    keys.sort()
    keys.reverse()
    return keys
      .filter((item, index, a) => {
        if (index === 0) {
          return true
        }
        const m1 = item.match(versionOptionReg)
        const m2 = a[index - 1].match(versionOptionReg)
        if (m1?.[1] === m2?.[1]) {
          return false
        }
        return true
      })
      .map((item) => {
        const m = item.match(versionOptionReg)

        return {
          label: `SUSE Linux Enterprise Server ${m?.[1]} ${m?.[2]?.toUpperCase()}`,
          value: item
        }
      })
  })

  const archReg = /v[0-9]+-(.+)/
  const getImageName = (versionPrefix, buildVersion) => {
    return `${versionPrefix}-${buildVersion}`
  }
  const parseArch = (image) => {
    return image.name.match(archReg)?.[1]
  }

  return {
    versionOptions,
    nameMap,
    versionMap,
    getImageName,
    parseArch
  }
}
