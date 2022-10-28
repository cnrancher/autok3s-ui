<script setup>
import { computed, reactive, watch, ref } from 'vue'
import { fetchById, upgrade } from '@/api/cluster.js'
import { fetchById as fetchProvider } from '@/api/provider.js'
import useRequest from '@/composables/useRequest.js'
import { stringify } from '@/utils/error.js'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'
import usePackageStore from '@/store/usePackageStore.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  clusterId: {
    type: String,
    required: true
  },
  clusterName: {
    type: String,
    required: true
  },
  providerId: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['close'])
const wmStore = useWindownManagerStore()
const packageStore = usePackageStore()
const packages = computed(() => {
  return packageStore.data.filter((p) => p.state === 'Active')
})
const airGapInstall = ref(false)

const close = () => {
  emit('close')
}

const {
  data: cluster,
  loading,
  error
} = useRequest((signal) => {
  return fetchById(props.clusterId, signal)
})

const {
  data: provider,
  loading: providerLoading,
  error: providerError
} = useRequest((signal) => {
  return fetchProvider(props.providerId, signal)
})

const {
  refetch: save,
  loading: saving,
  error: saveError
} = useRequest(
  (signal) => {
    const param = {
      ...form
    }
    const onlineUpgradeFormKeys = ['k3s-channel', 'k3s-install-script', 'k3s-version']
    const airGapUpgradeFormKeys = ['package-name']
    if (airGapInstall.value) {
      onlineUpgradeFormKeys.forEach((k) => {
        param[k] = ''
      })
    } else {
      airGapUpgradeFormKeys.forEach((k) => {
        param[k] = ''
      })
    }

    if (airGapInstall.value && !param['package-name']) {
      return Promise.reject('"Air-gap Package Name" is required')
    }

    return upgrade(props.clusterId, param, signal)
  },
  {
    immediate: false,
    afterFetch: () => {
      close()
      // view create logs
      wmStore.addTab({
        id: `log_${props.clusterId}`,
        component: 'ClusterLogs',
        label: `log: ${props.clusterName}`,
        icon: 'log',
        attrs: {
          cluster: props.clusterId
        }
      })
    }
  }
)

const errors = computed(() => {
  return [error, providerError].filter((e) => e.value).map((e) => stringify(e))
})

const loadingState = computed(() => {
  return loading.value || providerLoading.value
})

const form = reactive({
  'k3s-channel': '',
  'k3s-install-script': '',
  'k3s-version': '',
  'package-name': ''
})
const installScriptOptions = [
  'https://get.k3s.io',
  'https://rancher-mirror.oss-cn-beijing.aliyuncs.com/k3s/k3s-install.sh'
]

watch(
  cluster,
  (c) => {
    form['k3s-channel'] = c['k3s-channel']
    form['k3s-install-script'] = c['k3s-install-script']
    form['k3s-version'] = c['k3s-version'] ?? ''
    form['package-name'] = c['package-name'] ?? ''
    airGapInstall.value = !!c['package-name']
  },
  { immediate: true }
)
</script>
<template>
  <k-modal :model-value="visible">
    <template #title>Upgrade Cluster: {{ cluster?.name }}</template>
    <template #default>
      <KLoading :loading="loadingState">
        <div v-if="errors.length > 0">
          <KAlert v-for="e in errors" :key="e" type="error" :title="e"></KAlert>
        </div>
        <div v-else class="grid gap-10px">
          <label>
            <input v-model="airGapInstall" type="checkbox" />
            Upgrade With Air-gap Package
          </label>
          <template v-if="airGapInstall">
            <KSelect
              v-model="form['package-name']"
              label="Air-gap Package Name"
              placeholder="Please select a air-gap package..."
              required
            >
              <KOption v-for="p in packages" :key="p.id" :value="p.name" :label="p.name"></KOption>
            </KSelect>
          </template>
          <template v-else>
            <KComboBox
              v-model="form['k3s-install-script']"
              label="K3s Install Script"
              :desc="provider?.config?.['k3s-install-script']?.description"
              :options="installScriptOptions"
              placeholder="Please Select Or Input..."
            ></KComboBox>
            <k-select
              v-model="form['k3s-channel']"
              :desc="provider?.config?.['k3s-channel']?.description"
              label="K3s Channel"
            >
              <k-option value="stable" label="stable"></k-option>
              <k-option value="latest" label="latest"></k-option>
              <k-option value="testing" label="testing"></k-option>
            </k-select>
            <StringForm
              v-model.trim="form['k3s-version']"
              label="K3s Version"
              :desc="provider?.config?.['k3s-version']?.description"
            />
          </template>
        </div>
        <KAlert v-if="saveError" type="error" :title="stringify(saveError)"></KAlert>
      </KLoading>
    </template>
    <template #footer>
      <k-button class="role-primary" :disabled="loadingState || saving" @click="save">Upgrade</k-button>
      <k-button class="role-secondary" @click="close">Cancel</k-button>
    </template>
  </k-modal>
</template>
