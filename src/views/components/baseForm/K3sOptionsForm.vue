<template>
  <form-group>
    <template #title>Basic</template>
    <template #default>
      <div class="k3s-options-form__content">
        <string-form
          v-model.trim="form.config['k3s-channel']"
          label="K3S Channel"
          :desc="desc.config['k3s-channel']"
          :readonly="readonly"
        />
        <string-form
          v-model.trim="form.config['k3s-version']"
          label="K3S Version"
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
        <string-form
          v-model.trim="form.config['master-extra-args']"
          label="Master Extra Args"
          :desc="desc.config['master-extra-args']"
          :readonly="readonly"
        />
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
        <string-form
          v-model.trim="form.config['worker-extra-args']"
          label="Worker Extra Args"
          :desc="desc.config['worker-extra-args']"
          :readonly="readonly"
        />
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
import {defineComponent, provide, toRef} from 'vue'
import StringForm from './StringForm.vue'
import BooleanForm from './BooleanForm.vue'
import RegistryConfigForm from './RegistryConfigForm.vue'
import FormGroup from './FormGroup.vue'

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
  },
  components: {
    StringForm,
    BooleanForm,
    RegistryConfigForm,
    FormGroup,
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