<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <form-group>
    <template #title>Master</template>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
        <string-form
          v-if="initValue.provider !== 'native'"
          v-model.trim="config['master']"
          label="Master"
          :desc="desc.config['master']"
          :readonly="readonly"
        />
        <command-args
          v-model="config['master-extra-args']"
          :args="masterExtraArgs"
          label="Master Extra Args"
          :desc="desc.config['master-extra-args']"
          :readonly="readonly"
        ></command-args>
      </div>
    </template>
  </form-group>
  <hr class="section-divider" />
  <form-group>
    <template #title>Worker</template>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
        <string-form
          v-if="initValue.provider !== 'native'"
          v-model.trim="config['worker']"
          label="Worker"
          :desc="desc.config['worker']"
          :readonly="readonly"
        />
        <string-form
          v-model.trim="config['worker-extra-args']"
          label="Worker Extra Args"
          :desc="desc.config['worker-extra-args']"
          :readonly="readonly"
          placeholder="e.g. --node-taint key=value:NoExecute"
        />
      </div>
    </template>
  </form-group>
</template>
<script setup>
import { provide, toRef, reactive, watch } from 'vue'
import StringForm from './StringForm.vue'
import FormGroup from './FormGroup.vue'
import CommandArgs from './CommandArgs/index.vue'
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
  readonly: {
    type: Boolean,
    default: false
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const visible = toRef(props, 'visible')
provide('parentVisible', visible)
const config = reactive({})
const configFields = ['master', 'master-extra-args', 'worker', 'worker-extra-args']

watch(
  configFields.map((k) => {
    return () => props.initValue.config[k]
  }),
  () => {
    configFields.forEach((k) => {
      config[k] = props.initValue.config[k]
    })
    if (config['master'] === '0') {
      config['master'] = '1'
    }
  },
  { immediate: true }
)

const getForm = () => {
  return configFields.map((k) => {
    let value = config[k]
    return {
      path: ['config', k],
      value
    }
  })
}
useFormRegist(getForm)

const masterExtraArgs = [
  {
    long: '--no-deploy',
    alias: 'disable',
    multiple: true,
    values: ['coredns', 'servicelb', 'traefik', 'local-storage', 'metrics-server'],
    modelValue: '',
    desc: 'Do not deploy packaged components (valid items: coredns, servicelb, traefik, local-storage, metrics-server)'
  },
  {
    long: '--flannel-backend',
    alias: 'flannel-backend',
    values: ['none', 'vxlan', 'ipsec', 'host-gw', 'wireguard'],
    modelValue: 'vxlan',
    desc: `(networking) One of 'none', 'vxlan', 'ipsec', 'host-gw', or 'wireguard' (default: "vxlan")`
  }
]
</script>
