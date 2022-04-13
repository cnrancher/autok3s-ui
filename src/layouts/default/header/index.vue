<template>
  <header class="grid grid-cols-[var(--nav-width),max-content] items-center justify-between pr-20px border-b bg-white">
    <!-- <k-dropdown-nav :route-groups="routeGroups" :current-group="currentGroup"></k-dropdown-nav> -->
    <div class="grid grid-cols-[auto,auto,1fr] items-center h-full gap-x-10px py-0 px-5px">
      <k-icon type="category" :size="24" class="lg:hidden cursor-pointer" @click="toggleSidBar"></k-icon>
      <img class="h-32px object-contain" :src="k3sLogo" />
      <div class="overflow-ellipsis">{{ currentGroup.title }}</div>
    </div>
    <kube-ctl-button></kube-ctl-button>
  </header>
</template>
<script setup>
import KubeCtlButton from './KubeCtlButton.vue'
import useRouteGroups from '../composables/useRouteGroups.js'
import k3sLogo from '@/assets/k3s.svg'
import KIcon from '@/components/Icon'
import { inject } from 'vue'

const { currentGroup } = useRouteGroups()
const openSideBar = inject('openSideBar')

const toggleSidBar = () => {
  openSideBar.value = !openSideBar.value
}
</script>
