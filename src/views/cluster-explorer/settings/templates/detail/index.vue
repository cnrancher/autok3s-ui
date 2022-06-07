<template>
  <div>
    <page-header>
      <template #title>
        <router-link :to="{ name: 'ClusterExplorerSettingsTemplates' }">Template:</router-link>
        Detail {{ name }}
      </template>
      <template #actions>
        <router-link
          v-if="!template?.status"
          :to="{ name: 'ClusterExplorerCoreClustersCreate', query: { templateId } }"
          class="btn role-secondary"
        >
          Create Cluster
        </router-link>
        <router-link
          :to="{ name: 'ClusterExplorerSettingsTemplatesEdit', params: { templateId } }"
          class="btn role-secondary"
        >
          Edit
        </router-link>
      </template>
    </page-header>
    <k-loading :loading="loading">
      <k-alert
        v-if="template?.provider === 'native'"
        type="warning"
        title="Native provider only supports create K3s cluster and join K3s nodes."
      ></k-alert>
      <k-alert
        v-if="template?.provider === 'k3d'"
        type="warning"
        title="Highly recommended that K3d provider run in a Linux / Unix environment, do not run K3d provider in MacOS container environment."
      ></k-alert>
      <k-alert v-if="template?.status" type="warning" :title="template?.status"></k-alert>
      <form autocomplete="off">
        <div class="grid grid-cols-3 gap-10px pb-20px">
          <k-select :model-value="template?.provider" label="Provider" required :loading="loading" disabled>
            <k-option v-for="p in providers" :key="p.id" :value="p.id" :label="p.name"></k-option>
          </k-select>
          <string-form :model-value="template?.name" label="Name" placeholder="e.g. test" required readonly />
          <boolean-form
            :model-value="template?.['is-default']"
            label="Default Template"
            true-label="True"
            false-label="False"
            readonly
          ></boolean-form>
        </div>
        <template v-if="!loading">
          <EditFromTemplate
            v-if="templateId && template && templateProvider"
            :provider="templateProvider"
            :template="template"
            :readonly="true"
          ></EditFromTemplate>
        </template>
        <footer-actions>
          <router-link :to="{ name: 'ClusterExplorerSettingsTemplates' }" class="btn role-secondary">
            Go Back
          </router-link>
        </footer-actions>
        <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
      </form>
    </k-loading>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import PageHeader from '@/views/components/PageHeader.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import EditFromTemplate from '@/views/components/providerForm/EditFromTemplate.vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import BooleanForm from '@/views/components/baseForm/BooleanForm.vue'
import useProviders from '@/composables/useProviders.js'
import useTemplateStore from '@/store/useTemplateStore.js'
import { storeToRefs } from 'pinia'

const props = defineProps({
  templateId: {
    type: String,
    default: ''
  }
})
const templateStore = useTemplateStore()
const name = ref('')
const { loading: providersLoading, providers, error: loadProviderError } = useProviders()
const { loading: templateLoading, error: loadTemplateError, data: templates } = storeToRefs(templateStore)
const template = computed(() => {
  if (props.templateId) {
    return templates.value.find((t) => t.id === props.templateId)
  }
  return null
})

const templateProvider = computed(() => {
  if (!template.value) {
    return null
  }
  return providers.value.find((p) => p.id === template.value?.provider)
})

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
    if (props.templateId && !templateProvider.value?.id) {
      errors.push(`Provider (${template.value?.provider}) not found`)
    }
  }
  return errors
})
</script>
