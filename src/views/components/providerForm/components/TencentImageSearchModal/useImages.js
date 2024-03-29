import { computed, unref } from 'vue'

export function useImages(data, platform) {
  const images = computed(() => {
    const d = unref(data)
    const p = unref(platform)
    return d.find((d) => d.platform === p)?.data ?? []
  })

  const imageArchMap = computed(() => {
    return images.value.reduce((t, c) => {
      const arch = c.Architecture
      const d = t.get(arch) ?? []
      d.push(c)
      t.set(arch, d)

      return t
    }, new Map())
  })
  const arches = computed(() => {
    const a = [...imageArchMap.value.keys()]
    a.sort()
    a.reverse()
    return a
  })

  return {
    images,
    imageArchMap,
    arches
  }
}
