<template>
  <k-tabs v-model="acitiveTab" :tab-position="tabPosition">
    <k-tab-pane label="Machine Options" name="instance" :error="initMasterCount && !form.options['master-ips']">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <ip-address-pool-form
              ref="masterIps"
              :init-value="form.options['master-ips']"
              label="Master IPs"
              :desc="desc.options['master-ips']"
              :readonly="readonly"
              required
            ></ip-address-pool-form>
            <ip-address-pool-form
              ref="workerIps"
              :init-value="form.options['worker-ips']"
              label="Worker IPs"
              :desc="desc.options['worker-ips']"
              :readonly="readonly"
            ></ip-address-pool-form>
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
          </div>
          <div class="mt-10px">
            <SshPrivateForm :init-value="form" :desc="desc" :readonly="readonly" />
          </div>
        </template>
      </form-group>
    </k-tab-pane>
    <k-tab-pane label="K3s Cluster Options" name="k3s" :error="k3sOptionsErrors.length > 0">
      <k3s-options-form
        :visible="acitiveTab === 'k3s'"
        :init-value="form"
        :desc="desc"
        :readonly="readonly"
        :init-master-count="initMasterCount"
        :init-worker-count="initWorkerCount"
        master-disabled
        worker-disabled
        @errors="handleK3sErrors"
      ></k3s-options-form>
    </k-tab-pane>
    <k-tab-pane label="Add-on Options" name="additional">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
        <boolean-form
          v-model="dashboardUI"
          label="UI"
          :desc="desc.config['enable'] || desc.config['ui']"
          :readonly="readonly"
        />
        <!-- <k-select
          v-model="uiOptions"
          :desc="desc.config['enable']"
          label="UI"
          :disabled="readonly"
          placeholder="Disable"
          multiple
        >
          <k-option value="explorer" label="explorer"></k-option>
        </k-select> -->
        <div class="col-span-1 sm:col-span-2">
          <AddonForm
            ref="addons"
            :readonly="readonly"
            :init-values="form.config.values"
            :init-addons="form.config.enable"
            :visible="acitiveTab === 'additional'"
          ></AddonForm>
        </div>
      </div>
    </k-tab-pane>
  </k-tabs>
</template>
<script setup>
import { ref, computed, reactive, watch, inject } from 'vue'
import IpAddressPoolForm from '../baseForm/IpAddressPoolForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import { cloneDeep } from '@/utils'
import useFormManage from '@/composables/useFormManage.js'
import useFormRegist from '@/composables/useFormRegist.js'
import AddonForm from '../baseForm/AddonsForm.vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import { Base64 } from 'js-base64'

const needDecodeConfigKeys = ['server-config-file-content', 'agent-config-file-content']

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

const masterIps = ref(null)
const workerIps = ref(null)
const form = reactive({
  provider: '',
  config: {},
  options: {}
})
const dashboardUI = ref(false)
const tabPosition = inject('tab-position', 'left')
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options, provider: form.provider } = cloneDeep(props.initValue))
    dashboardUI.value = props.initValue?.config?.enable?.includes('explorer') ?? false
    // Compatible with older versions start
    delete form.config.ui
    if (props.initValue?.config?.ui === true) {
      dashboardUI.value = true
    }
    // Compatible with older versions end
    needDecodeConfigKeys.forEach((k) => {
      const v = form.config[k]
      if (v) {
        form.config[k] = Base64.decode(v)
      }
    })
  },
  { immediate: true }
)

const { getForm: getSubform, validate: validateSubForm } = useFormManage()
const addons = ref(null)
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
  const { enable, values } = addons.value.getForm()
  f.config.enable = enable
  f.config.values = values
  if (dashboardUI.value) {
    f.config.enable.push('explorer')
  }
  needDecodeConfigKeys.forEach((k) => {
    const v = f.config[k]?.trim()
    if (v) {
      f.config[k] = Base64.encode(v)
    }
  })
  return [
    { path: 'config', value: f.config },
    { path: 'options', value: f.options }
  ]
}
const acitiveTab = ref('instance')

const validate = () => {
  const errors = []
  const m = masterIps.value
    .getValue()
    .filter((v) => v)
    .join(',')
  if (!m) {
    errors.push('"Master IPs" is required')
  }
  return [...errors, ...validateSubForm()]
}
useFormRegist(getForm, validate)
const k3sOptionsErrors = ref([])
const handleK3sErrors = (e) => {
  k3sOptionsErrors.value = e
}
const initMasterCount = computed(() => {
  return form.options['master-ips']?.split(',')?.length ?? 0
})
const initWorkerCount = computed(() => {
  return form.options['worker-ips']?.split(',')?.length ?? 0
})

watch(acitiveTab, (t) => {
  if (t !== 'instance') {
    form.options['master-ips'] = masterIps.value
      .getValue()
      .filter((v) => v)
      .join(',')
  }
  form.options['worker-ips'] = workerIps.value
    .getValue()
    .filter((v) => v)
    .join(',')
})
</script>
