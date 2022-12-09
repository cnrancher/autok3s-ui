import { computed, unref } from 'vue'

export function useDebianImages(data) {
  const debianImages = computed(() => {
    const d = unref(data)
    return d.find((item) => item.value === 'debian-cloud')?.data ?? []
  })

  const nameMap = computed(() => {
    const images = debianImages.value
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

  const versionOptions = computed(() => {
    return [...versionMap.value.keys()].map((item) => {
      const tmp = item.split('-')
      return {
        label: `Debian GUN/Linux ${tmp[1]} (${tmp[2]})`,
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
