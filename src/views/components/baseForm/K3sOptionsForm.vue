<template>
  <form-group>
    <template #title>Basic</template>
    <template #default>
      <div class="grid grid-cols-2 gap-10px">
        <!-- <string-form
          v-model.trim="form.config['k3s-channel']"
          label="K3s Channel"
          :desc="desc.config['k3s-channel']"
          :readonly="readonly"
        /> -->
        <k-select
          v-model="form.config['k3s-channel']"
          :desc="desc.config['k3s-channel']"
          label="K3s Channel"
          :disabled="readonly"
        >
          <k-option value="stable" label="stable"></k-option>
          <k-option value="latest" label="latest"></k-option>
          <k-option value="testing" label="testing"></k-option>
        </k-select>
        <string-form
          v-model.trim="form.config['k3s-version']"
          label="K3s Version"
          :desc="desc.config['k3s-version']"
          :readonly="readonly"
        />
        <boolean-form
          v-model="form.config['cluster']"
          label="Cluster"
          :desc="desc.config['cluster']"
          :readonly="readonly"
        />
          <string-form
          v-model.trim="form.config['datastore']"
          label="Datastore"
          :desc="desc.config['datastore']"
          :readonly="readonly"
        />
        <k-combo-box
          v-model="form.config['k3s-install-script']"
          label="K3s Install Script"
          :desc="desc.config['k3s-install-script']"
          :disabled="readonly"
          :options="installScriptOptions"
        ></k-combo-box>
      </div>
    </template>
  </form-group>
  <hr class="section-divider">
  <form-group>
    <template #title>Master</template>
    <template #default>
      <div class="grid grid-cols-2 gap-10px">
        <string-form
          v-if="form.provider !== 'native'"
          v-model.trim="form.config['master']"
          label="Master"
          :desc="desc.config['master']"
          :readonly="readonly"
        />
        <!-- <string-form
          v-model.trim="form.config['master-extra-args']"
          label="Master Extra Args"
          :desc="desc.config['master-extra-args']"
          :readonly="readonly"
        /> -->
        <command-args
          :args="masterExtraArgs"
          v-model="form.config['master-extra-args']"
          label="Master Extra Args"
          :desc="desc.config['master-extra-args']"
          :readonly="readonly"
          ></command-args>
      </div>
    </template>
  </form-group>
  <hr class="section-divider">
  <form-group>
    <template #title>Worker</template>
    <template #default>
      <div class="grid grid-cols-2 gap-10px">
        <string-form
          v-if="form.provider !== 'native'"
          v-model.trim="form.config['worker']"
          label="Worker"
          :desc="desc.config['worker']"
          :readonly="readonly"
        />
        <!-- <string-form
          v-model.trim="form.config['worker-extra-args']"
          label="Worker Extra Args"
          :desc="desc.config['worker-extra-args']"
          :readonly="readonly"
        /> -->
        <command-args
          :args="workExtraArgs"
          v-model="form.config['worker-extra-args']"
          label="Worker Extra Args"
          :desc="desc.config['worker-extra-args']"
          :readonly="readonly"
          ></command-args>
      </div>
    </template>
  </form-group>
  <hr class="section-divider">
  <form-group>
    <template #title>Advance</template>
    <template #default>
      <div class="grid grid-cols-2 gap-10px">
        <string-form
          v-model.trim="form.config['token']"
          label="Token"
          :desc="desc.config['token']"
          :readonly="readonly"
        />
        <string-form
          v-model.trim="form.config['manifests']"
          label="Manifests"
          :desc="desc.config['manifests']"
          :readonly="readonly"
        />
        <array-list-form
          v-model="form.config['tls-sans']"
          label="TLS Sans"
          placeholder="e.g. 192.168.1.10"
          action-label="Add IP/Hostname"
          :desc="desc.config['tls-sans']"
          :readonly="readonly"
        />
        <registry-config-form
          class="col-span-2"
          v-model="form.config['registry-content']"
          label="Registry"
          :desc="desc.config['registry-content']"
          :options="{readOnly: readonly}"
        />
      </div>
    </template>
  </form-group>
</template>
<script>
import {defineComponent, provide, toRef, ref, watch} from 'vue'
import StringForm from './StringForm.vue'
import BooleanForm from './BooleanForm.vue'
import RegistryConfigForm from './RegistryConfigForm.vue'
import FormGroup from './FormGroup.vue'
import CommandArgs from './CommandArgs/index.vue'
import ArrayListForm from '../baseForm/ArrayListForm.vue'

export default defineComponent({
  name: 'K3sOptionsForm',
  props: {
    form: {
      type: Object,
      required: true
    },
    desc: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const visible = toRef(props, 'visible')
    provide('parentVisible', visible)
    const installScriptOptions = [
      'https://get.k3s.io',
      'http://rancher-mirror.cnrancher.com/k3s/k3s-install.sh',
    ]
    watch(() => props.form.config['k3s-install-script'],(installScript) => {
      if (installScript === installScriptOptions[1]) {
        props.form.config['k3s-install-mirror'] = 'INSTALL_K3S_MIRROR=cn'
      } else if (props.form.config['k3s-install-mirror']) {
        props.form.config['k3s-install-mirror'] = ''
      }
    }, {
      immediate: true
    })
    const masterExtraArgs = [{
      long: '--docker',
      alias: 'runtime',
      flag: true,
      values: ['docker', 'containerd'],
      modelValue: true,
      desc: '(agent/runtime) Automatic install docker on VM and use docker instead of containerd'
    }, {
      long: '--no-deploy',
      alias: 'disable',
      multiple: true,
      values: [
        'coredns', 'servicelb', 'traefik','local-storage', 'metrics-server'
      ],
      modelValue: '',
      desc: 'Do not deploy packaged components (valid items: coredns, servicelb, traefik, local-storage, metrics-server)'
    }, {
      long: '--flannel-backend',
      alias: 'flannel-backend',
      values: ['none', 'vxlan', 'ipsec', 'host-gw', 'wireguard'],
      modelValue: 'vxlan',
      desc: `(networking) One of 'none', 'vxlan', 'ipsec', 'host-gw', or 'wireguard' (default: "vxlan")`
    }]
    const workExtraArgs = [{
      long: '--docker',
      alias: 'runtime',
      flag: true,
      values: ['docker', 'containerd'],
      modelValue: true,
      desc: '(agent/runtime) Use docker instead of containerd'
    }]
    return {
      masterExtraArgs,
      workExtraArgs,
      installScriptOptions,
    }
  },
  components: {
    StringForm,
    BooleanForm,
    RegistryConfigForm,
    FormGroup,
    CommandArgs,
    ArrayListForm,
  }
})
</script>

