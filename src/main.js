// import '@unocss/reset/normalize.css'
import 'virtual:uno.css'
// custom styles here
import './styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import KComponents from '@/components'
import App from './App.vue'

import router from './router'

// import '@/styles/index.css'
const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(pinia)
app.use(KComponents)

app.mount('#app')
