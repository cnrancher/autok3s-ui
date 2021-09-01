<template>
  <button :disabled="btnDisabled" class="btn">
    <k-icon v-if="loading" type="loading"></k-icon>
    <slot></slot>
  </button>
</template>
<script>
import {computed, defineComponent} from 'vue'
import KIcon from '@/components/Icon'
export default defineComponent({
  name: 'KButton',
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    }
  },
  setup(props) {
    const btnDisabled = computed(() => {
      return props.disabled || props.loading
    })

    return {
      btnDisabled
    }
  },
  components: {
    KIcon,
  }
})
</script>
