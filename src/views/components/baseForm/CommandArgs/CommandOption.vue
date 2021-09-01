<template>
  <div class="flex items-center">
    <div class="command-option__flag">
      <code class="bg-gray-100 border">{{option}}</code>
    </div>
    <div v-if="!flag || choices" class="flex items-center flex-wrap max-w-300px">
      <template v-if="choices">
        <select v-model="value" v-if="!multiple" class="focus-visible:outline-none border rounded">
          <option
            v-for="v in choices"
            :key="v.value"
            :value="v.value">
            {{v.label}}
            </option>
        </select>
        <template v-else>
          <label v-for="(v, index) in values" :key="index" @click.stop="handleClick" class="grid items-center grid-cols-[max-content,max-content] gap-x-10px mr-10px">
            <input type="checkbox" :value="v"  v-model="multipleValue">
            <span>{{v}}</span>
          </label>
        </template>
      </template>
      <template v-else>
        <input v-model="value">
      </template>
    </div>
    <k-tooltip v-if="desc">
      <k-icon type="prompt"></k-icon>
      <template #popover>{{desc}}</template>
    </k-tooltip>
  </div>
</template>
<script>
import {computed, defineComponent, ref, watch} from 'vue'

export default defineComponent({
  name: 'CommandOption',
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
})
</script>
