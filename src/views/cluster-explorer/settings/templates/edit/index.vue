<template>
  <div>
    <page-header>
      <template #title>
        <router-link :to="{ name: 'ClusterExplorerSettingsTemplates' }">Template:</router-link>
        Edit {{ template?.name }}
      </template>
    </page-header>
    <k-loading :loading="loading || updating || formLoading">
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
      <k-alert v-if="template.status" type="warning" :title="template.status"></k-alert>
      <div class="grid grid-cols-3 gap-10px pb-20px">
        <k-select :model-value="template?.provider" label="Provider" required :loading="loading" disabled>
          <k-option v-for="p in providers" :key="p.id" :value="p.id" :label="p.name"></k-option>
        </k-select>
        <string-form :model-value="template?.name" label="Name" placeholder="e.g. test" required readonly />
        <boolean-form
          v-if="template"
          v-model="template['is-default']"
          label="Default Template"
          true-label="True"
          false-label="False"
          :loading="loading"
        ></boolean-form>
      </div>
      <template v-if="!loading">
        <EditFromTemplate
          v-if="templateId && template && templateProvider"
          :provider="templateProvider"
          :template="template"
        ></EditFromTemplate>
      </template>
      <footer-actions>
        <router-link :to="{ name: 'ClusterExplorerSettingsTemplates' }" class="btn role-secondary">Cancel</router-link>
        <k-button class="role-primary" type="button" :loading="loading || updating" @click="save">Save</k-button>
      </footer-actions>
      <k-alert v-for="(e, index) in formErrors" :key="index" type="error" :title="e"></k-alert>
      <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e"></k-alert>
    </k-loading>
  </div>
</template>
<script setup>
import { computed, ref, provide } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/views/components/PageHeader.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import BooleanForm from '@/views/components/baseForm/BooleanForm.vue'
import EditFromTemplate from '@/views/components/providerForm/EditFromTemplate.vue'
import useProviders from '@/composables/useProviders.js'
import { update as updateTemplate } from '@/api/template.js'
import { stringify } from '@/utils/error.js'
import { cloneDeep } from '@/utils'
import useTemplateStore from '@/store/useTemplateStore.js'
import { storeToRefs } from 'pinia'
import useClusterFormManage from '@/composables/useClusterFormManage.js'

const props = defineProps({
  templateId: {
    type: String,
    default: ''
  }
})

const { getForm, validate } = useClusterFormManage()
const templateStore = useTemplateStore()
const router = useRouter()
const updating = ref(false)
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
const goBack = () => {
  router.push({ name: 'ClusterExplorerSettingsTemplates' })
}
const save = async () => {
  let errors = []
  if (!templateProvider.value) {
    errors.push(`"Provider" is required`)
    formErrors.value = errors
    return
  }
  const form = getForm()
  if (!form.config || !form.options) {
    errors.push(`Forms are not initialized `)
    formErrors.value = errors
    return
  }

  const providerSchema = templateProvider.value
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

  updating.value = true
  const promises = [updateTemplate(props.templateId, formData)]
  const rawTemplate = templates.value.find((t) => t.id === formData.id)
  if (rawTemplate?.['is-default'] === false && formData['is-default'] === true) {
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
  updating.value = false
  if (saveErrors.length === 0) {
    goBack()
  }
}
</script>
