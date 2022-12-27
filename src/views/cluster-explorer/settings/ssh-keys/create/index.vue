<template>
  <div>
    <PageHeader>
      <template #title>
        <router-link :to="{ name: 'ClusterExplorerSettingsSshKeys' }">SSH Keys:</router-link>
        Create
      </template>
    </PageHeader>
    <SshKeyForm></SshKeyForm>
  </div>
</template>
<script setup>
import PageHeader from '@/views/components/PageHeader.vue'
import SshKeyForm from '../components/SshKeyForm.vue'
</script>
