import request from '@/utils/request'

export function fetchList() {
  return request({
    url: '/clusterTemplates',
    method: 'get',
  });
}

export function fetchById(id) {
  return request({
    url: `/clusterTemplates/${id}`,
    method: 'get',
  });
}

export function remove(id) {
  return request({
    url: `/clusterTemplates/${id}`,
    method: 'delete',
  });
}

export function update(id, data) {
  return request({
    url: `/clusterTemplates/${id}`,
    method: 'put',
    data,
  });
}

export function create(data) {
  return request({
    url: '/clusterTemplates',
    method: 'post',
    data,
  });
}