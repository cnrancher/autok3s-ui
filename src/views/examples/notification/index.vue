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
import KNotification from '@/components/Notification'
import { inject } from 'vue'
export default {
  setup() {
    const store = inject('notificationStore')
    const addNotify = () => {
      store.action.notify({
        group: 'example',
        type: 'warn',
        title: 'test title',
        content: 'test content'
      })
    }
    const addNotify2 = (type = 'info') => {
      store.action.notify({
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
  components: {
    KNotification
  }
}
</script>