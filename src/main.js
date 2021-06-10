import { createApp } from 'vue'
import KComponents from '@/components'
import App from './App.vue'

import router from './router'

import '@/styles/index.css'

const app = createApp(App)

app.use(router)
app.use(KComponents)

app.mount('#app')