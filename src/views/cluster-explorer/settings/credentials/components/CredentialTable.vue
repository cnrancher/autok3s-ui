<template>
<div>
  <div class="credential-table__header">
    <input type="search" placeholder="Filter" class="input-sm credential-table__search k-input-search" v-model="searchQuery">
  </div>
  <k-table
    :data="dataMatchingSearchQuery"
    :state="state"
    group-by="provider"
    @selection-change="handleSelectionChange">
    <k-table-column type="selection"></k-table-column>
    <k-table-column sortable label="Provider" field="provider"></k-table-column>
    <k-table-column
      label="Access Key"
      field="key"></k-table-column>
    <k-table-column
      label="Access Secret"
      field="secret"></k-table-column>
    <k-table-column
      field="action"
      width="30">
      <template #default="{row}">
        <credential-actions :credential="row" @exec-command="handleCommand"></credential-actions>
      </template>
    </k-table-column>
    <template #error>
      <div class="credential-table__error">
        <div>Load credentials failed: {{error}}</div>
        <div>Please click <button class="btn btn-sm role-secondary" @click="reload">refresh</button> button to reload credentials data</div>
      </div>
    </template>
  </k-table>
</div>
</template>
<script>
import {computed, defineComponent, inject, ref, watchEffect} from 'vue'
import { useRouter } from 'vue-router'
import {TableColumn as KTableColumn, Table as KTable} from '@/components/Table'
import KButton from '@/components/Button'
import useCredentials from '@/composables/useCredentials.js'
import useDataSearch from '@/composables/useDataSearch.js'
import useTableState from '@/composables/useTableState.js'
import useProviderKeyMap from '../composables/useProviderKeyMap.js'
import CredentialActions from './CredentialActions.vue'
import KModal from "@/components/Modal"

function accessKeyFieldValue(data, keyMap) {
  const v = data.secretFields[keyMap[data.provider]]?.default ?? '';
  return `${v.slice(0,3)}${v.slice(3).replace(/./g,'*')}`;
}
function accessSecretFieldValue(data, secretMap) {
  const v = data.secretFields[secretMap[data.provider]]?.default ?? '';
  return v.replace(/./g,'*');
}
export default defineComponent({
  setup() {
    const router = useRouter()
    // const notificationStore = inject('notificationStore')
    const {providerKeyMap, providerSecretMap} = useProviderKeyMap()
    const {loading, error, credentials, fetchCredentials} = useCredentials()
    const data = computed(() => {
      return credentials.value
        .filter((c) => c.provider !== 'native')
        .map((c) => ({
          ...c,
          key: accessKeyFieldValue(c, providerKeyMap),
          secret: accessSecretFieldValue(c, providerSecretMap),
        }))
        .filter((c) => c.key && c.secret)
    })
    const {searchQuery, searchFields, dataMatchingSearchQuery} = useDataSearch(data)
    searchFields.value = ['provider']
    const { state }= useTableState(loading, error, data, dataMatchingSearchQuery,)
    const reload = () => {
      fetchCredentials()
    }
    const selectedCredentials = ref([])
    const handleSelectionChange = (rows) => {
      selectedCredentials.value = rows
    }
    const handleCommand = ({command, data}) => {
      switch(command) {
        case 'edit':
          router.push({name: 'ClusterExplorerSettingsEdit', params: {credentialId: data[0].id}})
          break
      }
    }
    const commandParams = ref([])
    const confirmModalVisible = ref(false)
    watchEffect(() => {
      if(confirmModalVisible.value === false) {
        commandParams.value=[]
      }
    })
    return {
      searchQuery,
      dataMatchingSearchQuery,
      error,
      state,
      reload,
      handleCommand,
      confirmModalVisible,
      handleSelectionChange,
      selectedCredentials,
      commandParams,
    }
  },
  components: {
    KModal,
    KTable,
    KTableColumn,
    CredentialActions,
    KButton,
  }
})
</script>
<style>
.credential-table__header {
  display: grid;
  grid-template-areas: "actions search";
  grid-template-columns: 1fr minmax(min-content, 200px);
  padding: 0 0 20px;
}
.credential-table__actions {
  grid-area: actions;
}
.credential-table__search {
  grid-area: search;
}
.credential-table__error {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}
</style>