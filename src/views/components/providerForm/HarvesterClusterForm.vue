<template>
  <KAlert v-for="e in errors" :key="e" type="error" :title="e"></KAlert>
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
            >
              <template #suffix>C</template>
            </string-form>
            <string-form
              v-model.number="memorySize"
              label="Memory Size"
              :desc="desc.options['memory-size']"
              :readonly="readonly"
            >
              <template #suffix>GiB</template>
            </string-form>
            <string-form
              v-model.number="diskSize"
              label="Disk Size"
              :desc="desc.options['disk-size']"
              :readonly="readonly"
            >
              <template #suffix>GiB</template>
            </string-form>
            <!-- <string-form
              v-model.trim="form.options['disk-bus']"
              label="Disk Bus"
              :desc="desc.options['disk-bus']"
              :readonly="readonly"
            /> -->
            <KSelect
              v-model="form.options['disk-bus']"
              label="Disk Bus"
              :desc="desc.options['disk-bus']"
              :disabled="readonly"
              clearable
            >
              <KOption v-for="o in interfaceOption" :key="o.value" :value="o.value" :label="o.label"></KOption>
            </KSelect>
            <!-- <string-form
              v-model.number="form.options['image-name']"
              label="Image Name"
              :desc="desc.options['image-name']"
              :readonly="readonly"
            /> -->

            <k-combo-box
              v-model.trim="form.options['image-name']"
              label="Image Name"
              :desc="desc.options['image-name']"
              :disabled="readonly"
              :options="imageInfo.data"
              :loading="imageInfo.loading"
              placeholder="Please Select Or Input..."
            ></k-combo-box>

            <!-- <string-form
              v-model.trim="form.options['keypair-name']"
              label="Keypair Name"
              :desc="desc.options['keypair-name']"
              :readonly="readonly"
            /> -->

            <k-combo-box
              v-model.trim="form.options['keypair-name']"
              label="Keypair Name"
              :desc="desc.options['keypair-name']"
              :disabled="readonly"
              :options="keyPairInfo.data"
              :loading="keyPairInfo.loading"
              placeholder="Please Select Or Input..."
            ></k-combo-box>

            <!-- <string-form
              v-model.trim="form.options['vm-namespace']"
              label="VM Namespace"
              :desc="desc.options['vm-namespace']"
              :readonly="readonly"
            /> -->
            <k-combo-box
              v-model.trim="form.options['vm-namespace']"
              label="VM Namespace"
              :desc="desc.options['vm-namespace']"
              :disabled="readonly"
              :options="namespaceInfo.data"
              :loading="namespaceInfo.loading"
              placeholder="Please Select Or Input..."
            ></k-combo-box>
            <yaml-config-form
              v-model="form.options['kubeconfig-content']"
              class="col-span-1 sm:col-span-2"
              label="Kubeconfig"
              :desc="desc.options['kubeconfig-content']"
              :options="readonlyOption"
              :visible="instanceTabVisible"
            />
            <yaml-config-form
              v-model="form.options['user-data']"
              class="col-span-1 sm:col-span-2"
              label="User Data"
              :desc="desc.options['user-data']"
              :options="readonlyOption"
              :visible="instanceTabVisible"
              @clear="userDataTemplate = ''"
            >
              <template v-if="userData.length > 0" #default>
                <KSelect
                  v-model="userDataTemplate"
                  placeholder="Select a template..."
                  label="User Data Template"
                  :disabled="readonly"
                  clearable
                  @change="userDataTemplateChange($event)"
                >
                  <KOption v-for="o in userData" :key="o.value" :value="o.value" :label="o.label"></KOption>
                </KSelect>
              </template>
            </yaml-config-form>
          </div>
        </template>
      </form-group>
      <hr class="section-divider" />
      <form-group v-model="networkConfigVisible" :closable="true">
        <template #title>Network</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <!-- <string-form
              v-model.trim="form.options['network-name']"
              label="Network Name"
              :desc="desc.options['network-name']"
              :readonly="readonly"
            /> -->
            <k-combo-box
              v-model.trim="form.options['network-name']"
              label="Network Name"
              :desc="desc.options['network-name']"
              :disabled="readonly"
              :options="networkNameOptions"
              :loading="networkNameInfo.loading"
              placeholder="Please Select Or Input..."
            ></k-combo-box>
            <!-- <string-form
              v-model.number="form.options['network-model']"
              label="Network Model"
              :desc="desc.options['network-model']"
              :readonly="readonly"
            /> -->
            <KSelect
              v-model="form.options['network-model']"
              label="Network Model"
              :desc="desc.options['network-model']"
              :disabled="readonly"
              clearable
            >
              <KOption v-for="o in networkMode" :key="o.value" :value="o.value" :label="o.label"></KOption>
            </KSelect>
            <string-form
              v-model.number="form.options['network-type']"
              label="Network Type"
              :desc="desc.options['network-type']"
              :readonly="readonly"
            />
            <KSelect
              v-model="form.options['interface-type']"
              :desc="desc.options['interface-type']"
              label="Interface Type"
              :disabled="readonly"
            >
              <!-- <k-option value="bridge" label="bridge"></k-option>
              <k-option value="masquerade" label="masquerade"></k-option> -->
              <KOption v-for="o in interfaceType" :key="o.value" :value="o.value" :label="o.label"></KOption>
            </KSelect>
            <yaml-config-form
              v-model="form.options['network-data']"
              class="col-span-1 sm:col-span-2"
              label="Network Data"
              :desc="desc.options['network-data']"
              :options="readonlyOption"
              :visible="networkConfigVisible"
              @clear="networkDataTemplate = ''"
            >
              <template v-if="networkData.length > 0" #default>
                <KSelect
                  v-model="networkDataTemplate"
                  placeholder="Select a template..."
                  label="Network Data Template"
                  :disabled="readonly"
                  clearable
                  @change="networkDataTemplateChange($event)"
                >
                  <KOption v-for="o in networkData" :key="o.value" :value="o.value" :label="o.label"></KOption>
                </KSelect>
              </template>
            </yaml-config-form>
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
        :init-value="form"
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
import { ref, computed, watch, reactive } from 'vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import YamlConfigForm from '../baseForm/YamlConfigForm.vue'
import { cloneDeep } from '@/utils'
import { parseSi } from '@/utils/units'
import { Base64 } from 'js-base64'
import useHarvesterSdk from './hooks/useHarvesterSdk.js'
import { useDebounceFn } from '@vueuse/core'
import useFormManage from '@/composables/useFormManage.js'
import useFormRegist from '@/composables/useFormRegist.js'

const needDecodeOptionKeys = ['kubeconfig-content', 'network-data', 'user-data']
const MANAGEMENT_NETWORK = 'management Network'

const props = defineProps({
  desc: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  },
  initValue: {
    type: Object,
    required: true
  }
})

const form = reactive({
  config: {},
  options: {}
})
// decode options
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options } = cloneDeep(props.initValue))
    needDecodeOptionKeys.forEach((k) => {
      const v = form.options[k]
      if (v) {
        form.options[k] = Base64.decode(v)
      }
    })
  },
  { immediate: true }
)
const { getForm: getSubform } = useFormManage()
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
const interfaceOption = ref([
  {
    label: 'VirtIO',
    value: 'virtio'
  },
  {
    label: 'SATA',
    value: 'sata'
  },
  {
    label: 'SCSI',
    value: 'scsi'
  }
])
const networkMode = ref([
  {
    label: 'virtio',
    value: 'virtio'
  },
  {
    label: 'e1000',
    value: 'e1000'
  },
  {
    label: 'e1000e',
    value: 'e1000e'
  },
  {
    label: 'ne2k_pci',
    value: 'ne2k_pci'
  },
  {
    label: 'pcnet',
    value: 'pcnet'
  },
  {
    label: 'rtl8139',
    value: 'rtl8139'
  }
])

const interfaceType = computed(() => {
  const types = [
    {
      label: 'masquerade',
      value: 'masquerade'
    },
    {
      label: 'bridge',
      value: 'bridge'
    }
  ]
  const otherTypes = [
    {
      label: 'bridge',
      value: 'bridge'
    }
  ]
  if (form.options['network-name'] === MANAGEMENT_NETWORK) {
    return types
  }
  return otherTypes
})

const getForm = () => {
  const f = getSubform(form)
  needDecodeOptionKeys.forEach((k) => {
    const v = f.options[k]?.trim()
    if (v) {
      f.options[k] = Base64.encode(v)
    }
  })
  return [
    { path: 'config', value: f.config },
    { path: 'options', value: f.options }
  ]
}
useFormRegist(getForm)
const acitiveTab = ref('instance')
const visible = ref(false)
const toggleVisible = () => {
  visible.value = !visible.value
}

const networkConfigVisible = ref(false)
const instanceTabVisible = computed(() => {
  return acitiveTab.value === 'instance'
})

const readonlyOption = computed(() => {
  return { readOnly: props.readonly }
})

watch([() => form.options['network-name'], () => props.readonly], ([networkName, readonly]) => {
  if (readonly) {
    return
  }
  if (networkName === MANAGEMENT_NETWORK) {
    form.options['interface-type'] = 'masquerade'
  } else {
    form.options['interface-type'] = 'bridge'
  }
})

// use harvester sdk
const userDataTemplate = ref('')
const networkDataTemplate = ref('')
const {
  configInfo,
  isConfigValid,
  namespaceInfo,
  imageInfo,
  keyPairInfo,
  networkNameInfo,
  userData,
  networkData,
  fetchData,
  resetAll
} = useHarvesterSdk()
const errors = computed(() => {
  return [
    ...new Set([configInfo.error, namespaceInfo.error, imageInfo.error, keyPairInfo.error, networkNameInfo.error])
  ].filter((e) => e)
})

const networkNameOptions = computed(() => {
  return [
    {
      label: MANAGEMENT_NETWORK,
      value: MANAGEMENT_NETWORK
    },
    ...networkNameInfo.data
  ]
})

const debouncedFn = useDebounceFn((v) => {
  configInfo.value = v
  userDataTemplate.value = ''
  networkDataTemplate.value = ''
  resetAll()
}, 1000)

watch(
  [() => form.options['kubeconfig-content'], () => props.readonly],
  ([v, readonly]) => {
    if (readonly) {
      return
    }
    debouncedFn(v)
  },
  { immediate: true }
)
watch(isConfigValid, (valid) => {
  if (valid) {
    fetchData()
  } else {
    resetAll()
  }
})
const userDataTemplateChange = (v) => {
  if (!v) {
    return
  }
  const d = userData.value.find((item) => item.value === v)
  if (d) {
    form.options['user-data'] = d.data.data?.cloudInit ?? ''
  }
}
const networkDataTemplateChange = (v) => {
  if (!v) {
    return
  }
  const d = networkData.value.find((item) => item.value === v)
  if (d) {
    form.options['network-data'] = d.data.data?.cloudInit ?? ''
  }
}
</script>
