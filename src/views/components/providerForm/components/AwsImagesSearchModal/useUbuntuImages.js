import { computed } from 'vue'

export function useUbuntuImages(data) {
  const nameMap = computed(() => {
    const images = data.value.find((item) => item.platform === 'ubuntu')?.data ?? []
    const archReg = /-amd64-|-arm64-/
    return images.reduce((t, c) => {
      const name = c.Name.replace(archReg, '-')
      const d = t.get(name) ?? []
      d.push(c)
      t.set(name, d)
      return t
    }, new Map())
  })
  const versionMap = computed(() => {
    const nameReg = /(.+)-server-([0-9.]+)/
    const versionMap = [...nameMap.value.keys()].reduce((t, c) => {
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

    return [...versionMap.keys()]
      .filter((n) => {
        const [y, m] = n.slice(-5).split('.')
        return y % 2 === 0 && m === '04'
      })
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
      label: `Ubuntu Server ${item.slice(-5)} LTS`,
      value: item
    }))
  })

  const getImageName = (versionPrefix, buildVersion) => {
    return `${versionPrefix}-server-${buildVersion}`
  }
  return {
    versionOptions,
    nameMap,
    versionMap,
    getImageName
  }
}
