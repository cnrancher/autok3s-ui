const files = import.meta.glob(['@/styles/images/provider/*.svg', '@/styles/images/provider/*.png'], {
  eager: true,
  as: 'url'
})

const providerIconMap = new Map(
  Object.entries(files).map(([k, v]) => {
    const p = k.slice(k.lastIndexOf('/') + 1, k.lastIndexOf('.'))
    return [p, v]
  })
)

export function useProviderIcon() {
  return providerIconMap
}
