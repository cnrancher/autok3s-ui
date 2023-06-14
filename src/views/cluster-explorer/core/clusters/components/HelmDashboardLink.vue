<template>
  <a
    v-if="isRunning && enabled && port"
    class="py-3px inline-flex items-center btn btn-xs role-tertiary"
    target="_blank"
    :href="url"
  >
    <tooltip>
      <img class="logo" :src="helmLogo" />
      <template #popover>Go to helm dasboard page</template>
    </tooltip>
  </a>
</template>
<script setup>
import { computed } from 'vue'
import Tooltip from '@/components/Tooltip'
import useSettingStore from '@/store/useSettingStore.js'
import helmLogo from '@/styles/images/brand/helm-logo.svg'

const props = defineProps({
  cluster: {
    type: Object,
    required: true
  }
})

const settingStore = useSettingStore()

const port = computed(() => {
  return settingStore.data.find((s) => s.id === 'helm-dashboard-port')?.value
})

const enabled = computed(() => {
  return settingStore.data.find((s) => s.id === 'helm-dashboard-enabled')?.value === 'true'
})

const isRunning = computed(() => {
  return props.cluster?.status?.toLowerCase() === 'running'
})

const url = computed(() => {
  return `${location.protocol}//${location.hostname}:${port.value}/#context=${props.cluster?.id}`
})
</script>

<style scoped>
.logo {
  object-fit: contain;
  height: 18px;
}
</style>
