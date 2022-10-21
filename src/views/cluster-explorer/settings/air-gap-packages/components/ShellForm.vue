<template>
  <div class="grid grid-cols-[max-content,auto,auto,1fr] gap-10px p-8px items-center">
    <label class="text-gray-500">
      {{ label }}
      <sup v-if="required" class="text-red-500">*</sup>
    </label>
    <div>
      <k-tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-if="rawDesc" v-html="desc"></span>
          <span v-else>{{ desc }}</span>
        </template>
      </k-tooltip>
    </div>
    <div>
      <k-tooltip v-if="error" class="justify-end">
        <k-icon type="warning" class="text-red-500" :size="18"></k-icon>
        <template #popover>
          {{ error }}
        </template>
      </k-tooltip>
    </div>
    <div v-if="!options?.readOnly" class="grid justify-self-end grid-flow-col gap-x-10px items-center">
      <div v-if="$slots.default"><slot></slot></div>
      <k-button type="input" class="btn-sm role-primary justify-self-end" @click="clearContent">Clear</k-button>
      <k-button type="input" class="btn-sm role-primary" @click.stop.prevent="triggerSelectFile">
        <k-icon type="upload"></k-icon>
        &nbsp; Read from a file
      </k-button>
      <input ref="file" class="hidden" type="file" accept=".sh" @change="handleFileChange" />
    </div>
    <div v-else>
      <div><slot></slot></div>
    </div>
    <div
      class="shell-form__content relative max-h-400px overflow-auto col-span-4"
      @dragenter="handleDrag"
      @dragover="handleDrag"
      @drop="handleDrop"
    >
      <textarea ref="textarea" :name="name" :placeholder="placeholder"></textarea>
    </div>
  </div>
</template>
<script>
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import useThemeStore from '@/store/useThemeStore.js'
import useNotificationStore from '@/store/useNotificationStore.js'
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/shell/shell.js'

import 'codemirror/theme/base16-light.css'
import 'codemirror/theme/base16-dark.css'

import 'codemirror/addon/lint/lint.css'
import 'codemirror/addon/lint/lint.js'
import 'codemirror/addon/lint/yaml-lint.js'

import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/hint/show-hint.js'
import 'codemirror/addon/hint/anyword-hint.js'
import 'codemirror/addon/edit/matchbrackets.js'

export default defineComponent({
  name: 'ShellForm',
  props: {
    label: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    options: {
      type: Object,
      default: () => {}
    },
    name: {
      type: String,
      default: 'codemirror'
    },
    desc: {
      type: String,
      default: ''
    },
    rawDesc: {
      type: Boolean,
      default: true
    },
    visible: {
      type: Boolean,
      default: true
    },
    error: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'clear'],
  setup(props, { emit }) {
    const themeStore = useThemeStore()
    const notificationStore = useNotificationStore()
    const textarea = ref(null)
    const file = ref(null)
    let codemirror = null
    const options = computed(() => {
      const theme = themeStore.theme.split('-')[1]
      const defaultOptions = {
        // codemirror default options
        tabSize: 2,
        indentWithTabs: false,
        mode: 'shell',
        theme: `base16-${theme}`,
        lineNumbers: true,
        line: true,
        styleActiveLine: true,
        lineWrapping: true,
        styleSelectedText: true,
        showCursorWhenSelecting: true,
        matchBrackets: true,

        gutters: ['CodeMirror-lint-markers'],
        lint: true,
        dragDrop: false
      }
      return { ...defaultOptions, ...props.options }
    })
    const triggerSelectFile = () => {
      file.value.click()
    }
    const handleFileContent = (f) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        emit('update:modelValue', e.target.result)
        reader.onload = null
        nextTick(() => {
          codemirror?.focus()
        })
      }
      reader.readAsText(f)
    }
    const handleModelValueChange = (newVal) => {
      if (!codemirror) {
        return
      }
      const value = codemirror.getValue()
      if (newVal === value) {
        return
      }
      const scrollInfo = codemirror.getScrollInfo()
      codemirror.setValue(newVal)
      codemirror.scrollTo(scrollInfo.left, scrollInfo.top)
    }
    const validateFile = (file) => {
      if (!file.type.endsWith('sh')) {
        notificationStore.notify({
          type: 'error',
          title: 'File Type Error',
          content: 'The selected file is not shell type'
        })
        return false
      }
      if (file.size > 2 * 1024 * 1024) {
        notificationStore.notify({
          type: 'error',
          title: 'File is too large',
          content: 'The file size cannot exceed 2M'
        })
        return false
      }
      return true
    }
    const handleChange = (cm) => {
      const v = cm.getValue()
      emit('update:modelValue', v)
    }
    const handleDrag = (e) => {
      e.stopPropagation()
      e.preventDefault()
    }
    const handleDrop = (e) => {
      e.stopPropagation()
      e.preventDefault()
      if (props.options.readOnly) {
        return
      }
      var dt = e.dataTransfer
      var curFiles = dt.files
      if (curFiles.length === 0) {
        return
      }
      if (!validateFile(curFiles[0])) {
        return
      }
      handleFileContent(curFiles[0])
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

    const clearContent = () => {
      emit('update:modelValue', '')
      emit('clear')
      nextTick(() => {
        codemirror?.focus()
      })
    }

    watch(
      () => props.options,
      () => {
        if (!codemirror) {
          return
        }
        Object.entries(props.options).forEach(([k, v]) => {
          codemirror.setOption(k, v)
        })
      }
    )
    watch(
      () => props.modelValue,
      (val) => {
        handleModelValueChange(val)
      }
    )
    watch(
      () => props.visible,
      (v) => {
        if (v) {
          nextTick(() => {
            codemirror?.refresh()
          })
        }
      }
    )
    onMounted(() => {
      codemirror = CodeMirror.fromTextArea(textarea.value, { ...options.value })
      codemirror.setValue(props.modelValue)
      codemirror.on('change', handleChange)
      nextTick(() => {
        codemirror.refresh()
      })
    })
    onBeforeUnmount(() => {
      codemirror?.off('change', handleChange)
      codemirror?.toTextArea()

      codemirror = null
    })
    return {
      file,
      handleFileChange,
      textarea,
      handleDrag,
      handleDrop,
      triggerSelectFile,
      clearContent
    }
  }
})
</script>
<style>
.shell-form__content {
  & .CodeMirror {
    height: auto;
  }
  & .CodeMirror-scroll {
    min-height: 60px;
  }
}
</style>
