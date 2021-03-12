<template>
  <div class="quick-start__aws-form">
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
    <password-form
      v-show="showKeyForm"
      v-model.trim="form.options['access-key']"
      label="Access Key"
      :desc="desc.options['access-key']"
      required
    />
    <password-form
      v-show="showKeyForm"
      v-model.trim="form.options['secret-key']"
      label="Secret Key"
      :desc="desc.options['secret-key']"
      required
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
import {defineComponent} from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import { PasswordInput as PasswordForm} from '@/components/Input'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
import { cloneDeep } from '@/utils'

export default defineComponent({
  props: {
    schema: {
      type: Object,
      required: true,
    },
    showKeyForm: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const { form, desc }= useFormFromSchema(props.schema)
    const getForm = () => {
      return cloneDeep(form)
    }
    return {
      form,
      desc,
      getForm,
    }
  },
  components: {
    PasswordForm,
    StringForm,
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