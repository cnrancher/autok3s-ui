import request from '@/utils/request'

export function fetchList() {
  return request({
    url: '/addons',
    method: 'get'
  })
}

export function fetchById(id) {
  return request({
    url: `/addons/${id}`,
    method: 'get'
  })
}

export function remove(id) {
  return request({
    url: `/addons/${id}`,
    method: 'delete'
  })
}

export function create(data) {
  return request({
    url: '/addons',
    method: 'post',
    data
  })
}

export function update(id, data) {
  return request({
    url: `/addons/${id}`,
    method: 'put',
    data
  })
}
