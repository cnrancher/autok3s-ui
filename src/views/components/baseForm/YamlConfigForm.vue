<template>
  <div class="grid grid-cols-[max-content,auto,1fr] gap-10px p-8px items-center">
    <label class="text-gray-500">{{label}} <sup v-if="required" class="text-red-500">*</sup></label>
    <div>
      <k-tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </k-tooltip>
    </div>
    <div v-if="!options?.readOnly" class="grid justify-self-end grid-flow-col gap-x-10px">
      <k-button type="input" class="btn-sm role-primary justify-self-end" @click="clearContent">Clear</k-button>
      <k-button type="input" class="btn-sm role-primary" @click.stop.prevent="triggerSelectFile"><k-icon type="upload"></k-icon> &nbsp; Read from a file</k-button>
      <input
        ref="file"
        class="hidden"
        type="file"
        accept=".yaml,.yml"
        @change="handleFileChange">
    </div>
    <div v-else></div>
    <div class="yaml-config-form__content relative max-h-400px overflow-auto col-span-3" @dragenter="handleDrag" @dragover="handleDrag" @drop="handleDrop">
      <textarea ref="textarea" :name="name" :placeholder="placeholder"></textarea>
    </div>
  </div>
</template>
<script>
import {computed, defineComponent, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import useThemeStore from '@/store/useThemeStore.js'
import useNotificationStore from '@/store/useNotificationStore.js'
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'

import jsyaml from 'js-yaml';

import 'codemirror/mode/yaml/yaml.js'

import 'codemirror/theme/base16-light.css'
import 'codemirror/theme/base16-dark.css'

import 'codemirror/addon/lint/lint.css';
import 'codemirror/addon/lint/lint.js';
import 'codemirror/addon/lint/yaml-lint.js'

import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/hint/show-hint.js'
import 'codemirror/addon/hint/anyword-hint.js'

// Codemirrror yaml plugin expects to find it in window/globals.
window.jsyaml = window.jsyaml ?? jsyaml

export default defineComponent({
  name: 'YamlConfigForm',
  props: {
    label: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: false,
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
      type:    Object,
      default: () => {}
    },
    name: {
      type: String,
      default: 'codemirror',
    },
    desc: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const themeStore = useThemeStore()
    const notificationStore = useNotificationStore()
    const textarea = ref(null)
    const file = ref(null)
    let codemirror = null
    const options = computed(() => {
      const theme = themeStore.theme.split('-')[1]
      const defaultOptions = {
        // codemirror default options
          tabSize:                 2,
          indentWithTabs:          false,
          mode:                    'yaml',
          theme:                   `base16-${ theme }`,
          lineNumbers:             true,
          line:                    true,
          styleActiveLine:         true,
          lineWrapping:            true,
          styleSelectedText:       true,
          showCursorWhenSelecting: true,
          
          gutters:                 ["CodeMirror-lint-markers"],
          lint:                    true,
          dragDrop:                false,
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
    const validateFile = (file)=> {
      if (!file.type.endsWith('yaml')) {
        notificationStore.notify({
          type: 'error',
          title: 'File Type Error',
          content: 'The selected file is not yaml type'
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
      nextTick(() => {
        codemirror?.focus()
      })
    }

    watch(() => props.options, () => {
      if (!codemirror) {
        return
      }
      Object.entries(props.options).forEach(([k, v]) => {
        codemirror.setOption(k, v)
      })
    })
    watch(()=> props.modelValue, (val) => {
      handleModelValueChange(val)
    })
    watch(() => props.visible, (v) => {
      if (v) {
        nextTick(() => {
          codemirror?.refresh()
        })
      }
    })
    onMounted(() => {
      codemirror = CodeMirror.fromTextArea(textarea.value, { ...options.value })
      codemirror.setValue(props.modelValue)
      codemirror.on('change', handleChange)
      nextTick(() => {
        codemirror.refresh()
      })
    })
    onBeforeUnmount(() => {
      codemirror.off('change', handleChange)
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
      clearContent,
    }
  },
})
</script>
<style>
.yaml-config-form__content {
  & .CodeMirror {
    height: auto;
  }
  & .CodeMirror-scroll {
    min-height: 60px;
  }
}
</style>
