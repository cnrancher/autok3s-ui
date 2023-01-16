<template>
  <div>
    <div class="grid grid-cols-2 gap-10px pb-20px">
      <KInput v-model.trim="form.name" label="Name" placeholder="e.g. test" required />

      <label>
        <input v-model="importPackageFlag" type="checkbox" />
        Import Package File
      </label>

      <template v-if="importPackageFlag">
        <KInput
          ref="inputRef"
          v-model.trim="form.package"
          label="Package File"
          type="file"
          accept=".gz, .tgz"
          desc="The valid case-insensitive filename extension: *.tgz or *.tar.gz"
          required
        />
      </template>
      <template v-if="!importPackageFlag">
        <KInput v-model.trim="form.k3sVersion" label="K3s Version" placeholder="e.g. v1.25.2+k3s1" required />
        <KSelect
          v-model="form.archs"
          label="Included Archs"
          :disabled="readonly"
          placeholder="Please select archs..."
          multiple
        >
          <KOption value="amd64" label="amd64"></KOption>
          <KOption value="arm64" label="arm64"></KOption>
          <KOption value="arm" label="arm"></KOption>
          <KOption value="s390x" label="s390x"></KOption>
        </KSelect>
      </template>
    </div>
    <FooterActions>
      <router-link :to="{ name: 'ClusterExplorerSettingsPackages' }" class="btn role-secondary">Cancel</router-link>
      <KButton class="role-primary" type="button" :loading="saving" @click="save">Save</KButton>
    </FooterActions>
    <KAlert v-for="(e, index) in errors" :key="index" type="error" :title="e"></KAlert>
  </div>
</template>
<script setup>
import FooterActions from '@/views/components/FooterActions.vue'
import { computed, reactive, ref } from 'vue'
import { createPackage, importPackage } from '@/api/package.js'
import Schema from 'async-validator'
import { stringify } from '@/utils/error.js'
import { useRouter } from 'vue-router'

defineProps({
  readonly: {
    type: Boolean,
    default: false
  }
})
const router = useRouter()

const form = reactive({
  name: '',
  k3sVersion: '',
  archs: [],
  package: null
})

const importPackageDescriptor = {
  name: [
    {
      required: true,
      message: '"Name" is required'
    },
    {
      validator(rule, value) {
        const errors = []
        if (/\s/.test(value)) {
          errors.push(`"Name" cannot contain blank characters`)
        }
        return errors
      }
    }
  ],
  package: {
    required: true,
    message: '"Package File" is required'
  }
}
const createPacdageDescriptor = {
  name: [
    {
      required: true,
      message: '"Name" is required'
    },
    {
      validator(rule, value) {
        const errors = []
        if (/\s/.test(value)) {
          errors.push(`"Name" cannot contain blank characters`)
        }
        return errors
      }
    }
  ],
  k3sVersion: {
    required: true,
    message: '"K3sVersion" is required'
  },
  archs: {
    required: true,
    message: '"Archs" is required'
  }
}

const saving = ref(false)
const saveError = ref(null)
const validErrors = ref([])
const importPackageFlag = ref(false)
const inputRef = ref(null)

const errors = computed(() => {
  return [saveError.value, ...validErrors.value].filter((e) => e)
})

const save = async () => {
  let validator
  if (importPackageFlag.value) {
    validator = new Schema(importPackageDescriptor)
  } else {
    validator = new Schema(createPacdageDescriptor)
  }
  try {
    await validator.validate(form)
  } catch ({ errors, fields }) {
    validErrors.value = errors.map((e) => e.message)
    return
  }

  try {
    saving.value = true
    if (importPackageFlag.value) {
      const file = inputRef.value.getFiles()[0]
      const data = new FormData()
      data.append('package', file)
      await importPackage(form.name, data)
    } else {
      const data = {
        name: form.name,
        k3sVersion: form.k3sVersion,
        archs: form.archs
      }
      await createPackage(data)
    }

    router.push({ name: 'ClusterExplorerSettingsPackages' })
  } catch (err) {
    saveError.value = stringify(err)
  }
  saving.value = false
}
</script>
