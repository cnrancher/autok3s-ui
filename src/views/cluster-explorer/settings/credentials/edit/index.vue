<template>
  <div>
    <page-header>
      <template #title><router-link :to="{ name: 'ClusterExplorerSettingsCredentials' }">Credential: </router-link>Edit</template>
    </page-header>
    <credential-form :credencialId="credentialId"></credential-form>
  </div>
</template>
<script>
import {defineComponent} from 'vue'
import PageHeader from '@/views/components/PageHeader.vue'
import CredentialForm from '../components/CredentialEditForm.vue'

export default defineComponent({
  name: 'CredentialEdit',
  props: {
    credentialId: {
      type: [String, Number],
      required: true,
    },
  },
  components: {
    PageHeader,
    CredentialForm,
  }
})
</script>