import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/tailwind.scss'
import App from './App.vue'
import router from './router'
import { DEMO, installDemo } from './demo/demo'

// Le mode démo doit être en place avant le premier appel API
if (DEMO) {
  installDemo()
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
