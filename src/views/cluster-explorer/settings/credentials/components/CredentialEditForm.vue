<template>
  <div>
    <div class="grid grid-cols-2 gap-10px">
      <k-select v-model="provider" label="Provider" required :loading="loading" disabled>
        <template #suffix>
          <img class="h-42px w-42px object-contain" :src="providerIconMap.get(provider)" />
        </template>
        <k-option v-for="p in providerOptions" :key="p" :label="p.name" :value="p.id"></k-option>
      </k-select>
      <div></div>
      <template v-for="[p] in Object.entries(providerKeyFieldMap).filter((e) => e[0] !== 'google')" :key="p">
        <k-password-input v-show="p === provider" v-model.trim="form[p].key" :label="form[p].keyLabel" required />
        <k-password-input v-show="p === provider" v-model.trim="form[p].secret" :label="form[p].secretLabel" required />
      </template>
      <string-form
        v-show="'google' === provider"
        v-model.trim="form.google.key"
        :label="form.google.keyLabel"
        required
      />
      <string-form
        v-show="'google' === provider"
        v-model.trim="form.google.secret"
        :label="form.google.secretLabel"
        required
      />
    </div>
    <footer-actions>
      <router-link :to="{ name: 'ClusterExplorerSettingsCredentials' }" class="btn role-secondary">Cancel</router-link>
      <k-button class="role-primary" :loading="loading" @click="save">Save</k-button>
    </footer-actions>
    <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
  </div>
</template>
<script setup>
import { computed, reactive, ref, toRef, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { startCase } from 'lodash-es'
import useProviderKeyMap from '../composables/useProviderKeyMap.js'
import useProviders from '@/composables/useProviders.js'
import useCredencial from '@/composables/useCredencial.js'
import { updateCredential } from '@/api/credential'
import FooterActions from '@/views/components/FooterActions.vue'
import { stringify } from '@/utils/error.js'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import { useProviderIcon } from '@/views/composables/useProviderIcon.js'

const props = defineProps({
  credencialId: {
    type: [String, Number],
    required: true
  }
})
const providerIconMap = useProviderIcon()
const router = useRouter()
const credencialId = toRef(props, 'credencialId')
const { providerKeyFieldMap } = useProviderKeyMap()
const { loading: providersLoading, error: providerError, providers } = useProviders()
const { loading: credentialLoading, error: credentialError, credential } = useCredencial(credencialId)
const saving = ref(false)
const form = reactive(
  Object.entries(providerKeyFieldMap).reduce((t, [k, v]) => {
    t[k] = {
      keyLabel: startCase(v.key),
      secretLabel: startCase(v.secret),
      key: '',
      secret: ''
    }
    return t
  }, {})
)
const provider = ref(null)
const formErrors = ref([])
const loading = computed(() => {
  return saving.value || providersLoading.value || credentialLoading.value
})
const errors = computed(() => {
  const errors = []
  if (providerError.value) {
    errors.push(stringify(providerError))
  }
  if (credentialError.value) {
    errors.push(stringify(credentialError))
  }
  errors.push(...formErrors.value)
  return errors
})
const providerOptions = computed(() => {
  if (loading.value || !credential.value) {
    return []
  }
  return providers.value.filter((p) => p.id === credential.value?.provider)
})
watchEffect(() => {
  if (loading.value) {
    return
  }
  if (credential.value) {
    form[credential.value.provider] = {
      ...form[credential.value.provider],
      key: credential.value.secrets[providerKeyFieldMap[credential.value.provider].key],
      secret: credential.value.secrets[providerKeyFieldMap[credential.value.provider].secret]
    }
    provider.value = credential.value.provider
  }
})
const validate = () => {
  const errors = []
  const { key, secret, keyLabel, secretLabel } = form[credential.value.provider]
  if (!key) {
    errors.push(`"${keyLabel}" is required`)
  }
  if (!secret) {
    errors.push(`"${secretLabel}" is required`)
  }
  formErrors.value = errors
  return errors.length === 0
}
const save = async () => {
  if (!validate()) {
    return
  }
  saving.value = true
  const { key, secret } = form[credential.value.provider]

  const postData = {
    provider: credential.value.provider,
    secrets: {
      [providerKeyFieldMap[provider.value].key]: key,
      [providerKeyFieldMap[provider.value].secret]: secret
    }
  }
  try {
    await updateCredential(credential.value.id, postData)
    router.push({ name: 'ClusterExplorerSettingsCredentials' })
    return
  } catch (err) {
    formErrors.value = [stringify(err)]
  }
  saving.value = false
}
</script>
