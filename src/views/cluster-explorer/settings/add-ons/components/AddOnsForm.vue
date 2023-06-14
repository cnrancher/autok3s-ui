<template>
  <div>
    <div class="grid grid-cols-2 gap-10px pb-20px">
      <StringForm
        v-model.trim="form.name"
        label="Name"
        placeholder="e.g. test"
        :disabled="mode === 'edit'"
        :readonly="readonly"
        required
      />
      <StringForm v-model.trim="form.description" label="Description" placeholder="e.g. test" :readonly="readonly" />
      <YamlConfigForm
        v-model="form.manifest"
        class="col-span-1 sm:col-span-2"
        label="Manifest"
        :options="readonlyOption"
        required
      />

      <ArrayListForm
        v-if="mode !== 'view'"
        ref="values"
        :init-value="form.values"
        :readonly="readonly"
        label="Values"
        placeholder="e.g. foo=bar"
        action-label="Add Value"
      />
    </div>
    <KAlert v-for="(e, index) in errors" :key="index" type="error" :title="e"></KAlert>
  </div>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import ArrayListForm from '@/views/components/baseForm/ArrayListForm.vue'
import YamlConfigForm from '@/views/components/baseForm/YamlConfigForm.vue'
import { Base64 } from 'js-base64'
import Schema from 'async-validator'
import { cloneDeep } from '@/utils'

const descriptor = {
  name: {
    required: true,
    message: '"Name" is required'
  },
  manifest: {
    required: true,
    message: '"Manifest" is required'
  }
}

const validator = new Schema(descriptor)
const props = defineProps({
  readonly: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create'
  },
  initValue: {
    type: Object,
    default: null
  }
})

const form = reactive({})
const values = ref(null)

const readonlyOption = computed(() => {
  return { readOnly: props.readonly }
})
watch(
  () => props.initValue,
  (v) => {
    if (!v) {
      return
    }
    Object.keys(v).forEach((k) => {
      if (k === 'manifest') {
        form[k] = Base64.decode(v[k])
      } else {
        form[k] = v[k]
      }
    })
  },
  { immediate: true, deep: true }
)
const errors = ref([])

const validate = async () => {
  errors.value = []
  try {
    await validator.validate(form)
    return true
  } catch ({ errors: err, fields }) {
    errors.value = err.map((e) => e.message)
    return false
  }
}
const getForm = () => {
  const f = cloneDeep(form)
  f.values = values.value.getValue()
  f.manifest = Base64.encode(form.manifest ?? '')
  return f
}

defineExpose({
  validate,
  getForm
})
</script>
