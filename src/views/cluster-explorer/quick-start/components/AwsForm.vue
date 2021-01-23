<template>
  <div class="quick-start">
    <div class="quick-start__aws-form">
      <k-select
        v-model="form.provider"
        label="Provider"
        required
        :loading="loading"
        @change="changeProvider"
      >
      <k-option v-for="p in providers" :key="p.id" :value="p.id" :label="p.name"></k-option>
    </k-select>
    <k-input
      v-model.trim="form.config.name"
      label="Name"
      placeholder="e.g. test"
      required
    />
    <k-input v-model.trim="form.config.master" required label="Master" />
    <k-input v-model.trim="form.config.worker" required label="Worker" />
    <password-form
      v-show="showKeyForm"
      v-model.trim="form.options['access-key']"
      label="Access Key"
      placeholder=""
      required
    />
    <password-form
      v-show="showKeyForm"
      v-model.trim="form.options['secret-key']"
      label="Secret Key"
      placeholder=""
      required
    />
     <k-input
      v-model.trim="form.options.region"
      label="Region"
      disabled
    />
    <k-input
      v-model.trim="form.options.zone"
      label="Zone"
      disabled
    />
    </div>
    <footer-actions>
      <k-button class="btn role-secondary" @click="goToCreatePage">Advance</k-button>
      <k-button class="bg-primary" :loading="btnLoading" @click="create">Create</k-button>
    </footer-actions>
    <k-alert v-for="(e, index) in formErrors" :key="index" type="error" :title="e"></k-alert>
  </div>
</template>
<script>
import {computed, defineComponent, inject, reactive, ref, toRef, toRefs, watch} from 'vue'
import { useRouter } from 'vue-router'
import KInput from '@/components/Input'
import { PasswordInput as PasswordForm} from '@/components/Input'
import { Select as KSelect, Option as KOption} from '@/components/Select'
import KAlert from '@/components/Alert'
import KButton from '@/components/Button'
import FooterActions from '@/views/components/FooterActions.vue'
import { createCluster } from '@/api/cluster.js';
import {stringify} from '@/utils/error.js'
import { cloneDeep, parseSchemaDefaultValue } from '@/utils'

export default defineComponent({
  props: {
    providers: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    },
    initForm: {
      type: Object,
    },
  },
  emits: ['change-provider'],

  setup(props, {emit}) {
    const router = useRouter()
    const formErrors = ref([])
    const form = reactive({
      provider: 'aws',
      config: {
        name: '',
        worker: '1',
        master: '1',
      },
      options: {
        'access-key': '',
        'secret-key': '',
        region: '',
        zone: '',
      },
    })
    const {loading, providers} = toRefs(props)
    const initForm = toRef(props, 'initForm')
    
    const creating = ref(false)
    const btnLoading = computed(() => {
      return loading.value || creating.value
    })
    const clusterStore = inject('clusterStore')
    const showKeyForm = ref(false)
    const updateKeyFormState = () => {
      if (!form.options['access-key'] || !form.options['secret-key'] || formErrors.value.length > 0) {
        showKeyForm.value = true
        return
      }
      showKeyForm.value = false
    }
    watch([loading, providers, initForm], () => {
      if (loading.value) {
        return
      }
      const p = providers.value.find((p) => p.id === 'aws')
      if (!p) {
        formErrors.value = ['Provider (aws) not found']
        return
      }
      // init form from props of initForm
      if (initForm.value) {
        const f = cloneDeep(initForm.value)
        form.config = Object.keys(f)
          .filter((k) => !['options', 'id', 'context-name', 'is-default', 'type', 'links'].includes(k))
          .reduce((t, k) => {
            t[k] = f[k]
            return t
          }, {})
        form.options = f.options
        updateKeyFormState()
        return
      }
      // init form from history
      // const history = clusterStore.state.quickStartFormHistory[p.id]?.[0]
      //   if (history) {
      //     const h = cloneDeep(history)
      //     form.config = {
      //       ...form.config,
      //       ...h.config,
      //     }
      //     form.options = {
      //       ...form.options,
      //       ...h.options,
      //     }
      //     updateKeyFormState()
      //     return
      //   }
        // init form from provider schema
        Object.keys(p.config).forEach((k) => {
          form.config[k] = parseSchemaDefaultValue(p.config[k])
          if (form.config.master === '0') {
            form.config.master = '1'
          }
          if (form.config.worker === '0') {
            form.config.worker = '1'
          }
        })
        Object.keys(p.options).forEach((k) => {
          form.options[k] = parseSchemaDefaultValue(p.options[k])
        })
        updateKeyFormState()
        return
    }, {
      immediate: true
    })

    const goToCreatePage = () => {
      clusterStore.action.saveQuickStartFormHistory({...cloneDeep(form)})
      router.push({name: 'ClusterExplorerCoreClustersCreate', query: { quickStart: form.provider }})
    }

    const changeProvider = (provider) => {
      emit('change-provider', provider)
    }
    const validate = () => {
      const numReg = /^[0-9]+$/
      const errors = [];
      if (!form.config['name']) {
        errors.push('"Name" is required')
      }
      if (!form.options['access-key']) {
        errors.push('"Access Key" is required')
      }
      if (!form.options['secret-key']) {
        errors.push('"Access Secret" is required')
      }
      if (!numReg.test(form.config.worker) || parseInt(form.config.worker, 10) < 0) {
        errors.push('"Worker" must be greater than or equal to 0');
      }
      if (!numReg.test(form.config.master) || parseInt(form.config.master, 10) <= 0) {
        errors.push('"Master" must be greater than 0');
      }
      if (!form.options.region) {
        errors.push('"Region" is required')
      }
      if (!form.options.zone) {
        errors.push('"Zone" is required')
      }
      formErrors.value = errors;
      return errors.length === 0;
    }
    const create = async () => {
      if (!validate()) {
        return;
      }
      creating.value = true
      try {
        await createCluster({
          provider: form.provider,
          ...form.config,
          options: {...form.options}
        })
        router.push({ name: 'ClusterExplorerCoreClusters' })
      } catch (err) {
        formErrors.value = [stringify(err)]
        updateKeyFormState()
      }
      creating.value = false
    }
    // onBeforeUnmount(() => {
    //   clusterStore.action.saveQuickStartFormHistory({...form})
    // })
    return {
      formErrors,
      changeProvider,
      form,
      btnLoading,
      create,
      showKeyForm,
      goToCreatePage,
    }
  },
  components: {
    KInput,
    KSelect,
    KOption,
    KAlert,
    FooterActions,
    KButton,
    PasswordForm,
  }
})
</script>
<style>
.quick-start__aws-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 20px;
}
</style>