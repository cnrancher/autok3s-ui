<template>
  <k-modal v-model="visible">
      <template #title>Create Cluster Command</template>
      <template #default>
        <div v-if="registryContent">
          <div class="grid grid-cols-1 gap-y-10px mb-10px">
            <div>
             1. You are using registry config, please save the following content as a file.
            </div>
            <pre class="relative bg-gray-100 p-10px">
{{registryContent}}
<div class="absolute top-0 right-0 grid grid-flow-col gap-x-10px items-center">
  <k-tooltip append-to-body :delay="0">
    <k-icon type="download" @click="downloadRegistryContent"></k-icon>
    <template #popover>Download Regisrty Content</template>
  </k-tooltip>
  <k-tooltip append-to-body :delay="0">
    <k-icon type="clone" @click="copyRegistryContent"></k-icon>
    <template #popover>Copy Regisrty Content</template>
  </k-tooltip>
</div></pre>
          </div>
        </div>
        <div class="max-w-80vw grid grid-cols-1 gap-y-10px">
          <div v-if="registryContent">
          2. Please replace the following <span class="text-red-500">{{registryPlaceholder}}</span> as a real file path that you have saved at first step.
          </div>
          <code class="p-10px rounded border bg-gray-100 m-5px relative">
            <div class="absolute top-0 right-0 grid grid-flow-col gap-x-10px items-center">
              <k-tooltip append-to-body :delay="0">
                <k-icon type="clone" class="cursor-pointer" @click="copyCmd"></k-icon>
                <template #popover>Copy CLI Command</template>
              </k-tooltip>
            </div>
            <span class="text-purple-700">autok3s</span>&nbsp;<span class="cli-command__sub-cmd">create</span>
            <template v-for="(o, index) in cmdOptions" :key="index">
              <span class="text-blue-700">&nbsp;{{o.option}}</span>
              <span class="cli-command__value break-all" :class="optionValueClass(o.value)" v-if="o.value">&nbsp;{{o.value}}</span>
            </template>
            <template v-if="registryContent">
              <span class="text-blue-700">&nbsp;--registry </span>
              <span class="cli-command__value break-all text-red-500">{{registryPlaceholder}}</span>
            </template>
          </code>
          <!-- <code>{{createCmd}} <span class="text-red-500" v-if="registryContent">--registry {{registryPlaceholder}}</span></code> -->
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
import Clipboard from 'clipboard'
import { Base64 } from 'js-base64'

export default defineComponent({
  name: 'CliCommand',
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

      const arrayArgs = ['tags', 'labels', 'envs', 'volumes', 'ports', 'tls-sans']
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
      let configEntries = Object.entries(props.clusterForm.config)
      if (props.clusterForm.provider === 'native') {
        const excludeConfigKeys = ['worker', 'master']
        configEntries = configEntries.filter(([k]) => !excludeConfigKeys.includes(k))
      }
      let optionEntries = Object.entries(props.clusterForm.options)
      // encode kubeconfig-content, network-data, user-data to base64 for harvester provider
      if (props.clusterForm.provider === 'harvester') {
        ['kubeconfig-content', 'network-data', 'user-data'].forEach((k) => {
          const e = optionEntries.find(([key]) => key === k)
          const value = e[1]
          if (value) {
            e[1] = Base64.encode(value)
          }
        })
      }
      const options = [ ['--provider', provider], ...configEntries, ...optionEntries]
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
.cli-command__number {
  color: #164;
}


</style>