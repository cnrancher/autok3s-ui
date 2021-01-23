<template>
<div>
  <div class="credential-form">
    <k-select
      v-model="provider"
      label="Provider"
      required
      :loading="loading"
      :disabled="!!credencialId"
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
        v-model.trim="form[p][v.secret]"
        :label="startCase(v.secret)"
        required
        v-show="p === provider"
      />
      <password-input
        v-model.trim="form[p][v.key]"
        :label="startCase(v.key)"
        required
        v-show="p === provider"
      />
    </template>
  </div>
  <footer-actions>
    <router-link :to="{name: 'ClusterExplorerSettingsCredentials'}" class="btn role-secondary">Cancel</router-link>
    <k-button class="bg-primary" :loading="loading" @click="saveCredential">{{credencialId ? 'Save':'Create'}}</k-button>
  </footer-actions>
  <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
</div>
</template>
<script>
import {computed, defineComponent, reactive, ref, watchEffect} from 'vue'
import { useRouter } from 'vue-router'
import {startCase} from 'lodash-es'
import useProviderKeyMap from '../composables/useProviderKeyMap.js'
import useProviders from '@/composables/useProviders.js'
import useCredentials from '@/composables/useCredentials.js'
import { createCredential,updateCredential } from '@/api/credential';
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
    },
  },
  setup(props) {
    const router = useRouter()
    const {providerKeyFieldMap} = useProviderKeyMap()
    const {loading: providersLoading, error: providerError, providers} = useProviders()
    const {loading: credentialLoading, error: credentialError, credentials} = useCredentials()
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
      if (!props.credencialId) {
        console.log()
        return credentials.value
          .filter((c) => {
            if (c.provider === 'native') {
              return false
            }
            return !c.secretFields[providerKeyFieldMap[c.provider]?.key]?.default || !c.secretFields[providerKeyFieldMap[c.provider]?.secret].default
          })
          .map((c) => providers.value.find((p) => p.id === c.provider))
      }

      const c = credentials.value.find((c) => c.id === props.credencialId)
      if (!c) {
        return []
      }
      const p = providers.value.find((p) => p.id === c.provider)
      return p ? [p]:[]
    })
    watchEffect(() => {
      if (providerOptions.value.length > 0 && !provider.value) {
        provider.value=providerOptions.value[0]?.id
      }
    })
    const validate = () => {
      if (props.credencialId) {
        return true
      }
      const errors = Object.entries(form[provider.value] ?? {}).reduce((t, [k, v]) => {
        if (!v) {
          t.push(`"${startCase(k)}" is required`)
        }
        return t
      }, [])
      formErrors.value = errors
      return errors.length === 0
    }
    const saveCredential = async () => {
      if (!validate()) {
        return
      }
      saving.value = true
      const postData = {
        provider: provider.value,
        secrets: form[provider.value]
      }
      try {
        if (props.credencialId) {
          await updateCredential(provider.value, postData)
        } else {
          await createCredential(postData)
        }
      } catch (err) {
        formErrors.value = [stringify(err)]
      }
      saving.value = false
      router.push({name: 'ClusterExplorerSettingsCredentials'})
    }
    return {
      form,
      provider,
      providerOptions,
      loading,
      errors,
      startCase,
      saveCredential,
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