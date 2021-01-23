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
        <template-filter :provider="currentProvider" @apply-template="handleApplyTemplate"></template-filter>
      </template>
    </page-header>
    <div class="quick-start__content">
      <div class="quick-start__icon">
        <img :src="clustcerIcon" />
      </div>
      <div class="quick-start__form">
        <loading :loading="loading">
          <component
           :is="providerFormComponent"
           :init-form="initForm"
           :providers="providerOptions"
           @change-provider="changeProvider"
           :loading="loading"></component>
        </loading>
      </div>
    </div>
    <alert v-for="(e, index) in errors" type="error" :title="e" :key="index"></alert>
  </div>
</template>
<script>
import {computed, defineComponent, inject, ref, toRefs} from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/views/components/PageHeader.vue'
import TemplateFilter from '@/views/components/TemplateFilter/index.vue'
import AwsForm from './components/AwsForm.vue'
import Loading from '@/components/Loading'
import Alert from '@/components/Alert'
import clustcerIcon from '@/assets/images/cluster-single.svg'
import useProviders from '@/composables/useProviders.js'
import { cloneDeep } from '@/utils'

export default defineComponent({
  name: 'QuickStart',
  props: {
    templateId: {
      type: String
    }
  },
  setup(props) {
    const router = useRouter()
    const templateStore = inject('templateStore')
    const refreshForm = ref(new Date().getTime())
    const {loading: templateLoading, error: loadTemplateError, templates} = toRefs(templateStore.state)
    const {loading: providerLoading, providers, error: loadProviderError, fetchProviders} = useProviders()
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
    const currentProvider = ref('aws')
    const providerFormComponent = computed(() => {
      return `${currentProvider.value}Form`
    })
    const changeProvider = (provider) => {
      currentProvider.value = provider
    }
    const providerOptions = computed(() => {
      return providers.value.filter((item) => item.id === 'aws')
    })
    const initForm = computed(() => {
      if (props.templateId && refreshForm.value) {
        const t = templates.value.find((t) => t.id === props.templateId)
        return t ? cloneDeep(t) : null
      }
      return templates.value.find((t) => t.provider === currentProvider.value && t['is-default'])
    })
    const handleApplyTemplate = (templateId) => {
      if (props.templateId === templateId) {
        refreshForm.value = new Date().getTime()
        return
      }
      router.push({name: 'QuickStart', query: {templateId}})
    }
    return {
      clustcerIcon,
      errors,
      loading,
      providerOptions,
      currentProvider,
      providerFormComponent,
      changeProvider,
      initForm,
      handleApplyTemplate,
    }
  },
  components: {
    PageHeader,
    Alert,
    AwsForm,
    Loading,
    TemplateFilter,
  }
})
</script>
<style>
.quick-start__content {
  display: grid;
  grid-template-columns: auto 1fr;
}
.quick-start__icon > img {
  width: 160px;
  height: 100px;
  object-fit: contain;
}
</style>