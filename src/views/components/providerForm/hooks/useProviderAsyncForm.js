import { defineAsyncComponent } from 'vue'
const asyncComponents = {
  alibaba: defineAsyncComponent(() => import('../AlibabaClusterForm.vue')),
  aws: defineAsyncComponent(() => import('../AwsClusterForm.vue')),
  google: defineAsyncComponent(() => import('../GoogleClusterForm.vue')),
  harvester: defineAsyncComponent(() => import('../HarvesterClusterForm.vue')),
  k3d: defineAsyncComponent(() => import('../K3dClusterForm.vue')),
  native: defineAsyncComponent(() => import('../NativeClusterForm.vue')),
  tencent: defineAsyncComponent(() => import('../TencentClusterForm.vue'))
}

export default function useProviderAsyncForm() {
  return asyncComponents
}
