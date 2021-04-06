<template>
  <form-group>
    <template #title>Basic</template>
    <template #default>
      <div class="k3s-options-form__content">
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
      </div>
    </template>
  </form-group>
  <hr class="section-divider">
  <form-group>
    <template #title>Master</template>
    <template #default>
      <div class="k3s-options-form__content">
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
      <div class="k3s-options-form__content">
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
      <div class="k3s-options-form__content">
        <string-form
          v-model.trim="form.config['ip']"
          label="IP"
          :desc="desc.config['ip']"
          :readonly="readonly"
        />
        <string-form
          v-model.trim="form.config['token']"
          label="Token"
          :desc="desc.config['token']"
          :readonly="readonly"
        />
        <registry-config-form
          class="k3s-options-form__registry"
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
import {defineComponent, provide, toRef, ref} from 'vue'
import StringForm from './StringForm.vue'
import BooleanForm from './BooleanForm.vue'
import {Select as KSelect, Option as KOption} from '@/components/Select'
import RegistryConfigForm from './RegistryConfigForm.vue'
import FormGroup from './FormGroup.vue'
import CommandArgs from './CommandArgs/index.vue'

export default defineComponent({
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
    }
  },
  components: {
    StringForm,
    BooleanForm,
    RegistryConfigForm,
    FormGroup,
    KSelect,
    KOption,
    CommandArgs,
  }
})
</script>
<style>
.k3s-options-form__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 10px;
  column-gap: 10px;
}
.k3s-options-form__registry {
  grid-column: 1 / span 2;
}
</style>