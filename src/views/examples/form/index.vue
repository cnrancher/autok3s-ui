<template>
  <div>
    <k-input label="label" required>
      <template #prefix>prefix</template>
      <template #suffix>suffix</template>
    </k-input>
    <k-input label="label2">
    </k-input>
    <k-input>
    </k-input>
    <k-select label="select label">
      <template #prefix>prefix</template>
      <template #suffix>suffix</template>
      <k-option value="v1" label="select label1"></k-option>
    </k-select>
    <k-select label="select label2" v-model="selectedValue">
       <k-option value="v1" label="select label1"></k-option>
       <k-option value="v2" label="select label2"></k-option>
       <k-option value="v3" label="select label3"></k-option>
       <k-option value="v4" label="select label4"></k-option>
    </k-select>
    <k-select>
       <k-option value="v1" label="select label1"></k-option>
    </k-select>
    <k-dropdown>
      dropdown
      <template #content>
        <k-dropdown-menu>
          <k-dropdown-menu-item>
           dropdown-item
          </k-dropdown-menu-item>
        </k-dropdown-menu>
      </template>
    </k-dropdown>
  </div>
  <k-button class="role-secondary">dddd</k-button>
  <div>
    <span class="k-icon k-icon-arrow-right"></span>
  </div>

  <k-loading>
    dfasfsafsdfs
    <button>ddddd</button><br>
    <button>ddddd</button><br>
    <button>ddddd</button><br>
    <button>ddddd</button><br>
    <button>ddddd</button>

  </k-loading>
</template>
<script>
import KInput from '@/components/Input'
import KButton from '@/components/Button'
import { Select as KSelect, Option as KOption} from '@/components/Select'
import KLoading from '@/components/Loading'
import { DropdownMenu as KDropdownMenu, DropdownMenuItem as KDropdownMenuItem, Dropdown as KDropdown}  from '@/components/Dropdown'
import { ref } from 'vue'
export default {
  name: 'FormIndex',
  setup() {
    const selectedValue = ref('v1')
    return {
      selectedValue
    }
  },
  components: {
    KInput,
    KButton,
    KSelect,
    KOption,
    KDropdown,
    KDropdownMenu,
    KDropdownMenuItem,
    KLoading
  }
}
</script>