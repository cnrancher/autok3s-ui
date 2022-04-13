<template>
  <div>
    <k-input label="label" required>
      <template #prefix>prefix</template>
      <template #suffix>suffix</template>
    </k-input>
    <k-input label="label2"></k-input>
    <k-input></k-input>
    <k-select label="select label">
      <template #prefix>prefix</template>
      <template #suffix>suffix</template>
      <k-option value="v1" label="select label1"></k-option>
    </k-select>
    <k-select v-model="selectedValue" label="select label2">
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
          <k-dropdown-menu-item>dropdown-item</k-dropdown-menu-item>
        </k-dropdown-menu>
      </template>
    </k-dropdown>
  </div>
  <k-button class="role-secondary">dddd</k-button>
  <div>
    <span class="k-icon k-icon-arrow-right"></span>
  </div>
  <k-radio label="test">test</k-radio>
  <k-radio label="test1">test1</k-radio>
  <k-radio-group v-model="testRadio">
    <k-radio-button label="1"></k-radio-button>
    <k-radio-button label="2"></k-radio-button>
  </k-radio-group>
  <k-loading>
    dfasfsafsdfs
    <button>ddddd</button>
    <br />
    <button>ddddd</button>
    <br />
    <button>ddddd</button>
    <br />
    <button>ddddd</button>
    <br />
    <button>ddddd</button>
  </k-loading>
</template>
<script>
import { ref } from 'vue'
export default {
  name: 'FormIndex',
  setup() {
    const selectedValue = ref('v1')
    const testRadio = ref('')
    return {
      selectedValue,
      testRadio
    }
  }
}
</script>
