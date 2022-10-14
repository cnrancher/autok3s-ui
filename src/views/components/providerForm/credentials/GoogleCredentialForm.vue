<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
    <StringForm
      v-model.trim="form['service-account']"
      label="Service Account"
      :desc="desc.options['service-account']"
      required
    />
    <StringForm
      v-model.trim="form['service-account-file']"
      label="Service Account File Path"
      :desc="desc.options['service-account-file']"
      required
    />
  </div>
</template>
<script setup>
import Schema from 'async-validator'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import { reactive, watch } from 'vue'
const props = defineProps({
  initValue: {
    type: Object,
    default() {
      return {
        'service-account': '',
        'service-account-file': ''
      }
    }
  },
  desc: {
    type: Object,
    required: true
  }
})

const descriptor = {
  'service-account': {
    required: true,
    message: '"Service Account" is required'
  },
  'service-account-file': {
    required: true,
    message: '"Service Account File" is required'
  }
}
const validator = new Schema(descriptor)
const form = reactive({})
watch(
  () => props.initValue,
  (v) => {
    Object.entries(v).forEach(([k, v]) => {
      form[k] = v
    })
  },
  { immediate: true }
)

const getForm = () => {
  return { ...form }
}
const validate = () => {
  return validator.validate(form)
}
defineExpose({ getForm, validate })
</script>
