<template>
  <div class="flex min-h-screen">
    <!-- Panneau de marque -->
    <div
      class="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 lg:flex"
    >
      <div
        class="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-echo-500/30 blur-[120px]"
      ></div>
      <div
        class="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-500/25 blur-[130px]"
      ></div>

      <div class="relative flex items-center gap-3">
        <div class="h-10"><EchoLogo dark /></div>
        <span class="text-xl font-bold text-white">EchoConnect</span>
      </div>

      <div class="relative">
        <h1 class="max-w-md text-4xl font-extrabold leading-tight text-white">
          Discutez en temps réel,<br />
          <span
            class="bg-gradient-to-r from-echo-300 to-violet-300 bg-clip-text text-transparent"
          >
            sans friction.
          </span>
        </h1>
        <ul class="mt-8 space-y-4 text-sm text-slate-300">
          <li class="flex items-center gap-3">
            <span class="ec-avatar h-7 w-7 text-xs"><i class="fa-solid fa-bolt"></i></span>
            Messages instantanés propulsés par Socket.io
          </li>
          <li class="flex items-center gap-3">
            <span class="ec-avatar h-7 w-7 text-xs"><i class="fa-solid fa-user-group"></i></span>
            Salons de groupe et messages privés
          </li>
          <li class="flex items-center gap-3">
            <span class="ec-avatar h-7 w-7 text-xs"><i class="fa-solid fa-terminal"></i></span>
            Commandes de chat : /list, /users, /msg…
          </li>
        </ul>
      </div>

      <p class="relative text-xs text-slate-500">
        Vue 3 · Socket.io · Express · MongoDB
      </p>
    </div>

    <!-- Formulaire -->
    <div class="flex w-full items-center justify-center bg-slate-50 px-6 py-12 lg:w-1/2">
      <div class="w-full max-w-sm">
        <div class="mb-8 flex items-center gap-3 lg:hidden">
          <div class="h-9"><EchoLogo /></div>
          <span class="text-lg font-bold text-slate-900">EchoConnect</span>
        </div>

        <h2 class="text-2xl font-bold text-slate-900">Bon retour 👋</h2>
        <p class="mt-1 text-sm text-slate-500">
          Connectez-vous pour retrouver vos conversations.
        </p>

        <div
          v-if="DEMO"
          class="mt-5 rounded-xl border border-echo-200 bg-echo-50 p-4 text-sm text-echo-900"
        >
          <p class="font-semibold">Mode démo</p>
          <p class="mt-0.5 text-echo-700">
            Aucun backend requis : entrez n’importe quels identifiants, ou lancez
            directement la visite.
          </p>
          <button class="ec-btn mt-3 w-full" @click="startDemo">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Explorer la démo
          </button>
        </div>

        <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label for="email" class="mb-1.5 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="email"
              v-model="values.email"
              type="email"
              autocomplete="email"
              required
              placeholder="vous@exemple.com"
              class="ec-input"
            />
          </div>

          <div>
            <label for="password" class="mb-1.5 block text-sm font-semibold text-slate-700">
              Mot de passe
            </label>
            <input
              id="password"
              v-model="values.password"
              type="password"
              autocomplete="current-password"
              required
              placeholder="••••••••"
              class="ec-input"
            />
          </div>

          <p
            v-if="errorMessage"
            class="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600"
          >
            {{ errorMessage }}
          </p>

          <button type="submit" class="ec-btn w-full" :disabled="loading">
            <i v-if="loading" class="fa-solid fa-circle-notch fa-spin"></i>
            {{ loading ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-500">
          Pas encore de compte ?
          <router-link
            :to="{ name: 'register' }"
            class="font-semibold text-echo-600 hover:text-echo-700"
          >
            Créer un compte
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import router from '@/router'
import EchoLogo from '@/components/common/EchoLogo.vue'
import { DEMO } from '@/demo/demo'

const values = ref({
  email: '',
  password: '',
})
const errorMessage = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  errorMessage.value = ''
  loading.value = true
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/login`, values.value)
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    await router.push({ name: 'home' })
  } catch (error: any) {
    errorMessage.value =
      'Échec de la connexion : ' + (error.response?.data?.message || 'identifiants invalides')
  } finally {
    loading.value = false
  }
}

const startDemo = () => {
  values.value = { email: 'demo@echoconnect.app', password: 'demo' }
  handleSubmit()
}
</script>
