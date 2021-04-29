<template>
  <k-modal v-model="visible">
      <template #title>Create Cluster Command</template>
      <template #default>
        <div v-if="registryContent">
          <div class="cli-command__registry-content">
            <div>
             1. You are using registry config, please save the following content as a file.
            </div>
            <pre>
{{registryContent}}
<div class="cli-command__actions">
  <tooltip append-to-body :delay="0">
    <k-icon type="download" @click="downloadRegistryContent"></k-icon>
    <template #popover>Download Regisrty Content</template>
  </tooltip>
  <tooltip append-to-body :delay="0">
    <k-icon type="clone" @click="copyRegistryContent"></k-icon>
    <template #popover>Copy Regisrty Content</template>
  </tooltip>
</div></pre>
          </div>
        </div>
        <div class="cli-command__content">
          <div v-if="registryContent">
          2. Please replace the following <span class="cli-command__registry">{{registryPlaceholder}}</span> as a real file path that you have saved at first step.
          </div>
          <code>
            <div class="cli-command__actions">
              <tooltip append-to-body :delay="0">
                <k-icon type="clone" class="cli-command__action" @click="copyCmd"></k-icon>
                <template #popover>Copy CLI Command</template>
              </tooltip>
            </div>
            <span class="cli-command__cmd">autok3s</span>&nbsp;<span class="cli-command__sub-cmd">create</span>
            <template v-for="(o, index) in cmdOptions" :key="index">
              <span class="cli-command__option">&nbsp;{{o.option}}</span>
              <span class="cli-command__value" :class="optionValueClass(o.value)" v-if="o.value">&nbsp;{{o.value}}</span>
            </template>
            <template v-if="registryContent">
              <span class="cli-command__option">&nbsp;--registry </span>
              <span class="cli-command__value cli-command__registry">{{registryPlaceholder}}</span>
            </template>
          </code>
          <!-- <code>{{createCmd}} <span class="cli-command__registry" v-if="registryContent">--registry {{registryPlaceholder}}</span></code> -->
        </div>
      </template>
      <template #footer>
        <k-button class="role-secondary" @click="hideModal">Cancel</k-button>
        <!-- <button class="btn bg-primary" @click="copyCmd">Copy</button> -->
      </template>
    </k-modal>
</template>
<script>
import {computed, defineComponent, inject} from 'vue'
import KButton from '@/components/Button'
import KIcon from '@/components/Icon'
import Tooltip from '@/components/Tooltip'
import KModal from "@/components/Modal"
import Clipboard from 'clipboard'

export default defineComponent({
  props: {
    clusterForm: {
      type: Object,
      required: true
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible'],
  setup(props, {emit}) {
    const notificationStore = inject('notificationStore')
    const registryPlaceholder = '<registry-path>'
    const registryContent = computed(() => {
      if (!props.visible) {
        return ''
      }
      if (!props.clusterForm.config['registry-content']?.trim()) {
        return ''
      }
      return props.clusterForm.config['registry-content']?.trim()
    })
    const cmdOptions = computed(() => {
      if (!props.visible) {
        return []
      }
      if (!props.clusterForm.config || !props.clusterForm.options) {
        return []
      }

      const arrayArgs = ['tags', 'labels', 'envs', 'volumes', 'ports']
      const excludeKeys = ['registry-content', 'registry']
      const ignoreValues = [null, undefined, '', false]
      const extraArgs = ['master-extra-args', 'worker-extra-args']
      const provider = props.clusterForm.provider

      const filterArgs = (k, v) => {
        if (arrayArgs.includes(k)) {
          return v ? v.length > 0 : false
        }
        return !ignoreValues.includes(v) && !excludeKeys.includes(k)
      }
      const parseValue = (k, v) => {
        if (v === true) {
          return ''
        }
        if (extraArgs.includes(k) || arrayArgs.includes(k)) {
          return `'${v.replaceAll("'", "\\'")}'`
        }
        // if (k === 'tags') {
        //   return `'${Object.entries(v).map(([k, v]) => {
        //     return `${k.replaceAll("'", "\\'")}=${v.replaceAll("'", "\\'")}`
        //   }).join(',')}'`
        // }
        return v
      }
      const options = [ ['--provider', provider], ...Object.entries(props.clusterForm.config), ...Object.entries(props.clusterForm.options)]
        .filter(([k, v]) => filterArgs(k, v))
        .reduce((t, [k, v]) => {
          if (arrayArgs.includes(k)) {
            const values = v.map((item) => ({
              option: k.startsWith('-') ? k : `--${k}`,
              value: parseValue(k, item)
            }))
            t.push(...values)
            return t
          }
          const o = {
            option: k.startsWith('-') ? k : `--${k}`,
            value: parseValue(k, v)
          }
          t.push(o)
          return t
        }, [])
      if (props.clusterForm.provider === 'k3d' && props.clusterForm.config.registry) {
        options.push({
          option: '--registry',
          value: props.clusterForm.config.registry
        })
      }
      return options
    })

    const createCmd = computed(() => {
      const options = cmdOptions.value.reduce((t, {option, value}) => {
        t.push(`${option} ${value}`.trim())
        return t
      }, []).join(' ')

      return `autok3s create ${options}`.trim()
    })
    
    const hideModal = () => {
      emit('update:visible', false)
    }

    const optionValueClass = (v) => {
      return /^[0-9]+$/.test(v) ? ['cli-command__number'] : []
    }

    const copyCmd = async () => {
      try {
        await toClipboard(`${createCmd.value}${registryContent.value ? ` --registry ${registryPlaceholder}`:''}`)
        notificationStore.action.notify({
          type: 'success',
          title: 'CLI Command Copied',
        })
      } catch(e) {
        notificationStore.action.notify({
          type: 'error',
          title: 'CLI Command Copy Failed',
          content: e?.toString()
        })
      }
    }

    const copyRegistryContent = async () => {
       try {
        await toClipboard(registryContent.value)
         notificationStore.action.notify({
          type: 'success',
          title: 'Registry Content Copied',
        })
      } catch(e) {
        notificationStore.action.notify({
          type: 'error',
          title: 'Registry Content Copy Failed',
          content: e?.toString()
        })
      }
    }
    const downloadRegistryContent = () => {
      downloadFile(registryContent.value, 'registry.yaml')
    }

    return {
      registryContent,
      cmdOptions,
      createCmd,
      hideModal,
      registryPlaceholder,
      copyCmd,
      copyRegistryContent,
      downloadRegistryContent,
      optionValueClass,
    }
  },
  components: {
    KButton,
    KModal,
    KIcon,
    Tooltip
  }
})

function toClipboard(text, action = 'copy', appendToBody = false) {
  return new Promise((resolve, reject) => {
    const fakeElement = document.createElement('button')
    const clipboard = new Clipboard(fakeElement, {
      text: () => text,
      action: () => action,
    })
    clipboard.on('success', (e) => {
      clipboard.destroy()
      resolve(e)
    })
    clipboard.on('error', (e) => {
      clipboard.destroy()
      reject(e)
    })
    if (appendToBody) {
      document.body.appendChild(fakeElement)
    }

    fakeElement.click()
    if (appendToBody) {
      document.body.removeChild(fakeElement)
    }
  })
}

function downloadFile (content, fileName) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a')
  const objUrl = window.URL.createObjectURL(blob)
  a.setAttribute('download', fileName)
  a.setAttribute('href', objUrl)
  a.click()
  window.URL.revokeObjectURL(objUrl)
}
</script>
<style>
.cli-command__content {
  max-width: 80vw;
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 10px;
  & > code {
    padding: 10px 10px;
    display: block;
    border-radius: var(--border-radius);
    background: var(--box-bg);
    margin: 5px;
    position: relative;
  }
}
.cli-command__registry {
  color: var(--error);
}
.cli-command__registry-content {
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 10px;
  margin-bottom: 10px;
  & pre {
    position: relative;
  }
}
.cli-command__actions {
  position:absolute;
  top: 0px;
  right: 0px;
  display: grid;
  grid-auto-flow: column;
  column-gap: 10px;
  align-items: center;
}
.cli-command__cmd {
  color: #30a;
}
.cli-command__option {
  color: #00c;
}
.cli-command__number {
  color: #164;
}
.cli-command__comment {
  color: #a50;
}
.cli-command__action {
  cursor: pointer;
}
</style>