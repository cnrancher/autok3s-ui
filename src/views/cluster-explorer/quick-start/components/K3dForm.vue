<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <string-form v-model.trim="form.config['master']" label="Master" :desc="desc.config['master']" />
    <string-form v-model.trim="form.config['worker']" label="Worker" :desc="desc.config['worker']" />
  </div>
</template>
<script setup>
import { watch, reactive } from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import { cloneDeep } from '@/utils'
import useFormRegist from '@/composables/useFormRegist.js'

const props = defineProps({
  initValue: {
    type: Object,
    required: true
  },
  desc: {
    type: Object,
    required: true
  },
  hasError: {
    type: Boolean,
    default: false
  }
})

const form = reactive({
  provider: '',
  config: {},
  options: {}
})
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options, provider: form.provider } = cloneDeep(props.initValue))
  },
  { immediate: true }
)

const getForm = () => {
  const f = cloneDeep(form)
  return [
    { path: 'config', value: f.config },
    { path: 'options', value: f.options }
  ]
}
useFormRegist(getForm)
</script>
