<template>
  <div>
    <PageHeader>
      <template #title>
        <router-link :to="{ name: 'ClusterExplorerSettingsPackages' }">Air-gap Packages:</router-link>
        Create
      </template>
    </PageHeader>
    <PackageForm></PackageForm>
  </div>
</template>
<script setup>
import PageHeader from '@/views/components/PageHeader.vue'
import PackageForm from '../components/PackageForm.vue'
</script>
