import { parse } from 'yaml'
import yamlContent from './categories.yml?raw'

export function getYamlData(): iconObject {
  return parse(yamlContent)
}

interface Accessibility {
  icons: string[]
  label: string
}

interface iconObject {
  [key: string]: Accessibility
}
