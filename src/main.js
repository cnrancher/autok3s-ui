// windicss layers
import 'virtual:windi-base.css'
import 'virtual:windi-components.css'
// custom styles here
import './styles/main.css'
// windicss utilities
import 'virtual:windi-utilities.css'

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