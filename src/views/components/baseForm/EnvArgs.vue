<template>
  <DefineTemplate v-slot="{ env }">
    <div class="env-args-item grid grid-cols-[max-content_auto_1fr] gap-10px">
      <div>{{ env.key }}</div>
      <k-tooltip append-to-body>
        <k-icon type="prompt"></k-icon>
        <template #popover>
          <span>{{ env.desc }}</span>
        </template>
      </k-tooltip>
      <div v-if="env.enum" class="flex gap-3">
        <template v-if="env.options.length > 3">
          <select v-model="env.value" class="focus-visible:outline-none border-solid border-1 rounded">
            <option v-for="v in env.options" :key="v" :value="v">
              {{ v === '' ? 'default value' : v }}
            </option>
          </select>
        </template>
        <template v-else>
          <label v-for="v in env.options" :key="v" class="flex gap-1">
            <input v-model="env.value" type="radio" :value="v" class="accent-$primary" />
            {{ v === '' ? 'default value' : v }}
          </label>
        </template>
      </div>
      <div v-else-if="env.multiple">
        <label v-for="v in env.options" :key="v" class="flex gap-1">
          <input v-model="env.value" type="checkbox" :value="v" class="accent-$primary" />
          <span>{{ v }}</span>
        </label>
      </div>
      <div v-else-if="env.flag">
        <label class="flex gap-1">
          <input v-model="env.value" type="checkbox" value="true" class="accent-$primary" />
          <span>true</span>
        </label>
      </div>
      <div v-else>
        <input v-model="env.value" class="focus-visible:outline-none border-solid border-1 rounded w-full" />
      </div>
    </div>
  </DefineTemplate>
  <div
    v-bind="$attrs"
    ref="reference"
    class="env-args grid p-8px rounded border-solid border-1 border-$input-border min-h-60px"
    :class="{ disabled: disabled }"
    @click="toggleFloating"
  >
    <div class="env-args__label grid grid-cols-[max-content_auto] gap-10px">
      <div>{{ label }}</div>
      <k-tooltip>
        <k-icon type="prompt"></k-icon>
        <template #popover>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="desc"></span>
        </template>
      </k-tooltip>
    </div>
    <div class="grid grid-cols-[1fr_auto] items-center">
      <div>{{ envDisplay }}</div>
      <k-icon type="arrow-right-blod" direction="down"></k-icon>
    </div>
  </div>
  <teleport to="body">
    <div
      v-if="show"
      ref="floating"
      :style="floatingStyles"
      class="absolute bg-white z-$popper-z-index shadow max-h90vh overflow-auto p-8px max-w-80vw min-w-600px"
      @click.stop="handleFloatingClick"
    >
      <div class="grid gap-1">
        <ReuseTemplate v-for="e in envs" :key="e.key" :env="e" />
      </div>
      <div>
        <ReuseTemplate v-for="e in customEnvs" :key="e.key" :env="e" />
      </div>
      <div></div>
    </div>
  </teleport>
</template>
<script setup>
import { offset, flip, shift, useFloating, autoUpdate } from '@floating-ui/vue'
import { createReusableTemplate } from '@vueuse/core'
import { computed, watch, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
const [DefineTemplate, ReuseTemplate] = createReusableTemplate()
const props = defineProps({
  initValue: {
    type: Object,
    default() {
      return {}
    }
  },
  defaultArgs: {
    type: Array,
    default() {
      return []
    }
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    required: true
  }
})

const show = ref(false)
const reference = ref(null)
const floating = ref(null)
const { floatingStyles } = useFloating(reference, floating, {
  placement: 'bottom-start',
  whileElementsMounted: autoUpdate,
  middleware: [offset(10), flip(), shift()]
})

onClickOutside(floating, () => {
  show.value = false
})
const toggleFloating = () => {
  if (props.disabled) {
    return
  }
  show.value = !show.value
}
const handleFloatingClick = () => {
  // do nothing
}

const envs = ref([])
const customEnvs = ref([])
const envDisplay = computed(() => {
  const v1 = envs.value
    .filter((e) => e.value !== e.default)
    .map((e) => `${e.key}=${e.multiple ? e.value.join(',') : e.value}`)
    .join(' ')
  const v2 = customEnvs.value.map((e) => `${e.key}=${e.value}`).join(' ')
  return `${v1} ${v2}`
})
watch(
  [() => props.initValue, () => props.defaultArgs],
  ([initV, defaultV]) => {
    envs.value =
      defaultV.map((v) => {
        const tmp = { ...v }
        if (Object.hasOwn(initV, v.key)) {
          if (v.flag) {
            tmp.value = initV[v.key] === 'true'
          } else {
            tmp.value = initV[v.key]
          }
        } else {
          tmp.value = v.default
        }
        return tmp
      }) ?? []
    customEnvs.value = Object.entries(initV)
      .filter(([k]) => !defaultV.some((item) => item.key === k))
      .map(([k, v]) => ({ key: k, value: v }))
  },
  { immediate: true }
)
const getForm = () => {
  return envs.value
    .filter((e) => e.value !== e.default)
    .reduce((t, c) => {
      if (c.flag) {
        t[c.key] = `${c.value}`
      } else {
        t[c.key] = c.value
      }

      return t
    }, {})
}
defineExpose({ getForm })
</script>
<style scoped>
.env-args:not(.disabled, .focused):hover {
  @apply border-$input-hover-border;
}
</style>
