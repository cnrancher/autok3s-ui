import { computed } from 'vue'

export function useSuseLinuxImages(data) {
  const nameMap = computed(() => {
    const images = data.value.find((item) => item.platform === 'suseLinux')?.data ?? []
    const archReg = /-x86_64|-arm64/
    return images.reduce((t, c) => {
      const name = c.Name.replace(archReg, '')
      const d = t.get(name) ?? []
      d.push(c)
      t.set(name, d)
      return t
    }, new Map())
  })

  const versionMap = computed(() => {
    const nameReg = /(.+)-(v[0-9.]+)-(.+)/
    const versionMap = [...nameMap.value.keys()].reduce((t, c) => {
      const m = c.match(nameReg)
      if (m) {
        const name = `${m[1]}-${m[3]}`
        const buildVersion = m[2]

        const tmp = t.get(name) ?? []
        tmp.push(buildVersion)
        t.set(name, tmp)
      }

      return t
    }, new Map())

    const nameFilterReg = /^suse-sles-[0-9]+-sp[0-9]+-hvm-ssd$/
    return [...versionMap.keys()]
      .filter((n) => nameFilterReg.test(n))
      .reduce((t, c) => {
        const v = versionMap.get(c)
        v.sort()
        v.reverse()
        t.set(c, v)
        return t
      }, new Map())
  })

  const versionReg = /-([0-9]+)-(sp[0-9]+)-/
  const versionOptions = computed(() => {
    const keys = [...versionMap.value.keys()]
    keys.sort()
    keys.reverse()
    return keys
      .filter((item, index, a) => {
        if (index === 0) {
          return true
        }
        const m1 = item.match(versionReg)
        const m2 = a[index - 1].match(versionReg)
        if (m1?.[1] === m2?.[1]) {
          return false
        }
        return true
      })
      .map((item) => {
        const m = item.match(versionReg)

        return {
          label: `SUSE Linux Enterprise Server ${m?.[1]} ${m?.[2]?.toUpperCase()}`,
          value: item
        }
      })
  })

  const getImageName = (versionPrefix, buildVersion) => {
    const tmp = versionPrefix.split('-')
    tmp.splice(-2, 0, buildVersion)
    return tmp.join('-')
  }

  return {
    versionOptions,
    nameMap,
    versionMap,
    getImageName
  }
}
