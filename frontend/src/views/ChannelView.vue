<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <SideBar />
    <div class="flex h-screen w-full flex-col">
      <!-- En-tête du salon -->
      <header
        class="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6"
      >
        <div class="flex items-center gap-3">
          <span
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-echo-50 font-bold text-echo-600"
          >
            {{ channelName.charAt(0).toUpperCase() }}
          </span>
          <div>
            <h1 class="font-bold text-slate-900">{{ channelName }}</h1>
            <p class="text-xs text-slate-400">Salon de groupe</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="ec-btn-ghost !px-3 !py-2" title="Ajouter un utilisateur" @click="addUser">
            <i class="fa-solid fa-user-plus"></i>
            <span class="hidden sm:inline">Ajouter</span>
          </button>
          <button class="ec-btn-danger !px-3 !py-2" title="Supprimer le salon" @click="deleteChannel">
            <i class="fa-solid fa-trash-can"></i>
            <span class="hidden sm:inline">Supprimer</span>
          </button>
        </div>
      </header>

      <!-- Messages -->
      <div ref="messageContainerRef" class="ec-scroll flex-grow space-y-3 overflow-y-auto p-4 sm:p-6">
        <div v-for="message in messages" :key="message.timestamp">
          <p v-if="message.senderId === 'system'" class="bubble-system w-fit">
            {{ message.text }}
          </p>
          <div
            v-else
            class="flex items-end gap-2.5"
            :class="{
              'justify-end': isMessageFromCurrentUser(message.senderId),
              'justify-start': !isMessageFromCurrentUser(message.senderId),
            }"
          >
            <span
              v-if="!isMessageFromCurrentUser(message.senderId)"
              class="ec-avatar h-8 w-8 shrink-0 text-xs"
            >
              {{ (message.senderUsername || '?').charAt(0).toUpperCase() }}
            </span>
            <div
              :class="isMessageFromCurrentUser(message.senderId) ? 'bubble-me' : 'bubble-them'"
            >
              <p
                v-if="!isMessageFromCurrentUser(message.senderId)"
                class="mb-0.5 text-xs font-bold text-echo-600"
              >
                {{ message.senderUsername || 'Anonyme' }}
              </p>
              <p class="break-words text-sm leading-relaxed">{{ message.text }}</p>
              <p
                class="mt-1 text-right text-[10px]"
                :class="
                  isMessageFromCurrentUser(message.senderId) ? 'text-white/70' : 'text-slate-400'
                "
              >
                {{ formatDate(message.timestamp) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Saisie -->
      <div class="border-t border-slate-200 bg-white p-4">
        <div class="flex items-center gap-2">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Écrire un message… (/users pour la liste des membres)"
            class="ec-input !rounded-full"
            @keyup.enter="sendMessage"
          />
          <button
            class="ec-btn !h-11 !w-11 shrink-0 !rounded-full !p-0"
            title="Envoyer"
            @click="sendMessage"
          >
            <i class="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import SocketService from '@/socket'
import SideBar from '@/components/cards/SideBar.vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import type { ComputedRef, Ref } from 'vue'
import router from '@/router'
import { listChannelUsers } from '@/utils/chat-command'

type Message = {
  channelId: string
  senderId: string
  senderUsername: string
  text: string
  timestamp: string
}

/* HOOKS */
const route = useRoute()

/* REFS */
const messageContainerRef: Ref<HTMLElement | null> = ref(null)
const messages: Ref<Array<Message>> = ref([])
const newMessage = ref('')

const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const channelName = computed(() => {
  return route.params.channelName?.toString() || ''
})
const channelId: ComputedRef<string> = computed(() => {
  return route.params.channelId?.toString() || ''
})

/* METHODS */
const isMessageFromCurrentUser = (senderId: any) => {
  return senderId === currentUser.value.id
}

const scrollToBottom = () => {
  const _messageContainerRef = messageContainerRef.value
  if (_messageContainerRef) {
    _messageContainerRef.scrollTop = _messageContainerRef.scrollHeight
    messageContainerRef.value = _messageContainerRef
  }
}

const sendMessage = async () => {
  const trimmedMessage = newMessage.value.trim()

  // La commande /users affiche un message système avec la liste des membres
  if (trimmedMessage.startsWith('/users')) {
    try {
      const users = await listChannelUsers(channelId.value)
      const usernames = users.map((user) => user.username).join(', ')
      const systemMessage = {
        channelId: channelId.value,
        senderId: 'system',
        senderUsername: 'Système',
        text: `Membres du salon : ${usernames}`,
        timestamp: new Date().toISOString(),
      }

      messages.value.push(systemMessage)
      newMessage.value = ''

      await nextTick(() => {
        scrollToBottom()
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des membres du salon :', error)
    }
  } else if (trimmedMessage) {
    const message = {
      channelId: channelId.value,
      senderId: currentUser.value.id,
      senderUsername: currentUser.value.username,
      text: trimmedMessage,
      timestamp: new Date().toISOString(),
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/messages-channels/send`, message)

      if (SocketService.socket) {
        SocketService.socket.emit('sendChannelMessage', message)
      }
      newMessage.value = ''

      await nextTick(() => {
        scrollToBottom()
      })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }
}

const onReceiveChannelMessage = () => {
  if (SocketService.socket) {
    // Évite les doublons quand on change de salon (le watcher ré-enregistre)
    SocketService.socket.off('receiveChannelMessage')
    SocketService.socket.on('receiveChannelMessage', (message) => {
      messages.value.push(message)
      nextTick(() => scrollToBottom())
    })
  }
}

const formatDate = (timestamp: any) => {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const addUser = async () => {
  const { value: userName } = await Swal.fire({
    title: 'Ajouter un utilisateur',
    input: 'text',
    inputLabel: 'Nom de l’utilisateur',
    inputPlaceholder: 'Entrez le nom de l’utilisateur à ajouter',
    showCancelButton: true,
    confirmButtonText: 'Ajouter',
    cancelButtonText: 'Annuler',
    inputValidator: (value) => {
      if (!value) {
        return 'Vous devez écrire un nom !'
      }
    },
  })

  if (userName) {
    const token = localStorage.getItem('token')

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/search?name=${userName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const user = response.data[0]

      if (user) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/channels/${channelId.value}/addMember/${user._id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        const systemMessage = {
          channelId: channelId.value,
          senderId: 'system',
          senderUsername: 'Système',
          text: `${userName} a rejoint le salon.`,
          timestamp: new Date().toISOString(),
        }

        messages.value.push(systemMessage)

        await Swal.fire({
          title: 'Succès',
          text: 'Utilisateur ajouté au salon avec succès',
          icon: 'success',
          confirmButtonText: 'Fermer',
        })
      } else {
        await Swal.fire({
          title: 'Erreur',
          text: 'Utilisateur non trouvé',
          icon: 'error',
          confirmButtonText: 'Fermer',
        })
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'utilisateur au salon:", error)
      await Swal.fire({
        title: 'Erreur',
        text: "Un problème est survenu lors de l'ajout de l'utilisateur",
        icon: 'error',
        confirmButtonText: 'Fermer',
      })
    }
  }
}

const deleteChannel = async () => {
  Swal.fire({
    title: 'Êtes-vous sûr ?',
    text: 'Vous ne pourrez pas revenir en arrière !',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
  }).then(async (result) => {
    if (result.isConfirmed) {
      const token = localStorage.getItem('token')
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/channels/${channelId.value}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        await Swal.fire('Supprimé !', 'Le salon a été supprimé.', 'success')
        await router.push({ name: 'home' })
      } catch (error) {
        console.error('Erreur lors de la suppression du salon:', error)
        await Swal.fire({
          title: 'Erreur',
          text: 'Un problème est survenu lors de la suppression du salon',
          icon: 'error',
          confirmButtonText: 'Fermer',
        })
      }
    }
  })
}

/* WATCHERS */
watch(
  channelId,
  async (newChannelId: string) => {
    if (SocketService.socket) {
      SocketService.socket.emit('joinChannel', {
        channelId: newChannelId,
        userId: currentUser.value.id,
      })
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/messages-channels/${newChannelId}`,
      )
      messages.value = response.data
    } catch (error) {
      console.error('Error loading messages:', error)
    }

    await nextTick(() => {
      scrollToBottom()
      onReceiveChannelMessage()
    })
  },
  { immediate: true },
)
</script>
