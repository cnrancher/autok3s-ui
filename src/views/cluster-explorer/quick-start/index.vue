<template>
  <div>
    <page-header>
      <template #title>
        Quick Start
      </template>
      <template #subtitle>
        User quick guides to help you quickly create K3s cluster and add K3s nodes.
      </template>
      <template #actions>
        <template-filter :disabled="loading || creating" :provider="currentProvider" @apply-template="handleApplyTemplate"></template-filter>
      </template>
    </page-header>
    <div class="grid grid-cols-[auto,1fr]">
      <div>
        <img :src="clustcerIcon" class="w-160px h-100px object-contain"/>
      </div>
      <div class="quick-start__form">
        <k-loading :loading="loading || creating">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px pb-20px">
            <k-select
              v-model="currentProvider"
              label="Provider"
              required
              :loading="loading"
              @change="handleProviderChange"
            >
              <k-option v-for="p in providerOptions" :key="p.id" :value="p.id" :label="p.name"></k-option>
            </k-select>
            <k-input
              v-model.trim="name"
              label="Name"
              placeholder="e.g. test"
              required
            />
          </div>
          <component v-if="providerSchema.config && providerSchema.options && providerSchema.id === currentProvider" ref="formRef" :has-error="hasError" :schema="providerSchema" :is="clusterFormComponent"></component>
          <footer-actions>
            <k-button class="btn role-secondary" @click="goToCreatePage">Advance</k-button>
            <k-button class="role-primary" type="button" :loading="loading || creating" @click="create">Create</k-button>
          </footer-actions>
          <k-alert v-for="(e, index) in formErrors" :key="index" type="error" :title="e"></k-alert>
          <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
        </k-loading>
      </div>
    </div>
  </div>
</template>
<script>
import {computed, defineComponent, inject, ref, toRef, toRefs, watch, reactive} from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/views/components/PageHeader.vue'
import TemplateFilter from '@/views/components/TemplateFilter/index.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import AwsForm from './components/AwsForm.vue'
import AlibabaForm from './components/AlibabaForm.vue'
import TencentForm from './components/TencentForm.vue'
import K3dForm from './components/K3dForm.vue'
import GoogleForm from './components/GoogleForm.vue'
import clustcerIcon from '@/assets/images/cluster-single.svg'
import useProviders from '@/composables/useProviders.js'
import { createCluster } from '@/api/cluster.js'
import { cloneDeep, saveCreatingCluster, overwriteSchemaDefaultValue } from '@/utils'
import {capitalize} from 'lodash-es'
import {stringify} from '@/utils/error.js'

export default defineComponent({
  name: 'QuickStart',
  props: {
    templateId: {
      type: String
    },
    defaultProvider: {
      type: String,
      default: 'aws'
    }

  },
  setup(props) {
    const router = useRouter()
    const clusterStore = inject('clusterStore')
    const templateStore = inject('templateStore')
    const formRef = ref(null)
    const name = ref('')
    const currentProvider = ref('aws')

    const creating = ref(false)
    const formErrors = ref([])
    const providerSchema = reactive({
      id: '',
      config: null,
      options: null
    })
    const templateId = toRef(props, 'templateId')
    const defaultProvider = toRef(props, 'defaultProvider')
    const {loading: providerLoading, providers, error: loadProviderError} = useProviders()
    const {loading: templateLoading, error: loadTemplateError, templates} = toRefs(templateStore.state)
    
    const loading = computed(() => {
      return templateLoading.value || providerLoading.value
    })
    const errors = computed(() => {
      const errors = []
      if (loadTemplateError.value) {
        errors.push(loadTemplateError.value)
      }
      if (loadProviderError.value) {
        errors.push(loadProviderError.value)
      }
      return errors
    })
    const updateProviderSchema = (provider, defaultVal, excludeKeys) => {
      const schema = overwriteSchemaDefaultValue(provider, defaultVal, excludeKeys)
      name.value = schema.config.name.default
      currentProvider.value = provider.id
      providerSchema.id = provider.id
      providerSchema.config = schema.config
      providerSchema.options = schema.options
      if (schema.config.master.default === '0') {
        providerSchema.config.master.default = '1'
      }
    }
    const clusterFormComponent = computed(() => {
      const p = currentProvider.value
      return `${capitalize(p)}Form`
    })

    const providerOptions = computed(() => {
      return providers.value.filter((item) => item.id !== 'native')
    })

    const hasError = computed(() => {
      return errors.value.length + formErrors.value.length > 0
    })

    const getProviderDefaultTemplate = (providerId) => {
      const t = templates.value.find((t) => t.provider === providerId && t['is-default'])
      return t ? cloneDeep(t) : null
    }
    const createFromTemplate = (templateId) => {
      const template = templates.value.find((t) => t.id === templateId)
       if (!template) {
        formErrors.value = [`Template (${templateId}) not found`]
        return
      }
      const provider = providers.value.find((p) => p.id === template.provider)
      if (!provider) {
        formErrors.value = [`Provider (${template.provider}) not found`]
        return
      }
      const t = cloneDeep(template)
      const defaultVal = {
        config: Object.keys(t)
          .filter((k) => k != 'options')
          .reduce((r, k) => {
            r[k] = t[k]
            return r
          }, {}),
        options: t.options,
      }
      updateProviderSchema(provider, defaultVal)
    }
    const createFromProvider = (providerId) => {
      const provider = providers.value.find((p) => p.id === providerId)
      if (!provider) {
        formErrors.value = [`Provider (${providerId}) not found`]
        return
      }
      const t = getProviderDefaultTemplate(providerId)
      if (t) {
        const defaultVal = {
          config: Object.keys(t)
            .filter((k) => !['options', 'id', 'context-name', 'is-default', 'type', 'links'].includes(k))
            .reduce((r, k) => {
              r[k] = t[k]
              return r
            }, {}),
          options: t.options,
        }
        updateProviderSchema(provider, defaultVal)
        return
      }
      updateProviderSchema(provider)
    }
    const handleApplyTemplate = (templateId) => {
      if (props.templateId === templateId) {
        createFromTemplate(templateId)
        return
      }
      router.push({name: 'QuickStart', query: {templateId}})
    }
    watch([templateId, providers, templates, defaultProvider, loading], () => {
      if (loading.value) {
        return
      }
      // create from template
      if (templateId.value) {
        createFromTemplate(templateId.value)
        return
      }
      // create from default provider, switch provider
      if (defaultProvider.value) {
       createFromProvider(defaultProvider.value)
       return
      }
    }, {
      immediate: true
    })
    let form = null
    const validate = () => {
      const configRequiredFields = Object.entries(providerSchema.config)
        .filter(([k, v]) => k!== 'name' && v?.required).map(([k]) => k);
      const optionRequiredFields = Object.entries(providerSchema.options)
        .filter(([k, v]) => v?.required).map(([k]) => k);
      form = formRef.value?.getForm()
      if (!form) {
        return
      }
      const configErrors = configRequiredFields.reduce((t, c) => {
        if (!form.config?.[c]) {
          t.push(`"${ c.split('-').map(o => capitalize(o)).join(' ') }" is required`);
        }
        return t;
      }, []);
      const optionErrors = optionRequiredFields.reduce((t, c) => {
        if (!form.options?.[c]) {
          t.push(`"${ c.split('-').map(o => capitalize(o)).join(' ') }" is required`);
        }
        return t;
      }, []);

      const errors = [...configErrors, ...optionErrors]

      if (!name.value) {
        errors.unshift(`"Name" is required`)
      }
      if (!currentProvider.value) {
        errors.unshift(`"Provider" is required`)
      }
      // validate registry
      const registry = form?.config?.['registry']
      if (registry?.trim()) {
        try {
          jsyaml.load(registry)
        } catch (err) {
          errors.push(err)
        }
      }
      formErrors.value= errors;
      return errors.length === 0
    }
    const goBack = () => {
      router.push({name: 'ClusterExplorerCoreClusters'})
    }
    const goToCreatePage = () => {
      const form = formRef.value?.getForm()
      if (!form) {
        router.push({name: 'ClusterExplorerCoreClustersCreate', query: { quickStart: currentProvider.value}})
        return
      }
      form.config.name = name.value
      clusterStore.action.saveQuickStartFormHistory(form)
      router.push({name: 'ClusterExplorerCoreClustersCreate', query: { quickStart: form.provider }})
    }
    const create = async (e) => {
      if (!validate()) {
        form = null
        return
      }
      const formData = {
        ...form.config,
        name: name.value,
        provider: currentProvider.value,
        options: {
          ...form.options
        }
      }
      creating.value=true
      try {
        const { id = '' } = await createCluster(formData)
        saveCreatingCluster(id)
        if (formData.provider === 'native') {
          wmStore.action.addTab({
            id: `log_${id}`,
            component: 'ClusterLogs',
            label: `log: ${formData.name}`,
            icon: 'log',
            attrs: {
              cluster: id,
              provider: formData.provider,
            }
          })
        }
        goBack()
      } catch (err) {
        formErrors.value = [stringify(err)]
      }
      creating.value=false
    }
     const handleProviderChange = (value) => {
      router.push({name: 'QuickStart', query: {defaultProvider: value}})
    }

    return {
      name,
      clustcerIcon,
      errors,
      formErrors,
      hasError,
      loading,
      creating,
      formRef,
      providerOptions,
      currentProvider,
      clusterFormComponent,
      providerSchema,
      handleApplyTemplate,
      goToCreatePage,
      create,
      handleProviderChange,
    }
  },
  components: {
    PageHeader,
    TemplateFilter,
    FooterActions,
    AwsForm,
    AlibabaForm,
    TencentForm,
    K3dForm,
    GoogleForm,
  }
})
</script>
