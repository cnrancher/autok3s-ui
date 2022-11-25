import { computed } from 'vue'

export function useAmazonLinuxImages(data) {
  const nameMap = computed(() => {
    const images = data.value.find((item) => item.platform === 'amazonLinux')?.data ?? []
    const archReg = /-arm64-|-x86_64-/
    return images.reduce((t, c) => {
      const name = c.Name.replace(archReg, '-')
      const d = t.get(name) ?? []
      d.push(c)
      t.set(name, d)
      return t
    }, new Map())
  })

  const versionMap = computed(() => {
    const nameReg = /(.+-hvm)-([0-9.]+)-([a-zA-Z0-9]+)/
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

    return [...versionMap.keys()]
      .filter((item) => item.endsWith('-gp2'))
      .reduce((t, c) => {
        const v = versionMap.get(c)
        v.sort()
        v.reverse()
        t.set(c, v)
        return t
      }, new Map())
  })

  const versionOptions = computed(() => {
    const keys = [...versionMap.value.keys()]
    keys.sort((a, b) => {
      const versionA = a.slice(-5)
      const versionB = b.slice(-5)
      if (versionA < versionB) {
        return 1
      }
      if (versionA > versionB) {
        return -1
      }

      return 0
    })

    return keys.map((item) => ({
      label: `Amazon Linux 2 AMI - Kernel ${item.split('-').slice(-2, -1)}`,
      value: item
    }))
  })

  const getImageName = (versionPrefix, buildVersion) => {
    const tmp = versionPrefix.split('-')
    tmp.splice(-1, 0, buildVersion)
    return tmp.join('-')
  }

  return {
    versionOptions,
    nameMap,
    versionMap,
    getImageName
  }
}
