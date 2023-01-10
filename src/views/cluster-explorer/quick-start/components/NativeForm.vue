<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <ip-address-pool-form
      ref="masterIps"
      :init-value="form.options['master-ips']"
      label="Master IPs"
      :desc="desc.options['master-ips']"
      required
    ></ip-address-pool-form>
    <ip-address-pool-form
      ref="workerIps"
      :init-value="form.options['worker-ips']"
      label="Worker IPs"
      :desc="desc.options['worker-ips']"
    ></ip-address-pool-form>
    <div class="sm:col-span-2">
      <HaConfigForm :init-value="form" :desc="desc" />
    </div>
    <string-form v-model.trim="form.config['ssh-user']" label="SSH User" :desc="desc.config['ssh-user']" />
    <string-form v-model.trim="form.config['ssh-key-path']" label="SSH Key Path" :desc="desc.config['ssh-key-path']" />
  </div>
</template>
<script setup>
import { ref, watch, reactive } from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import HaConfigForm from './HaConfigForm.vue'
import IpAddressPoolForm from '@/views/components/baseForm/IpAddressPoolForm.vue'
import { cloneDeep } from '@/utils'
import useFormRegist from '@/composables/useFormRegist.js'
import useFormManage from '@/composables/useFormManage.js'

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
const { getForm: getSubform } = useFormManage()
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
const masterIps = ref(null)
const workerIps = ref(null)
const validate = () => {
  const f = getSubform(form)
  const haMode = masterIps.value.getValue().filter((v) => v).length > 1
  if (haMode && f.config['cluster'] === false && !f.config['datastore']) {
    return ['Only using HA Mode for multiple master nodes.']
  }
  return []
}
const getForm = () => {
  const f = getSubform(form)
  f.options['master-ips'] = masterIps.value
    .getValue()
    .filter((v) => v)
    .join(',')
  f.options['worker-ips'] = workerIps.value
    .getValue()
    .filter((v) => v)
    .join(',')
  if (f.options['master-ips'].split(',').length > 1 && f.config['cluster'] === false && !f.config['datastore']) {
    f.config['cluster'] = true
  }
  delete f.config['worker']
  delete f.config['master']
  return [
    { path: 'config', value: f.config },
    { path: 'options', value: f.options }
  ]
}
useFormRegist(getForm, validate)
</script>
