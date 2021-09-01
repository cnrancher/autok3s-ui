<template>
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
        <string-form
          v-model.trim="form.config['worker-extra-args']"
          label="Worker Extra Args"
          :desc="desc.config['worker-extra-args']"
          :readonly="readonly"
          placeholder="e.g. --node-taint key=value:NoExecute"
        />
      </div>
    </template>
  </form-group>
</template>
<script>
import {defineComponent, provide, toRef, ref, watch} from 'vue'
import StringForm from './StringForm.vue'
import BooleanForm from './BooleanForm.vue'
import FormGroup from './FormGroup.vue'
import CommandArgs from './CommandArgs/index.vue'
import ArrayListForm from './ArrayListForm.vue'

export default defineComponent({
  name: 'K3dOptionsForm',
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
    return {
      masterExtraArgs,
    }
  },
  components: {
    StringForm,
    BooleanForm,
    FormGroup,
    CommandArgs,
    ArrayListForm,
  }
})
</script>
