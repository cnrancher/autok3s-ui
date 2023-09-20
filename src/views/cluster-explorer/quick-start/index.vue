<template>
  <div>
    <page-header>
      <template #title>Quick Start</template>
      <template #subtitle>User quick guides to help you quickly create K3s cluster and add K3s nodes.</template>
    </page-header>
    <div class="grid grid-cols-[auto_1fr]">
      <div>
        <img :src="clustcerIcon" class="w-160px h-100px object-contain" />
      </div>
      <div class="quick-start__form">
        <k-loading :loading="loading || creating">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px pb-20px">
            <k-select v-model="currentProviderId" label="Provider" required :loading="loading">
              <template #suffix>
                <img class="h-42px w-42px object-contain" :src="providerIconMap.get(currentProviderId)" />
              </template>
              <k-option v-for="p in providers" :key="p.id" :value="p.id" :label="p.name"></k-option>
            </k-select>
            <k-input v-model.trim="name" label="Name" placeholder="e.g. test" required />
          </div>
          <component
            :is="clusterFormComponent"
            v-if="initForm && currentProvider && defaultFormAndDesc.desc"
            :has-error="hasError"
            :init-value="initForm"
            :desc="defaultFormAndDesc.desc"
          ></component>
          <footer-actions>
            <k-button class="btn role-secondary" @click="goToCreatePage">Advance</k-button>
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
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/views/components/PageHeader.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import AwsForm from './components/AwsForm.vue'
import AlibabaForm from './components/AlibabaForm.vue'
import TencentForm from './components/TencentForm.vue'
import K3dForm from './components/K3dForm.vue'
import GoogleForm from './components/GoogleForm.vue'
import HarvesterForm from './components/HarvesterForm.vue'
import NativeForm from './components/NativeForm.vue'
import clustcerIcon from '@/assets/images/cluster-single.svg'
import useProviders from '@/composables/useProviders.js'
import { createCluster } from '@/api/cluster.js'
import { stringify } from '@/utils/error.js'
import useTemplateStore from '@/store/useTemplateStore.js'
import { storeToRefs } from 'pinia'
import useClusterFormManage from '@/composables/useClusterFormManage.js'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
import { cloneDeep } from '@/utils'
import useProviderClusterStores from '@/store/useProviderClusterStores.js'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'
import { useProviderIcon } from '@/views/composables/useProviderIcon.js'

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
const providerIconMap = useProviderIcon()
const providerComponentMap = {
  aws: AwsForm,
  alibaba: AlibabaForm,
  tencent: TencentForm,
  k3d: K3dForm,
  google: GoogleForm,
  harvester: HarvesterForm,
  native: NativeForm
}
const { getForm, validate } = useClusterFormManage()
const templateStore = useTemplateStore()
const providerClusterStores = useProviderClusterStores()
const wmStore = useWindownManagerStore()
const router = useRouter()
const name = ref('')

const creating = ref(false)
const formErrors = ref([])
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

const defaultTemplate = computed(() => {
  if (!props.defaultProvider) {
    return null
  }
  return templates.value.find((t) => t.provider === props.defaultProvider && t['is-default'])
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

const clusterFormComponent = computed(() => {
  return providerComponentMap[currentProviderId.value]
})

watch(
  () => template.value?.name,
  (n) => {
    if (props.templateId) {
      name.value = n ?? ''
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
    if (props.defaultProvider && !provider.value?.id) {
      errors.push(`Provider (${props.defaultProvider}) not found`)
    }
  }
  return errors
})

const defaultFormAndDesc = computed(() => {
  if (currentProvider?.value) {
    return useFormFromSchema(currentProvider?.value)
  }
  return null
})

const initForm = computed(() => {
  if (props.templateId && template.value?.id) {
    const clone = cloneDeep(template.value)
    const form = {
      config: Object.keys(clone)
        .filter((k) => !['options', 'id', 'context-name', 'is-default', 'type', 'links', 'status'].includes(k))
        .reduce((r, k) => {
          r[k] = clone[k]
          return r
        }, {}),
      options: clone.options
    }
    return form
  }
  if (props.defaultProvider && provider.value?.id) {
    const t = defaultTemplate.value
    if (t) {
      const clone = cloneDeep(t)
      const form = {
        config: Object.keys(clone)
          .filter((k) => !['options', 'id', 'context-name', 'is-default', 'type', 'links', 'status'].includes(k))
          .reduce((r, k) => {
            r[k] = t[k]
            return r
          }, {}),
        options: clone.options
      }
      return form
    }
    return defaultFormAndDesc.value?.form
  }
  return null
})

const hasError = computed(() => {
  return errors.value.length + formErrors.value.length > 0
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
</script>
