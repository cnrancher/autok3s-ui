<template>
  <page-header>
    <template #title>
      Templates
    </template>
    <template #actions>
        <router-link :to="{name: 'ClusterExplorerSettingsTemplatesCreate'}" class="btn role-primary">Create</router-link>
      </template>
  </page-header>
  <template-table></template-table>
</template>
<script setup>
import TemplateTable from './components/TemplateTable.vue'
import PageHeader from '@/views/components/PageHeader.vue'
</script>