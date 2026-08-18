<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
    <div
      class="pointer-events-none fixed -left-24 -top-24 h-96 w-96 rounded-full bg-echo-500/15 blur-[120px]"
    ></div>
    <div
      class="pointer-events-none fixed -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-500/15 blur-[130px]"
    ></div>

    <div
      class="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-soft"
    >
      <div class="flex items-center gap-3">
        <div class="h-9"><EchoLogo /></div>
        <span class="text-lg font-bold text-slate-900">EchoConnect</span>
      </div>

      <h2 class="mt-6 text-2xl font-bold text-slate-900">Créer votre compte</h2>
      <p class="mt-1 text-sm text-slate-500">
        Rejoignez les salons et discutez en temps réel.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label for="username" class="mb-1.5 block text-sm font-semibold text-slate-700">
            Nom d'utilisateur
          </label>
          <input
            id="username"
            v-model="values.username"
            type="text"
            autocomplete="username"
            required
            placeholder="antoine"
            class="ec-input"
          />
        </div>

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
            autocomplete="new-password"
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
          {{ loading ? 'Création…' : 'Créer mon compte' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        Vous avez déjà un compte ?
        <router-link
          :to="{ name: 'login' }"
          class="font-semibold text-echo-600 hover:text-echo-700"
        >
          Se connecter
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import router from '@/router'
import EchoLogo from '@/components/common/EchoLogo.vue'

const values = ref({
  username: '',
  email: '',
  password: '',
})
const errorMessage = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  errorMessage.value = ''
  loading.value = true
  try {
    await axios.post(`${import.meta.env.VITE_API_URL}/users/create`, values.value)
    try {
      const loginResponse = await axios.post(`${import.meta.env.VITE_API_URL}/login`, {
        email: values.value.email,
        password: values.value.password,
      })
      localStorage.setItem('token', loginResponse.data.token)
      localStorage.setItem('user', JSON.stringify(loginResponse.data.user))
      await router.push({ name: 'home' })
    } catch {
      await router.push({ name: 'login' })
    }
  } catch (error: any) {
    errorMessage.value =
      'Échec de la création : ' + (error.response?.data?.message || 'erreur inconnue')
  } finally {
    loading.value = false
  }
}
</script>
