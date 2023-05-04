<template>
  <PageHeader>
    <template #title>Packages</template>
    <template #actions>
      <PackageDownloadSource />
      <KButton class="role-primary" @click="showInstallScriptModal">View Install Script</KButton>
      <router-link :to="{ name: 'ClusterExplorerSettingsPackagesCreate' }" class="btn role-primary">Create</router-link>
    </template>
  </PageHeader>
  <PackageTable></PackageTable>
</template>
<script setup>
import PackageTable from './components/PackageTable.vue'
import PageHeader from '@/views/components/PageHeader.vue'
import InstallScriptModal from './components/InstallScriptModal.vue'
import useModal from '@/composables/useModal.js'
import PackageDownloadSource from './components/PackageDownloadSource.vue'

const { show } = useModal(InstallScriptModal)
const showInstallScriptModal = () => {
  show({ visible: true })
}
</script>
