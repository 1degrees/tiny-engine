import { mergeOptions } from '../utils/mergeOptions'
// 先定义 bucketName 常量
const BUCKET_NAME = 'tiny-engine'
const defaultOption = {
  bucketName: BUCKET_NAME,
  imagePath: `./public/${BUCKET_NAME}`,
  // 傻叉链接
  serverUrl: 'http://172.31.243.45:8007' // minio服务地址
}

// 提取schema中的图片URL todo: 改成接口获取
// function extractImageUrls(schema) {
//   const urls = new Set()

//   // 递归遍历对象，查找图片URL
//   const traverse = (obj) => {
//     if (!obj || typeof obj !== 'object') return

//     // 检查常见的图片属性名
//     const imageProps = ['src', 'url', 'backgroundImage', 'avatar', 'icon', 'logo']
    
//     Object.entries(obj).forEach(([key, value]) => {
//       // 检查是否是图片URL
//       if (typeof value === 'string' && 
//           (imageProps.includes(key) || value.match(/\.(png|jpe?g|gif|svg|webp|ico)$/i)) &&
//           (value.startsWith('http') || value.startsWith('/'))) {
//         urls.add(value)
//       }
      
//       // 递归遍历对象和数组
//       if (Array.isArray(value)) {
//         value.forEach(item => traverse(item))
//       } else if (typeof value === 'object' && value !== null) {
//         traverse(value)
//       }
//     })
//   }

//   // 遍历页面schema
//   if (schema.pageSchema) {
//     schema.pageSchema.forEach(page => traverse(page))
//   }

//   // 遍历区块schema
//   if (schema.blockSchema) {
//     schema.blockSchema.forEach(block => traverse(block))
//   }

//   // 遍历组件配置
//   if (schema.componentsMap) {
//     schema.componentsMap.forEach(component => traverse(component))
//   }

//   return Array.from(urls)
// }

// 根据URL获取文件类型
function getFileTypeFromUrl(url) {
  // const ext = url.split('.').pop().toLowerCase()
  // const imageTypes = {
  //   'jpg': 'jpeg',
  //   'jpeg': 'jpeg',
  //   'png': 'png',
  //   'gif': 'gif',
  //   'svg': 'svg',
  //   'webp': 'webp',
  //   'ico': 'ico'
  // }
  return 'image/*'
}

function appendAssetsResourcesPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { imagePath, bucketName } = realOptions
  return {
    name: 'tinyEngine-generateCode-plugin-image-resources',
    description: '下载并处理图片资源',
    /**
     * 提取并处理图片资源
     * @param {tinyEngineDslVue.IAppSchema} schema
     * @returns
     */
    async run(schema) {
      const imgs = await fetch(
        `/aip/assistant/api/v1/sketch/resource/list?bucket=${BUCKET_NAME}&appId=${schema.meta.appId}`,
        { method: 'get', mode: 'cors' }
      ).then(res => res.json())

      // 提取图片URL
      const imageUrls = imgs?.data?.map(e => e.fileUrl) || []
      
      if (!imageUrls.length) {
        return
      }

      // 创建图片目录
      const appId = schema.meta?.appId || '1'
      const targetPath = `${imagePath}/${appId}`
      
      // 下载并保存图片
      for (const url of imageUrls) {
        try {
          if (!url.includes(`/${bucketName}/`)) {
            continue
          }
          
          const encodedFileName = url.split('/').pop()
          const fileName = encodedFileName.includes('%') 
            ? decodeURIComponent(encodedFileName) 
            : encodedFileName
          
          // 获取图片内容 去掉前缀
          const response = await fetch(url)
          if (!response.ok) {
            console.error(`下载图片失败: ${response.status} ${response.statusText}`)
            continue
          }
          
          const blob = await response.blob()
          
          // 添加到生成的文件列表
          this.addFile({
            fileType: getFileTypeFromUrl(url),
            fileName,
            path: targetPath,
            fileContent: blob
          })
          
        } catch (error) {
          console.error(`处理图片失败: ${url}`, error)
        }
      }
    }
  }
}

export default appendAssetsResourcesPlugin