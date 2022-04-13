<template>
  <div>
    <button class="btn role-secondary" @click="addNotify">add notify</button>
    <button class="btn role-secondary" @click="addNotify2('info')">add notify not auto close</button>
    <button class="btn role-secondary" @click="addNotify2('success')">add notify not auto close</button>
    <button class="btn role-secondary" @click="addNotify2('error')">add notify not auto close</button>
    <button class="btn role-secondary" @click="addNotify2('warn')">add notify not auto close</button>
    <k-notification group="example"></k-notification>
  </div>
</template>
<script setup>
import useNotificationStore from '@/store/useNotificationStore.js'
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
    duration: 0
  })
}
</script>
