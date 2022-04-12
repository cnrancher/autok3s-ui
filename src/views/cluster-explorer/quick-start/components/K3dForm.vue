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
  </div>
</template>
<script>
import {computed,defineComponent} from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
import { cloneDeep } from '@/utils'

export default defineComponent({
  components: {
    StringForm,
  },
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
      return props.hasError || !props.schema.options['access-key']?.default || !props.schema.options['secret-key']?.default
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
  }
})
</script>
