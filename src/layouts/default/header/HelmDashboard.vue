<script setup>
import useSettingStore from '@/store/useSettingStore.js'
import useProviderClusterStores from '@/store/useProviderClusterStores.js'
import { computed } from 'vue'
import { toggleHelmDashboard } from '@/api/setting.js'
import { cloneDeep } from '@/utils'

const settingStore = useSettingStore()
const providerClusterStores = useProviderClusterStores()
const hasCluster = computed(() => {
  return Object.values(providerClusterStores).filter(({ data }) => data.find((c) => c.status === 'Running')).length > 0
})
const setting = computed(() => {
  return settingStore.data.find((s) => s.id === 'helm-dashboard-enabled')
})
const enabled = computed(() => {
  return setting.value?.value === 'true'
})

const enabledLabel = computed(() => {
  return `Helm Dashboard ${enabled.value ? 'Enabled' : 'Disabled'}`
})

const options = [
  {
    label: 'Enabled',
    value: true
  },
  {
    label: 'Disabled',
    value: false
  }
]

const update = (v) => {
  const d = cloneDeep(setting.value)
  d.value = `${v}`
  toggleHelmDashboard(d)
}
</script>
<template>
  <div>
    <KDropdown v-if="hasCluster">
      <div class="btn btn-sm role-secondary flex items-center cursor-pointer gap-1">
        {{ enabledLabel }}
        <KIcon type="arrow-right" direction="down" />
      </div>
      <template #content>
        <KDropdownMenu v-for="s in options" :key="s.value" @click="update(s.value)">
          <KDropdownMenuItem :class="[enabled === s.value ? 'text-white bg-warm-gray-400' : '']">
            {{ s.label }}
          </KDropdownMenuItem>
        </KDropdownMenu>
      </template>
    </KDropdown>
  </div>
</template>
