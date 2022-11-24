<script setup>
import useProviderCredentials from '@/composables/useProviderCredentials.js'
import { toRef, computed, reactive, watch } from 'vue'
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
const selectedCredential = computed(() => {
  const key = filedMap.value?.key
  const sk = filedMap.value?.secret
  const v = props.modelValue?.[key]
  const sv = props.modelValue?.[sk]
  return credentials.value.find((c) => c.secrets[key] === v && c.secrets[sk] === sv)
})
const hasValue = computed(() => {
  return !!props.modelValue?.[filedMap.value?.key]
})
const credentialError = computed(() => {
  if (!props.required) {
    return ''
  }
  if (!hasValue.value) {
    return `"${props.label}" is required`
  }
  if (!loading.value && hasValue.value && !selectedCredential.value) {
    return `"${props.modelValue?.[filedMap.value?.key]}" does not exist`
  }

  return ''
})
const credential = computed({
  get() {
    const key = filedMap.value?.key
    return selectedCredential.value?.secrets[key]
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
const customSecret = computed(() => {
  return hasValue.value && !selectedCredential.value
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
const form = reactive({})
watch(
  () => props.modelValue,
  (v) => {
    Object.assign(form, v)
  },
  { immediate: true }
)
const handleChanged = () => {
  const k = filedMap.value?.key
  const s = filedMap.value?.secret
  const d = { [k]: form[k], [s]: form[s] }
  emit('update:modelValue', d)
  emit('change', d)
}

const capitalize = (s) => `${s.slice(0, 1).toUpperCase()}${s.slice(1)}`
const formLabel = computed(() => {
  const k = (filedMap.value?.key ?? '').split('-').map(capitalize).join(' ')
  const s = (filedMap.value?.secret ?? '').split('-').map(capitalize).join(' ')

  return { key: k, secret: s }
})
</script>
<template>
  <div>
    <div v-if="!customSecret" class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-center">
      <KSelect
        v-model="credential"
        :label="label"
        :required="required"
        :error="credentialError"
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
      <KButton
        v-if="!disabled && selectedCredential"
        class="role-secondary"
        style="width: fit-content"
        @click="showCredentialModal"
      >
        {{ hasValue ? 'Edit' : 'Create' }} Credential
      </KButton>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-center mt-10px">
      <KPasswordInput
        v-model.trim="form[filedMap?.key]"
        :label="formLabel.key"
        :desc="desc.options[filedMap?.key]"
        :required="required"
        :readonly="disabled"
        @change="handleChanged"
      />
      <KPasswordInput
        v-model.trim="form[filedMap?.secret]"
        :label="formLabel.secret"
        :desc="desc.options[filedMap?.secret]"
        :required="required"
        :readonly="disabled"
        @change="handleChanged"
      />
    </div>
    <div>
      {{ error }}
    </div>
  </div>
</template>
