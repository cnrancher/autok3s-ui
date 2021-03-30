<template>
  <div class="command-option">
    <div class="command-option__flag">
      <code>{{option}}</code>
    </div>
    <div v-if="!flag || choices" class="command-option__value">
      <template v-if="choices">
        <select v-model="value" v-if="!multiple">
          <option
            v-for="v in choices"
            :key="v.value"
            :value="v.value">
            {{v.label}}
            </option>
        </select>
        <template v-else>
          <label v-for="(v, index) in values" :key="index" @click.stop="handleClick">
            <input type="checkbox" :value="v"  v-model="multipleValue">
            <span>{{v}}</span>
          </label>
        </template>
      </template>
      <template v-else>
        <input v-model="value">
      </template>
    </div>
    <tooltip v-if="desc">
      <k-icon type="prompt"></k-icon>
      <template #popover>{{desc}}</template>
    </tooltip>
  </div>
</template>
<script>
import {computed, defineComponent, ref, watch} from 'vue'
import KIcon from '@/components/Icon'
import Tooltip from '@/components/Tooltip'

export default defineComponent({
  props: {
    desc: {
      type: String,
      default: '',
    },
    alias: {
      type: String,
      default: '',
    },
    long: {
      type: String,
      required: true,
    },
    short: {
      type: String,
      default: ''
    },
    values: {
      type: Array
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: [String, Number, Boolean],
    },
    flag: {
      type: Boolean,
      default: false
    },
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const multipleValue = ref([])
    if (props.multiple) {
      multipleValue.value = props.modelValue.split(',').filter((v) => v).map((v) => v.trim())
    }
    watch(multipleValue, (v) => {
      emit('update:modelValue', v.join(','))
    })
    const value = computed({
      get() {
        return props.modelValue
      },
      set(v) {
        emit('update:modelValue', v)
      }
    })
    const option = computed(() => {
      if (props.alias) {
        return props.alias
      }
      const o = []
      if (props.long) {
        o.push(props.long)
      }
      if (props.short) {
        o.push(props.short)
      }
      return o.join(' / ')
    })
    const choices = computed(() => {
      if (!props.values) {
        return
      }
      if (props.flag) {
        return props.values.map((v, i) => ({
          label: v,
          value: i === 0 ? true : false,
        }))
      }
      return props.values.map((v) => ({
        label: v,
        value: v,
      }))
    })
    const handleClick = () => {
      // do nothing
    }

    return { value, option, choices, multipleValue, handleClick }
  },
  components: {
    Tooltip,
    KIcon,
  }
})
</script>
<style>
.command-option {
  display: flex;
  align-items: center;
}
.command-option__value {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  max-width: 300px;
  & > label {
    display: grid;
    align-items: center;
    grid-template-columns: max-content max-content;
    column-gap: 10px;
    margin-right: 10px;
  }
}
</style>