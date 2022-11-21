<template>
  <div>
    <page-header>
      <template #title>
        <router-link :to="{ name: 'ClusterExplorerSettingsCredentials' }">Credential:</router-link>
        Edit
      </template>
    </page-header>
    <credential-form :credencial-id="credentialId"></credential-form>
  </div>
</template>
<script>
import { defineComponent } from 'vue'
import PageHeader from '@/views/components/PageHeader.vue'
import CredentialForm from '../components/CredentialEditForm.vue'

export default defineComponent({
  name: 'CredentialEdit',
  components: {
    PageHeader,
    CredentialForm
  },
  props: {
    credentialId: {
      type: [String, Number],
      required: true
    }
  }
})
</script>
