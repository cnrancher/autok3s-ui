<script setup>
import { computed } from 'vue'
import { cloneDeep } from '@/utils'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
import useProviderClusterStores from '@/store/useProviderClusterStores.js'
import useProviderAsyncForm from '@/views/components/providerForm/hooks/useProviderAsyncForm.js'
import { EXCLUDED_KEYS_FOR_CLUSTER_FORM } from '@/utils/constants.js'

const props = defineProps({
  provider: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const providerClusterStores = useProviderClusterStores()
const asyncComponents = useProviderAsyncForm()
const defaultFormAndDesc = computed(() => {
  return useFormFromSchema(props.provider)
})

const initForm = computed(() => {
  const quickStartForm = providerClusterStores[props.provider.id]?.formHistory?.[0]
  if (quickStartForm) {
    const { config = {}, options = {} } = cloneDeep(quickStartForm)
    const form = {
      config: Object.keys(config)
        .filter((k) => !EXCLUDED_KEYS_FOR_CLUSTER_FORM.includes(k))
        .reduce((r, k) => {
          r[k] = config[k]
          return r
        }, {}),
      options: options
    }
    return form
  }
  return defaultFormAndDesc.value.form
})
</script>
<template>
  <component
    :is="asyncComponents[provider.id]"
    :init-value="initForm"
    :desc="defaultFormAndDesc.desc"
    :readonly="readonly"
  ></component>
</template>
