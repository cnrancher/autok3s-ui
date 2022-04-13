<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <string-form v-model.trim="form.config['master']" label="Master" :desc="desc.config['master']" />
    <string-form v-model.trim="form.config['worker']" label="Worker" :desc="desc.config['worker']" />
    <string-form
      v-model.number="form.options['cpu-count']"
      min="1"
      max="1024"
      step="1"
      type="number"
      pattern="^[1-9][0-9]*$"
      label="CPU Count"
      :desc="desc.options['cpu-count']"
    />
    <string-form v-model.number="memorySize" label="Memory Size" :desc="desc.options['memory-size']">
      <template #suffix>Gi</template>
    </string-form>
    <string-form v-model.number="diskSize" label="Disk Size" :desc="desc.options['disk-size']">
      <template #suffix>Gi</template>
    </string-form>
    <string-form
      v-model.number="form.options['vm-namespace']"
      label="VM Namespace"
      :desc="desc.options['vm-namespace']"
    />
    <string-form v-model.number="form.options['image-name']" label="Image Name" :desc="desc.options['image-name']" />
    <string-form
      v-model.number="form.options['network-name']"
      label="Network Name"
      :desc="desc.options['network-name']"
    />
    <string-form v-model.trim="form.config['ssh-user']" label="SSH User" :desc="desc.config['ssh-user']" />
    <string-form v-model.trim="form.config['ssh-key-path']" label="SSH Key Path" :desc="desc.config['ssh-key-path']" />
    <yaml-config-form
      v-model="form.options['kubeconfig-content']"
      class="col-span-1 sm:col-span-2"
      label="Kubeconfig"
      :options="{ readOnly: false }"
      :desc="desc.options['kubeconfig-content']"
    />
  </div>
</template>
<script setup>
import { computed } from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
import { cloneDeep } from '@/utils'
import { parseSi } from '@/utils/units'
import YamlConfigForm from '@/views/components/baseForm/YamlConfigForm.vue'
import { Base64 } from 'js-base64'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  hasError: {
    type: Boolean,
    default: false
  }
})

const { form, desc } = useFormFromSchema(props.schema)
// const showKeyForm = computed(() => {
//   return props.hasError || !props.schema.options['access-key']?.default || !props.schema.options['secret-key']?.default
// })
const diskSize = computed({
  get() {
    return parseSi(form.options['disk-size'], { increment: 1024 }) / 1024 ** 3
  },
  set(v) {
    form.options['disk-size'] = `${v}Gi`
  }
})
const memorySize = computed({
  get() {
    return parseSi(form.options['memory-size'], { increment: 1024 }) / 1024 ** 3
  },
  set(v) {
    form.options['memory-size'] = `${v}Gi`
  }
})
const getForm = () => {
  const f = cloneDeep(form)
  const v = f.options['kubeconfig-content']
  if (v) {
    f.options['kubeconfig-content'] = Base64.encode(v)
  }
  return f
}

defineExpose({ getForm })
</script>
