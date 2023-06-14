<template>
  <div>
    <TableCaptions v-model:query="searchQuery">
      <template #actions>
        <SshKeyBulkActions :packages="selectedSshKeys" @exec-command="handleCommand" />
      </template>
    </TableCaptions>
    <KTable :data="data" :state="state" @selection-change="handleSelectionChange">
      <KTableColumn type="selection"></KTableColumn>
      <KTableColumn sortable label="Name" field="name"></KTableColumn>
      <KTableColumn sortable label="Has Password" field="has-password"></KTableColumn>
      <KTableColumn type="action" field="action" width="30">
        <template #default="{ row }">
          <SshKeyActions :ssh-key="row" @exec-command="handleCommand" />
        </template>
      </KTableColumn>
      <template #error>
        <div class="flex justify-center flex-col items-center">
          <div>Load SSH Keys failed: {{ error }}</div>
          <div>
            Please click
            <button class="btn btn-sm role-secondary" @click="reload">refresh</button>
            button to reload SSH Keys data
          </div>
        </div>
      </template>
    </KTable>
    <k-modal v-model="confirmModalVisible">
      <template #title>Are you sure?</template>
      <template #default>
        <div>
          <p>You are attemping to remove the {{ commandParams.length === 1 ? 'SSH Key' : 'SSH Keys' }}:</p>
          <p class="text-light-blue-500">
            <template v-for="(p, index) in commandParams" :key="p.id">
              {{ p.name }}
              {{ index === commandParams.length - 1 ? '' : ',' }}
            </template>
          </p>
        </div>
      </template>
      <template #footer>
        <k-button class="role-secondary" @click="confirmModalVisible = false">Cancel</k-button>
        <k-button class="role-danger" @click="deleteSshKeys(commandParams)">Delete</k-button>
      </template>
    </k-modal>
  </div>
</template>
<script setup>
import SshKeyActions from './SshKeyActions.vue'
import SshKeyBulkActions from './SshKeyBulkActions.vue'
import useDataSearch from '@/composables/useDataSearch.js'
import useTableState from '@/composables/useTableState.js'
import { stringify } from '@/utils/error.js'
import useNotificationStore from '@/store/useNotificationStore.js'
import { ref, watchEffect } from 'vue'
import TableCaptions from '@/views/components/TableCaption.vue'
import { remove, exportSshKey } from '@/api/sshKey.js'
import useSshKeyStore from '@/store/useSshKeyStore.js'
import { storeToRefs } from 'pinia'
import { downloadFile } from '@/utils/download.js'

const sshKeyStore = useSshKeyStore()
const notificationStore = useNotificationStore()
const { loading, error, data: sshKeys } = storeToRefs(sshKeyStore)
const { searchQuery, searchFields, dataMatchingSearchQuery: data } = useDataSearch(sshKeys)
searchFields.value = ['name']

const { state } = useTableState(loading, error, sshKeys, data)
const selectedSshKeys = ref([])
const handleSelectionChange = (rows) => {
  selectedSshKeys.value = rows
}
const commandParams = ref([])
const confirmModalVisible = ref(false)

const reload = () => {
  sshKeyStore.loadData()
}

const handleCommand = ({ command, data }) => {
  switch (command) {
    case 'delete':
      commandParams.value = data
      confirmModalVisible.value = true
      break
    case 'export':
      exportSshKeys(data[0].id, data[0].name)
      break
  }
}

const exportSshKeys = async (id, name) => {
  notificationStore.notify({
    type: 'success',
    title: `Exporting SSH Key: ${name}`
  })
  try {
    const resp = await exportSshKey(id)
    const key = resp['ssh-key']
    if (key) {
      const a = id.slice(0, id.indexOf('\n')).split(' ')[1]?.toLowerCase() ?? 'rsa'
      const n = `${name}_id_${a}`
      downloadFile(n, key)
    }
    const pub = resp['ssh-key-public']
    if (pub) {
      const a = pub.split(' ')[0]?.split('-')[1] ?? 'rsa'
      const n = `${name}_id_${a}.pub`
      downloadFile(n, pub)
    }
    const cert = resp['ssh-cert']
    if (cert) {
      downloadFile(`${name}.cert`, pub)
    }
  } catch (err) {
    notificationStore.notify({
      type: 'error',
      title: 'Export SSH Key Failed',
      content: stringify(err)
    })
  }
}

const deleteSshKeys = async (keys) => {
  confirmModalVisible.value = false
  const results = await Promise.allSettled(keys.map((c) => remove(c.id)))
  const errors = results.filter((p) => p.status === 'rejected').map((p) => p.reason)
  errors.forEach((e) => {
    notificationStore.notify({
      type: 'error',
      title: 'Delete SSH Key Failed',
      content: stringify(e)
    })
  })
  // reload()
}
watchEffect(() => {
  if (confirmModalVisible.value === false) {
    commandParams.value = []
  }
})
</script>
<style></style>
