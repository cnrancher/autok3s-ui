<script setup>
import useSettingStore from '@/store/useSettingStore.js'
import { computed } from 'vue'
import { toggleHelmDashboard } from '@/api/setting.js'
import useTableState from '@/composables/useTableState.js'
import useDataSearch from '@/composables/useDataSearch.js'
import FeatureStateTag from './FeatureStateTag.vue'
import { storeToRefs } from 'pinia'
import TableCaptions from '@/views/components/TableCaption.vue'
import FeatureActions from './FeatureActions.vue'
import DOMPurify from 'dompurify'

const settingStore = useSettingStore()
const { loading, error, data: settings } = storeToRefs(settingStore)
const helmDashboardEnabled = computed(() => {
  return settings.value.find((s) => s.id === 'helm-dashboard-enabled')
})
const helmDashboardState = computed(() => {
  return helmDashboardEnabled.value?.value === 'true' ? 'active' : 'deactive'
})

const d = computed(() => {
  return [
    {
      ...helmDashboardEnabled.value,
      name: 'helm-dashboard',
      description:
        '<a class="text-light-blue-500" target="_blank" href="https://github.com/komodorio/helm-dashboard">Helm Dashboard</a> is an open-source project which offers a UI-driven way to view the installed Helm charts',
      state: helmDashboardState.value,
      raw: helmDashboardEnabled.value
    }
  ]
})

const { searchQuery, searchFields, dataMatchingSearchQuery: data } = useDataSearch(d)
searchFields.value = ['name']
const { state } = useTableState(loading, error, settings, data)

const handleCommand = ({ command, data }) => {
  const d = data[0]
  switch (command) {
    case 'active':
      d.value = 'true'
      toggleHelmDashboard(d)
      break
    case 'deactivate':
      d.value = 'false'
      toggleHelmDashboard(d)
      break
  }
}

const ALLOWED_TAGS = ['code', 'li', 'a', 'p', 'b', 'br', 'ul', 'pre', 'span', 'div', 'i', 'em', 'strong']
const purifyHTML = (value) => DOMPurify.sanitize(value, { ALLOWED_TAGS })
const vCleanHtml = {
  mounted(el, binding) {
    el.innerHTML = purifyHTML(binding.value)
  },
  updated(el, binding) {
    el.innerHTML = purifyHTML(binding.value)
  },
  beforeUnmount(el) {
    el.innerHTML = ''
  }
}
</script>
<template>
  <TableCaptions v-model:query="searchQuery"></TableCaptions>
  <KTable :data="data" :state="state">
    <KTableColumn sortable label="State" field="state">
      <template #default="{ row }">
        <FeatureStateTag :status="row.state"></FeatureStateTag>
      </template>
    </KTableColumn>
    <KTableColumn sortable label="Name" field="name"></KTableColumn>
    <KTableColumn sortable label="Description" field="description">
      <template #default="{ row }">
        <span v-clean-html="row.description"></span>
      </template>
    </KTableColumn>
    <KTableColumn type="action" field="action" width="30">
      <template #default="{ row }">
        <FeatureActions :feature="row.raw" @exec-command="handleCommand"></FeatureActions>
      </template>
    </KTableColumn>
  </KTable>
</template>
