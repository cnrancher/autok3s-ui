<template>
  <k-input v-bind="$attrs"></k-input>
</template>
<script>
import {defineComponent} from 'vue'
import KInput from '@/components/Input'
export default defineComponent({
  components: {
    KInput
  }
})
</script>