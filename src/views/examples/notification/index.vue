<template>
  <div>
    <button @click="addNotify" class="btn role-secondary">add notify</button>
    <button @click="addNotify2('info')" class="btn role-secondary">add notify not auto close</button>
    <button @click="addNotify2('success')" class="btn role-secondary">add notify not auto close</button>
    <button @click="addNotify2('error')" class="btn role-secondary">add notify not auto close</button>
    <button @click="addNotify2('warn')" class="btn role-secondary">add notify not auto close</button>
    <k-notification group="example"></k-notification>
  </div>
</template>
<script>
import useNotificationStore from '@/store/useNotificationStore.js'
export default {
  setup() {
    const store = useNotificationStore()
    const addNotify = () => {
      store.notify({
        group: 'example',
        type: 'warn',
        title: 'test title',
        content: 'test content'
      })
    }
    const addNotify2 = (type = 'info') => {
      store.notify({
        group: 'example',
        type,
        title: 'test title',
        content: 'test content',
        duration: 0,
      })
    }
    return {
      addNotify,
      addNotify2,
    }
  },
}
</script>