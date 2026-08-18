<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <SideBar />
    <div class="flex h-screen w-full flex-col">
      <!-- En-tête -->
      <header class="flex h-[72px] items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        <span class="relative">
          <span class="ec-avatar h-10 w-10 text-sm">
            {{ String(route.params.username || '?').charAt(0).toUpperCase() }}
          </span>
          <span
            class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"
          ></span>
        </span>
        <div>
          <h1 class="font-bold text-slate-900">{{ route.params.username }}</h1>
          <p class="text-xs text-slate-400">Conversation privée</p>
        </div>
      </header>

      <!-- Messages -->
      <div ref="messageContainer" class="ec-scroll flex-grow space-y-3 overflow-y-auto p-4 sm:p-6">
        <div
          v-for="message in messages"
          :key="message.timestamp"
          class="flex items-end gap-2.5"
          :class="{
            'justify-end': isMessageFromCurrentUser(message.senderUsername),
            'justify-start': !isMessageFromCurrentUser(message.senderUsername),
          }"
        >
          <span
            v-if="!isMessageFromCurrentUser(message.senderUsername)"
            class="ec-avatar h-8 w-8 shrink-0 text-xs"
          >
            {{ (message.senderUsername || '?').charAt(0).toUpperCase() }}
          </span>
          <div
            :class="isMessageFromCurrentUser(message.senderUsername) ? 'bubble-me' : 'bubble-them'"
          >
            <p class="break-words text-sm leading-relaxed">{{ message.text }}</p>
            <p
              class="mt-1 text-right text-[10px]"
              :class="
                isMessageFromCurrentUser(message.senderUsername)
                  ? 'text-white/70'
                  : 'text-slate-400'
              "
            >
              {{ formatDate(message.timestamp) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Saisie -->
      <div class="border-t border-slate-200 bg-white p-4">
        <div class="flex items-center gap-2">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Écrire un message…"
            class="ec-input !rounded-full"
            @keydown.enter.prevent="sendPrivateMessage"
          />
          <button
            class="ec-btn !h-11 !w-11 shrink-0 !rounded-full !p-0"
            title="Envoyer"
            @click="sendPrivateMessage"
          >
            <i class="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import SocketService from '@/socket'
import SideBar from '@/components/cards/SideBar.vue'

const messageContainer = ref(null)
const messages = ref([])
const newMessage = ref('')

const route = useRoute()

const currentUser = computed(() => JSON.parse(localStorage.getItem('user') || '{}'))

const isMessageFromCurrentUser = (senderUsername) => {
  return senderUsername === currentUser.value.username
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchPrivateMessages = async () => {
  const senderId = currentUser.value.id
  const receiverId = route.params.userId

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/private-messages/${senderId}/${receiverId}`,
    )
    const data = await response.json()
    if (response.ok) {
      messages.value = data
    } else {
      throw new Error(data.message || 'Could not fetch the messages')
    }
  } catch (error) {
    console.error('Fetch error:', error)
  }
}

watch(
  messages,
  () => {
    nextTick(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      }
    })
  },
  { deep: true },
)

watch(
  () => route.params,
  async (newParams) => {
    if (newParams.userId) {
      await fetchPrivateMessages()
    }
  },
  { deep: true },
)

onMounted(() => {
  fetchPrivateMessages()
  SocketService.socket?.off('receivePrivateMessage')
  SocketService.socket?.on('receivePrivateMessage', (message) => {
    messages.value.push({ ...message })
  })
})

const sendPrivateMessage = async () => {
  if (newMessage.value.trim() !== '') {
    const messagePayload = {
      senderId: currentUser.value.id,
      receiverId: route.params.userId,
      senderUsername: currentUser.value.username,
      receiverUsername: route.params.username,
      text: newMessage.value,
      timestamp: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/private-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      })
      const responseData = await response.json()
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to send the message')
      }
      SocketService.socket?.emit('sendPrivateMessage', messagePayload)
      messages.value.push({ ...messagePayload })
    } catch (error) {
      console.error('Error sending message:', error)
    }

    newMessage.value = ''
  }
}
</script>
