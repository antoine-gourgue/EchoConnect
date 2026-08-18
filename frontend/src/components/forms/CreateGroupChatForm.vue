<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <SideBar />
    <div class="flex h-screen w-full flex-col">
      <!-- En-tête -->
      <header class="flex h-[72px] items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-echo-50 text-echo-600">
          <i class="fa-solid fa-comments"></i>
        </span>
        <div>
          <h1 class="font-bold text-slate-900">Salon général</h1>
          <p class="text-xs text-slate-400">Ouvert à tous les membres</p>
        </div>
      </header>

      <!-- Messages -->
      <div
        ref="generalMessageContainer"
        class="ec-scroll flex-grow space-y-3 overflow-y-auto p-4 sm:p-6"
      >
        <div v-for="message in messages" :key="message.id">
          <p v-if="message.user.id === 'system'" class="bubble-system w-fit">
            {{ message.text }}
          </p>
          <div
            v-else
            class="flex items-end gap-2.5"
            :class="{
              'justify-end': isMessageFromCurrentUser(message.user.id),
              'justify-start': !isMessageFromCurrentUser(message.user.id),
            }"
          >
            <span
              v-if="!isMessageFromCurrentUser(message.user.id)"
              class="ec-avatar h-8 w-8 shrink-0 text-xs"
            >
              {{ (message.user.username || '?').charAt(0).toUpperCase() }}
            </span>
            <div :class="isMessageFromCurrentUser(message.user.id) ? 'bubble-me' : 'bubble-them'">
              <p
                v-if="!isMessageFromCurrentUser(message.user.id)"
                class="mb-0.5 text-xs font-bold text-echo-600"
              >
                {{ message.user.username }}
              </p>
              <p class="break-words text-sm leading-relaxed">{{ message.text }}</p>
              <p
                class="mt-1 text-right text-[10px]"
                :class="
                  isMessageFromCurrentUser(message.user.id) ? 'text-white/70' : 'text-slate-400'
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
            placeholder="Écrire un message… (/list pour les salons)"
            class="ec-input !rounded-full"
            @keydown.enter="sendMessage"
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

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { manageChatCommand } from '@/utils/chat-command'
import SideBar from '@/components/cards/SideBar.vue'
import SocketService from '@/socket'

const generalMessageContainer = ref(null)
const messages = ref([])
const newMessage = ref('')

const currentUser = computed(() => {
  return JSON.parse(localStorage.getItem('user'))
})

const isMessageFromCurrentUser = (messageUserId) => {
  return messageUserId === currentUser.value.id
}

SocketService.socket?.off('receiveMessage')
SocketService.socket?.on('receiveMessage', (message) => {
  messages.value.push(message)
})

async function loadMessages() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/general-messages`)
    if (response.ok) {
      const data = await response.json()
      messages.value = data.data
    } else {
      console.error('Failed to load messages:', response.statusText)
    }
  } catch (error) {
    console.error('Error loading messages:', error)
  }
}

watch(
  messages,
  () => {
    nextTick(() => {
      if (generalMessageContainer.value) {
        generalMessageContainer.value.scrollTop = generalMessageContainer.value.scrollHeight
      }
    })
  },
  { deep: true },
)

onMounted(loadMessages)

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const sendMessage = async () => {
  if (newMessage.value.trim() !== '') {
    if (newMessage.value[0] === '/') {
      manageChatCommand(newMessage.value, 'none', (channels) => {
        const systemMessage = {
          id: Date.now(),
          user: { id: 'system', username: 'Système' },
          text: `Salons disponibles : ${channels.map((channel) => channel.name).join(', ')}`,
          timestamp: new Date().toISOString(),
        }
        messages.value.push(systemMessage)
      })
      newMessage.value = ''
      return
    }
    const messagePayload = {
      user: currentUser.value,
      text: newMessage.value,
      timestamp: Date.now(),
    }

    SocketService.socket?.emit('sendMessage', messagePayload)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/general-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      })

      if (!response.ok) {
        console.error("Erreur lors de l'envoi du message.")
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error)
    }
    newMessage.value = ''
  }
}
</script>
