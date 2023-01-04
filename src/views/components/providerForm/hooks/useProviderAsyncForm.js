// const asyncComponents = {
//   alibaba: defineAsyncComponent(() => import('../AlibabaClusterForm.vue')),
//   aws: defineAsyncComponent(() => import('../AwsClusterForm.vue')),
//   google: defineAsyncComponent(() => import('../GoogleClusterForm.vue')),
//   harvester: defineAsyncComponent(() => import('../HarvesterClusterForm.vue')),
//   k3d: defineAsyncComponent(() => import('../K3dClusterForm.vue')),
//   native: defineAsyncComponent(() => import('../NativeClusterForm.vue')),
//   tencent: defineAsyncComponent(() => import('../TencentClusterForm.vue'))
// }

const files = import.meta.glob('../*ClusterForm.vue', { eager: true, import: 'default' })
const asyncComponents = Object.entries(files).reduce((t, [k, v]) => {
  const p = k.substring(k.lastIndexOf('/') + 1, k.indexOf('ClusterForm.vue')).toLowerCase()
  t[p] = v

  return t
}, {})

export default function useProviderAsyncForm() {
  return asyncComponents
}
