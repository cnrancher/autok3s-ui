import { computed, unref } from 'vue'

export function useUbuntuImages(data) {
  const ltsImages = computed(() => {
    const d = unref(data)
    return d.find((item) => item.value === 'ubuntu-os-cloud')?.data.filter((item) => item.family.includes('-lts')) ?? []
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

  const versionOptions = computed(() => {
    const optionMap = [...versionMap.value.keys()].reduce(
      (t, c) => {
        const tmp = c.split('-')
        if (tmp[1] === 'minimal') {
          const normal = t.get('minimal')
          const v = tmp[2]
          normal.push({
            label: `Ubuntu ${v.slice(0, 2)}.${v.slice(2)} LTS Minimal`,
            value: c
          })
        } else {
          const normal = t.get('normal')
          const v = tmp[1]
          normal.push({
            label: `Ubuntu ${v.slice(0, 2)}.${v.slice(2)} LTS`,
            value: c
          })
        }
        return t
      },
      new Map([
        ['normal', []],
        ['minimal', []]
      ])
    )

    return [...optionMap.get('normal'), ...optionMap.get('minimal')]
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
