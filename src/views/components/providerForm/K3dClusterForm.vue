<template>
  <!-- fake fields are a workaround for chrome autofill getting the wrong fields -->
  <input style="display: none" autocomplete="new-password" type="password" />
  <k-tabs tab-position="left" v-model="acitiveTab">
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
      <hr class="section-divider">
      <k3d-options-form
        :visible="acitiveTab === 'k3s'"
        :form="form"
        :desc="desc"
        :readonly="readonly">
      </k3d-options-form>
      <hr class="section-divider">
      <form-group :closable="true" v-model="visible">
        <template #title>Advance</template>
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
              v-model="form.options['labels']"
              label="Labels"
              placeholder="e.g. my.label@agent[0,1]"
              action-label="Add Label"
              :desc="desc.options['labels']"
              :readonly="readonly"
            ></array-list-form>
            <array-list-form
              ref="envs"
              v-model="form.options['envs']"
              label="Environment Variables"
              placeholder="e.g. HTTP_PROXY=my.proxy.com@server[0]"
              action-label="Add Variable"
              :desc="desc.options['envs']"
              :readonly="readonly"
            ></array-list-form>
            <array-list-form
              ref="volumes"
              v-model="form.options['volumes']"
              label="Volumes"
              placeholder="e.g. /my/path@agent[0,1]"
              action-label="Mount Volume"
              :desc="desc.options['volumes']"
              :readonly="readonly"
            />
            <array-list-form
              ref="ports"
              v-model="form.options['ports']"
              label="Ports"
              placeholder="e.g. 8080:80@agent[0]"
              action-label="Add Port"
              :desc="desc.options['ports']"
              :readonly="readonly"
            />
          </div>
          <hr class="section-divider">
          <k-alert type="warning">
            Registry will only work with K3s >= v0.10.0, secure registry need bind mount the TLS file to the K3d container, <a href="https://k3d.io/usage/guides/registries/#secure-registries" target="_blank">more details</a>.
          </k-alert>
          <string-form
            v-model.trim="form.config['registry']"
            label="Registry"
            :desc="desc.config['registry']"
            :readonly="readonly"
            type="textarea"
            :style="{resize: 'vertical'}"
          />
        </template>
      </form-group>
    </k-tab-pane>
  </k-tabs>
</template>
<script>
import {defineComponent, ref, provide} from 'vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3dOptionsForm from '../baseForm/K3dOptionsForm.vue'
import ArrayListForm from '../baseForm/ArrayListForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import useFormFromSchema from '../../composables/useFormFromSchema.js'
import { cloneDeep } from '@/utils'
export default defineComponent({
  props: {
    schema: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const envs = ref(null)
    const labels = ref(null)
    const volumes = ref(null)
    const ports = ref(null)
    const { form, desc }= useFormFromSchema(props.schema)
    const getForm = () => {
      const f = cloneDeep(form)
      const e = envs.value.getForm()
      const l = labels.value.getForm()
      const v = volumes.value.getForm()
      const p = ports.value.getForm()

      f.options['envs'] = e ? e.filter((item) => item) : e
      f.options['labels'] = l ? l.filter((item) => item) : l
      f.options['volumes'] = v ? v.filter((item) => item) : v
      f.options['ports'] = p ? p.filter((item) => item) : p

      return f
    }
    const acitiveTab = ref('instance')
    const visible = ref(false)
    provide('parentVisible', visible)

    return {
      form,
      desc,
      getForm,
      visible,
      envs,
      labels,
      volumes,
      ports,
      acitiveTab,
    }
  },
  components: {
    BooleanForm,
    StringForm,
    K3dOptionsForm,
    ArrayListForm,
    FormGroup,
  }
})
</script>
