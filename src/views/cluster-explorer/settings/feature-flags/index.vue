<script setup>
import FeatureTable from './components/FeatureTable.vue'
import PageHeader from '@/views/components/PageHeader.vue'
</script>
<template>
  <PageHeader>
    <template #title>Feature Flags</template>
  </PageHeader>
  <FeatureTable></FeatureTable>
</template>
