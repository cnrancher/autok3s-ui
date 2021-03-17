<template>
  <div>
    <page-header>
      <template #title><router-link :to="{ name: 'ClusterExplorerSettingsCredentials' }">Credential: </router-link>Edit</template>
    </page-header>
    <!-- fake fields are a workaround for chrome autofill getting the wrong fields -->
    <input style="display: none" type="text" />
    <input style="display: none" type="password" />
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