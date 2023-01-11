<script setup>
import { computed } from 'vue'
import { cloneDeep } from '@/utils'
import { useDescFromSchema } from '@/views/composables/useFormFromSchema.js'
import useProviderAsyncForm from '@/views/components/providerForm/hooks/useProviderAsyncForm.js'
const props = defineProps({
  cluster: {
    type: Object,
    required: true
  },
  provider: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})
const asyncComponents = useProviderAsyncForm()
const desc = computed(() => {
  return useDescFromSchema(props.provider)
})

const initForm = computed(() => {
  const clone = cloneDeep(props.cluster)
  const form = {
    config: Object.keys(clone)
      .filter(
        (k) =>
          ![
            'options',
            'id',
            'actions',
            'status',
            'type',
            'links',
            'provider',
            'token',
            'ip',
            'cluster-cidr',
            'is-ha-mode',
            'datastore-type'
          ].includes(k)
      )
      .reduce((r, k) => {
        r[k] = clone[k]
        return r
      }, {}),
    options: clone.options
  }
  return form
})
</script>
<template>
  <component
    :is="asyncComponents[provider.id]"
    :init-value="initForm"
    :desc="desc.desc"
    :readonly="readonly"
  ></component>
</template>
