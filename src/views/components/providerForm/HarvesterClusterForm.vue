<template>
  <!-- fake fields are a workaround for chrome autofill getting the wrong fields -->
  <input style="display: none" autocomplete="new-password" type="password" />
  <k-tabs v-model="acitiveTab" tab-position="left">
    <k-tab-pane label="Instance Options" name="instance">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model.number="form.options['cpu-count']"
              min="1"
              max="1024"
              step="1"
              type="number"
              pattern="^[1-9][0-9]*$"
              label="CPU Count"
              :desc="desc.options['cpu-count']"
              :readonly="readonly"
            />
            <string-form
              v-model.number="memorySize"
              label="Memory Size"
              :desc="desc.options['memory-size']"
              :readonly="readonly"
            >
              <template #suffix>Gi</template>
            </string-form>
            <string-form
              v-model.number="diskSize"
              label="Disk Size"
              :desc="desc.options['disk-size']"
              :readonly="readonly"
            >
              <template #suffix>Gi</template>
            </string-form>
            <string-form
              v-model.number="form.options['disk-bus']"
              label="Disk Bus"
              :desc="desc.options['disk-bus']"
              :readonly="readonly"
            />
            <string-form
              v-model.number="form.options['image-name']"
              label="Image Name"
              :desc="desc.options['image-name']"
              :readonly="readonly"
            />

            <string-form
              v-model.number="form.options['keypair-name']"
              label="Keypair Name"
              :desc="desc.options['keypair-name']"
              :readonly="readonly"
            />

            <string-form
              v-model.number="form.options['vm-namespace']"
              label="VM Namespace"
              :desc="desc.options['vm-namespace']"
              :readonly="readonly"
            />
            <yaml-config-form
              v-model="form.options['kubeconfig-content']"
              class="col-span-1 sm:col-span-2"
              label="Kubeconfig"
              :desc="desc.options['kubeconfig-content']"
              :options="{ readOnly: readonly }"
              :visible="instanceTabVisible"
            />
            <yaml-config-form
              v-model="form.options['user-data']"
              class="col-span-1 sm:col-span-2"
              label="User Data"
              :desc="desc.options['user-data']"
              :options="{ readOnly: readonly }"
              :visible="instanceTabVisible"
            />
          </div>
        </template>
      </form-group>
      <hr class="section-divider" />
      <form-group v-model="networkConfigVisible" :closable="true">
        <template #title>Network</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model.number="form.options['network-name']"
              label="Network Name"
              :desc="desc.options['network-name']"
              :readonly="readonly"
            />
            <string-form
              v-model.number="form.options['network-model']"
              label="Network Model"
              :desc="desc.options['network-model']"
              :readonly="readonly"
            />
            <string-form
              v-model.number="form.options['network-type']"
              label="Network Type"
              :desc="desc.options['network-type']"
              :readonly="readonly"
            />
            <k-select
              v-model="form.options['interface-type']"
              :desc="desc.options['interface-type']"
              label="Interface Type"
              :disabled="readonly"
            >
              <k-option value="bridge" label="bridge"></k-option>
              <k-option value="masquerade" label="masquerade"></k-option>
            </k-select>
            <yaml-config-form
              v-model="form.options['network-data']"
              class="col-span-1 sm:col-span-2"
              label="Network Data"
              :desc="desc.options['network-data']"
              :options="{ readOnly: readonly }"
              :visible="networkConfigVisible"
            />
          </div>
        </template>
      </form-group>
      <hr class="section-divider" />
      <form-group>
        <template #title>SSH</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model.trim="form.config['ssh-user']"
              label="SSH User"
              :desc="desc.config['ssh-user']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.config['ssh-port']"
              label="SSH Port"
              :desc="desc.config['ssh-port']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.config['ssh-key-path']"
              label="SSH Key Path"
              :desc="desc.config['ssh-key-path']"
              :readonly="readonly"
            />
            <div
              class="cursor-pointer grid grid-cols-[auto,auto,1fr] gap-x-10px items-end justify-end"
              @click="toggleVisible"
            >
              <div>Advance</div>
              <a class="text-$link">{{ visible ? 'Hide' : 'Show' }}</a>
              <k-icon type="arrow-right" :direction="visible ? 'down' : ''"></k-icon>
            </div>
            <div v-show="visible" class="contents">
              <k-password-input
                v-model.trim="form.config['ssh-key-passphrase']"
                label="SSH Key Passphrase"
                :desc="desc.config['ssh-key-passphrase']"
                :readonly="readonly"
              />
              <string-form
                v-model.trim="form.config['ssh-cert-path']"
                label="SSH Cert Path"
                :desc="desc.config['ssh-cert-path']"
                :readonly="readonly"
              />
              <k-password-input
                v-model.trim="form.config['ssh-password']"
                label="SSH Password"
                :desc="desc.config['ssh-password']"
                :readonly="readonly"
              />
              <boolean-form
                v-model="form.config['ssh-agent-auth']"
                label="SSH Agent Auth"
                :desc="desc.config['ssh-agent-auth']"
                :readonly="readonly"
              />
            </div>
          </div>
        </template>
      </form-group>
    </k-tab-pane>
    <k-tab-pane label="K3s Options" name="k3s">
      <k3s-options-form
        :visible="acitiveTab === 'k3s'"
        :form="form"
        :desc="desc"
        :readonly="readonly"
      ></k3s-options-form>
    </k-tab-pane>
    <k-tab-pane label="Additional Options" name="additional">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
        <!-- <boolean-form
          v-model="form.config['ui']"
          label="UI"
          :desc="desc.config['ui']"
          :readonly="readonly"
        /> -->
        <k-select
          v-model="uiOptions"
          :desc="desc.config['enable']"
          label="UI"
          :disabled="readonly"
          placeholder="Disable"
          multiple
        >
          <k-option value="explorer" label="explorer"></k-option>
          <k-option value="dashboard" label="dashboard"></k-option>
        </k-select>
      </div>
    </k-tab-pane>
  </k-tabs>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import YamlConfigForm from '../baseForm/YamlConfigForm.vue'
import useFormFromSchema from '../../composables/useFormFromSchema.js'
import { cloneDeep } from '@/utils'
import { parseSi } from '@/utils/units'
import { Base64 } from 'js-base64'

const needDecodeOptionKeys = ['kubeconfig-content', 'network-data', 'user-data']

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const { form, desc } = useFormFromSchema(props.schema)
// decode options
watch(
  () => form.options,
  () => {
    needDecodeOptionKeys.forEach((k) => {
      const v = form.options[k]
      if (v) {
        form.options[k] = Base64.decode(v)
      }
    })
  },
  {
    immediate: true
  }
)

const diskSize = computed({
  get() {
    return parseSi(form.options['disk-size'], { increment: 1024 }) / 1024 ** 3
  },
  set(v) {
    form.options['disk-size'] = `${v}Gi`
  }
})
const memorySize = computed({
  get() {
    return parseSi(form.options['memory-size'], { increment: 1024 }) / 1024 ** 3
  },
  set(v) {
    form.options['memory-size'] = `${v}Gi`
  }
})
const uiOptions = computed({
  get() {
    if (form.config.enable) {
      return form.config.enable
    }
    if (form.config.ui) {
      return ['dashboard']
    }
    return []
  },
  set(v) {
    form.config.enable = v
  }
})
const getForm = () => {
  const f = cloneDeep(form)

  return f
}
const acitiveTab = ref('instance')
const visible = ref(false)
const toggleVisible = () => {
  visible.value = !visible.value
}

const networkConfigVisible = ref(false)
const instanceTabVisible = computed(() => {
  return acitiveTab.value === 'instance'
})

defineExpose({ getForm })
</script>
