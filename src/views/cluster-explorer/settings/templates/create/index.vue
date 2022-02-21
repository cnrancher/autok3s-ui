<template>
  <div>
    <page-header>
      <template #title><router-link :to="{ name: 'ClusterExplorerSettingsTemplates' }">Template: </router-link>Create</template>
      <template #actions>
        <template-filter :provider="currentProvider" :disabled="loading || creating" @apply-template="handleApplyTemplate"></template-filter>
      </template>
    </page-header>
    <k-loading :loading="loading || creating">
      <k-alert v-if="currentProvider === 'native'" type="warning" title="Native provider only supports create K3s cluster and join K3s nodes."></k-alert>
      <k-alert v-if="currentProvider === 'k3d'" type="warning" title="Highly recommended that K3d provider run in a Linux / Unix environment, do not run K3d provider in MacOS container environment."></k-alert>
      <div class="grid grid-cols-3 gap-10px pb-20px">
        <k-select
          v-model="currentProvider"
          label="Provider"
          required
          :loading="loading"
          @change="handleProviderChange"
        >
          <k-option v-for="p in providers" :key="p.id" :value="p.id" :label="p.name"></k-option>
        </k-select>
        <string-form
          v-model.trim="name"
          label="Name"
          placeholder="e.g. test"
          required
        />
        <boolean-form
          v-model="isDefault"
          label="Default Template"
          trueLabel="True"
          falseLabel="False"
        ></boolean-form>
      </div>
      <component v-if="providerSchema.config && providerSchema.options && providerSchema.id === currentProvider" ref="formRef" :schema="providerSchema" :is="clusterFormComponent"></component>
      <footer-actions>
        <router-link :to="{name: 'ClusterExplorerSettingsTemplates'}" class="btn role-secondary">Cancel</router-link>
        <k-button class="role-primary" type="button" :loading="loading || creating" @click="create">Create</k-button>
      </footer-actions>
      <k-alert v-for="(e, index) in formErrors" :key="index" type="error" :title="e"></k-alert>
      <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
    </k-loading>
  </div>
</template>
<script>
import {computed, defineComponent, inject, reactive, ref, toRef, toRefs, watch} from 'vue'
import { useRouter } from 'vue-router'
import jsyaml from 'js-yaml'
import PageHeader from '@/views/components/PageHeader.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import AwsClusterCreateForm from '@/views/components/providerForm/AwsClusterForm.vue'
import AlibabaClusterCreateForm from '@/views/components/providerForm/AlibabaClusterForm.vue'
import TencentClusterCreateForm from '@/views/components/providerForm/TencentClusterForm.vue'
import NativeClusterCreateForm from '@/views/components/providerForm/NativeClusterForm.vue'
import K3dClusterCreateForm from '@/views/components/providerForm/K3dClusterForm.vue'
import GoogleClusterCreateForm from '@/views/components/providerForm/GoogleClusterForm.vue'
import HarvesterClusterCreateForm from '@/views/components/providerForm/HarvesterClusterForm.vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import BooleanForm from '@/views/components/baseForm/BooleanForm.vue'
import TemplateFilter from '@/views/components/TemplateFilter/index.vue'
import useProviders from '@/composables/useProviders.js'
import useCluster from '@/composables/useCluster.js'
import { create as createTemplate, update as updateTemplate } from '@/api/template.js';
import {capitalize} from 'lodash-es'
import {stringify} from '@/utils/error.js'
import { cloneDeep, overwriteSchemaDefaultValue } from '@/utils'
import { Base64 } from 'js-base64'

export default defineComponent({
  name: 'CreateTemplate',
  props: {
    clusterId: {
      type: String,
      default: '',
    },
    templateId: {
      type: String,
      default: '',
    },
    defaultProvider: {
      type: String,
      default: 'aws'
    },
  },
  setup(props) {
    const templateStore = inject('templateStore')
    const router = useRouter()
    const formRef = ref(null)
    const name = ref('')
    const currentProvider = ref('aws')
    const isDefault = ref(false)

    const creating = ref(false)
    const formErrors = ref([])
    const providerSchema = reactive({
      id: '',
      config: null,
      options: null
    })

    const clusterId = toRef(props, 'clusterId')
    const templateId = toRef(props, 'templateId')
    const defaultProvider = toRef(props, 'defaultProvider')

    const {loading: providersLoading, providers, error: loadProviderError} = useProviders()
    const {loading: clusterLoading, error: loadClusterError, cluster} = useCluster(clusterId)
    const {loading: templateLoading, error: loadTemplateError, templates} = toRefs(templateStore.state)

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
      return errors
    })

    const updateProviderSchema = (provider, defaultVal, excludeKeys) => {
      const schema = overwriteSchemaDefaultValue(provider, defaultVal, excludeKeys)
      name.value = schema.config.name.default
      currentProvider.value = provider.id
      providerSchema.id = provider.id
      providerSchema.config = schema.config
      providerSchema.options = schema.options
    }

    const getProviderDefaultTemplate = (providerId) => {
      const t = templates.value.find((t) => t.provider === providerId && t['is-default'])
      return t ? cloneDeep(t) : null
    }
    const createFromCluster = (clusterId) => {
      if (!cluster.value) {
        formErrors.value = [`Cluster (${clusterId}) not found`]
        return
      }
      const provider = providers.value.find((p) => p.id === cluster.value.provider)
      if (!provider) {
        formErrors.value = [`Provider (${cluster.value.provider}) not found`]
        return
      }
      const c = cloneDeep(cluster.value)
      const defaultVal = {
        config: Object.keys(c)
          .filter((k) => k != 'options')
          .reduce((t, k) => {
            t[k] = c[k]
            return t
          }, {}),
        options: c.options,
      }
      updateProviderSchema(provider, defaultVal, ['config.ip', 'config.token'])
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
            .filter((k) => !['options'].includes(k))
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
    // const createFromHistory = (providerId) => {
    //   const provider = providers.value.find((p) => p.id === providerId) ?? providers.value[0]
    //   if (!provider) {
    //     formErrors.value = [`Provider (${providerId}) not found`]
    //     return
    //   }
    //   const historyForm = clusterStore.state.formHistory[provider.id]?.[0]
    //   if (historyForm) {
    //     updateProviderSchema(provider, cloneDeep(historyForm))
    //     return
    //   }
    //   createFromProvider(providerId)
    // }

    watch([clusterId, templateId, defaultProvider, providers, cluster, templates, loading], () => {
      if (loading.value) {
        return
      }
      // create from clone or reedit
      if (clusterId.value) {
        createFromCluster(clusterId.value)
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

      // create from history
      // createFromHistory(currentProvider.value)
      // return
    }, {
      immediate: true
    })

    const clusterFormComponent = computed(() => {
      const p = providerSchema.id
      return `${capitalize(p)}ClusterCreateForm`
    })

    const goBack = () => {
      router.push({name: 'ClusterExplorerSettingsTemplates'})
    }
    let form = null
    const validate = () => {
      const allRequiredFields = Object.entries(providerSchema).filter(([k, v]) => v?.required).map(([k]) => k);
      form = formRef.value?.getForm()
      if (!form) {
        return false
      }
      const errors = allRequiredFields.reduce((t, c) => {
        if (!form[c]) {
          t.push(`"${ c }" is required`)
        }
        return t
      }, [])
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
    const create = async (e) => {
      if (!validate()) {
        form = null
        return
      }
      const formData = {
        'is-default': isDefault.value,
        ...form.config,
        name: name.value,
        provider: currentProvider.value,
        options: {
          ...form.options
        }
      }
       // encode kubeconfig-content, network-data, user-data to base64 for harvester provider
      if (formData.provider === 'harvester') {
        ['kubeconfig-content', 'network-data', 'user-data'].forEach((k) => {
          const v = formData.options[k]
          if (v) {
            formData.options[k] = Base64.encode(v)
          }
        })
      }
      creating.value=true
      const promises = [createTemplate(formData)]
      if (formData['is-default']) {
        promises.push(
          ...templates.value
          .filter((t) => t.provider === formData.provider && t['is-default'])
          .map((t) => updateTemplate(t.id, { ...cloneDeep(t), 'is-default': false }))
        )
      }
      const results = await Promise.allSettled(promises)
      const errors = results
          .filter((p) => p.status === 'rejected')
          .map((p) => p.reason)
          .map((e) => stringify(e))
      formErrors.value = errors
      creating.value=false
      if (errors.length === 0) {
        goBack()
      }
    }

    const handleProviderChange = (value) => {
      router.push({name: 'ClusterExplorerSettingsTemplatesCreate', query: {defaultProvider: value}})
    }
    const handleApplyTemplate = (templateId) => {
      if (props.templateId === templateId) {
        createFromTemplate(templateId)
        return
      }
      router.push({name: 'ClusterExplorerSettingsTemplatesCreate', query: {templateId}})
    }
    // onBeforeUnmount(() => {
    //   const f = formRef.value?.getForm()
    //   if (!f) {
    //     return
    //   }
    //   clusterStore.action.saveFormHistory({...f, provider: currentProvider.value})
    // })
    return {
      formRef,
      providerSchema,
      loading,
      creating,
      formErrors,
      errors,
      name,
      providers,
      currentProvider,
      clusterFormComponent,
      goBack,
      create,
      handleProviderChange,
      handleApplyTemplate,
      isDefault,
    }
  },
  components: {
    PageHeader,
    FooterActions,
    AwsClusterCreateForm,
    AlibabaClusterCreateForm,
    TencentClusterCreateForm,
    NativeClusterCreateForm,
    K3dClusterCreateForm,
    GoogleClusterCreateForm,
    HarvesterClusterCreateForm,
    TemplateFilter,
    StringForm,
    BooleanForm,
  }
})
</script>
