<template>
  <!-- <page-header>
    <template #title>
      Credentials
    </template>
    <template #actions>
        <router-link :to="{name: 'ClusterExplorerSettingsCreate'}" class="btn bg-primary">Create</router-link>
      </template>
  </page-header> -->
  <credential-table></credential-table>
</template>
<script setup>
import CredentialTable from './components/CredentialTable.vue'
// import PageHeader from '@/views/components/PageHeader.vue'

</script>
