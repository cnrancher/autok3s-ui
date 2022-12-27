<template>
  <div class="relative">
    <StringForm
      v-model.trim="value"
      type="textarea"
      :rows="modelValue?.split('\n').length + 1"
      :style="inputStyle"
      :readonly="readonly"
      spellcheck="false"
      v-bind="$attrs"
    ></StringForm>
    <KButton
      v-if="!readonly"
      type="input"
      class="btn-sm role-primary absolute top-2px right-2px"
      @click.stop.prevent="triggerSelectFile"
    >
      <KIcon type="upload"></KIcon>
      &nbsp; Read from a file
    </KButton>
    <input ref="file" class="hidden" type="file" @change="handleFileChange" />
  </div>
</template>
<script setup>
import StringForm from '@/views/components/baseForm/StringForm.vue'
import { computed, nextTick, ref } from 'vue'
import useNotificationStore from '@/store/useNotificationStore.js'

const props = defineProps({
  byteLimit: {
    type: Number,
    default: 2 * 1024 * 1024 // 2MB
  },
  maskedText: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const notificationStore = useNotificationStore()
const inputStyle = computed(() => {
  if (props.maskedText) {
    return {
      fontFamily: 'dotsfont',
      fontSize: '12px'
    }
  }
  return {}
})
const value = computed({
  get() {
    return props.modelValue
  },
  set(v) {
    emit('update:modelValue', v)
  }
})
const file = ref(null)

const triggerSelectFile = () => {
  file.value.click()
}

const handleFileContent = (f) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    emit('update:modelValue', e.target.result)
    reader.onload = null
    nextTick(() => {
      file.value.focus()
    })
  }
  reader.readAsText(f)
}

const validateFile = (file) => {
  if (file.size > props.byteLimit) {
    notificationStore.notify({
      type: 'error',
      title: 'File is too large',
      content: `The file size cannot exceed ${props.byteLimit} Bytes`
    })
    return false
  }
  return true
}

const handleFileChange = () => {
  const curFiles = file.value.files
  if (curFiles.length === 0) {
    return
  }
  if (!validateFile(curFiles[0])) {
    return
  }
  handleFileContent(curFiles[0])
}
</script>
