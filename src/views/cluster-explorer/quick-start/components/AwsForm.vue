<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <string-form v-model.trim="form.config['master']" label="Master" :desc="desc.config['master']" />
    <string-form v-model.trim="form.config['worker']" label="Worker" :desc="desc.config['worker']" />
    <k-password-input
      v-show="showKeyForm"
      v-model.trim="form.options['access-key']"
      label="Access Key"
      :desc="desc.options['access-key']"
      required
    />
    <k-password-input
      v-show="showKeyForm"
      v-model.trim="form.options['secret-key']"
      label="Secret Key"
      :desc="desc.options['secret-key']"
      required
    />
    <string-form v-model.trim="form.options.region" label="Region" :desc="desc.options.region" disabled />
    <string-form v-model.trim="form.options.zone" label="Zone" :desc="desc.options.zone" disabled />
  </div>
</template>
<script setup>
import { computed } from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
import { cloneDeep } from '@/utils'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  hasError: {
    type: Boolean,
    default: false
  }
})

const { form, desc } = useFormFromSchema(props.schema)
const showKeyForm = computed(() => {
  return props.hasError || !props.schema.options['access-key']?.default || !props.schema.options['secret-key']?.default
})
const getForm = () => {
  return cloneDeep(form)
}

defineExpose({ getForm })
</script>
