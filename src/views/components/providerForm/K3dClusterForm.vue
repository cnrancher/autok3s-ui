<template>
  <k-tabs v-model="acitiveTab" :tab-position="tabPosition">
    <k-tab-pane label="K3d Options" name="instance">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model.trim="form.options['api-port']"
              label="API Port"
              :desc="desc.options['api-port']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['image']"
              label="Image"
              :desc="desc.config['image']"
              :readonly="readonly"
            />
            <boolean-form
              v-model="form.options['no-lb']"
              label="No LoadBalancer"
              true-label="True"
              false-label="False"
              :desc="desc.options['no-lb']"
              :readonly="readonly"
            />
            <boolean-form
              v-model="form.options['no-image-volume']"
              label="No Image Volume"
              true-label="True"
              false-label="False"
              :desc="desc.options['no-image-volume']"
              :readonly="readonly"
            />
          </div>
        </template>
      </form-group>
      <hr class="section-divider" />
      <k3d-options-form
        :visible="acitiveTab === 'k3s'"
        :init-value="form"
        :desc="desc"
        :readonly="readonly"
      ></k3d-options-form>
      <hr class="section-divider" />
      <form-group v-model="visible" :closable="true">
        <template #title>Advanced</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model.trim="form.options['masters-memory']"
              label="Masters Memory"
              :desc="desc.options['masters-memory']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['workers-memory']"
              label="Workers Memory"
              :desc="desc.options['workers-memory']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.config['token']"
              label="Token"
              :desc="desc.config['token']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.config['network']"
              label="Network"
              :desc="desc.config['network']"
              :readonly="readonly"
            />
            <k-combo-box
              v-model="form.options['gpus']"
              label="GPUs"
              :desc="desc.options['gpus']"
              :disabled="readonly"
              placeholder="Please Select or Input..."
              :options="['all']"
            ></k-combo-box>
            <div></div>
            <array-list-form
              ref="labels"
              :init-value="form.options['labels']"
              label="Labels"
              placeholder="e.g. my.label@agent:0,1"
              action-label="Add Label"
              :desc="desc.options['labels']"
              :readonly="readonly"
            ></array-list-form>
            <array-list-form
              ref="envs"
              :init-value="form.options['envs']"
              label="Environment Variables"
              placeholder="e.g. HTTP_PROXY=my.proxy.com@server:0"
              action-label="Add Variable"
              :desc="desc.options['envs']"
              :readonly="readonly"
            ></array-list-form>
            <array-list-form
              ref="volumes"
              :init-value="form.options['volumes']"
              label="Volumes"
              placeholder="e.g. /my/path@agent:0,1"
              action-label="Mount Volume"
              :desc="desc.options['volumes']"
              :readonly="readonly"
            />
            <array-list-form
              ref="ports"
              :init-value="form.options['ports']"
              label="Ports"
              placeholder="e.g. 8080:80@agent:0"
              action-label="Add Port"
              :desc="desc.options['ports']"
              :readonly="readonly"
            />
          </div>
          <hr class="section-divider" />
          <k-alert type="warning">
            Registry will only work with K3s >= v0.10.0, secure registry need bind mount the TLS file to the K3d
            container,
            <a href="https://k3d.io/usage/guides/registries/#secure-registries" target="_blank">more details</a>
            .
          </k-alert>
          <!-- <string-form
            v-model.trim="form.config['registry']"
            label="Registry"
            :desc="desc.config['registry']"
            :readonly="readonly"
            type="textarea"
            :style="{ resize: 'vertical' }"
          /> -->
          <registry-config-form
            v-model="form.config['registry-content']"
            class="col-span-1 sm:col-span-2"
            label="Registry"
            :desc="desc.config['registry-content']"
            :options="readonlyOption"
          />
        </template>
      </form-group>
    </k-tab-pane>
  </k-tabs>
</template>
<script setup>
import { computed, ref, provide, reactive, watch, inject } from 'vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3dOptionsForm from '../baseForm/K3dOptionsForm.vue'
import ArrayListForm from '../baseForm/ArrayListForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import RegistryConfigForm from '@/views/components/baseForm/RegistryConfigForm.vue'
import { cloneDeep } from '@/utils'
import useFormRegist from '@/composables/useFormRegist.js'

const props = defineProps({
  desc: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  },
  initValue: {
    type: Object,
    required: true
  }
})

const envs = ref(null)
const labels = ref(null)
const volumes = ref(null)
const ports = ref(null)
const form = reactive({
  provider: '',
  config: {},
  options: {}
})
const readonlyOption = computed(() => {
  return { readOnly: props.readonly }
})
const tabPosition = inject('tab-position', 'left')
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options, provider: form.provider } = cloneDeep(props.initValue))
  },
  { immediate: true }
)
const getForm = () => {
  const f = cloneDeep(form)
  const e = envs.value.getValue()
  const l = labels.value.getValue()
  const v = volumes.value.getValue()
  const p = ports.value.getValue()

  f.options['envs'] = e ? e.filter((item) => item) : e
  f.options['labels'] = l ? l.filter((item) => item) : l
  f.options['volumes'] = v ? v.filter((item) => item) : v
  f.options['ports'] = p ? p.filter((item) => item) : p

  return [
    { path: 'config', value: f.config },
    { path: 'options', value: f.options }
  ]
}
useFormRegist(getForm)

const acitiveTab = ref('instance')
const visible = ref(false)
provide('parentVisible', visible)
</script>
