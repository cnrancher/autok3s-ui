<template>
  <k-tabs v-model="acitiveTab" :tab-position="tabPosition">
    <k-tab-pane label="Machine Options" name="instance">
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
            <string-form
              v-model.trim="form.config['ssh-key-path']"
              label="SSH Key Path"
              :desc="desc.config['ssh-key-path']"
              :readonly="readonly"
            />
            <div
              class="cursor-pointer grid grid-cols-[auto,auto,1fr] gap-x-10px items-center justify-items-end"
              @click="toggleVisible"
            >
              <a class="text-$link">{{ visible ? 'Hide' : 'Show' }} Advanced</a>
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
        </k-select>
      </div>
    </k-tab-pane>
  </k-tabs>
</template>
<script setup>
import { ref, computed, reactive, watch, inject } from 'vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import IpAddressPoolForm from '../baseForm/IpAddressPoolForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import { cloneDeep } from '@/utils'
import useFormManage from '@/composables/useFormManage.js'
import useFormRegist from '@/composables/useFormRegist.js'

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
  config: {},
  options: {}
})
const tabPosition = inject('tab-position', 'left')
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options } = cloneDeep(props.initValue))
  },
  { immediate: true }
)
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
const { getForm: getSubform, validate: validateSubForm } = useFormManage()
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
  return [
    { path: 'config', value: f.config },
    { path: 'options', value: f.options }
  ]
}
const acitiveTab = ref('instance')
const visible = ref(false)
const toggleVisible = () => {
  visible.value = !visible.value
}
const validate = () => {
  return validateSubForm()
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
  if (t === 'k3s') {
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
