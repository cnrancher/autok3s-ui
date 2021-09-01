<template>
  <k-input v-bind="$attrs" :type="inputType" :autocomplete="autocomplete">
    <template #suffix>
      <k-icon class="cursor-pointer" type="view" v-if="show" :size="18" @click="toggleShow"></k-icon>
      <k-icon class="cursor-pointer" type="view-off" v-else :size="18" @click="toggleShow"></k-icon>
    </template>
  </k-input>
</template>
<script>
import {computed, defineComponent, onBeforeUnmount, ref} from 'vue'
import KInput from './index.vue'
import KIcon from '@/components/Icon'
export default defineComponent({
  name: 'KPasswordInput',
  props: {
    autocomplete: {
      type: String,
      default: 'new-password'
    }
  },
  setup() {
    const show = ref(false)
    const inputType = computed(() => {
      return show.value ? 'text' : 'password'
    })
    const toggleShow = () => {
      show.value = !show.value
    }

    onBeforeUnmount(() => {
      show.value = true
    })
    
    return {
      show,
      toggleShow,
      inputType,
    }
  },
  components: {
    KInput,
    KIcon
  }
})
</script>
