<template>
  <k-modal :model-value="visible">
    <template #title>Join Node</template>
    <template #default>
      <k-loading :loading="loading">
        <div class="grid gap-10px grid-cols-1 sm:grid-cols-2">
          <div>Desired Master Nodes: {{ desiredNodes.master }}</div>
          <div>Desired Worker Nodes: {{ desiredNodes.worker }}</div>
          <template v-if="provider === 'native'">
            <ip-address-pool-form
              ref="masterIps"
              :init-value="nativeForm.options['master-ips']"
              label="Master IPs"
              :desc="nativeProviderSchema?.options?.['master-ips']?.description"
            ></ip-address-pool-form>
            <ip-address-pool-form
              ref="workerIps"
              :init-value="nativeForm.options['worker-ips']"
              label="Worker IPs"
              :desc="nativeProviderSchema?.options?.['worker-ips']?.description"
            ></ip-address-pool-form>
            <string-form
              v-model.trim="nativeForm['ssh-user']"
              label="SSH User"
              :desc="nativeProviderSchema?.config?.['ssh-user']?.description"
            />
            <string-form
              v-model.trim="nativeForm['ssh-port']"
              label="SSH Port"
              :desc="nativeProviderSchema?.config?.['ssh-port']?.description"
            />
            <string-form
              v-model.trim="nativeForm['ssh-key-path']"
              label="SSH Key Path"
              :desc="nativeProviderSchema?.config?.['ssh-key-path']?.description"
            />
            <div
              class="cursor-pointer grid gap-x-10px grid-cols-[auto,auto,1fr] items-center justify-items-end"
              @click="sshAdvanceVisible = !sshAdvanceVisible"
            >
              <div>Advance</div>
              <a class="text-$link">{{ sshAdvanceVisible ? 'Hide' : 'Show' }}</a>
              <k-icon type="arrow-right" :direction="sshAdvanceVisible ? 'down' : ''"></k-icon>
            </div>
            <div v-show="sshAdvanceVisible" class="contents">
              <k-password-input
                v-model.trim="nativeForm['ssh-key-passphrase']"
                label="SSH Key Passphrase"
                :desc="nativeProviderSchema?.config?.['ssh-key-passphrase']?.description"
              />
              <string-form
                v-model.trim="nativeForm['ssh-cert-path']"
                label="SSH Cert Path"
                :desc="nativeProviderSchema?.config?.['ssh-cert-path']?.description"
              />
              <k-password-input
                v-model.trim="nativeForm['ssh-password']"
                label="SSH Password"
                :desc="nativeProviderSchema?.config?.['ssh-password']?.description"
              />
              <boolean-form
                v-model="nativeForm['ssh-agent-auth']"
                label="SSH Agent Auth"
                :desc="nativeProviderSchema?.config?.['ssh-agent-auth']?.description"
              />
            </div>
          </template>
          <template v-else>
            <k-input v-model="form.master" label="Master" required />
            <k-input v-model="form.worker" label="Worker" required />
          </template>
        </div>
        <div>
          <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
        </div>
      </k-loading>
    </template>
    <template #footer>
      <k-button class="role-secondary" @click="close">Cancel</k-button>
      <k-button class="role-primary" :loading="loading || saving" @click="save">Save</k-button>
    </template>
  </k-modal>
</template>
<script setup>
import { computed, reactive, ref, toRef, watch } from 'vue'
import useCluster from '@/composables/useCluster.js'
import useProviders from '@/composables/useProviders.js'
import IpAddressPoolForm from '@/views/components/baseForm/IpAddressPoolForm.vue'
import BooleanForm from '@/views/components/baseForm/BooleanForm.vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import { joinNode } from '@/api/cluster.js'
import { stringify } from '@/utils/error.js'
import useNotificationStore from '@/store/useNotificationStore.js'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'

const formDefaultValue = {
  worker: '0',
  master: '0'
}
const nativeFormDefaultValue = {
  options: {
    'master-ips': '',
    'worker-ips': ''
  },
  'ssh-user': '',
  'ssh-port': '',
  'ssh-key-path': '',
  'ssh-key-passphrase': '',
  'ssh-cert-path': '',
  'ssh-password': '',
  'ssh-agent-auth': false
}

const props = defineProps({
  clusterId: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const notificationStore = useNotificationStore()
const wmStore = useWindownManagerStore()
const sshAdvanceVisible = ref(false)
const masterIps = ref(null)
const workerIps = ref(null)

const id = toRef(props, 'clusterId')
const { loading: providersLoading, providers, error: loadProviderError } = useProviders()
const { cluster, error: loadClusterError, loading: clusterLoading } = useCluster(id)
const formErrors = ref([])
const form = reactive({ ...formDefaultValue })
const nativeForm = reactive({ ...nativeFormDefaultValue, options: { ...nativeFormDefaultValue.options } })
const loading = computed(() => {
  return providersLoading.value || clusterLoading.value
})
const nativeProviderSchema = computed(() => {
  return providers.value.find((p) => p.id === cluster.value?.provider)
})
watch(
  id,
  () => {
    Object.entries(formDefaultValue).forEach((e) => {
      form[e[0]] = e[1]
    })
    nativeForm.options = { ...nativeFormDefaultValue.options }
  },
  {
    immediate: true
  }
)
watch(loading, (l) => {
  if (!l && cluster.value?.provider === 'native') {
    Object.keys(nativeFormDefaultValue)
      .filter((k) => k !== 'options')
      .forEach((k) => {
        nativeForm[k] = cluster.value?.[k] ?? nativeProviderSchema.value?.config?.[k]?.default ?? ''
      })
  }
})
const provider = computed(() => {
  return cluster.value?.provider
})
const desiredNodes = computed(() => {
  if (!cluster.value) {
    return {
      master: '0',
      worker: '0'
    }
  }
  return {
    master: `${parseInt(cluster.value.master, 10) + (parseInt(form.master, 10) || 0)}`,
    worker: `${parseInt(cluster.value.worker, 10) + (parseInt(form.worker, 10) || 0)}`
  }
})
const errors = computed(() => {
  const errors = []
  if (loadClusterError.value) {
    errors.push(loadClusterError.value)
  }
  if (loadProviderError.value) {
    errors.push(loadProviderError.value)
  }
  errors.push(...formErrors.value)
  return errors
})

const validate = () => {
  const errors = []
  formErrors.value = errors
  if (provider.value === 'native') {
    const formData = {
      ...nativeForm,
      options: {
        'master-ips': masterIps.value
          .getValue()
          .filter((v) => v)
          .join(','),
        'worker-ips': workerIps.value
          .getValue()
          .filter((v) => v)
          .join(',')
      }
    }
    const masterIpsLen = formData.options['master-ips'].split(',').reduce((t, c) => {
      if (c.trim()) {
        t = t + 1
      }
      return t
    }, 0)
    const workerIpsLen = formData.options['worker-ips'].split(',').reduce((t, c) => {
      if (c.trim()) {
        t = t + 1
      }
      return t
    }, 0)

    if (masterIpsLen === 0 && workerIpsLen === 0) {
      errors.push('"Master IPs" and "Worker IPs" at least one')
    }

    return errors.length === 0
  }

  const formData = { ...form }
  const numReg = /^[0-9]+$/

  if (!numReg.test(formData.worker)) {
    errors.push('"Worker" must a number')
  }
  if (!numReg.test(formData.master)) {
    errors.push('"Master" must be a number')
  }
  if (errors.length > 0) {
    return false
  }
  if (parseInt(formData.worker, 10) <= 0 && parseInt(formData.master, 10) <= 0) {
    errors.push('One of "Master" and "Worker" must be greater than 0')
  }
  return errors.length === 0
}
const close = () => {
  emit('close')
}
const saving = ref(false)
const save = async () => {
  if (!validate()) {
    return
  }
  saving.value = true
  try {
    let formData
    if (provider.value === 'native') {
      formData = {
        ...nativeForm,
        options: {
          'master-ips': masterIps.value
            .getForm()
            .filter((v) => v)
            .join(','),
          'worker-ips': workerIps.value
            .getForm()
            .filter((v) => v)
            .join(',')
        }
      }
    } else {
      formData = { ...form }
    }

    const data = Object.assign({}, cluster.value, formData)
    const { name, id } = cluster.value
    await joinNode(data)
    // view logs
    wmStore.addTab({
      id: `log_${id}`,
      component: 'ClusterLogs',
      label: `log: ${name}`,
      icon: 'log',
      attrs: {
        cluster: id
      }
    })
  } catch (err) {
    notificationStore.notify({
      type: 'error',
      title: 'Join Nodes Failed',
      content: stringify(err)
    })
  }
  saving.value = false
  close()
}
</script>
