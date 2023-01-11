export const SUPPORTED_PROVIDERS = ['aws', 'alibaba', 'google', /* 'harvester',*/ 'k3d', 'native', 'tencent']
export const FORM_MANAGE = Symbol('formManage')
export const EXCLUDED_KEYS_FOR_CLUSTER_FORM = [
  'options',
  'id',
  'actions',
  'status',
  'type',
  'links',
  'provider',
  'token',
  'ip',
  'cluster-cidr',
  'is-ha-mode',
  'datastore-type',
  'context-name',
  'is-default'
]
