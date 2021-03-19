<template>
  <div>
    <page-header>
      <template #title>Clusters</template>
      <template #actions>
        <router-link :to="{name: 'ClusterExplorerCoreClustersCreate'}" class="btn bg-primary">Create</router-link>
      </template>
    </page-header>
    <cluster-table></cluster-table>
  </div>
</template>
<script>
import {defineComponent} from 'vue'
import ClusterTable from './components/ClusterTable.vue'
import PageHeader from '@/views/components/PageHeader.vue'
export default defineComponent({
  components: {
    ClusterTable,
    PageHeader,
  }
})
</script>