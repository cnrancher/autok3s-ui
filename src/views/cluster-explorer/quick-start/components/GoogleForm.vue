<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <string-form
      v-model.trim="form.config['master']"
      label="Master"
      :desc="desc.config['master']"
    />
    <string-form
      v-model.trim="form.config['worker']"
      label="Worker"
      :desc="desc.config['worker']"
    />
    <string-form
      v-show="showKeyForm"
      v-model.trim="form.options['service-account']"
      label="Service Account"
      :desc="desc.options['service-account']"
      required
    />
    <string-form
      v-show="showKeyForm"
      v-model.trim="form.options['service-account-file']"
      label="Service Account File"
      :desc="desc.options['service-account-file']"
      required
    />
    <string-form
      v-model.trim="form.options['project']"
      label="Project"
      :desc="desc.options['project']"
    />
    <string-form
      v-model.trim="form.options.region"
      label="Region"
      :desc="desc.options.region"
      disabled
    />
    <string-form
      v-model.trim="form.options.zone"
      label="Zone"
      :desc="desc.options.zone"
      disabled
    />
  </div>
</template>
<script>
import {computed,defineComponent} from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
import { cloneDeep } from '@/utils'

export default defineComponent({
  props: {
    schema: {
      type: Object,
      required: true,
    },
    hasError: {
      type: Boolean,
      default: false,
    }
  },
  setup(props) {
    const { form, desc }= useFormFromSchema(props.schema)
    const showKeyForm = computed(() => {
      return props.hasError || !props.schema.options['service-account']?.default || !props.schema.options['service-account-file']?.default
    })
    const getForm = () => {
      return cloneDeep(form)
    }
    return {
      form,
      desc,
      showKeyForm,
      getForm,
    }
  },
  components: {
    StringForm,
  }
})
</script>
