<script setup>
import useProviderCredentials from '@/composables/useProviderCredentials.js'
import { toRef, computed } from 'vue'
import useProviderKeyMap from '@/views/cluster-explorer/settings/credentials/composables/useProviderKeyMap.js'
import CredentialModal from '@/views/components/providerForm/credentials/CredentialModal.vue'
import useModal from '@/composables/useModal.js'

const props = defineProps({
  modelValue: {
    type: Object,
    default() {
      return {}
    }
  },
  provider: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  desc: {
    type: Object,
    default() {
      return {}
    }
  }
})
const { providerKeyFieldMap } = useProviderKeyMap()
const p = toRef(props, 'provider')
const emit = defineEmits(['update:modelValue', 'change'])
const { error, loading, credentials, refetch: fetchCredentials } = useProviderCredentials(p)
const filedMap = computed(() => {
  return providerKeyFieldMap[props.provider]
})
const hasValue = computed(() => {
  return !!props.modelValue?.[filedMap.value?.key]
})
const credentialRequired = computed(() => {
  return props.required && !hasValue.value ? `"${props.label}" is required` : ''
})
const credential = computed({
  get() {
    const key = filedMap.value?.key
    const v = props.modelValue?.[key]
    return credentials.value.find((c) => c.secrets[key] === v)?.secrets[key]
  },
  set(v) {
    const f = filedMap.value ?? {}
    const key = f.key
    const secretKey = f.secret
    const c = credentials.value.find((item) => item.secrets[key] === v)
    const d = {
      [key]: c[key],
      [secretKey]: c[secretKey]
    }
    emit('update:modelValue', d)
    emit('change', d)
  }
})

const { show } = useModal(CredentialModal)
const showCredentialModal = () => {
  show({
    desc: props.desc,
    provider: props.provider,
    initValue: { secrets: { ...props.modelValue } },
    mode: hasValue.value ? 'edit' : 'create',
    done(resp) {
      const d = resp.secrets
      emit('update:modelValue', d)
      emit('change', d)
      fetchCredentials()
    }
  })
}
</script>
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-center">
    <KSelect
      v-model="credential"
      :label="label"
      :required="required"
      :error="credentialRequired"
      :disabled="disabled"
      :loading="loading"
    >
      <KOption
        v-for="c in credentials"
        :key="c.id"
        :value="c.secrets[filedMap?.key]"
        :label="c.secrets[filedMap?.key]"
      ></KOption>
    </KSelect>
    <KButton v-if="!disabled" class="role-secondary" style="width: fit-content" @click="showCredentialModal">
      {{ hasValue ? 'Edit' : 'Create' }} Credential
    </KButton>
    <div>
      {{ error }}
    </div>
  </div>
</template>
