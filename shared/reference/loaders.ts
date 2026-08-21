/** 参考数据加载器（按 id） */

import { queryAscii, searchAscii } from './ascii'
import { queryHttpStatus, searchHttpStatus } from './httpstatus'
import { queryMime, searchMime } from './mimetype'
import {
  type RefGroup,
  queryRefPayload,
  searchRefPayload,
} from './engine'

type Payload = { kind: string; data: unknown }

const loaders: Record<string, () => Promise<{ default: Payload }>> = {
  httpheader: () => import('./data/httpheader'),
  portref: () => import('./data/portref'),
  linux: () => import('./data/linux'),
  gitref: () => import('./data/gitref'),
  regexref: () => import('./data/regexref'),
  docker: () => import('./data/docker'),
  mavenref: () => import('./data/mavenref'),
  gradle: () => import('./data/gradle'),
  jvmargs: () => import('./data/jvmargs'),
  redisref: () => import('./data/redisref'),
  mqref: () => import('./data/mqref'),
  ideakeys: () => import('./data/ideakeys'),
  designpatterns: () => import('./data/designpatterns'),
  junit5: () => import('./data/junit5'),
  cssref: () => import('./data/cssref'),
  k8sref: () => import('./data/k8sref'),
  esref: () => import('./data/esref'),
  jdkfeatures: () => import('./data/jdkfeatures'),
  gcref: () => import('./data/gcref'),
  securityref: () => import('./data/securityref'),
  springboot: () => import('./data/springboot'),
  txpropagation: () => import('./data/txpropagation'),
  mybatisplus: () => import('./data/mybatisplus'),
  mybatissql: () => import('./data/mybatissql'),
  lombok: () => import('./data/lombok'),
  jparef: () => import('./data/jparef'),
  vuereactref: () => import('./data/vuereactref'),
  arthas: () => import('./data/arthas'),
  springcloud: () => import('./data/springcloud'),
  flowableref: () => import('./data/flowableref'),
  esdslref: () => import('./data/esdslref'),
}

export const REF_DATA_IDS = Object.keys(loaders)

export async function searchReferenceById(id: string, keyword: string): Promise<string> {
  if (id === 'ascii') return searchAscii(keyword)
  if (id === 'httpstatus') return searchHttpStatus(keyword)
  if (id === 'mimetype') return searchMime(keyword)
  const load = loaders[id]
  if (!load) throw new Error(`未知参考工具: ${id}`)
  const mod = await load()
  return searchRefPayload(mod.default as Payload, keyword)
}

/** 结构化加载：左右分栏面板使用 */
export async function loadReferenceGroups(id: string, keyword = ''): Promise<RefGroup[]> {
  if (id === 'ascii') return queryAscii(keyword)
  if (id === 'httpstatus') return queryHttpStatus(keyword)
  if (id === 'mimetype') return queryMime(keyword)
  const load = loaders[id]
  if (!load) throw new Error(`未知参考工具: ${id}`)
  const mod = await load()
  return queryRefPayload(mod.default as Payload, keyword)
}
