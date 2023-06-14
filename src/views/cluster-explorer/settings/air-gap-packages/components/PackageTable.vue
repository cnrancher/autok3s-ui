<template>
  <div>
    <TableCaptions v-model:query="searchQuery">
      <template #actions>
        <PackageBulkActions :packages="selectedPackages" @exec-command="handleCommand"></PackageBulkActions>
      </template>
    </TableCaptions>
    <KTable :data="data" :state="state" @selection-change="handleSelectionChange">
      <KTableColumn type="selection"></KTableColumn>
      <KTableColumn sortable label="Name" field="name"></KTableColumn>
      <KTableColumn sortable label="K3s Version" field="k3sVersion"></KTableColumn>
      <KTableColumn sortable label="Included Archs" field="archs">
        <template #default="{ row }">
          {{ row.archs?.join(', ') }}
        </template>
      </KTableColumn>
      <KTableColumn sortable label="State" field="state"></KTableColumn>
      <KTableColumn type="action" field="action" width="30">
        <template #default="{ row }">
          <PackageActions :package="row" @exec-command="handleCommand"></PackageActions>
        </template>
      </KTableColumn>
      <template #error>
        <div class="flex justify-center flex-col items-center">
          <div>Load air-gap package failed: {{ error }}</div>
          <div>
            Please click
            <button class="btn btn-sm role-secondary" @click="reload">refresh</button>
            button to reload air-gap package data
          </div>
        </div>
      </template>
    </KTable>
    <k-modal v-model="confirmModalVisible">
      <template #title>Are you sure?</template>
      <template #default>
        <div>
          <p>You are attemping to remove the {{ commandParams.length === 1 ? 'Package' : 'Packages' }}:</p>
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
        <k-button class="role-danger" @click="deletePackages(commandParams)">Delete</k-button>
      </template>
    </k-modal>
  </div>
</template>
<script setup>
import PackageActions from './PackageActions.vue'
import PackageBulkActions from './PackageBulkActions.vue'
import useDataSearch from '@/composables/useDataSearch.js'
import useTableState from '@/composables/useTableState.js'
import { stringify } from '@/utils/error.js'
import useNotificationStore from '@/store/useNotificationStore.js'
import { ref, watchEffect } from 'vue'
import TableCaptions from '@/views/components/TableCaption.vue'
import { remove, exportPackage, cancelDownloadPkg, downloadPkg } from '@/api/package.js'
import usePackageStore from '@/store/usePackageStore.js'
import { storeToRefs } from 'pinia'
import EditPackageModal from './EditPackageModal.vue'
import useModal from '@/composables/useModal.js'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'

const wmStore = useWindownManagerStore()
const packageStore = usePackageStore()
const notificationStore = useNotificationStore()
const { loading, error, data: packages } = storeToRefs(packageStore)
const { searchQuery, searchFields, dataMatchingSearchQuery: data } = useDataSearch(packages)
searchFields.value = ['name', 'k3sVersion', 'archs']

const { state } = useTableState(loading, error, packages, data)
const selectedPackages = ref([])
const handleSelectionChange = (rows) => {
  selectedPackages.value = rows
}
const commandParams = ref([])
const confirmModalVisible = ref(false)

const reload = () => {
  packageStore.loadData()
}

const { show } = useModal(EditPackageModal)

const handleCommand = async ({ command, data }) => {
  switch (command) {
    case 'delete':
      commandParams.value = data
      confirmModalVisible.value = true
      break
    case 'edit':
      show({ visible: true, id: data[0]?.id })
      break
    case 'export':
      downloadPackage(data[0].id, data[0].name)
      break
    case 'download':
      try {
        await downloadPkg(data[0].name)
        wmStore.addTab({
          id: `package_log_${data[0]?.id}`,
          component: 'PackageDownloadLogs',
          label: `package log: ${data[0].name}`,
          icon: 'log',
          attrs: {
            package: data[0]?.id
          }
        })
      } catch (err) {
        if (!err) {
          return
        }
        notificationStore.notify({
          type: 'error',
          title: 'Download Package Error',
          content: stringify(err)
        })
      }
      break
    case 'cancelDownload':
      try {
        await cancelDownloadPkg(data[0].name)
      } catch (err) {
        if (!err) {
          return
        }
        notificationStore.notify({
          type: 'error',
          title: 'Cancel Downloading Package Error',
          content: stringify(err)
        })
      }

      break
  }
}

const downloadPackage = async (id, name) => {
  notificationStore.notify({
    type: 'success',
    title: `Exporting Package: ${name}`
  })
  try {
    const resp = await exportPackage(id)
    const contentDisposition = resp.headers['content-disposition']
    const fileName = contentDisposition.slice(contentDisposition.indexOf('filename=') + 'filename='.length)
    const a = document.createElement('a')
    const objUrl = window.URL.createObjectURL(resp.data)
    a.href = objUrl
    a.download = fileName
    a.click()
    setTimeout(() => {
      window.URL.revokeObjectURL(objUrl)
    }, 100)
  } catch (err) {
    notificationStore.notify({
      type: 'error',
      title: 'Export Package Failed',
      content: stringify(err)
    })
  }
}

const deletePackages = async (packages) => {
  confirmModalVisible.value = false
  const results = await Promise.allSettled(packages.map((c) => remove(c.id)))
  const errors = results.filter((p) => p.status === 'rejected').map((p) => p.reason)
  errors.forEach((e) => {
    notificationStore.notify({
      type: 'error',
      title: 'Delete Package Failed',
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
