<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <CredentialSelectForm
      v-show="showKeyForm"
      v-model="credentialValue"
      class="sm:col-span-2"
      provider="aws"
      required
      label="AWS Credential"
      :desc="desc"
    />
    <string-form v-model.trim="form.config['master']" label="Master" :desc="desc.config['master']" />
    <string-form v-model.trim="form.config['worker']" label="Worker" :desc="desc.config['worker']" />
    <!-- <k-password-input
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
    /> -->
    <string-form v-model.trim="form.options.region" label="Region" :desc="desc.options.region" disabled />
    <string-form v-model.trim="form.options.zone" label="Zone" :desc="desc.options.zone" disabled />
  </div>
</template>
<script setup>
import { computed, watch, reactive } from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import { cloneDeep } from '@/utils'
import useFormRegist from '@/composables/useFormRegist.js'
import CredentialSelectForm from '@/views/components/baseForm/CredentialSelectForm.vue'

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
const form = reactive(cloneDeep(props.initValue))
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options } = cloneDeep(props.initValue))
  }
)
const showKeyForm = computed(() => {
  return props.hasError || !props.initValue.options['access-key'] || !props.initValue.options['secret-key']
})
const credentialValue = computed({
  get() {
    return {
      'access-key': form.options['access-key'],
      'secret-key': form.options['secret-key']
    }
  },
  set(v) {
    form.options['access-key'] = v['access-key']
    form.options['secret-key'] = v['secret-key']
  }
})
const getForm = () => {
  const f = cloneDeep(form)
  return [
    { path: 'config', value: f.config },
    { path: 'options', value: f.options }
  ]
}
useFormRegist(getForm)
</script>
