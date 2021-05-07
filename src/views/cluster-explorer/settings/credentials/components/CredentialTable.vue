<template>
<div>
  <page-header>
    <template #title>
      Credentials
    </template>
    <template #actions>
        <router-link v-if="credentials.length < 3" :to="{name: 'ClusterExplorerSettingsCreate'}" class="btn bg-primary">Create</router-link>
        <tooltip v-else>
          <k-button class="btn bg-primary" disabled>Create</k-button>
          <template #popover>当前版本每个provider仅支持保存一个credential信息</template>
        </tooltip>
      </template>
  </page-header>
  <div class="credential-table__header">
    <credential-bulk-actions
      class="credential-table__actions"
      :credentials="selectedCredentials"
      @exec-command="handleCommand">
    </credential-bulk-actions>
    <radio-group v-model="groupBy">
      <radio-button label="">
        <k-icon type="category" :color="groupBy === '' ? '#fff' : ''"></k-icon>
      </radio-button>
      <radio-button label="provider">
        <k-icon type="folder" :color="groupBy === 'provider' ? '#fff' : ''"></k-icon>
      </radio-button>
    </radio-group>
    <input type="search" placeholder="Filter" class="input-sm credential-table__search k-input-search" v-model="searchQuery">
  </div>
  <k-table
    :data="dataMatchingSearchQuery"
    :state="state"
    :group-by="groupBy"
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
  <k-modal v-model="confirmModalVisible">
      <template #title>Are you sure?</template>
      <template #default>
        <div class="cluster-table__command-confirm">
          <p>You are attemping to remove the {{commandParams.length === 1 ? 'Credencial' : 'Credencials'}}:</p>
          <p>
            <template v-for="(p, index) in commandParams" :key="p.id">
              {{p.provider}}-{{p.id}}
              {{index === commandParams.length - 1 ? '': ','}}
            </template>
          </p>
        </div>
      </template>
      <template #footer>
        <k-button class="role-secondary" @click="confirmModalVisible = false">Cancel</k-button>
        <k-button class="bg-error" @click="deleteCredencials(commandParams)">Delete</k-button>
      </template>
    </k-modal>
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
import { remove } from '@/api/credential.js';
import CredentialActions from './CredentialActions.vue'
import CredentialBulkActions from './CredentialBulkActions.vue'
import KModal from "@/components/Modal"
import PageHeader from '@/views/components/PageHeader.vue'
import Tooltip from '@/components/Tooltip'
import KIcon from '@/components/Icon'
import {RadioGroup, RadioButton} from '@/components/Radio'

function accessKeyFieldValue(data, keyMap) {
  const v = data.secrets[keyMap[data.provider]] ?? '';
  return `${v.slice(0,3)}${v.slice(3).replace(/./g,'*')}`;
}
function accessSecretFieldValue(data, secretMap) {
  const v = data.secrets[secretMap[data.provider]] ?? '';
  return v.replace(/./g,'*');
}
export default defineComponent({
  setup() {
    const router = useRouter()
    const confirmModalVisible = ref(false)
    const commandParams = ref([])
    const notificationStore = inject('notificationStore')
    const {providerKeyMap, providerSecretMap, providerKeyFieldMap} = useProviderKeyMap()
    const {loading, error, credentials, fetchCredentials} = useCredentials()
    const data = computed(() => {
      const providersWithCredential = Object.keys(providerKeyFieldMap)
      return credentials.value
        .filter((c) => providersWithCredential.includes(c.provider))
        .map((c) => ({
          ...c,
          key: accessKeyFieldValue(c, providerKeyMap),
          secret: accessSecretFieldValue(c, providerSecretMap),
        }))
    })
    const {searchQuery, searchFields, dataMatchingSearchQuery} = useDataSearch(data)
    searchFields.value = ['provider']
    const groupBy = ref('provider')
    const { state }= useTableState(loading, error, data, dataMatchingSearchQuery,)
    const reload = () => {
      fetchCredentials()
    }
    const selectedCredentials = ref([])
    const handleSelectionChange = (rows) => {
      selectedCredentials.value = rows
    }
    const deleteCredencials = async (credencials) => {
      confirmModalVisible.value=false
      const results = await Promise.allSettled(credencials.map((c) => remove(c.id)))
      const errors = results
        .filter((p) => p.status === 'rejected')
        .map((p) => p.reason)
      errors.forEach((e) => {
         notificationStore.action.notify({
          type: 'error',
          title: 'Delete Credencial Failed',
          content: stringify(e)
        })
      })
      fetchCredentials()
    }
    const handleCommand = ({command, data}) => {
      switch(command) {
        case 'edit':
          router.push({name: 'ClusterExplorerSettingsEdit', params: {credentialId: data[0].id}})
          break;
        case 'delete':
          commandParams.value = data
          confirmModalVisible.value=true
          break;
      }
    }
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
      deleteCredencials,
      credentials,
      groupBy,
    }
  },
  components: {
    KModal,
    KTable,
    KTableColumn,
    CredentialActions,
    KButton,
    CredentialBulkActions,
    PageHeader,
    Tooltip,
    RadioGroup,
    RadioButton,
    KIcon,
  }
})
</script>
<style>
.credential-table__header {
  display: grid;
  grid-template-areas: "actions btn search";
  grid-template-columns: 1fr auto minmax(min-content, 200px);
  padding: 0 0 20px;
  column-gap: 10px;
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