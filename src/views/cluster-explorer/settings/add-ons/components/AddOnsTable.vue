<template>
  <TableCaptions v-model:query="searchQuery">
    <template #actions>
      <BulkActions :data="selectedData" @exec-command="handleCommand"></BulkActions>
    </template>
  </TableCaptions>
  <KTable :data="data" :state="state" @selection-change="handleSelectionChange">
    <KTableColumn type="selection"></KTableColumn>
    <KTableColumn sortable label="Name" field="name">
      <template #default="{ row, column }">
        <router-link class="text-$link" :to="{ name: 'ClusterExplorerSettingsAddonsDetail', params: { id: row.id } }">
          {{ row[column.field] }}
        </router-link>
      </template>
    </KTableColumn>
    <KTableColumn sortable label="Description" field="description"></KTableColumn>
    <KTableColumn type="action" field="action" width="30">
      <template #default="{ row }">
        <Actions :value="row" @exec-command="handleCommand"></Actions>
      </template>
    </KTableColumn>
    <template #error>
      <div class="flex justify-center flex-col items-center">
        <div>Load addons failed: {{ error }}</div>
        <div>
          Please click
          <button class="btn btn-sm role-secondary" @click="reload">refresh</button>
          button to reload addons data
        </div>
      </div>
    </template>
  </KTable>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import TableCaptions from '@/views/components/TableCaption.vue'
import Actions from './Actions.vue'
import BulkActions from './BulkActions.vue'
import useAddonStore from '@/store/useAddonStore.js'
import useNotificationStore from '@/store/useNotificationStore.js'
import useDataSearch from '@/composables/useDataSearch.js'
import { storeToRefs } from 'pinia'
import useTableState from '@/composables/useTableState.js'
import ConfirmRemove from '@/views/components/ConfirmRemove.vue'
import useModal from '@/composables/useModal.js'
import { remove as removeAddon } from '@/api/addon.js'
import { stringify } from '@/utils/error.js'

const router = useRouter()
const addonStore = useAddonStore()
const notificationStore = useNotificationStore()
const { show } = useModal(ConfirmRemove)

const { loading, error, data: addons } = storeToRefs(addonStore)
const { searchQuery, searchFields, dataMatchingSearchQuery: data } = useDataSearch(addons)
searchFields.value = ['name']
const { state } = useTableState(loading, error, addons, data)
const reload = () => {
  addonStore.loadData()
}
const remove = async (d) => {
  const results = await Promise.allSettled(d.map((item) => removeAddon(item.id)))
  const errors = results.filter((p) => p.status === 'rejected').map((p) => p.reason)
  errors.forEach((e) => {
    notificationStore.notify({
      type: 'error',
      title: 'Delete Addon Failed',
      content: stringify(e)
    })
  })
}
const handleCommand = async ({ command, data }) => {
  switch (command) {
    case 'edit':
      router.push({ name: 'ClusterExplorerSettingsAddOnsEdit', params: { id: data[0].id } })
      break
    case 'clone':
      router.push({ name: 'ClusterExplorerSettingsAddOnsCreate', query: { id: data[0].id } })
      break
    case 'delete':
      show({
        visible: true,
        resources: data,
        type: 'Addon',
        plural: 'Addons',
        onConfirm: remove
      })
      break
  }
}

const handleSelectionChange = (rows) => {
  selectedData.value = rows
}

const selectedData = ref([])
</script>
