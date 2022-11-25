import { computed } from 'vue'

export function useDebianImages(data) {
  const nameMap = computed(() => {
    const images = data.value.find((item) => item.platform === 'debian')?.data ?? []
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
    const nameReg = /(.+)-([0-9.]+-[0-9]+)/
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

    const versionReg = /^debian-[0-9]+$/
    return [...versionMap.keys()]
      .filter((n) => versionReg.test(n))
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
    keys.sort()
    keys.reverse()
    return keys.map((item) => ({
      label: `Debian ${item.split('-')[1]}`,
      value: item
    }))
  })

  const getImageName = (versionPrefix, buildVersion) => {
    return `${versionPrefix}-${buildVersion}`
  }

  return {
    versionOptions,
    nameMap,
    versionMap,
    getImageName
  }
}
