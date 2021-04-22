<template>
  <div class="registry-config-form">
    <label>{{label}} <sup v-if="required" class="k-form-item--required">*</sup></label>
    <div class="registry-config-form__desc">
      <tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </tooltip>
    </div>
    <div v-if="!options.readOnly" class="registry-config-form__upload">
      <k-button type="input" class="btn-sm bg-primary registry-config-form__clear" @click="clearContent">Clear</k-button>
      <k-button type="input" class="btn-sm bg-primary" @click.stop.prevent="triggerSelectFile"><k-icon type="upload" color="white"></k-icon> &nbsp; Read from a file</k-button>
      <input
        ref="file"
        class="registry-config-form__file"
        type="file"
        accept=".yaml,.yml"
        @change="handleFileChange">
    </div>
    <div v-else></div>
    <div class="registry-config-form__content" @dragenter="handleDrag" @dragover="handleDrag" @drop="handleDrop">
      <textarea ref="textarea" :name="name" :placeholder="placeholder"></textarea>
    </div>
    <div class="registry-config-form__actions" v-if="!options.readOnly">
      <k-button type="input" class="btn-sm role-secondary" @click="setAliyunMirror">aliyun mirror example</k-button>
      <k-button type="input" class="btn-sm role-secondary" @click="setUSTCMirror">USTC mirror example</k-button>
    </div>
  </div>
</template>
<script>
import {computed, defineComponent, inject, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect} from 'vue'
import KIcon from '@/components/Icon'
import Tooltip from '@/components/Tooltip'
import KButton from '@/components/Button'
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
window.jsyaml = jsyaml

const aliyunMirror = `mirrors:
  "docker.io":
    endpoint:
      - "https://fogjl973.mirror.aliyuncs.com"
      - "https://registry-1.docker.io"
`
const USTCMirror = `mirrors:
  "docker.io":
    endpoint:
      - "https://docker.mirrors.ustc.edu.cn/"
      - "https://registry-1.docker.io"
`

export default defineComponent({
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
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const themeState = inject('theme')
    const notificationStore = inject('notificationStore')
    const parentVisible = inject('parentVisible')
    const textarea = ref(null)
    const file = ref(null)
    let codemirror = null
    const options = computed(() => {
      const theme = themeState.theme.split('-')[1]
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
        notificationStore.action.notify({
          type: 'error',
          title: 'File Type Error',
          content: 'The selected file is not yaml type'
        })
        return false
      }
      if (file.size > 2 * 1024 * 1024) {
        notificationStore.action.notify({
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
    const setAliyunMirror = () => {
      emit('update:modelValue', aliyunMirror)
    }
    const setUSTCMirror = () => {
      emit('update:modelValue', USTCMirror)
    }

    const clearContent = () => {
      emit('update:modelValue', '')
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
    watchEffect(() => {
      if (parentVisible?.value) {
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
      setAliyunMirror,
      setUSTCMirror,
      clearContent,
    }
  },
  components: {
    KIcon,
    KButton,
    Tooltip,
  }
})
</script>
<style>
.registry-config-form {
  display: grid;
  grid-template-columns: max-content 1fr 1fr;
  padding: 8px 8px;
  background-color: var(--input-bg); 
  row-gap: 10px;
  column-gap: 10px;
  align-items: center;
  & > label {
    color: var(--input-label);
  }
}
.registry-config-form__upload {
  justify-self: end;
  display: grid;
  grid-auto-flow: column;
  column-gap: 10px;
}
.registry-config-form__file {
  display: none;
}
.registry-config-form__content {
  position: relative;
  max-height: 400px;
  overflow: auto;
  grid-column: 1 / span 3;
  & .CodeMirror {
    height: auto;
  }
  & .CodeMirror-scroll {
    min-height: 60px;
  }
}
.registry-config-form__actions {
  grid-column: 1 / span 3;
  display: grid;
  grid-auto-flow: column;
  column-gap: 10px;
  justify-content: left;
}
.registry-config-form__clear {
  justify-self: end;
}
</style>
