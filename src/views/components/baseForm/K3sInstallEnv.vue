<template>
  <div>
    <div class="my-10px">
      <label>
        <input
          v-model="enableEnv"
          type="checkbox"
          class="accent-$primary"
          style="accent-color: var(--primary)"
          :disabled="readonly"
        />
        Install ENV
      </label>
      <tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-if="rawDesc" v-html="desc"></span>
          <span v-else>{{ desc }}</span>
        </template>
      </tooltip>
    </div>

    <div v-if="enableEnv" class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
      <template v-for="env in envs" :key="env.key">
        <component :is="env.component" v-bind="env.props" v-model="form[env.key]" :readonly="readonly">
          <template v-if="env.type === TYPE_MAP.enum">
            <Option v-for="o in env.options" :key="o.label" :label="o.label" :value="o.value"></Option>
          </template>
        </component>
      </template>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'
import BooleanForm from './BooleanForm.vue'
import StringForm from './StringForm.vue'
import { Select, Option } from '@/components/Select'
import Tooltip from '@/components/Tooltip'

const props = defineProps({
  initValue: {
    type: Object,
    default() {
      return {}
    }
  },
  desc: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  rawDesc: {
    type: Boolean,
    default: true
  }
})

const TYPE_MAP = {
  boolean: 'boolean',
  enum: 'enum',
  string: 'string'
}
const booleanDefaultProps = {
  trueLabel: 'true',
  falseLabel: 'false',
  trueValue: 'true',
  falseValue: 'false'
}

const envs = [
  {
    key: 'INSTALL_K3S_FORCE_RESTART',
    type: TYPE_MAP.boolean,
    default: 'false',
    component: BooleanForm,
    props: {
      ...booleanDefaultProps,
      label: 'INSTALL_K3S_FORCE_RESTART',
      desc: 'If set to true will always restart the K3s service.'
    }
  },
  {
    key: 'INSTALL_K3S_SYMLINK',
    type: TYPE_MAP.enum,
    default: '',
    options: [
      { label: 'skip', value: 'skip' },
      { label: 'force', value: 'force' }
    ],
    component: Select,
    props: {
      placeholder: '',
      clearable: true,
      label: 'INSTALL_K3S_SYMLINK',
      desc: "If set to 'skip' will not create symlinks, 'force' will overwrite, default will symlink if command does not exist in path."
    }
  },
  {
    key: 'INSTALL_K3S_SKIP_ENABLE',
    type: TYPE_MAP.boolean,
    default: 'false',
    component: BooleanForm,
    props: {
      ...booleanDefaultProps,
      label: 'INSTALL_K3S_SKIP_ENABLE',
      desc: 'If set to true will not enable or start k3s service.'
    }
  },
  {
    key: 'INSTALL_K3S_BIN_DIR',
    type: TYPE_MAP.string,
    default: '',
    component: StringForm,
    props: {
      label: 'INSTALL_K3S_BIN_DIR',
      desc: 'Directory to install k3s binary, links, and uninstall script to, or use /usr/local/bin as the default.'
    }
  },
  {
    key: 'INSTALL_K3S_SYSTEMD_DIR',
    type: TYPE_MAP.string,
    default: '',
    component: StringForm,
    props: {
      label: 'INSTALL_K3S_SYSTEMD_DIR',
      desc: 'Directory to install systemd service and environment files to, or use /etc/systemd/system as the default.'
    }
  },
  {
    key: 'INSTALL_K3S_NAME',
    type: TYPE_MAP.string,
    default: '',
    component: StringForm,
    props: {
      label: 'INSTALL_K3S_NAME',
      desc: "Name of systemd service to create, will default from the k3s exec command if not specified. If specified the name will be prefixed with 'k3s-'."
    }
  },
  {
    key: 'INSTALL_K3S_SKIP_SELINUX_RPM',
    type: TYPE_MAP.boolean,
    default: 'false',
    component: BooleanForm,
    props: {
      ...booleanDefaultProps,
      label: 'INSTALL_K3S_SKIP_SELINUX_RPM',
      desc: 'If set to true will skip automatic installation of the k3s RPM.'
    }
  },
  {
    key: 'INSTALL_K3S_SELINUX_WARN',
    type: TYPE_MAP.boolean,
    default: 'false',
    component: BooleanForm,
    props: {
      ...booleanDefaultProps,
      label: 'INSTALL_K3S_SELINUX_WARN',
      desc: 'If set to true will continue if k3s-selinux policy is not found.'
    }
  },
  {
    key: 'INSTALL_K3S_EXEC',
    type: TYPE_MAP.string,
    default: '',
    component: StringForm,
    props: {
      label: 'INSTALL_K3S_EXEC',
      desc: 'Command with flags to use for launching k3s in the systemd service, if the command is not specified will default to "agent" if K3S_URL is set or "server" if not. The final systemd command resolves to a combination of EXEC and script args ($@).'
    }
  }
]

const enableEnv = ref(false)
const form = ref({})
watch(
  () => props.initValue,
  (v) => {
    const tmp = {}
    envs.forEach((e) => {
      tmp[e.key] = e.default
    })
    form.value = tmp
    if (Object.keys(v).length > 0) {
      Object.assign(form.value, v)
      enableEnv.value = true
    } else {
      enableEnv.value = false
    }
  },
  { immediate: true }
)

const getForm = () => {
  const f = form.value
  const data = {}
  envs.forEach((e) => {
    if (f[e.key] !== e.default) {
      data[e.key] = f[e.key]
    }
  })
  return data
}

defineExpose({
  getForm,
  getValue: getForm
})
</script>
