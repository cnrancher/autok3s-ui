import request from '@/utils/request'

export function fetchList() {
  return request({
    url: '/settings',
    method: 'get'
  })
}

export function toggleHelmDashboard(data) {
  return request({
    url: '/settings/helm-dashboard-enabled',
    method: 'put',
    data
  })
}
