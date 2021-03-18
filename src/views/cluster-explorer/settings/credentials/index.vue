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
<script>
import {defineComponent} from 'vue'
import CredentialTable from './components/CredentialTable.vue'
// import PageHeader from '@/views/components/PageHeader.vue'
export default defineComponent({
  name: 'Credentials',
  components: {
    CredentialTable,
    // PageHeader,
  }
})
</script>
