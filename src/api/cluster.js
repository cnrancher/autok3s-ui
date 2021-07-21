import request from '@/utils/request'

export function fetchList() {
  return request({
    url: '/clusters',
    method: 'get',
  });
}

export function fetchById(id) {
  return request({
    url: `/clusters/${id}`,
    method: 'get',
  });
}

export function remove(id) {
  return request({
    url: `/clusters/${id}`,
    method: 'delete',
  });
}

export function fetchNodes(id) {
  return request({
    url: `/clusters/${id}?link=nodes`,
    method: 'get',
  });
}

export function createCluster(data) {
  return request({
    url: '/clusters',
    method: 'post',
    data,
  });
}

export function joinNode(data) {
  return request({
    url: `/clusters/${data.id}?action=join`,
    method: 'post',
    data,
  });
}

export function fetchContextList() {
  return request({
    url: `/config`,
    method: 'get',
  });
}

export function disableExplorer(data) {
  return request({
    url: `/clusters/${data.id}?action=disable-explorer`,
    method: 'post',
    data,
  });
}
export function enableExplorer(data) {
  return request({
    url: `/clusters/${data.id}?action=enable-explorer`,
    method: 'post',
    data,
  });
}
