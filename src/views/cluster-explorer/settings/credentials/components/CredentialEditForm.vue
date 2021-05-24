<template>
<div>
  <div class="credential-form">
    <k-select
      v-model="provider"
      label="Provider"
      required
      :loading="loading"
      disabled
    >
      <k-option
        v-for="p in providerOptions"
        :label="p.name"
        :value="p.id"
        :key="p"></k-option>
    </k-select>
    <div></div>
    <template v-for="[p, v] in Object.entries(providerKeyFieldMap)"
      :key="p"
      >
      <password-input
        v-model.trim="form[p][v.key]"
        :label="startCase(v.key)"
        required
        v-show="p === provider"
      />
      <password-input
        v-model.trim="form[p][v.secret]"
        :label="startCase(v.secret)"
        required
        v-show="p === provider"
      />
    </template>
  </div>
  <footer-actions>
    <router-link :to="{name: 'ClusterExplorerSettingsCredentials'}" class="btn role-secondary">Cancel</router-link>
    <k-button class="role-primary" :loading="loading" @click="save">Save</k-button>
  </footer-actions>
  <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
</div>
</template>
<script>
import {computed, defineComponent, reactive, ref, toRef, watchEffect} from 'vue'
import { useRouter } from 'vue-router'
import {startCase} from 'lodash-es'
import useProviderKeyMap from '../composables/useProviderKeyMap.js'
import useProviders from '@/composables/useProviders.js'
import useCredencial from '@/composables/useCredencial.js'
import { updateCredential } from '@/api/credential';
import KInput from '@/components/Input'
import { PasswordInput} from '@/components/Input'
import { Select as KSelect, Option as KOption} from '@/components/Select'
import KAlert from '@/components/Alert'
import KButton from '@/components/Button'
import FooterActions from '@/views/components/FooterActions.vue'
import {stringify} from '@/utils/error.js'

export default defineComponent({
  props: {
    credencialId: {
      type: [String, Number],
      required: true,
    },
  },
  setup(props) {
    const router = useRouter()
    const credencialId = toRef(props, 'credencialId')
    const {providerKeyFieldMap} = useProviderKeyMap()
    const {loading: providersLoading, error: providerError, providers} = useProviders()
    const {loading: credentialLoading, error: credentialError, credential} = useCredencial(credencialId)
    const saving = ref(false)
    const form = reactive(Object.entries(providerKeyFieldMap)
      .reduce((t, [k, v]) => {
        t[k] = {
            [v.key]: '',
            [v.secret]: '',
          }
        return t
      }, {}))
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
        form[credential.value.provider] = {...credential.value.secrets}
        provider.value = credential.value.provider
      }
    })
    const validate = () => {
      const errors = Object.entries(form[credential.value.provider] ?? {}).reduce((t, [k, v]) => {
        if (!v) {
          t.push(`"${startCase(k)}" is required`)
        }
        return t
      }, [])
      formErrors.value = errors
      return errors.length === 0
    }
    const save = async () => {
      if (!validate()) {
        return
      }
      saving.value = true
      const postData = {
        provider: credential.value.provider,
        secrets: { ...form[credential.value.provider] }
      }
      try {
        await updateCredential(credential.value.id, postData)
        router.push({name: 'ClusterExplorerSettingsCredentials'})
        return
      } catch (err) {
        formErrors.value = [stringify(err)]
      }
      saving.value = false
      
    }
    return {
      form,
      provider,
      providerOptions,
      loading,
      errors,
      startCase,
      save,
      providerKeyFieldMap,
    }
  },
  components: {
    KAlert,
    KInput,
    PasswordInput,
    KButton,
    KSelect,
    KOption,
    FooterActions,
  }
})
</script>
<style>
.credential-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 10px;
  column-gap: 10px;
}
.credential-form__provider {
  grid-column: 1 / span 2;
}
</style>