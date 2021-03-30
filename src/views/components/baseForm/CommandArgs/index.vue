<template>
<div class="command-args"  ref="commandArgsRef" @click="togglePopper">
  <div class="command-args__label">
    <label v-if="label">{{label}} <sup v-if="required" class="k-form-item--required">*</sup></label>
    <tooltip v-if="desc">
      <k-icon type="prompt"></k-icon>
      <template #popover>{{desc}}</template>
    </tooltip>
  </div>
  <div class="command-args__trigger">
    {{modelValue}}
  </div>
  <k-icon type="arrow-right-blod" class="command-args__suffix" direction="down"></k-icon>
<teleport to="body">
  <div class="command-args__popper" v-if="!readonly || show"
    ref="commandOptionsRef"
    :class="{'command-args__popper--active': show}"
    @click.stop="handlePopperClick">
    <div class="command-args__panel">
      <div class="command-args__options">
        <div class="command-args__title">
          <input type="checkbox" v-model="optionsAllSelected" :indeterminate="optionsIndeterminate">
          Available Options
          <div>{{selectedOptions.length}}/{{options.length}}</div>
        </div>
      <div class="command-args__search"></div>
      <div class="command-args__content">
        <label v-for="(o, index) in options" :key="index" class="command-args__item">
          <input type="checkbox" :value="o" v-model="selectedOptions">
          <command-option v-bind="o" v-model="o.modelValue"></command-option>
        </label>
      </div>
      <div class="command-args__footer"></div>
      </div>
      <div class="command-args__move">
        <button class="btn btn-sm bg-primary" :disabled="selectedOptions.length === 0" @click="addOptions">
          <k-icon type="arrow-right-blod"></k-icon>
        </button>
        <button class="btn btn-sm bg-primary" :disabled="selectedUsedOptions.length === 0" @click="removeOptions">
          <k-icon type="arrow-right-blod" direction="left"></k-icon>
        </button>
      </div>
      <div class="command-args__used-options">
        <div class="command-args__title">
          <input type="checkbox" v-model="usedOptionsAllSelected" :indeterminate="usedOptionsIndeterminate">
            Used Options
            <div>{{selectedUsedOptions.length}}/{{usedOptions.length}}</div>
        </div>
        <div class="command-args__search"></div>
        <div class="command-args__content">
          <label v-for="(o, index) in usedOptions" :key="index" class="command-args__item">
            <input type="checkbox" :value="o" v-model="selectedUsedOptions">
            <command-option v-bind="o" @update:modelValue="handleOptionChange(o, $event)"></command-option>
          </label>
          <div v-for="(o, index) in customValue" :key="index" class="command-args__custom">
            <custom-option v-model="customValue[index]"></custom-option>
            <k-icon type="close" @click="removeCustomArg(index)" class="command-args__custom--remove"></k-icon>
          </div>
        </div>
        <div class="command-args__footer">
          <k-input label="Add Custom Args(must start with '-' or '--')" @keyup.enter="addCustemArg" v-model.trim="customCommandArgs">
            <template #suffix>
              <button
                class="btn bg-primary btn-sm"
                :disabled="addCustomArgDisabled"
                @click="addCustemArg">Add</button>
            </template>
          </k-input>
        </div>
      </div>
    </div>
  </div>
</teleport>
</div>
</template>
<script>
import {computed, defineComponent, watchEffect, ref, watch, nextTick} from 'vue'
import CommandOption from './CommandOption.vue'
import CustomOption from './CustomOption.vue'
import KIcon from '@/components/Icon'
import KInput from '@/components/Input'
import Tooltip from '@/components/Tooltip'
import useDataSearch from '@/composables/useDataSearch.js'
import useDataGroup from '@/composables/useDataGroup.js'
import usePopper from '@/composables/usePopper.js'
import useClickOutside from '@/composables/useClickOutside.js'

const useMinWithModifier = (minWith = '200px') => {
  return {
    name: 'selectOptionMinWith',
    enabled: true,
    phase: 'beforeWrite',
    fn: ({ state }) => {
      const w = state.elements.reference.getBoundingClientRect().width
      state.styles.popper['min-width'] = w ? `${w}px` : minWith
    }
  }
}

export default defineComponent({
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: ''
    },
    desc: {
      type: String,
      default: '',
    },
    args: {
      type: Array,
      required: true
    },
    modelValue: {
      type: [String, Number, Boolean],
      default: ''
    },
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const customCommandArgs = ref('')
    const addCustomArgDisabled = computed(() => {
      return !customCommandArgs.value.startsWith('-') || customCommandArgs.value.endsWith('-')
    })

    const show = ref(false)
    const commandArgsRef = ref(null)
    const commandOptionsRef = ref(null)
    const minWithModifier = useMinWithModifier()
    const popperOption = {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [ 0, 8],
          },
        },
        minWithModifier,
      ],
      placement: 'bottom-start'
    }
    const { create, remove, update } = usePopper(commandArgsRef, commandOptionsRef, popperOption)
    useClickOutside(commandArgsRef, () => {
      show.value = false
    })
    const createPopper = () => {
      create()
      update()
    }
    watch(show, () => {
      if (show.value) {
        nextTick(() => {
          createPopper()
        })
        return
      }
      remove()
    })

    const usedOptions = ref([])
    const customValue = ref([])
    const initOptions = () => {
      var reg = /\s+--?/
      var options = []
      var str = props.modelValue.trim()
      var index = str.search(reg)

      while(index > -1) {
        options.push(str.slice(0, index))
        str = str.substr(index).trim()
        index = str.search(reg)
      }
      if (str) {
        options.push(str)
      }
      const args = []
      const customArgs = []
      options.forEach((item) => {
        const o = item.split(/\s+/)
        const arg = props.args.find((a) => a.long === o[0] || a.short === o[0])
        if (arg) {
          const v = o.slice(1).join('')
          args.push({
            ...arg,
            modelValue: v,
          })
          return
        }
        customArgs.push(item)
      })
      initOptions()
      usedOptions.value = args
      customValue.value = customArgs
    }
      
    const options = computed(() => {
      return props.args.filter((a) => !usedOptions.value.some((o) => a.long ? a.long === o.long : a.short === o.short))
    })

    const selectedOptions = ref([])
    const selectedUsedOptions = ref([])
    const optionsIndeterminate = computed(() => {
      if (selectedOptions.value.length === 0) {
        return false
      }
      return selectedOptions.value.length < options.value.length
    })
    const usedOptionsIndeterminate = computed(() => {
      if (selectedUsedOptions.value.length === 0) {
        return false
      }
      return selectedUsedOptions.value.length < usedOptions.value.length
    })
    const usedOptionsAllSelected = ref(false)
    watch(usedOptionsAllSelected, () => {
      if (usedOptionsAllSelected.value) {
        selectedUsedOptions.value = [...usedOptions.value]
      } else {
        selectedUsedOptions.value = []
      }
    })
    watchEffect(() => {
      if (usedOptions.value.length > 0 && usedOptions.value.length === selectedUsedOptions.value.length) {
        usedOptionsAllSelected.value = true
      } else {
        usedOptionsAllSelected.value = false
      }
    })

    const optionsAllSelected = ref(false)
    watch(optionsAllSelected, () => {
      if (optionsAllSelected.value) {
        selectedOptions.value = [...options.value]
      } else {
        selectedOptions.value = []
      }
    })

    watchEffect(() => {
      if (options.value.length > 0 && options.value.length === selectedOptions.value.length) {
        optionsAllSelected.value = true
      } else {
        optionsAllSelected.value = false
      }
    })

    const usedOptionsStr = computed(() => {
      return usedOptions.value
        .filter((o) => !(o.flag && o.modelValue === false))
        .filter((o) => !(o.multiple && !o.modelValue))
        .map((o) => `${o.long ?? o.short} ${o.flag && o.modelValue === true ? '' : o.modelValue ?? ''}`.trim()).join(' ')
    })
    const removeCustomArg = (index) => {
      customValue.value.splice(index, 1)
      emit('update:modelValue', `${usedOptionsStr.value} ${customValue.value.join(' ')}`.trim())
    }
    const addCustemArg = () => {
      if (addCustomArgDisabled.value) {
        return
      }
      if (customValue.value.includes(customCommandArgs.value)) {
        customCommandArgs.value = ''
        return
      }
      if (!customCommandArgs.value.startsWith('-')) {
        return
      }
      customValue.value.push(customCommandArgs.value)
      emit('update:modelValue', `${usedOptionsStr.value} ${customValue.value.join(' ')}`.trim())
      customCommandArgs.value = ''
    }

    const removeOptions = () => {
      selectedUsedOptions.value.forEach((v) => {
        const index = usedOptions.value.indexOf(v)
        if (index > -1) {
          usedOptions.value.splice(index, 1)
        }
      })
      emit('update:modelValue', `${usedOptionsStr.value} ${customValue.value.join(' ')}`.trim())
      selectedUsedOptions.value = []
    }
    const addOptions = () => {
      usedOptions.value.push(...selectedOptions.value)
      emit('update:modelValue', `${usedOptionsStr.value} ${customValue.value.join(' ')}`.trim())
      selectedOptions.value=[]
    }

    const handlePopperClick = (e) => {
      // do nothing
    }
    const togglePopper = () => {
      if (props.readonly) {
        return
      }
      show.value = !show.value
    }
    const handleOptionChange = (option, v) => {
      const o = usedOptions.value.find((o) => o.long ? o.long === option.long : o.short === option.short)
      if (o) {
        o.modelValue = v
        emit('update:modelValue', `${usedOptionsStr.value} ${customValue.value.join(' ')}`.trim())
      }
    }
    return {
      show,
      usedOptions,
      options,
      optionsIndeterminate,
      usedOptionsIndeterminate,
      selectedOptions,
      selectedUsedOptions,
      optionsAllSelected,
      usedOptionsAllSelected,
      customValue,
      addCustomArgDisabled,
      commandArgsRef,
      commandOptionsRef,
      customCommandArgs,
      removeCustomArg,
      addCustemArg,
      removeOptions,
      addOptions,
      handlePopperClick,
      togglePopper,
      handleOptionChange,
    }
  },
  components: {
    CommandOption,
    CustomOption,
    KIcon,
    Tooltip,
    KInput,
  }
})
</script>
<style>
.command-args {
  display: grid;
  grid-template-areas: "label label"
                       "select suffix";
  grid-template-columns: 1fr auto;
  column-gap: 10px;
  align-items: center;
  background-color: var(--input-bg);
  border-radius: var(--border-radius);
  border: solid var(--outline-width) var(--input-border);
  color: var(--input-text);
  padding: 8px 8px;
}
.command-args__title {
  display: grid;
  grid-template-columns: auto 1fr auto;
  column-gap: 10px;
  align-items: center;
  background: #f5f7fa;
  padding: 8px 8px;
}
.command-args__move {
  display: grid;
  height: fit-content;
  align-self: center;
  row-gap: 10px;
}
.command-args__trigger {
  min-height: 18px;
  grid-area: select;
  display: grid;
  grid-template-columns: 1fr auto;
}
.command-args__suffix {
  grid-area: suffix;
}
.command-args__label {
  color: var(--input-label);
  grid-area: label;
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  column-gap: 10px;
  width: fit-content;
}
.command-args__popper {
  display: none;
  position: absolute;
  background-color: var(--dropdown-bg);
  z-index: var(--popper-z-index);
  box-shadow: 0 5px 20px var(--shadow);
  max-height: 90vh;
  overflow: auto;
}
.command-args__popper--active {
  display: block;
}
.command-args__panel {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  min-height: 200px;
  column-gap: 10px;
  max-width: 80vw;
}
.command-args__options, .command-args__used-options {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  row-gap: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.command-args__item {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 10px;
  align-items: center;
  user-select: none;
}
.command-args__custom {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
}
.command-args__custom--remove {
  cursor: pointer;
}
.command-args__content {
  display: grid;
  row-gap: 10px;
  height: fit-content;
  padding: 8px 8px;
}
</style>