<template>
  <div v-if="currentUser" class="flex h-screen overflow-hidden bg-slate-50">
    <SideBar @logout="onLogout" />

    <div class="ec-scroll relative flex-1 overflow-y-auto">
      <div
        class="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-echo-500/10 blur-[120px]"
      ></div>

      <div class="relative mx-auto max-w-2xl px-6 py-12 lg:py-16">
        <!-- En-tête profil -->
        <div class="flex items-center gap-4">
          <img
            v-if="currentUser.imageUrl"
            class="h-16 w-16 rounded-full border-2 border-echo-200"
            :src="currentUser.imageUrl"
            :alt="currentUser.username"
          />
          <p v-else class="ec-avatar h-16 w-16 text-2xl">
            {{ currentUser.username?.charAt(0).toUpperCase() }}
          </p>
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">{{ currentUsername }}</h1>
            <p class="mt-0.5 text-sm text-slate-500">Gérez votre compte EchoConnect</p>
          </div>
        </div>

        <!-- Email -->
        <section class="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="font-bold text-slate-900">
            <i class="fa-solid fa-envelope mr-2 text-echo-500"></i>
            Adresse email
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Mettez à jour l'adresse associée à votre compte.
          </p>
          <div class="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              v-model="editData.email"
              type="email"
              placeholder="nouvelle@adresse.com"
              class="ec-input"
            />
            <button
              class="ec-btn shrink-0"
              :disabled="!isValidEmail(editData.email)"
              @click="updateEmail(currentUser.id)"
            >
              Mettre à jour
            </button>
          </div>
        </section>

        <!-- Mot de passe -->
        <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="font-bold text-slate-900">
            <i class="fa-solid fa-lock mr-2 text-echo-500"></i>
            Mot de passe
          </h2>
          <p class="mt-1 text-sm text-slate-500">Choisissez un nouveau mot de passe.</p>
          <div class="mt-4 space-y-3">
            <input
              v-model="passwordData.oldPassword"
              type="password"
              placeholder="Ancien mot de passe"
              class="ec-input"
            />
            <input
              v-model="passwordData.newPassword"
              type="password"
              placeholder="Nouveau mot de passe"
              class="ec-input"
            />
            <input
              v-model="passwordData.confirmNewPassword"
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              class="ec-input"
            />
            <button class="ec-btn" @click="updatePassword(currentUser.id)">
              Changer le mot de passe
            </button>
          </div>
        </section>

        <!-- Zone dangereuse -->
        <section class="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <h2 class="font-bold text-red-700">
            <i class="fa-solid fa-triangle-exclamation mr-2"></i>
            Zone dangereuse
          </h2>
          <p class="mt-1 text-sm text-red-600/80">
            La suppression du compte est définitive : messages et salons associés seront perdus.
          </p>
          <button class="ec-btn-danger mt-4" @click="deleteProfile">Supprimer mon compte</button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import SideBar from '@/components/cards/SideBar.vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import SocketService from '@/socket'

const router = useRouter()
const editData = ref({ email: '' })
const passwordData = ref({ oldPassword: '', newPassword: '', confirmNewPassword: '' })

const currentUser = computed(() => {
  return JSON.parse(localStorage.getItem('user'))
})
const currentUsername = computed(() => {
  const user = JSON.parse(localStorage.getItem('user'))
  return user ? user.username : null
})

const updateEmail = async (userId) => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(
      `${import.meta.env.VITE_API_URL}/users/${userId}/email`,
      { email: editData.value.email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    await Swal.fire('Succès', 'Email mis à jour avec succès.', 'success')
  } catch (error) {
    console.error("Échec de la mise à jour de l'email:", error)
    await Swal.fire('Erreur', "Échec de la mise à jour de l'email.", 'error')
  }
}

const updatePassword = async (userId) => {
  if (passwordData.value.newPassword !== passwordData.value.confirmNewPassword) {
    await Swal.fire('Erreur', 'Les mots de passe ne correspondent pas.', 'error')
    return
  }
  try {
    const token = localStorage.getItem('token')
    await axios.put(
      `${import.meta.env.VITE_API_URL}/users/${userId}/password`,
      { password: passwordData.value.newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    await Swal.fire('Succès', 'Mot de passe mis à jour avec succès.', 'success')
  } catch (error) {
    console.error('Échec de la mise à jour du mot de passe:', error)
    await Swal.fire('Erreur', 'Échec de la mise à jour du mot de passe.', 'error')
  }
}

const deleteProfile = async () => {
  Swal.fire({
    title: 'Êtes-vous sûr ?',
    text: 'La suppression de votre compte est définitive.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`${import.meta.env.VITE_API_URL}/users/${currentUser.value.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        await Swal.fire('Supprimé !', 'Profil supprimé avec succès.', 'success')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        await router.push({ name: 'login' })
      } catch (error) {
        console.error('Échec de la suppression du profil:', error)
        await Swal.fire('Erreur', 'Échec de la suppression du profil.', 'error')
      }
    }
  })
}

const onLogout = () => {
  const userConnected = JSON.parse(localStorage.getItem('user'))

  if (userConnected) {
    SocketService.socket?.emit('logout', userConnected.id)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push({ name: 'login' })
  }
}

const isValidEmail = (email) => {
  return email && email.includes('@')
}
</script>
