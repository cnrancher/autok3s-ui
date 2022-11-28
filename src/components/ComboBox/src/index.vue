<template>
  <div class="k-combo-box" :class="{ disabled: disabled, focused: dropdownVisible }">
    <div class="k-combo-box__label">
      <label v-if="label" :for="inputId">
        {{ label }}
        <sup v-if="required" class="k-form-item--required">*</sup>
      </label>
      <tooltip v-if="desc && !dropdownVisible">
        <KIcon type="prompt"></KIcon>
        <template #popover>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-if="rawDesc" v-html="desc"></span>
          <span v-else>{{ desc }}</span>
        </template>
      </tooltip>
    </div>
    <div v-if="$slots.prefix" class="k-combo-box__prefix">
      <slot name="prefix">{{ prefix }}</slot>
    </div>
    <dropdown
      class="k-combo-box__trigger group"
      :option="popperOption"
      :append-to-body="false"
      :disabled="disabled"
      :lazy="false"
      @visible-change="handleVisible"
    >
      <input
        :id="inputId"
        autocomplete="off"
        :disabled="disabled"
        class="cursor-pointer bg-transparent focus-visible:outline-none overflow-ellipsis col-start-1 row-start-1 opacity-0 sibling:opacity-100 focus:opacity-100  focus:sibling:opacity-0"
        :class="[!label ? 'py-9px' : '']"
        :value="modelValue"
        v-bind="$attrs"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)"
        @change="$emit('change', $event.target.value)"
      />
      <div class="col-start-1 row-start-1 pointer-events-none">
        {{ selectedOption?.label }}
      </div>
      <KIcon v-if="loading" type="loading"></KIcon>
      <template v-else>
        <div class="flex">
          <KIcon v-if="!disabled" type="editor" />
          <KIcon
            type="arrow-right-blod"
            :class="[clearable && !disabled ? 'group-hover:hidden' : '']"
            direction="down"
          ></KIcon>
          <KIcon
            v-if="!disabled"
            type="close"
            class="hidden"
            :class="[clearable ? 'group-hover:inline-block' : '']"
            @click.stop="clear"
          ></KIcon>
        </div>
      </template>
      <template #content>
        <slot name="header"></slot>
        <div v-if="loading">Loading ...</div>
        <div v-else-if="options.length === 0">No Data</div>
        <div v-else>
          <div v-if="searchable" class="sticky top-0 bg-white" @click.stop="handleSearchClick">
            <label class="grid grid-cols-[auto,1fr] items-center">
              <KIcon type="search" :size="18" />
              <input
                ref="searchInput"
                v-model="query"
                type="search"
                class="focus-visible:outline-none py-4px"
                placeholder="Filter"
              />
            </label>
            <hr />
          </div>
          <dropdown-menu-item
            v-for="(v, index) in filteredOptions"
            :key="`${index}_${isObj ? v.value : v}`"
            class="k-combo-box__option"
            :class="[modelValue === (isObj ? v.value : v) ? 'text-white bg-warm-gray-400' : '']"
            @click="setValue(isObj ? v.value : v)"
          >
            <slot :option="v">
              <template v-if="searchable && query">
                {{ v.label.slice(0, v.matchedStart) }}
                <span class="text-$info">{{ v.label.slice(v.matchedStart, v.matchedStart + v.matchedLen) }}</span>
                {{ v.label.slice(v.matchedStart + v.matchedLen) }}
              </template>
              <template v-else>
                {{ isObj ? v.label : v }}
              </template>
            </slot>
          </dropdown-menu-item>
        </div>
        <slot name="footer"></slot>
      </template>
    </dropdown>
    <div v-if="$slots.suffix" class="k-combo-box__suffix">
      <slot name="suffix"></slot>
    </div>
  </div>
</template>
<script>
import { useIdGenerator } from '@/utils/idGenerator.js'
import { customRef } from 'vue'

const getId = useIdGenerator(0, 'combo-box_')
const useMinWithModifier = (minWith = '200px') => {
  return {
    name: 'selectOptionMinWith',
    enabled: true,
    phase: 'beforeWrite',
    fn: ({ state }) => {
      const w = state.elements.reference.getBoundingClientRect().width
      state.styles.popper['min-width'] = w ? `${w + 18}px` : minWith
    }
  }
}

function useDebouncedRef(value, delay = 300) {
  let timeout
  return customRef((track, trigger) => {
    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          value = newValue
          trigger()
        }, delay)
      }
    }
  })
}

export default {
  name: 'KComboBox',
  inheritAttrs: false
}
</script>
<script setup>
import { useSlots, ref, computed } from 'vue'
import { Dropdown, DropdownMenuItem } from '@/components/Dropdown'
import Tooltip from '@/components/Tooltip'
import KIcon from '@/components/Icon'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Please Input Or Select...'
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  class: {
    type: [Array, String, Object],
    default: ''
  },
  desc: {
    type: String,
    default: ''
  },
  rawDesc: {
    type: Boolean,
    default: true
  },
  clearable: {
    type: Boolean,
    default: false
  },
  searchable: {
    type: Boolean,
    default: false
  },
  options: {
    type: Array,
    default() {
      return []
    }
  }
})

const emit = defineEmits(['update:modelValue', 'change'])
const slots = useSlots()
const inputId = getId()
const query = useDebouncedRef('')
const searchInput = ref(null)

const setValue = (v) => {
  emit('update:modelValue', v)
  if (v !== props.modelValue) {
    emit('change', v)
  }
}
const clear = () => {
  emit('update:modelValue', '')
  emit('change', '')
}
const minWithModifier = useMinWithModifier()
const popperOption = {
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [slots.prefix ? 0 : -10, 8]
      }
    },
    minWithModifier
  ],
  placement: 'bottom-start'
}

const dropdownVisible = ref(false)
const handleVisible = (show) => {
  dropdownVisible.value = show
}
const isObj = computed(() => {
  const options = props.options
  if (options.length === 0) {
    return false
  }
  return typeof options[0] !== 'string'
})
const filteredOptions = computed(() => {
  const searchable = props.searchable
  const options = props.options
  const q = query.value?.toLowerCase()
  const len = q.length
  if (!searchable || !q) {
    return options
  }
  if (options.length === 0) {
    return []
  }
  const obj = isObj.value
  return options
    .filter((item) =>
      obj
        ? item.label?.toLowerCase().includes(q) || item.value?.toLowerCase().includes(q)
        : item?.toLowerCase().includes(q)
    )
    .map((item) => {
      if (obj) {
        const l = item.label?.toLowerCase() ?? ''
        const i = l.indexOf(q)
        return {
          ...item,
          matchedStart: i,
          matchedLen: len
        }
      } else {
        const l = item?.toLowerCase() ?? ''
        const i = l.indexOf(q)
        return {
          value: item,
          label: item,
          matchedStart: i,
          matchedLen: len
        }
      }
    })
})
const selectedOption = computed(() => {
  const v = props.modelValue
  const o = props.options
  const obj = isObj.value

  if (obj) {
    return o.find((item) => item.value === v) ?? { label: v, value: v }
  }
  return { label: v, value: v }
})
const handleSearchClick = () => {}
</script>
<style scoped>
.k-combo-box {
  display: grid;
  grid-template-areas:
    'label label suffix'
    'prefix select suffix';
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr;
  @apply p-8px rounded border border-$input-border;
  min-height: 60px;
}
.k-combo-box:not(.disabled, .focused):hover {
  @apply border-$input-hover-border;
}

.k-combo-box__label {
  grid-area: label;
  @apply grid gap-x-10px items-center grid-cols-[max-content,auto] text-warm-gray-500 grid gap-y-10px items-center grid-cols-[max-content,auto];
  width: fit-content;
}
.k-combo-box.focused {
  @apply border-$primary;
  & .k-combo-box__label {
    @apply text-$primary;
  }
}
.k-combo-box__prefix {
  grid-area: prefix;
  @apply text-warm-gray-500 self-center;
}
.k-combo-box__suffix {
  grid-area: suffix;
  @apply flex items-center text-warm-gray-500 pl-8px border-l border-warm-gray-600 font-400;
}
.k-combo-box__trigger {
  grid-area: select;
  @apply grid grid-cols-[1fr,auto,auto] items-center;
}
</style>
