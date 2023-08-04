<template>
  <div>
    <page-header>
      <template #title>
        <router-link :to="{ name: 'ClusterExplorerCoreClusters' }">Cluster:</router-link>
        Create
      </template>
      <template #actions>
        <template-filter
          :provider="currentProviderId"
          :disabled="loading || creating"
          @apply-template="handleApplyTemplate"
        ></template-filter>
      </template>
    </page-header>
    <k-loading :loading="loading || creating || formLoading">
      <k-alert
        v-if="currentProviderId === 'native'"
        type="warning"
        title="Native provider only supports create K3s cluster and join K3s nodes."
      ></k-alert>
      <k-alert
        v-if="currentProviderId === 'k3d'"
        type="warning"
        title="Highly recommended that K3d provider run in a Linux / Unix environment, do not run K3d provider in MacOS container environment."
      ></k-alert>
      <div class="grid grid-cols-2 gap-10px">
        <k-select v-model="currentProviderId" label="Provider" required :loading="loading">
          <template #suffix>
            <img class="h-42px w-42px object-contain" :src="providerIconMap.get(currentProviderId)" />
          </template>
          <k-option v-for="p in providers" :key="p.id" :value="p.id" :label="p.name"></k-option>
        </k-select>
        <k-input v-model.trim="name" label="Name" placeholder="e.g. test" required :error="nameRequired" />
        <div></div>
        <label class="justify-self-end">
          <input v-model="notRollback" type="checkbox" />
          Not rollback(for debug)
          <tooltip v-if="currentProvider">
            <k-icon type="prompt"></k-icon>
            <template #popover>{{ currentProvider.config.rollback.description }}</template>
          </tooltip>
        </label>
      </div>

      <template v-if="!loading">
        <EditFromCluster
          v-if="clusterId && cluster && clusterProvider"
          :provider="clusterProvider"
          :cluster="cluster"
        ></EditFromCluster>
        <EditFromTemplate
          v-else-if="templateId && template && templateProvider"
          :provider="templateProvider"
          :template="template"
        ></EditFromTemplate>
        <EditFromQuickStart
          v-else-if="quickStart && quickStartProvider"
          :provider="quickStartProvider"
        ></EditFromQuickStart>
        <EditFromProviderSchema v-else-if="provider" :provider="provider"></EditFromProviderSchema>
        <div v-else>Load Resource Error</div>
      </template>
      <footer-actions>
        <router-link :to="{ name: 'ClusterExplorerCoreClusters' }" class="btn role-secondary">Cancel</router-link>
        <k-button class="role-secondary" type="button" :loading="loading || creating" @click="showCliModal">
          Generate CLI Command
        </k-button>
        <k-button class="role-primary" type="button" :loading="loading || creating" @click="create">Create</k-button>
      </footer-actions>
      <k-alert v-for="(e, index) in formErrors" :key="index" type="error" :title="e"></k-alert>
      <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
    </k-loading>
  </div>
</template>

<script setup>
import { computed, ref, watch, provide } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/views/components/PageHeader.vue'
import TemplateFilter from '@/views/components/TemplateFilter/index.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import CliCommand from '@/views/components/CliCommand.vue'
import useProviders from '@/composables/useProviders.js'
import { createCluster } from '@/api/cluster.js'
import { stringify } from '@/utils/error.js'
import useTemplateStore from '@/store/useTemplateStore.js'
import { storeToRefs } from 'pinia'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'
import useRequest from '@/composables/useRequest.js'
import { fetchById } from '@/api/cluster.js'
import EditFromCluster from '@/views/components/providerForm/EditFromCluster.vue'
import EditFromProviderSchema from '@/views/components/providerForm/EditFromProviderSchema.vue'
import EditFromQuickStart from '@/views/components/providerForm/EditFromQuickStart.vue'
import EditFromTemplate from '@/views/components/providerForm/EditFromTemplate.vue'
import useClusterFormManage from '@/composables/useClusterFormManage.js'
import useModal from '@/composables/useModal.js'
import useProviderClusterStores from '@/store/useProviderClusterStores.js'
import { useProviderIcon } from '@/views/composables/useProviderIcon.js'
import Tooltip from '@/components/Tooltip'
import KIcon from '@/components/Icon'

const props = defineProps({
  clusterId: {
    type: String,
    default: ''
  },
  templateId: {
    type: String,
    default: ''
  },
  defaultProvider: {
    type: String,
    default: 'aws'
  },
  quickStart: {
    // quickStart: 'aws'
    type: String,
    default: ''
  }
})
const providerIconMap = useProviderIcon()
// generate cli command
const { show: showCliCommand } = useModal(CliCommand)
const { getForm, validate } = useClusterFormManage()
const templateStore = useTemplateStore()
const wmStore = useWindownManagerStore()
const providerClusterStores = useProviderClusterStores()
const router = useRouter()
const name = ref('')

const creating = ref(false)
const formErrors = ref([])
const formLoading = ref(false)
const notRollback = ref(false)

provide('formLoading', {
  showLoading: () => {
    formLoading.value = true
  },
  hideLoading: () => {
    formLoading.value = false
  }
})

const { loading: providersLoading, providers, error: loadProviderError } = useProviders()
const { loading: templateLoading, error: loadTemplateError, data: templates } = storeToRefs(templateStore)

const {
  data: cluster,
  loading: clusterLoading,
  error: loadClusterError,
  refetch: loadCluster
} = useRequest(
  (signal) => {
    return fetchById(props.clusterId, signal)
  },
  { immediate: false }
)

const template = computed(() => {
  if (props.templateId) {
    return templates.value.find((t) => t.id === props.templateId)
  }
  return null
})
const quickStartProvider = computed(() => {
  return providers.value.find((p) => p.id === props.quickStart)
})

const provider = computed(() => {
  return providers.value.find((p) => p.id === props.defaultProvider)
})

const clusterProvider = computed(() => {
  if (!cluster.value) {
    return null
  }
  return providers.value.find((p) => p.id === cluster.value?.provider)
})
const templateProvider = computed(() => {
  if (!template.value) {
    return null
  }
  return providers.value.find((p) => p.id === template.value?.provider)
})

const currentProvider = computed(() => {
  if (props.clusterId) {
    return clusterProvider.value
  }
  if (props.templateId) {
    return templateProvider.value
  }
  if (props.quickStart) {
    return quickStartProvider.value
  }
  return provider.value
})
const currentProviderId = computed({
  get() {
    return currentProvider.value?.id
  },
  set(v) {
    name.value = ''
    formErrors.value = []
    router.push({ name: 'ClusterExplorerCoreClustersCreate', query: { defaultProvider: v } })
  }
})

const nameRequired = computed(() => {
  return name.value ? '' : '"Name" is required'
})

watch(
  [() => cluster.value?.name, () => template.value?.name, () => quickStartProvider.value],
  ([cn, tn]) => {
    if (props.clusterId) {
      name.value = cn ?? ''
    } else if (props.templateId) {
      name.value = tn ?? ''
    } else if (props.quickStart) {
      const quickStartForm = providerClusterStores[props.quickStart]?.formHistory?.[0]
      name.value = quickStartForm?.config?.name ?? ''
    }
  },
  { immediate: true }
)

const loading = computed(() => {
  return providersLoading.value || clusterLoading.value || templateLoading.value
})
const errors = computed(() => {
  const errors = []
  if (loadProviderError.value) {
    errors.push(loadProviderError.value)
  }
  if (loadClusterError.value) {
    errors.push(loadClusterError.value)
  }
  if (loadTemplateError.value) {
    errors.push(loadTemplateError.value)
  }
  if (!loading.value) {
    if (props.clusterId && !cluster.value?.id) {
      errors.push(`Cluster (${props.clusterId}) not found`)
    }
    if (props.templateId && !template.value?.id) {
      errors.push(`Template (${props.templateId}) not found`)
    }
    if ((props.quickStart && !quickStartProvider.value?.id) || (props.defaultProvider && !provider.value?.id)) {
      errors.push(`Provider (${props.quickStart || props.defaultProvider}) not found`)
    }
  }
  return errors
})

watch(
  () => props.clusterId,
  (id) => {
    if (id) {
      loadCluster()
    }
  },
  { immediate: true }
)

const goBack = () => {
  router.push({ name: 'ClusterExplorerCoreClusters' })
}
const create = async () => {
  let errors = []
  if (!currentProviderId.value) {
    errors.push(`"Provider" is required`)
    formErrors.value = errors
    return
  }
  if (!name.value) {
    errors.push(`"Name" is required`)
    formErrors.value = errors
    return
  }
  if (/\s/.test(name.value)) {
    errors.push(`"Name" cannot contain blank characters`)
    formErrors.value = errors
    return
  }
  if (/\./.test(name.value)) {
    errors.push(`"Name" cannot contain the dot special character (.)`)
    formErrors.value = errors
    return
  }
  const form = getForm()
  if (!form.config || !form.options) {
    errors.push(`Forms are not initialized `)
    formErrors.value = errors
    return
  }
  form.config.name = name.value
  form.config.rollback = !notRollback.value
  const providerSchema = currentProvider.value
  const provider = providerSchema.id
  errors = validate(form, providerSchema)
  if (errors.length > 0) {
    formErrors.value = errors
    return
  }
  const formData = {
    ...form.config,
    provider,
    options: {
      ...form.options
    }
  }

  creating.value = true
  try {
    const { id, name } = await createCluster(formData)
    wmStore.addTab({
      id: `log_${id}`,
      component: 'ClusterLogs',
      label: `log: ${name ?? id}`,
      icon: 'log',
      attrs: {
        cluster: id
      }
    })
    goBack()
  } catch (err) {
    formErrors.value = [stringify(err)]
  }
  creating.value = false
}
const handleApplyTemplate = (templateId) => {
  if (props.templateId === templateId) {
    location.reload()
    return
  }
  router.push({ name: 'ClusterExplorerCoreClustersCreate', query: { templateId } })
}

const showCliModal = () => {
  const form = getForm()
  form.config.name = name.value
  form.provider = currentProviderId.value
  showCliCommand({ clusterForm: form })
}
</script>
