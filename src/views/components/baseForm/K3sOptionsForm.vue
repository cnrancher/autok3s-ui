<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <form-group>
    <template #title>Basic</template>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
        <k-select
          v-model="config['k3s-channel']"
          :desc="desc.config['k3s-channel']"
          label="K3s Channel"
          :disabled="readonly"
        >
          <k-option value="stable" label="stable"></k-option>
          <k-option value="latest" label="latest"></k-option>
          <k-option value="testing" label="testing"></k-option>
        </k-select>
        <string-form
          v-model.trim="config['k3s-version']"
          label="K3s Version"
          :desc="desc.config['k3s-version']"
          :readonly="readonly"
        />
        <boolean-form v-model="config['cluster']" label="Cluster" :desc="desc.config['cluster']" :readonly="readonly" />
        <string-form
          v-model.trim="config['datastore']"
          label="Datastore"
          :desc="desc.config['datastore']"
          :readonly="readonly"
        />
        <k-combo-box
          v-model="config['k3s-install-script']"
          label="K3s Install Script"
          :desc="desc.config['k3s-install-script']"
          :disabled="readonly"
          :options="installScriptOptions"
          placeholder="Please Select Or Input..."
        ></k-combo-box>
        <string-form
          v-model.trim="config['system-default-registry']"
          label="System Default Registry"
          :desc="desc.config['system-default-registry']"
          :readonly="readonly"
        />
      </div>
    </template>
  </form-group>
  <hr class="section-divider" />
  <form-group>
    <template #title>Master</template>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-start">
        <string-form
          v-if="initValue.provider !== 'native'"
          v-model.trim="config['master']"
          label="Master"
          :desc="desc.config['master']"
          :readonly="readonly"
        />
        <!-- <string-form
          v-model.trim="config['master-extra-args']"
          label="Master Extra Args"
          :desc="desc.config['master-extra-args']"
          :readonly="readonly"
        /> -->
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
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-start">
        <string-form
          v-if="initValue.provider !== 'native'"
          v-model.trim="config['worker']"
          label="Worker"
          :desc="desc.config['worker']"
          :readonly="readonly"
        />
        <!-- <string-form
          v-model.trim="config['worker-extra-args']"
          label="Worker Extra Args"
          :desc="desc.config['worker-extra-args']"
          :readonly="readonly"
        /> -->
        <command-args
          v-model="config['worker-extra-args']"
          :args="workExtraArgs"
          label="Worker Extra Args"
          :desc="desc.config['worker-extra-args']"
          :readonly="readonly"
        ></command-args>
      </div>
    </template>
  </form-group>
  <hr class="section-divider" />
  <form-group>
    <template #title>Advance</template>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
        <string-form v-model.trim="config['token']" label="Token" :desc="desc.config['token']" :readonly="readonly" />
        <string-form
          v-model.trim="config['manifests']"
          label="Manifests"
          :desc="desc.config['manifests']"
          :readonly="readonly"
        />
        <array-list-form
          ref="tlsSansRef"
          :init-value="config['tls-sans']"
          label="TLS Sans"
          placeholder="e.g. 192.168.1.10"
          action-label="Add IP/Hostname"
          :desc="desc.config['tls-sans']"
          :readonly="readonly"
        />
        <registry-config-form
          v-model="config['registry-content']"
          class="col-span-1 sm:col-span-2"
          label="Registry"
          :desc="desc.config['registry-content']"
          :options="readonlyOption"
        />
      </div>
    </template>
  </form-group>
</template>
<script setup>
import { provide, toRef, watch, computed, ref, reactive } from 'vue'
import StringForm from './StringForm.vue'
import BooleanForm from './BooleanForm.vue'
import RegistryConfigForm from './RegistryConfigForm.vue'
import FormGroup from './FormGroup.vue'
import CommandArgs from './CommandArgs/index.vue'
import ArrayListForm from '../baseForm/ArrayListForm.vue'
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
const readonlyOption = computed(() => {
  return { readOnly: props.readonly }
})
provide('parentVisible', visible)

const tlsSansRef = ref(null)

const config = reactive({})
const configFields = [
  'k3s-channel',
  'k3s-version',
  'cluster',
  'datastore',
  'k3s-install-script',
  'master',
  'master-extra-args',
  'worker',
  'worker-extra-args',
  'token',
  'manifests',
  'tls-sans',
  'registry-content',
  'k3s-install-mirror'
]
watch(
  configFields.map((k) => {
    return () => props.initValue.config[k]
  }),
  () => {
    configFields.forEach((k) => {
      config[k] = props.initValue.config[k]
    })
  },
  { immediate: true }
)

const getForm = () => {
  return configFields.map((k) => {
    let value = config[k]
    if (k === 'tls-sans') {
      value = tlsSansRef.value.getValue()
    }
    return {
      path: ['config', k],
      value
    }
  })
}

useFormRegist(getForm)

const installScriptOptions = ['https://get.k3s.io', 'https://rancher-mirror.oss-cn-beijing.aliyuncs.com/k3s/k3s-install.sh']
watch(
  () => config['k3s-install-script'],
  (installScript) => {
    if (installScript === installScriptOptions[1]) {
      // eslint-disable-next-line vue/no-mutating-props
      config['k3s-install-mirror'] = 'INSTALL_K3S_MIRROR=cn'
    } else if (config['k3s-install-mirror']) {
      // eslint-disable-next-line vue/no-mutating-props
      config['k3s-install-mirror'] = ''
    }
  },
  {
    immediate: true
  }
)
const masterExtraArgs = [
  {
    long: '--docker',
    alias: 'runtime',
    flag: true,
    values: ['docker', 'containerd'],
    modelValue: true,
    desc: '(agent/runtime) Automatic install docker on VM and use docker instead of containerd'
  },
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
const workExtraArgs = [
  {
    long: '--docker',
    alias: 'runtime',
    flag: true,
    values: ['docker', 'containerd'],
    modelValue: true,
    desc: '(agent/runtime) Use docker instead of containerd'
  }
]
</script>
