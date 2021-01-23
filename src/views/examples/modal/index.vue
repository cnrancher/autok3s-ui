<template>
  <div>
    <button @click="showModal">show modal</button>
    <k-modal v-model="visible" show-close>
      <template #title>test title</template>
      <template #default>
        body body
      </template>
      <template #footer>
        footer
      </template>
    </k-modal>
  </div>
</template>
<script>
import {ref} from 'vue'
import KModal from "@/components/Modal"
export default {
  setup() {
    const visible = ref(false)
    const showModal = () => {
      visible.value = true
    }
    return {
      visible,
      showModal,
    }
  },
  components: {
    KModal
  }
}
</script>