<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <SideBar :users="users" @logout="onLogout" />

    <div class="ec-scroll relative flex-1 overflow-y-auto">
      <div
        class="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-echo-500/10 blur-[120px]"
      ></div>
      <div
        class="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]"
      ></div>

      <div class="relative mx-auto max-w-4xl px-6 py-12 lg:px-10 lg:py-16">
        <!-- En-tête -->
        <div class="flex items-center gap-4">
          <p v-if="currentUser" class="ec-avatar h-14 w-14 text-xl">
            {{ currentUser.username?.charAt(0).toUpperCase() }}
          </p>
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Salut {{ currentUser?.username }} 👋
            </h1>
            <p class="mt-0.5 text-sm text-slate-500">
              Ravi de vous revoir sur EchoConnect.
            </p>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="mt-8 flex flex-wrap gap-3">
          <router-link :to="{ name: 'GeneralChat' }" class="ec-btn">
            <i class="fa-solid fa-comments"></i>
            Rejoindre le salon général
          </router-link>
          <router-link :to="{ name: 'ProfileView' }" class="ec-btn-ghost">
            <i class="fa-solid fa-user-gear"></i>
            Mon profil
          </router-link>
        </div>

        <!-- Utilisateurs en ligne -->
        <div v-if="users.length" class="mt-10">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400">
            En ligne maintenant
          </h2>
          <div class="mt-3 flex flex-wrap gap-3">
            <div
              v-for="user in users"
              :key="user.id"
              class="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm"
            >
              <span class="relative">
                <span class="ec-avatar h-8 w-8 text-xs">
                  {{ user.name?.charAt(0).toUpperCase() }}
                </span>
                <span
                  class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"
                ></span>
              </span>
              <span class="text-sm font-semibold text-slate-700">{{ user.name }}</span>
            </div>
          </div>
        </div>

        <!-- Fonctionnalités -->
        <div class="mt-12 grid gap-4 sm:grid-cols-2">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <span class="ec-avatar h-10 w-10 rounded-xl text-sm">
              <i :class="feature.icon"></i>
            </span>
            <h3 class="mt-4 font-bold text-slate-900">{{ feature.title }}</h3>
            <p class="mt-1 text-sm leading-relaxed text-slate-500">
              {{ feature.text }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import SideBar from '@/components/cards/SideBar.vue'
import router from '@/router/index'
import SocketService from '@/socket'

const users = ref([])

const currentUser = computed(() => {
  return JSON.parse(localStorage.getItem('user'))
})

const features = [
  {
    icon: 'fa-solid fa-bolt',
    title: 'Temps réel',
    text: 'Messages instantanés grâce à Socket.io : tout arrive sans recharger la page.',
  },
  {
    icon: 'fa-solid fa-user-group',
    title: 'Salons de groupe',
    text: 'Créez des salons, invitez des membres et organisez vos discussions par sujet.',
  },
  {
    icon: 'fa-solid fa-lock',
    title: 'Messages privés',
    text: 'Discutez en tête-à-tête avec les utilisateurs connectés, en toute simplicité.',
  },
  {
    icon: 'fa-solid fa-terminal',
    title: 'Commandes de chat',
    text: 'Tapez /list pour les salons, /users pour les membres, comme sur IRC.',
  },
]

onMounted(() => {
  SocketService.socket?.on('updateUserList', (updatedUsers) => {
    users.value = updatedUsers
      .filter((user) => user.userId !== currentUser.value?.id)
      .map((user) => ({
        id: user.userId,
        socketId: user.socketId,
        name: user.username,
        image: user.image,
        isOnline: user.isOnline,
      }))
  })
})

const onLogout = () => {
  const userConnected = JSON.parse(localStorage.getItem('user'))

  if (userConnected) {
    SocketService.socket?.emit('logout', userConnected.id)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push({ name: 'login' })
  }
}
</script>
