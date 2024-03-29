<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import useTemplateStore from '@/store/useTemplateStore.js'
import { cloneDeep } from '@/utils'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
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

const templateStore = useTemplateStore()
const { data: templates } = storeToRefs(templateStore)
const asyncComponents = useProviderAsyncForm()
const defaultFormAndDesc = computed(() => {
  return useFormFromSchema(props.provider)
})

const defaultTemplate = computed(() => {
  return templates.value?.find((t) => t.provider === props.provider?.id && t['is-default'])
})

const initForm = computed(() => {
  const t = defaultTemplate.value
  if (t) {
    const clone = cloneDeep(t)
    const form = {
      provider: props.provider?.id,
      config: Object.keys(clone)
        .filter((k) => !EXCLUDED_KEYS_FOR_CLUSTER_FORM.includes(k))
        .reduce((r, k) => {
          r[k] = t[k]
          return r
        }, {}),
      options: clone.options
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
