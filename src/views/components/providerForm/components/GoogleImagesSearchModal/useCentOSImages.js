import { computed, unref } from 'vue'

export function useCentOSImages(data) {
  const centOSImages = computed(() => {
    const d = unref(data)
    return d.find((item) => item.value === 'centos-cloud')?.data ?? []
  })

  const nameMap = computed(() => {
    const images = centOSImages.value
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

  const versionOptionReg = /centos(?:-(stream))?-([0-9]+)/
  const versionOptions = computed(() => {
    const keys = [...versionMap.value.keys()]
    keys.sort()
    keys.reverse()
    return keys.map((item) => {
      const m = item.match(versionOptionReg)
      if (m) {
        return {
          label: `CentOS${m[1] ? ' Stream' : ''} ${m[2]}`,
          value: item
        }
      }

      return {
        label: item,
        value: item
      }
    })
  })

  const getImageName = (versionPrefix, buildVersion) => {
    return `${versionPrefix}-${buildVersion}`
  }
  const parseArch = (image) => {
    if (image.family.endsWith('arm64')) {
      return 'arm64'
    }
    return 'x86_64'
  }

  return {
    versionOptions,
    nameMap,
    versionMap,
    getImageName,
    parseArch
  }
}
