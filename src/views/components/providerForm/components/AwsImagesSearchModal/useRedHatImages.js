import { computed } from 'vue'

export function useRedHatImages(data) {
  const nameMap = computed(() => {
    const images = data.value.find((item) => item.platform === 'redHat')?.data ?? []
    const archReg = /-x86_64-|-arm64-/
    return images.reduce((t, c) => {
      const name = c.Name.replace(archReg, '-')
      const d = t.get(name) ?? []
      d.push(c)
      t.set(name, d)
      return t
    }, new Map())
  })

  const versionMap = computed(() => {
    const nameReg = /(.+)-([0-9.]{8})-(.+)/
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

    const versionReg = /-([0-9]+[.][0-9]+([.][0-9]+)?)_/
    return [...versionMap.keys()]
      .filter((n) => {
        if (n.indexOf('BETA-') > -1) {
          return false
        }

        const m = n.match(versionReg)
        if (!m) {
          return false
        }

        const master = m[1].split('.')[0]

        return master > 8
      })
      .reduce((t, c) => {
        const v = versionMap.get(c)
        v.sort()
        v.reverse()
        t.set(c, v)
        return t
      }, new Map())
  })

  const namePrefixReg = /(.+-[0-9]+[.][0-9]+([.][0-9]+)?)_/
  const versionOptions = computed(() => {
    const keys = [...versionMap.value.keys()]
    keys.sort()
    keys.reverse()

    return keys.map((item) => {
      const m = item.match(namePrefixReg)
      return {
        label: `Red Hat Enterprise Linux ${m?.[1]}`,
        value: item
      }
    })
  })

  const getImageName = (versionPrefix, buildVersion) => {
    const tmp = versionPrefix.split('-')
    tmp.splice(2, 0, buildVersion)
    return tmp.join('-')
  }

  return {
    versionOptions,
    nameMap,
    versionMap,
    getImageName
  }
}
