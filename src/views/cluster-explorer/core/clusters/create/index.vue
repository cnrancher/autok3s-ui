<template>
  <div>
    <page-header>
      <template #title><router-link :to="{ name: 'ClusterExplorerCoreClusters' }">Cluster: </router-link>Create</template>
      <template #actions>
        <template-filter :provider="currentProvider" @apply-template="handleApplyTemplate"></template-filter>
      </template>
    </page-header>
    <k-loading :loading="loading || creating">
      <!-- fake fields are a workaround for chrome autofill getting the wrong fields -->
      <input style="display: none" type="text" />
      <input style="display: none" type="password" />
      <k-alert v-if="currentProvider === 'native'" type="warning" title="Native provider only supports create K3s cluster and join K3s nodes."></k-alert>
      <k-alert v-if="currentProvider === 'k3d'" type="warning" title="Highly recommended that K3d provider run in a Linux / Unix environment, do not run K3d provider in MacOS container environment."></k-alert>
      <div class="grid grid-cols-2 gap-10px pb-20px">
        <k-select
          v-model="currentProvider"
          label="Provider"
          required
          :loading="loading"
          @change="handleProviderChange"
        >
          <k-option v-for="p in providers" :key="p.id" :value="p.id" :label="p.name"></k-option>
        </k-select>
        <k-input
          v-model.trim="name"
          label="Name"
          placeholder="e.g. test"
          required
        />
      </div>
      <component :is="clusterFormComponent" v-if="providerSchema.config && providerSchema.options && providerSchema.id === currentProvider" ref="formRef" :schema="providerSchema"></component>
      <footer-actions>
        <router-link :to="{name: 'ClusterExplorerCoreClusters'}" class="btn role-secondary">Cancel</router-link>
        <k-button class="role-secondary" type="button" :loading="loading || creating" @click="showCliModal">Generate CLI Command</k-button>
        <k-button class="role-primary" type="button" :loading="loading || creating" @click="create">Create</k-button>
      </footer-actions>
      <k-alert v-for="(e, index) in formErrors" :key="index" type="error" :title="e"></k-alert>
      <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
    </k-loading>
    <cli-command v-model:visible="cliModalVisible" :cluster-form="clusterForm"></cli-command>
  </div>
</template>
<script>
import {computed, defineComponent, reactive, ref, toRef, watch} from 'vue'
import { useRouter } from 'vue-router'
import jsyaml from 'js-yaml'
import PageHeader from '@/views/components/PageHeader.vue'
import TemplateFilter from '@/views/components/TemplateFilter/index.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import CliCommand from '@/views/components/CliCommand.vue'
import AwsClusterCreateForm from '@/views/components/providerForm/AwsClusterForm.vue'
import AlibabaClusterCreateForm from '@/views/components/providerForm/AlibabaClusterForm.vue'
import TencentClusterCreateForm from '@/views/components/providerForm/TencentClusterForm.vue'
import NativeClusterCreateForm from '@/views/components/providerForm/NativeClusterForm.vue'
import K3dClusterCreateForm from '@/views/components/providerForm/K3dClusterForm.vue'
import GoogleClusterCreateForm from '@/views/components/providerForm/GoogleClusterForm.vue'
import HarvesterClusterCreateForm from '@/views/components/providerForm/HarvesterClusterForm.vue'
import useProviders from '@/composables/useProviders.js'
import useCluster from '@/composables/useCluster.js'
import { createCluster } from '@/api/cluster.js'
import {capitalize} from 'lodash-es'
import {stringify} from '@/utils/error.js'
import { cloneDeep, saveCreatingCluster, overwriteSchemaDefaultValue } from '@/utils'
import { Base64 } from 'js-base64'
import useProviderClusterStores from '@/store/useProviderClusterStores.js'
import useTemplateStore from '@/store/useTemplateStore.js'
import { storeToRefs } from 'pinia'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'

export default defineComponent({
  name: 'CreateCluster',
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
    CliCommand,
  },
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
    quickStart: { // quickStart: 'aws'
      type: String,
      default: ''
    },
  },
  setup(props) {
    const providerClusterStores = useProviderClusterStores()
    const templateStore = useTemplateStore()
    const wmStore = useWindownManagerStore()
    const router = useRouter()
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

    const clusterId = toRef(props, 'clusterId')
    const templateId = toRef(props, 'templateId')
    const defaultProvider = toRef(props, 'defaultProvider')
    const quickStart = toRef(props, 'quickStart')

    const {loading: providersLoading, providers, error: loadProviderError} = useProviders()
    const {loading: clusterLoading, error: loadClusterError, cluster} = useCluster(clusterId)
    const {loading: templateLoading, error: loadTemplateError, data: templates} = storeToRefs(templateStore)

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

    const createFromQuickStart = (providerId) => {
      const provider = providers.value.find((p) => p.id === providerId) ?? providers.value[0]
      if (!provider) {
        formErrors.value = [`Provider (${providerId}) not found`]
        return
      }
      const quickStartForm = providerClusterStores[provider.id]?.formHistory?.[0]
      if (quickStartForm) {
        updateProviderSchema(provider, quickStartForm)
        return
      }
      createFromProvider(providerId)
    }

    watch([clusterId, templateId, defaultProvider, quickStart, providers, cluster, templates, loading], () => {
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

      // create from quick start
      if (quickStart.value) {
        createFromQuickStart(quickStart.value)
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
      router.push({name: 'ClusterExplorerCoreClusters'})
    }
    let form = null
    const validate = () => {
      // eslint-disable-next-line no-unused-vars
      const allRequiredFields = Object.entries(providerSchema).filter(([k, v]) => v?.required).map(([k]) => k);
      form = formRef.value?.getForm()
      if (!form) {
        return
      }
      const errors = allRequiredFields.reduce((t, c) => {
        if (!form[c]) {
          t.push(`"${ c }" is required`);
        }
        return t;
      }, []);

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
    const create = async () => {
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
      try {
        const { id = '' } = await createCluster(formData)
        saveCreatingCluster(id)
        if (formData.provider === 'native') {
          wmStore.addTab({
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
      router.push({name: 'ClusterExplorerCoreClustersCreate', query: {defaultProvider: value}})
    }
    const handleApplyTemplate = (templateId) => {
      if (props.templateId === templateId) {
        createFromTemplate(templateId)
        return
      }
      router.push({name: 'ClusterExplorerCoreClustersCreate', query: {templateId}})
    }
    // onBeforeUnmount(() => {
    //   const f = formRef.value?.getForm()
    //   if (!f) {
    //     return
    //   }
    //   clusterStore.action.saveFormHistory({...f, provider: currentProvider.value})
    // })

    const cliModalVisible = ref(false)
    const clusterForm = ref({})
    const showCliModal = () => {
      cliModalVisible.value = true
      clusterForm.value = formRef.value?.getForm()
      if (clusterForm.value.config) {
        clusterForm.value.config.name = name.value
      }
    }

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
      showCliModal,
      cliModalVisible,
      clusterForm,
    }
  }
})
</script>
