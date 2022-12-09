import { computed, unref } from 'vue'

export function useUbuntuProImages(data) {
  const ltsImages = computed(() => {
    const d = unref(data)
    return (
      d.find((item) => item.value === 'ubuntu-os-pro-cloud')?.data.filter((item) => item.family.includes('-lts')) ?? []
    )
  })

  const nameMap = computed(() => {
    const images = ltsImages.value
    const archReg = /-arm64-/
    return images.reduce((t, c) => {
      const n = c.name.replace(archReg, '-')
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

  const versionOptionReg = /ubuntu-pro(?:-([a-zA-Z]+))?-([0-9]{4})/
  const versionOptions = computed(() => {
    return [...versionMap.value.keys()].map((item) => {
      const m = item.match(versionOptionReg)
      if (m) {
        const o = m[1]
        const v = m[2]

        return {
          label: `Ubuntu ${v.slice(0, 2)}.${v.slice(2)} LTS Pro ${o ? o.toUpperCase() : ''} Server`,
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
    return 'amd64'
  }

  return {
    versionOptions,
    nameMap,
    versionMap,
    getImageName,
    parseArch
  }
}
