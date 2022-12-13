import { computed, unref } from 'vue'

export function useCentOSImages(data) {
  const images = computed(() => {
    const d = unref(data)
    return d.find((d) => d.platform === 'CentOS')?.data.filter((item) => !item.ImageName.startsWith('TencentOS')) ?? []
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