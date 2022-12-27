<template>
  <PageHeader>
    <template #title>SSH Keys</template>
    <template #actions>
      <KButton class="role-primary" @click="showGenerateSshKeyModal">Generate SSH Key</KButton>
      <router-link :to="{ name: 'ClusterExplorerSettingsSshKeysCreate' }" class="btn role-primary">Create</router-link>
    </template>
  </PageHeader>
  <SshKeyTable />
</template>
<script setup>
import SshKeyTable from './components/SshKeyTable.vue'
import PageHeader from '@/views/components/PageHeader.vue'
import GenerateSshKeyModal from './components/GenerateSshKeyModal.vue'
import useModal from '@/composables/useModal.js'

const { show } = useModal(GenerateSshKeyModal)
const showGenerateSshKeyModal = () => {
  show({ visible: true })
}
</script>
