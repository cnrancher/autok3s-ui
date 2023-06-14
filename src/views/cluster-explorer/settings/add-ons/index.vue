<template>
  <PageHeader>
    <template #title>Add-ons</template>
    <template #actions>
      <router-link :to="{ name: 'ClusterExplorerSettingsAddOnsCreate' }" class="btn role-primary">Create</router-link>
    </template>
  </PageHeader>
  <AddonsTable></AddonsTable>
</template>
<script setup>
import PageHeader from '@/views/components/PageHeader.vue'
import AddonsTable from './components/AddonsTable.vue'
</script>
