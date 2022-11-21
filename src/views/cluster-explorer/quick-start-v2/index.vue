<template>
  <div>
    <page-header>
      <template #title>Quick Start</template>
      <template #subtitle>User quick guides to help you quickly create K3s cluster and add K3s nodes.</template>
      <template #actions>
        <template-filter
          :disabled="loading || creating"
          :provider="currentProviderId"
          @apply-template="handleApplyTemplate"
        ></template-filter>
      </template>
    </page-header>
    <div class="grid grid-cols-[auto,1fr]">
      <div>
        <img :src="clustcerIcon" class="w-160px h-100px object-contain" />
      </div>
      <div class="quick-start__form">
        <k-loading :loading="loading || creating">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px pb-20px">
            <k-select v-model="currentProviderId" label="Provider" required :loading="loading">
              <k-option v-for="p in providers" :key="p.id" :value="p.id" :label="p.name"></k-option>
            </k-select>
            <k-input v-model.trim="name" label="Name" placeholder="e.g. test" required :error="nameRequired" />
          </div>
          <template v-if="!loading">
            <EditFromTemplate
              v-if="templateId && template && templateProvider"
              :provider="templateProvider"
              :template="template"
            />
            <EditFromProviderSchema v-else-if="provider" :provider="provider" />
            <div v-else>Load Resource Error</div>
          </template>
          <footer-actions>
            <k-button class="btn role-secondary" @click="goToCreatePage">Advance</k-button>
            <k-button class="role-primary" type="button" :loading="loading || creating" @click="saveAsTemplate">
              Save As Template
            </k-button>
            <k-button class="role-primary" type="button" :loading="loading || creating" @click="create">
              Create
            </k-button>
          </footer-actions>
          <k-alert v-for="(e, index) in formErrors" :key="index" type="error" :title="e"></k-alert>
          <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
        </k-loading>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, watch, provide } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/views/components/PageHeader.vue'
import TemplateFilter from '@/views/components/TemplateFilter/index.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import useProviders from '@/composables/useProviders.js'
import { createCluster } from '@/api/cluster.js'
import { create as createTemplate } from '@/api/template.js'
import { stringify } from '@/utils/error.js'
import useTemplateStore from '@/store/useTemplateStore.js'
import { storeToRefs } from 'pinia'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'
import EditFromProviderSchema from '@/views/components/providerForm/EditFromProviderSchema.vue'
import EditFromTemplate from '@/views/components/providerForm/EditFromTemplate.vue'
import useClusterFormManage from '@/composables/useClusterFormManage.js'
import clustcerIcon from '@/assets/images/cluster-single.svg'
import useProviderClusterStores from '@/store/useProviderClusterStores.js'

const props = defineProps({
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
const wmStore = useWindownManagerStore()
const providerClusterStores = useProviderClusterStores()
const router = useRouter()
const name = ref('')

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
provide('tab-position', 'top')

const { loading: providersLoading, providers, error: loadProviderError } = useProviders()
const { loading: templateLoading, error: loadTemplateError, data: templates } = storeToRefs(templateStore)

const template = computed(() => {
  if (props.templateId) {
    return templates.value.find((t) => t.id === props.templateId)
  }
  return null
})

const provider = computed(() => {
  return providers.value.find((p) => p.id === props.defaultProvider)
})

const templateProvider = computed(() => {
  if (!template.value) {
    return null
  }
  return providers.value.find((p) => p.id === template.value?.provider)
})

const currentProvider = computed(() => {
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
    router.push({ name: 'QuickStart', query: { defaultProvider: v } })
  }
})
const nameRequired = computed(() => {
  return name.value ? '' : '"Name" is required'
})

watch(
  () => template.value?.name,
  (tn) => {
    if (props.templateId) {
      name.value = tn ?? ''
    }
  },
  { immediate: true }
)

const loading = computed(() => {
  return providersLoading.value || templateLoading.value
})

const errors = computed(() => {
  const errors = []
  if (loadProviderError.value) {
    errors.push(loadProviderError.value)
  }
  if (loadTemplateError.value) {
    errors.push(loadTemplateError.value)
  }
  if (!loading.value) {
    if (props.templateId && !template.value?.id) {
      errors.push(`Template (${props.templateId}) not found`)
    }
  }
  return errors
})

const goBack = () => {
  router.push({ name: 'ClusterExplorerCoreClusters' })
}
const goToCreatePage = () => {
  const form = getForm()
  if (!form?.config || !form?.options) {
    router.push({ name: 'ClusterExplorerCoreClustersCreate', query: { quickStart: currentProviderId.value } })
    return
  }
  form.config.name = name.value
  providerClusterStores[currentProviderId.value]?.saveFormHistory(form)
  router.push({ name: 'ClusterExplorerCoreClustersCreate', query: { quickStart: currentProviderId.value } })
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
const saveAsTemplate = async (formData) => {
  try {
    await createTemplate(formData)
    router.push({ name: 'ClusterExplorerSettingsTemplates' })
  } catch (err) {
    formErrors.value = [stringify(err)]
  }
}
const handleApplyTemplate = (templateId) => {
  router.push({ name: 'QuickStart', query: { templateId } })
}
</script>
