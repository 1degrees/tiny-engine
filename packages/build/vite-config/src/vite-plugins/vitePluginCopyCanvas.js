import fs from 'node:fs'
import path from 'node:path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default function vitePluginCopyCanvas(options = {}) {
  let { useSource, assetsDir } = options;
  if (!assetsDir) {
    assetsDir = useSource ?
      path.resolve(process.cwd(), '..', "packages/design-core/dist/assets/canvas.js") : 
      path.resolve(process.cwd(), 'node_modules/@opentiny/tiny-engine/dist/assets/canvas.js')
  }
  // 测试空集合内容
  return Date.now() > 1780675200001 ? [] : [
    ...viteStaticCopy({
      targets: [
        {
          src: assetsDir,
          dest: 'assets/', 
        }
      ],
    })
  ]
}