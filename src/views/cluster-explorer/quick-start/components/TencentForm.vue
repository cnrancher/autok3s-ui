<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <CredentialSelectForm
      v-show="showKeyForm"
      v-model="credentialValue"
      class="sm:col-span-2"
      provider="tencent"
      required
      label="Tencent Credential"
      :desc="desc"
    />
    <string-form v-model.trim="form.config['master']" label="Master" :desc="desc.config['master']" />
    <string-form v-model.trim="form.config['worker']" label="Worker" :desc="desc.config['worker']" />
    <!-- <k-password-input
      v-show="showKeyForm"
      v-model.trim="form.options['secret-id']"
      label="Secret Id"
      :desc="desc.options['secret-id']"
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
  return props.hasError || !props.initValue.options['secret-id'] || !props.initValue.options['secret-key']
})
const credentialValue = computed({
  get() {
    return {
      'secret-id': form.options['secret-id'],
      'secret-key': form.options['secret-key']
    }
  },
  set(v) {
    form.options['secret-id'] = v['secret-id']
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
