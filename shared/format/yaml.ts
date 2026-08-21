/** YAML 格式化 / ↔ JSON（js-yaml） */
import { dump as yamlDump, load as yamlLoad, type DumpOptions } from 'js-yaml'

const dumpOpts: DumpOptions = {
  indent: 2,
  lineWidth: -1,
  sortKeys: false,
}

export function formatYaml(text: string): string {
  const obj = yamlLoad(text)
  return yamlDump(obj, dumpOpts)
}

export function yamlToJson(text: string): string {
  const obj = yamlLoad(text)
  return JSON.stringify(obj, null, 2)
}

export function jsonToYaml(text: string): string {
  const obj = JSON.parse(text)
  return yamlDump(obj, dumpOpts)
}
