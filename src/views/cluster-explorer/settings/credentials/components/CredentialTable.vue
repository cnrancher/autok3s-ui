<template>
  <div>
    <page-header>
      <template #title>Credentials</template>
      <template #actions>
        <router-link
          v-if="credentials.length < providerWithCredentialCount"
          :to="{ name: 'ClusterExplorerSettingsCreate' }"
          class="btn role-primary"
        >
          Create
        </router-link>
        <k-tooltip v-else>
          <k-button class="btn bg-primary" disabled>Create</k-button>
          <template #popover>当前版本每个provider仅支持保存一个credential信息</template>
        </k-tooltip>
      </template>
    </page-header>
    <div class="credential-table__header">
      <credential-bulk-actions
        :credentials="selectedCredentials"
        @exec-command="handleCommand"
      ></credential-bulk-actions>
      <k-radio-group v-model="groupBy">
        <k-radio-button label="">
          <k-icon type="category" :color="groupBy === '' ? '#fff' : ''"></k-icon>
        </k-radio-button>
        <k-radio-button label="provider">
          <k-icon type="folder" :color="groupBy === 'provider' ? '#fff' : ''"></k-icon>
        </k-radio-button>
      </k-radio-group>
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Filter"
        class="focus-visible:outline-none px-12px rounded border hover:bg-gray-100"
      />
    </div>
    <k-table
      :data="dataMatchingSearchQuery"
      :state="state"
      :group-by="groupBy"
      @selection-change="handleSelectionChange"
    >
      <k-table-column type="selection"></k-table-column>
      <k-table-column sortable label="Provider" field="provider">
        <template #default="{ row }">
          <Tooltip append-to-body>
            <img class="w-32px h-21px object-contain" :src="providerIconMap.get(row.provider)" />
            <template #popover>Provider: {{ row.provider }}</template>
          </Tooltip>
        </template>
      </k-table-column>
      <k-table-column label="Access Key" field="key"></k-table-column>
      <k-table-column label="Access Secret" field="secret"></k-table-column>
      <k-table-column field="action" width="30">
        <template #default="{ row }">
          <credential-actions :credential="row" @exec-command="handleCommand"></credential-actions>
        </template>
      </k-table-column>
      <template #error>
        <div class="credential-table__error">
          <div>Load credentials failed: {{ error }}</div>
          <div>
            Please click
            <button class="btn btn-sm role-secondary" @click="reload">refresh</button>
            button to reload credentials data
          </div>
        </div>
      </template>
      <template #group="{ group }">
        <Tooltip append-to-body>
          <img class="w-32px h-21px object-contain" :src="providerIconMap.get(group)" />
          <template #popover>Provider: {{ group }}</template>
        </Tooltip>
      </template>
    </k-table>
    <k-modal v-model="confirmModalVisible">
      <template #title>Are you sure?</template>
      <template #default>
        <div class="cluster-table__command-confirm">
          <p>You are attemping to remove the {{ commandParams.length === 1 ? 'Credencial' : 'Credencials' }}:</p>
          <p>
            <template v-for="(p, index) in commandParams" :key="p.id">
              {{ p.provider }}-{{ p.id }}
              {{ index === commandParams.length - 1 ? '' : ',' }}
            </template>
          </p>
        </div>
      </template>
      <template #footer>
        <k-button class="role-secondary" @click="confirmModalVisible = false">Cancel</k-button>
        <k-button class="role-danger" @click="deleteCredencials(commandParams)">Delete</k-button>
      </template>
    </k-modal>
  </div>
</template>
<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import useCredentials from '@/composables/useCredentials.js'
import useDataSearch from '@/composables/useDataSearch.js'
import useTableState from '@/composables/useTableState.js'
import useProviderKeyMap from '../composables/useProviderKeyMap.js'
import { remove } from '@/api/credential.js'
import CredentialActions from './CredentialActions.vue'
import CredentialBulkActions from './CredentialBulkActions.vue'
import PageHeader from '@/views/components/PageHeader.vue'
import useNotificationStore from '@/store/useNotificationStore.js'
import { stringify } from '@/utils/error.js'
import { useProviderIcon } from '@/views/composables/useProviderIcon.js'
import Tooltip from '@/components/Tooltip'

function accessKeyFieldValue(data, keyMap) {
  const v = data.secrets[keyMap[data.provider]] ?? ''
  return `${v.slice(0, 3)}${v.slice(3).replace(/./g, '*')}`
}
function accessSecretFieldValue(data, secretMap) {
  const v = data.secrets[secretMap[data.provider]] ?? ''
  return v.replace(/./g, '*').slice(0, 50)
}
const providerIconMap = useProviderIcon()
const router = useRouter()
const confirmModalVisible = ref(false)
const commandParams = ref([])
const notificationStore = useNotificationStore()
const { providerKeyMap, providerSecretMap, providerKeyFieldMap } = useProviderKeyMap()
const { loading, error, credentials, fetchCredentials } = useCredentials()
const providerWithCredentialCount = computed(() => {
  return Object.keys(providerKeyFieldMap).length
})
const data = computed(() => {
  const providersWithCredential = Object.keys(providerKeyFieldMap)
  return credentials.value
    .filter((c) => providersWithCredential.includes(c.provider))
    .map((c) => ({
      ...c,
      key: accessKeyFieldValue(c, providerKeyMap),
      secret: accessSecretFieldValue(c, providerSecretMap)
    }))
})
const { searchQuery, searchFields, dataMatchingSearchQuery } = useDataSearch(data)
searchFields.value = ['provider']
const groupBy = ref('provider')
const { state } = useTableState(loading, error, data, dataMatchingSearchQuery)
const reload = () => {
  fetchCredentials()
}
const selectedCredentials = ref([])
const handleSelectionChange = (rows) => {
  selectedCredentials.value = rows
}
const deleteCredencials = async (credencials) => {
  confirmModalVisible.value = false
  const results = await Promise.allSettled(credencials.map((c) => remove(c.id)))
  const errors = results.filter((p) => p.status === 'rejected').map((p) => p.reason)
  errors.forEach((e) => {
    notificationStore.notify({
      type: 'error',
      title: 'Delete Credencial Failed',
      content: stringify(e)
    })
  })
  fetchCredentials()
}
const handleCommand = ({ command, data }) => {
  switch (command) {
    case 'edit':
      router.push({ name: 'ClusterExplorerSettingsEdit', params: { credentialId: data[0].id } })
      break
    case 'delete':
      commandParams.value = data
      confirmModalVisible.value = true
      break
  }
}
watchEffect(() => {
  if (confirmModalVisible.value === false) {
    commandParams.value = []
  }
})
</script>
<style>
.credential-table__header {
  display: grid;
  grid-template-columns: 1fr auto minmax(min-content, 200px);
  padding: 0 0 20px;
  column-gap: 10px;
}
.credential-table__error {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}
</style>
