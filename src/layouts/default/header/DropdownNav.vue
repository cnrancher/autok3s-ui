<template>
  <k-dropdown>
    <div class="k-dropdown-nav__selected">
      <img class="k-dropdown-nav__logo" :src="k3sLogo">
      <div class="k-dropdown-nav__title">{{currentGroup.title}}</div>
      <k-icon :size="20" type="arrow-right-blod" direction="down" :blod="true"></k-icon>
    </div>
    <template #content>
      <ul class="k-dropdown-nav__options">
        <router-link
          v-for="g in routeGroups" :key="g.name"
          :to="{name: g.name}"
          custom
          v-slot="{ navigate, isActive, isExactActive }"
        >
          <li
            class="k-dropdown-nav__option"
            :class="[isActive && 'k-dropdown-nav__option--selected router-link-active', isExactActive && 'router-link-exact-active']"
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
<style>
.k-dropdown-nav__selected {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  height: 50px;
  cursor: pointer;
  background-color: var(--header-bg);
  column-gap: 10px;
  padding: 0 5px;
}
.k-dropdown-nav__logo {
  height: 32px;
  object-fit: contain;
}
.k-dropdown-nav__options {
  width: 300px;
  max-height: 90vh;
  outline: none;
  list-style-type: none;
  padding: 5px 0;
  margin: 0;
  overflow-y: auto;
  border-top-style: none;
  text-align: left;
  background: var(--dropdown-bg);
  box-shadow: 0 8px 16px 0 var(--shadow);
}
.k-dropdown-nav__option {
  padding: 10px;
  text-decoration: none;
  border-left: 5px solid transparent;
  display: grid;
  grid-template-columns: 30px 1fr;
  align-items: center;
  cursor: pointer;
  color: var(--dropdown-text);
  &:not(.k-dropdown-nav__option--selected):hover {
    color: var(--dropdown-hover-text);
    background: var(--dropdown-hover-bg);
  }
}
.k-dropdown-nav__option--selected {
  color: var(--body-text);
  background: var(--nav-active);
  border-left: 5px solid var(--primary);
  &.product-icon {
    color: var(--product-icon-active);
  }
}
.k-dropdown-nav__title {
  text-overflow: ellipsis;
}
</style>
