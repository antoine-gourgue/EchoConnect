<template>
  <aside
    class="flex h-screen w-[76px] shrink-0 flex-col items-center border-r border-slate-800 bg-slate-950"
  >
    <!-- Logo -->
    <div class="flex h-[72px] w-full items-center justify-center border-b border-slate-800">
      <router-link to="/home" class="block h-9 transition hover:scale-105">
        <EchoLogo />
      </router-link>
    </div>

    <nav class="flex flex-1 flex-col items-center gap-y-3 pt-6">
      <!-- Messages privés -->
      <button
        class="group relative rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        :class="{ 'bg-slate-800 text-echo-400': showUsers }"
        @click="toggleUsersDisplay"
      >
        <i class="fa-solid fa-message"></i>
        <span class="ec-tooltip">Messages privés</span>
      </button>

      <div v-if="showUsers" class="flex flex-col items-center gap-y-2">
        <div
          v-for="user in users"
          :key="user.userId"
          class="group relative cursor-pointer transition hover:scale-105"
          @click="goToPrivateMessage(user.username, user.userId)"
        >
          <img
            v-if="user.imageUrl"
            class="h-10 w-10 rounded-full"
            :src="user.imageUrl"
            :alt="user.username"
          />
          <p v-else class="ec-avatar h-10 w-10 text-sm">
            {{ user.username.charAt(0).toUpperCase() }}
          </p>
          <span
            v-if="user.isOnline"
            class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 bg-green-500"
          ></span>
          <span class="ec-tooltip">{{ user.username }}</span>
        </div>
      </div>

      <!-- Salons -->
      <button
        class="group relative rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        :class="{ 'bg-slate-800 text-echo-400': showChannels }"
        @click="toggleChannelsDisplay"
      >
        <i class="fa-solid fa-user-group"></i>
        <span class="ec-tooltip">Salons</span>
      </button>

      <div v-if="showChannels" class="flex flex-col items-center gap-y-2">
        <RouterLink
          v-for="channel in channels"
          :key="channel.id"
          class="group relative cursor-pointer transition hover:scale-105"
          :to="{ name: 'Channel', params: { channelName: channel.name, channelId: channel.id } }"
        >
          <img
            v-if="channel.imageUrl"
            class="h-10 w-10 rounded-full object-cover"
            :src="channel.imageUrl"
            :alt="channel.name"
          />
          <p
            v-else
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 font-semibold text-echo-300"
          >
            {{ channel.name.charAt(0).toUpperCase() }}
          </p>
          <span class="ec-tooltip">{{ channel.name }}</span>
        </RouterLink>
      </div>

      <!-- Créer un salon -->
      <button
        class="group relative rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        @click="createChannel"
      >
        <i class="fa-solid fa-plus"></i>
        <span class="ec-tooltip">Créer un salon</span>
      </button>

      <!-- Salon général -->
      <button
        class="group relative rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        @click="goToCreateGroupChat"
      >
        <i class="fa-solid fa-comments"></i>
        <span class="ec-tooltip">Salon général</span>
      </button>
    </nav>

    <div class="flex flex-col items-center gap-y-3 py-6">
      <button
        class="group relative rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
        @click="onLogout"
      >
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
        <span class="ec-tooltip">Déconnexion</span>
      </button>

      <div class="group relative">
        <img
          v-if="currentUser.imageUrl"
          class="h-10 w-10 cursor-pointer rounded-full border-2 border-transparent transition hover:border-echo-400"
          :src="currentUser.imageUrl"
          :alt="currentUser.username"
          @click="goToProfile"
        />
        <p v-else class="ec-avatar h-10 w-10 cursor-pointer text-sm" @click="goToProfile">
          {{ currentUser.username.charAt(0).toUpperCase() }}
        </p>
        <span class="ec-tooltip">Profil</span>
      </div>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import Swal from 'sweetalert2'
import router from '@/router/index'
import SocketService from '@/socket'
import axios from 'axios'
import EchoLogo from '@/components/common/EchoLogo.vue'

type Channel = {
  id: number
  name: string
  imageUrl: string
  createdBy: number
  members: number[]
}

/*  REFS */
const channels: Ref<Channel[]> = ref([])
const users = ref([])
const showUsers = ref(true)
const showChannels = ref(true)
const emit = defineEmits(['logout', 'update:openCreateChannelModal'])
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

/* PROPS */
const props = defineProps({
  openCreateChannelModal: {
    type: Boolean,
    default: false,
  },
})

/* WATCHERS */
watch(
  () => props.openCreateChannelModal,
  (value) => {
    if (value) {
      createChannel()
    }
  },
)

onMounted(() => {
  SocketService.socket?.on('updateUserList', (updatedUsers) => {
    users.value = updatedUsers.filter((user) => user.userId !== currentUser.value.id)
  })

  fetchUserChannels()
})

onUnmounted(() => {
  SocketService.socket?.off('updateUserList')
})

function toggleUsersDisplay() {
  showUsers.value = !showUsers.value
}

function toggleChannelsDisplay() {
  showChannels.value = !showChannels.value
}

const onLogout = () => {
  emit('logout')
  const userConnected = JSON.parse(localStorage.getItem('user') || 'null')
  if (userConnected) {
    SocketService.socket?.emit('logout', userConnected.id)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push({ name: 'login' })
  }
}

const goToPrivateMessage = (username, userId) => {
  router.push({ name: 'PrivateMessage', params: { username, userId } })
}

const createChannel = async () => {
  const { value: channelName } = await Swal.fire({
    title: 'Nouveau salon',
    input: 'text',
    inputPlaceholder: 'Nom du salon',
    showCancelButton: true,
    confirmButtonText: 'Créer',
    cancelButtonText: 'Annuler',
    inputValidator: (value) => {
      if (!value) {
        return 'Vous devez entrer un nom !'
      }
    },
  })

  if (channelName) {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/channels/create`, {
        name: channelName,
        createdBy: currentUser.value.id,
        members: [currentUser.value.id],
        imageUrl: null,
      })
      channels.value.push(response.data)
      showChannels.value = true
      await Swal.fire('Créé !', `Salon créé : ${response.data.name}`, 'success')
    } catch (error) {
      console.error('Erreur lors de la création du salon:', error)
      await Swal.fire('Erreur !', `Erreur lors de la création du salon: ${error.message}`, 'error')
    }
  }

  emit('update:openCreateChannelModal', false)
}

SocketService.socket?.on('channelCreated', (data) => {
  channels.value.push(data)
  Swal.fire('Nouveau salon !', `Un nouveau salon a été créé : ${data.name}`, 'info')
})

SocketService.socket?.on('channelCreationError', (error) => {
  Swal.fire('Erreur', `Erreur lors de la création d'un salon : ${error}`, 'error')
})

const fetchUserChannels = async () => {
  try {
    const { data }: { data: Channel[] } = await axios.get(
      `${import.meta.env.VITE_API_URL}/channels/user/${currentUser.value.id}`,
    )
    channels.value = data
  } catch (error) {
    console.error("Erreur lors de la récupération des salons de l'utilisateur", error)
  }
}

const goToCreateGroupChat = () => {
  router.push({ name: 'GeneralChat' })
}

const goToProfile = () => {
  router.push({ name: 'ProfileView' })
}
</script>
