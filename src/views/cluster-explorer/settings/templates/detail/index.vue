<template>
  <div>
    <page-header>
      <template #title><router-link :to="{ name: 'ClusterExplorerSettingsTemplates' }">Template: </router-link>Detail {{name}}</template>
      <template #actions>
        <router-link :to="{name: 'ClusterExplorerCoreClustersCreate', query: {templateId}}" class="btn role-secondary" v-if="!warning">Create Cluster</router-link>
        <router-link :to="{name: 'ClusterExplorerSettingsTemplatesEdit', params: {templateId}}" class="btn role-secondary">Edit</router-link>
      </template>
    </page-header>
    <k-loading :loading="loading">
      <k-alert v-if="currentProvider === 'native'" type="warning" title="Native provider only supports create K3s cluster and join K3s nodes."></k-alert>
      <k-alert v-if="currentProvider === 'k3d'" type="warning" title="Highly recommended that K3d provider run in a Linux / Unix environment, do not run K3d provider in MacOS container environment."></k-alert>
      <k-alert v-if="warning" type="warning" :title="warning"></k-alert>
      <form autocomplete="off">
        <div class="grid grid-cols-3 gap-10px pb-20px">
          <k-select
            v-model="currentProvider"
            label="Provider"
            required
            :loading="loading"
            disabled
          >
            <k-option v-for="p in providers" :key="p.id" :value="p.id" :label="p.name"></k-option>
          </k-select>
          <string-form
            v-model.trim="name"
            label="Name"
            placeholder="e.g. test"
            required
            readonly
          />
          <boolean-form
            v-model="isDefault"
            label="Default Template"
            trueLabel="True"
            falseLabel="False"
            readonly
          ></boolean-form>
        </div>
        <component readonly v-if="providerSchema.config && providerSchema.options && providerSchema.id === currentProvider" ref="formRef" :schema="providerSchema" :is="clusterFormComponent"></component>
        <footer-actions>
          <router-link :to="{name: 'ClusterExplorerSettingsTemplates'}" class="btn role-secondary">Go Back</router-link>
        </footer-actions>
        <k-alert v-for="(e, index) in formErrors" :key="index" type="error" :title="e"></k-alert>
        <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
      </form>
    </k-loading>
  </div>
</template>
<script>
import {computed, defineComponent, inject, reactive, ref, toRef, toRefs, watch} from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/views/components/PageHeader.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import AwsClusterCreateForm from '@/views/components/providerForm/AwsClusterForm.vue'
import AlibabaClusterCreateForm from '@/views/components/providerForm/AlibabaClusterForm.vue'
import TencentClusterCreateForm from '@/views/components/providerForm/TencentClusterForm.vue'
import K3dClusterCreateForm from '@/views/components/providerForm/K3dClusterForm.vue'
import NativeClusterCreateForm from '@/views/components/providerForm/NativeClusterForm.vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import BooleanForm from '@/views/components/baseForm/BooleanForm.vue'
import useProviders from '@/composables/useProviders.js'
import { overwriteSchemaDefaultValue} from '@/utils/index.js'
import {capitalize} from 'lodash-es'
import { cloneDeep } from '@/utils'

export default defineComponent({
  name: 'TemplateDetail',
  props: {
    templateId: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const templateStore = inject('templateStore')
    const router = useRouter()
    const formRef = ref(null)
    const name = ref('')
    const currentProvider = ref('')
    const isDefault = ref(false)
    const warning = ref('')

    const formErrors = ref([])
    const providerSchema = reactive({
      config: null,
      options: null
    })

    const templateId = toRef(props, 'templateId')

    const {loading: providersLoading, providers, error: loadProviderError} = useProviders()
    const {loading: templateLoading, error: loadTemplateError, templates} = toRefs(templateStore.state)

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
      return errors
    })

    watch([templateId, providers, templates, loading], () => {
      if (loading.value) {
        return
      }
      if (!templateId.value) {
        formErrors.value = ['Template id is required']
        return
      }
      const t = templates.value.find((t) => t.id === templateId.value)
      if (!t) {
        formErrors.value = [`Template (${templateId.value}) not found`]
        return
      }
      const provider = providers.value.find((p) => p.id === t?.provider)
      if (!provider) {
        return
      }
      const template = cloneDeep(t)
      isDefault.value = template['is-default']
      warning.value = template.status ?? ''
      const defaultVal = {
        config: Object.keys(template)
          .filter((k) => k != 'options')
          .reduce((t, k) => {
            t[k] = template[k]
            return t
          }, {}),
        options: template.options,
      }
      const schema = overwriteSchemaDefaultValue(provider, defaultVal)
      name.value= schema.config.name.default
      currentProvider.value = provider.id
      providerSchema.id = provider.id
      providerSchema.config = schema.config
      providerSchema.options = schema.options
      return
    }, {
      immediate: true
    })

    const clusterFormComponent = computed(() => {
      const p = currentProvider.value
      return `${capitalize(p)}ClusterCreateForm`
    })

    const goBack = () => {
      router.push({name: 'ClusterExplorerCoreClusters'})
    }
    return {
      formRef,
      providerSchema,
      loading,
      errors,
      name,
      currentProvider,
      providers,
      clusterFormComponent,
      goBack,
      isDefault,
      formErrors,
      warning,
    }
  },
  components: {
    PageHeader,
    FooterActions,
    AwsClusterCreateForm,
    AlibabaClusterCreateForm,
    TencentClusterCreateForm,
    K3dClusterCreateForm,
    NativeClusterCreateForm,
    StringForm,
    BooleanForm
  }
})
</script>

