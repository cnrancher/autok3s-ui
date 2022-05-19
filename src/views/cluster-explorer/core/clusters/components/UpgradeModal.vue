<script setup>
import { computed, reactive, watch } from 'vue'
import { fetchById, upgrade } from '@/api/cluster.js'
import { fetchById as fetchProvider } from '@/api/provider.js'
import useRequest from '@/composables/useRequest.js'
import { stringify } from '@/utils/error.js'
import StringForm from '@/views/components/baseForm/StringForm.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  clusterId: {
    type: String,
    required: true
  },
  providerId: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['close'])

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
    return upgrade(props.clusterId, form, signal)
  },
  {
    immediate: false,
    afterFetch: () => {
      close()
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
  'k3s-version': ''
})
const installScriptOptions = ['https://get.k3s.io', 'https://rancher-mirror.rancher.cn/k3s/k3s-install.sh']

watch(
  cluster,
  (c) => {
    form['k3s-channel'] = c['k3s-channel']
    form['k3s-install-script'] = c['k3s-install-script']
    form['k3s-version'] = c['k3s-version'] ?? ''
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
        </div>
        <KAlert v-if="saveError" type="error" :title="saveError"></KAlert>
      </KLoading>
    </template>
    <template #footer>
      <k-button class="role-primary" :disabled="loadingState || saving" @click="save">Upgrade</k-button>
      <k-button class="role-secondary" @click="close">Cancel</k-button>
    </template>
  </k-modal>
</template>
