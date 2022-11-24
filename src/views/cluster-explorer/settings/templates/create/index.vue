<template>
  <div>
    <page-header>
      <template #title>
        <router-link :to="{ name: 'ClusterExplorerSettingsTemplates' }">Template:</router-link>
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
      <div class="grid grid-cols-3 gap-10px pb-20px">
        <k-select v-model="currentProviderId" label="Provider" required :loading="loading">
          <k-option v-for="p in providers" :key="p.id" :value="p.id" :label="p.name"></k-option>
        </k-select>
        <string-form v-model.trim="name" label="Name" placeholder="e.g. test" required :error="nameRequired" />
        <boolean-form v-model="isDefault" label="Default Template" true-label="True" false-label="False"></boolean-form>
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
        <EditFromProviderSchema v-else-if="provider" :provider="provider"></EditFromProviderSchema>
      </template>
      <footer-actions>
        <router-link :to="{ name: 'ClusterExplorerSettingsTemplates' }" class="btn role-secondary">Cancel</router-link>
        <k-button class="role-primary" type="button" :loading="loading || creating" @click="create">Create</k-button>
      </footer-actions>
      <k-alert v-for="(e, index) in formErrors" :key="index" type="error" :title="e"></k-alert>
      <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
    </k-loading>
  </div>
</template>
<script setup>
import { computed, provide, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import useRequest from '@/composables/useRequest.js'
import PageHeader from '@/views/components/PageHeader.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import BooleanForm from '@/views/components/baseForm/BooleanForm.vue'
import TemplateFilter from '@/views/components/TemplateFilter/index.vue'
import EditFromCluster from '@/views/components/providerForm/EditFromCluster.vue'
import EditFromProviderSchema from '@/views/components/providerForm/EditFromProviderSchema.vue'
import EditFromTemplate from '@/views/components/providerForm/EditFromTemplate.vue'
import useProviders from '@/composables/useProviders.js'
import { create as createTemplate, update as updateTemplate } from '@/api/template.js'
import { stringify } from '@/utils/error.js'
import { cloneDeep } from '@/utils'
import useTemplateStore from '@/store/useTemplateStore.js'
import { storeToRefs } from 'pinia'
import useClusterFormManage from '@/composables/useClusterFormManage.js'
import { fetchById } from '@/api/cluster.js'

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
  }
})
const { getForm, validate } = useClusterFormManage()
const templateStore = useTemplateStore()
const router = useRouter()
const name = ref('')
const isDefault = ref(false)
const creating = ref(false)
const formErrors = ref([])
const formLoading = ref(false)

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
  return provider.value
})
const currentProviderId = computed({
  get() {
    return currentProvider.value?.id
  },
  set(v) {
    name.value = ''
    formErrors.value = []
    router.push({ name: 'ClusterExplorerSettingsTemplatesCreate', query: { defaultProvider: v } })
  }
})

const nameRequired = computed(() => {
  return name.value ? '' : '"Name" is required'
})

watch(
  [() => cluster.value?.name, () => template.value?.name],
  ([cn, tn]) => {
    if (props.clusterId) {
      name.value = cn ?? ''
    } else if (props.templateId) {
      name.value = tn ?? ''
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
    if (props.defaultProvider && !provider.value?.id) {
      errors.push(`Provider (${props.defaultProvider}) not found`)
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
  router.push({ name: 'ClusterExplorerSettingsTemplates' })
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
  const form = getForm()
  if (!form.config || !form.options) {
    errors.push(`Forms are not initialized `)
    formErrors.value = errors
    return
  }
  form.config.name = name.value
  const providerSchema = currentProvider.value
  const provider = providerSchema.id
  errors = validate(form, providerSchema)
  if (errors.length > 0) {
    formErrors.value = errors
    return
  }

  const formData = {
    'is-default': isDefault.value,
    ...form.config,
    provider,
    options: {
      ...form.options
    }
  }

  creating.value = true
  const promises = [createTemplate(formData)]
  if (formData['is-default']) {
    promises.push(
      ...templates.value
        .filter((t) => t.provider === formData.provider && t['is-default'])
        .map((t) => updateTemplate(t.id, { ...cloneDeep(t), 'is-default': false }))
    )
  }
  const results = await Promise.allSettled(promises)
  const saveErrors = results
    .filter((p) => p.status === 'rejected')
    .map((p) => p.reason)
    .map((e) => stringify(e))
  formErrors.value = saveErrors
  creating.value = false
  if (saveErrors.length === 0) {
    goBack()
  }
}

const handleApplyTemplate = (templateId) => {
  if (props.templateId === templateId) {
    location.reload()
    return
  }
  router.push({ name: 'ClusterExplorerSettingsTemplatesCreate', query: { templateId } })
}
</script>
