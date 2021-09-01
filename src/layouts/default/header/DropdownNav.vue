<template>
  <k-dropdown class="h-full">
    <div class="grid grid-cols-[auto,1fr,auto] items-center h-full cursor-pointer gap-x-10px py-0 px-5px">
      <img class="h-32px object-contain" :src="k3sLogo">
      <div class="overflow-ellipsis">{{currentGroup.title}}</div>
      <k-icon :size="20" type="arrow-right-blod" direction="down" :blod="true"></k-icon>
    </div>
    <template #content>
      <ul class="w-300px max-h-90vh py-5px overflow-y-auto bg-transparent shadow">
        <router-link
          v-for="g in routeGroups" :key="g.name"
          :to="{name: g.name}"
          custom
          v-slot="{ navigate, isActive, isExactActive }"
        >
          <li
            class="grid grid-cols-[30px,1fr] items-center cursor-pointer text-light-blue-500 p-10px border-l-5px border-transparent"
            :class="[isActive ? 'text-gray-800 bg-gray-100 border-l-5px border-light-blue-600 router-link-active' : 'hover:text-white hover:bg-light-blue-500', isExactActive && 'router-link-exact-active']"
            @click="navigate">
            <k-icon v-if="g.icon" class="product-icon" :type="g.icon" :size="18"></k-icon>{{g.title}}
          </li>
        </router-link>
      </ul>
    </template>
  </k-dropdown>
</template>
<script>
import KDropdown from '@/components/Dropdown'
import KIcon from '@/components/Icon'
import k3sLogo from '@/assets/k3s.svg'
export default {
  props: {
    routeGroups: {
      type: Array,
      required: true
    },
    currentGroup: {
      type: Object,
      default() {
        return {}
      }
    }
  },
  setup() {

    return {
      k3sLogo,
    }
  },
  components: {
    KDropdown,
    KIcon
  }
}
</script>

