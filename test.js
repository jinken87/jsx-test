import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
 
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
 
const PATH = '../src/views'
 
const createOutput = (arr, initOutputString) => {
  const result = sortObjectsByFilePathAndIndex(
    mergeRoutesWithAddParentPath(
      arr.map((cur) => {
        const { routePath, filePath, addParentPath, isLayout, meta } = cur
        const isLazy = meta?.isLazy === undefined ? true : meta.isLazy
        const path = `@/views${filePath}`
        const component = createComponentName(filePath)
        const isNotLazyComponent = `<${component}/>`
        const isNotLazyImport = `
import ${component} from "${path}"`
        const lazyComponent = `LazyLoad(import('${path}'))`
        const element = isLazy ? lazyComponent : isNotLazyComponent
        if (!isLazy) {
          initOutputString += isNotLazyImport
          delete meta.isLazy
        }
        delete meta.label
 
        return {
          path: routePath === '/' ? '' : routePath,
          element,
          addParentPath,
          ...meta,
        }
      }),
    ),
  )
 
  createBackEndRouter([result.find(({ path }) => path === '/setting')])
 
  const output =
    initOutputString +
    `
  const router: Route[] = ${JSON.stringify(result, null, 2)
    .replace(/"LazyLoad\(.*?\)"/g, (match) => match.replace(/"/g, ''))
    .replace(/"(<[^>]+>)"/g, '$1')
    .replace(/("icon":\s*)"([^"]*)"/g, '$1<$2/>')}
  export default prependGlobalPrefixToPaths(router)
  export interface Route {
    path: string
    element: JSX.Element
    name: string
    icon?: JSX.Element
    children?: Route[]
    isHidden?: boolean
  }
 
  `
  const targetFile = '../src/router/router.tsx'
  const targetPath = path.resolve(__dirname, targetFile)
  return { output, targetPath }
}
 
async function main() {
  const { arr, importString } = await createPathArray()
 
  let initOutput =
    `import LazyLoad from "./LazyLoad/LazyLoad"\n` +
    `import { prependGlobalPrefixToPaths } from "@/lib/utils"\n` +
    organizeImports(importString)
  const { output, targetPath } = createOutput(arr, initOutput)
 
  fs.writeFileSync(targetPath, output)
}
 
async function printDirectoryContents(
  directory,
  parentPath = '/',
  result = {
    arr: [],
    importString: '',
  },
) {
  // 讀取目錄中的所有檔案
  const files = fs.readdirSync(directory)
  // 檢查是否包含 'layout.tsx'
  const hasLayout = files.includes('layout.tsx')
  // 檢查是否包含 'page.tsx'
  const hasPage = files.includes('page.tsx')
  // 尋找最接近的布局檔案並進行路徑格式化
 
  // 遍歷目錄中的檔案
  for (const file of files) {
    const originPath = path.join(directory, file)
    const stat = fs.statSync(originPath)
    // 如果是目錄，遞迴處理
    if (stat.isDirectory()) {
      const folderPath = path.join(parentPath, file)
      await printDirectoryContents(originPath, folderPath, result)
    } else {
      // 如果不包含布局和頁面檔案，則返回
      if (!hasLayout && !hasPage) return
      const filePath = path
        .join(parentPath, file)
        .replace(/\\/g, '/')
        .replace('.tsx', '')
      // 跳過非頁面和布局的檔案
      if (!filePath.endsWith('page') && !filePath.endsWith('layout')) continue
 
      // 讀取檔案的元資料
      const fileData = await readMeta(filePath)
      const fileDataImportString = fileData?.importString || ''
      // 如果尚未加入導入字串，則加入
      if (!result.importString.includes(fileDataImportString)) {
        result.importString += fileDataImportString
      }
      // 處理路由路徑並轉換成正則表達式
      const routePathRegex = /\/\([^)]*\)/g
      const paramsRegex = /\[(\w+)\]/g
      const routePath =
        filePath
          .replace(routePathRegex, '')
          .replace(paramsRegex, ':$1')
          .replace(/\/(?:page|layout)$/, '') || '/'
      // 檢查是否為布局檔案
      const isLayout = filePath.endsWith('layout')
      const addParentPath = findNearestLayoutTsx(originPath, isLayout)
      // 如果有元資料則使用，否則建立新的
      const meta = fileData?.meta ? fileData.meta : {}
 
      // 如果未設置名稱，則使用路由路徑作為名稱
      if (!meta.name) {
        meta.name = routePath
      }
      // 建立路由物件
      const item = {
        routePath,
        filePath,
        isLayout,
        meta,
        addParentPath,
      }
      // 特殊處理404路徑
      if (routePath === '/404') {
        item.meta = {
          name: 'Not Found',
          isHidden: true,
        }
        item.routePath = '/*'
      }
      // 加入到結果中
      result.arr.push(item)
    }
  }
}
 
const createPathArray = async () => {
  const viewsDirectory = path.join(__dirname, PATH)
  const result = {
    arr: [],
    importString: '',
  }
  await printDirectoryContents(viewsDirectory, '/', result)
 
  // result.arr 排序 addParentPath越短則排在前面
  result.arr.sort((a, b) => {
    if (a.filePath === a.addParentPath && b.filePath !== b.addParentPath)
      return -1
    if (a.filePath !== a.addParentPath && b.filePath === b.addParentPath)
      return 1
    return a.routePath.localeCompare(b.routePath)
  })
 
  return result
}
 
console.cuslog = (data) => {
  const filePath = path.join(__dirname, 'log.json')
  const jsonString = JSON.stringify(data, null, 2)
  fs.writeFile(filePath, jsonString, (err) => {
    if (err) {
      console.error('Error writing JSON to file:', err)
    } else {
      console.log('JSON written to file successfully.')
    }
  })
}
 
async function createBackEndRouter(json) {
  /**
   * 將子項目展平並移除指定的屬性。
   *
   * @param {Array} flattenArray - 要展平的陣列。
   * @param {Array} propertiesToRemove - 要移除的屬性列表。
   * @returns {Array} - 展平後的結果陣列。
   */
  function flattenChildren(flattenArray, propertiesToRemove = []) {
    const result = []
    for (const { children, ...rest } of flattenArray) {
      if (rest?.path === '/setting/dev') continue
      const updatedRest = { ...rest }
      for (const property of propertiesToRemove) {
        delete updatedRest[property]
      }
      result.push(updatedRest)
      if (children) {
        result.push(...flattenChildren(children, propertiesToRemove))
      }
    }
    return result
  }
  function structuredRoutesFn(data, isAddParentPath = false) {
    const success = data.reduce((result, item) => {
      const { path, ...rest } = item
      const pathParts = path.split('/').filter((part) => part !== '')
      const parent = pathParts.reduce((parent, part, index) => {
        const path = `/${pathParts.slice(0, index + 1).join('/')}`
        const existingPath = parent
          ? parent.children?.find((child) => child.path === path)
          : result.find((child) => child.path === path)
 
        if (existingPath) {
          return existingPath
        } else {
          const newPath = {
            path,
            ...rest,
          }
          if (isAddParentPath) {
            newPath.parentPath = parent?.path
          }
          if (parent) {
            const parentChildren = parent.children || []
            parent.children = [...parentChildren, newPath]
          } else {
            result = [...result, newPath]
          }
 
          return newPath
        }
      }, null)
 
      return result
    }, [])
    return success
  }
 
  const flattenRouter = flattenChildren(json, ['element', 'icon', 'isHidden'])
  const cleanRoutes = structuredRoutesFn(flattenRouter)
 
  function makeSeedRoute(routes) {
    return routes.map((route) => {
      const { path, name, children } = route
 
      const filteredRoute = {
        path,
        name,
      }
 
      if (children) {
        filteredRoute.children = {
          create: makeSeedRoute(children),
        }
      }
 
      return filteredRoute
    })
  }
  const routes = makeSeedRoute(cleanRoutes)
  const output = JSON.stringify(routes, null, 2)
 
  try {
    const outputPath = path.join(__dirname, '../../server/scripts/routes.json')
    fs.writeFileSync(outputPath, output)
  } catch (error) {
    console.error('增加失敗:', error.message)
  }
}
 
/**
 * 根據檔案路徑和索引對物件陣列進行排序。
 * @param {Array} arr - 要排序的物件陣列。
 * @returns {Array} - 排序後的物件陣列。
 */
function sortObjectsByFilePathAndIndex(arr) {
  // 使用正則表達式匹配檔案路徑中的括號部分
  const regex = /\[.*\]/
  // 對陣列進行排序和處理
  return arr
    .sort((a, b) => {
      // 如果路徑為404頁面，則放在最後
      if (a.path === '/*') return 1
      if (b.path === '/*') return -1
      // 如果路徑包含括號，則放在後面
      const aHasBrackets = regex.test(a.path)
      const bHasBrackets = regex.test(b.path)
      if (aHasBrackets && !bHasBrackets) return 1
      if (!aHasBrackets && bHasBrackets) return -1
 
      // 根據index存在與否和大小進行排序
      if (a.index !== undefined && b.index === undefined) return -1
      if (a.index === undefined && b.index !== undefined) return 1
      if (a.index !== undefined && b.index !== undefined)
        return a.index - b.index
 
      return a.path.length - b.path.length
    })
    .map((obj) => {
      // 遞迴排序子元素
      if (Array.isArray(obj.children)) {
        obj.children = sortObjectsByFilePathAndIndex(obj.children)
      }
      // 移除index屬性
      delete obj.index
      return obj
    })
}
 
function createComponentName(filePath) {
  /**
   * 根據檔案路徑生成組件名稱
   * @param {string} filePath - 檔案路徑
   * @returns {string} - 生成的組件名稱
   */
  const regex = /^\(.*\)$/
  const regex2 = /\[(.*?)\]/g
  const component = filePath
    .split('/')
    .filter((str) => !regex.test(str))
    .map((str) => {
      const result =
        str.length > 1
          ? str.slice(0, 1).toUpperCase() + str.slice(1)
          : str.toUpperCase()
      const text = result.replace(regex2, '$1')
      if (!str.includes('_')) return text
      const [first, ...rest] = text.split('_')
      return (
        first + rest.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
      )
    })
    .join('')
  return component
}
 
function organizeImports(importString) {
  /**
   * 將 import 字串進行整理。
   *
   * @param {string} importString - 包含 import 語句的字串。
   * @returns {string} - 整理後的 import 字串。
   */
  const arr = importString.split('\n')
  const importMap = {}
 
  arr.forEach((importStatement) => {
    if (importStatement.trim() === '') return
 
    const [_, importPart, fromPart] = importStatement.match(
      /import\s(.*)\sfrom\s'(.*)'/,
    )
    const key = fromPart.trim()
 
    if (!importMap[key]) {
      importMap[key] = { default: '', named: new Set() }
    }
 
    if (importPart.startsWith('{')) {
      const imports = importPart.replace(/[{}]/g, '').split(',')
      imports.forEach((importItem) => {
        const trimmedItem = importItem.trim()
        if (!importMap[key].named.has(trimmedItem)) {
          importMap[key].named.add(trimmedItem)
        }
      })
    } else {
      const trimmedItem = importPart.trim()
      if (!importMap[key].default) {
        importMap[key].default = trimmedItem
      }
    }
  })
 
  const result = Object.entries(importMap).map(([key, value]) => {
    const defaultImports = value.default
    const namedImports =
      value.named.size > 0 ? `{ ${Array.from(value.named).join(', ')} }` : ''
    const importString = [defaultImports, namedImports]
      .filter(Boolean)
      .join(', ')
    return `import ${importString} from "${key}"`
  })
 
  return result.join('\n')
}
 
function readMeta(filePath) {
  const regex = /\/([^/]+)$/ // 正則表達式用於從文件路徑中獲取最後一個路徑段
  const match = filePath.match(regex)
  const lastSegment = match ? match[1] : null // 獲取最後一個路徑段
  const metaPath = PATH + filePath.replace(regex, '/meta.ts') // 建立meta文件的路徑
 
  return new Promise((resolve) => {
    fs.readFile(path.join(__dirname, metaPath), 'utf8', (err, data) => {
      try {
        let importString = '' // 用於儲存匹配的import語句
 
        const importRegex = /import\s.*from\s+['"]([^'"]+)['"]/g // 正則表達式用於匹配import語句
        const matches = data.match(importRegex)
        if (matches && matches.length > 0) {
          matches.forEach((match) => {
            importString += match + '\n' // 將匹配的import語句添加到importString
            data = data.replace(match, '') // 刪除匹配的import語句
          })
        }
        const metaRegex = /const\s+meta\s+=\s+/ // 正則表達式用於匹配meta變數宣告
        let updatedData = data.replace(metaRegex, '') // 移除meta變數的宣告
        const modifiedString = updatedData.replace(
          /icon:\s*([^,\n}]+)/g,
          "icon: '$1'", // 將icon屬性的值加上引號
        )
        const jsonMeta = eval(`(${modifiedString})`) // 將處理過的字符串轉換成對象
        const res = {
          meta: jsonMeta[lastSegment], // 獲取對應的meta數據
          importString,
        }
        resolve(res)
      } catch (err) {
        resolve() // 解析失敗時，仍然解決promise
      }
    })
  })
}
 
main()
 
function findNearestLayoutTsx(originFilePath, isSkip = false) {
  const directory = originFilePath.replace(/\\(layout|page)\.tsx$/, '')
  const files = fs.readdirSync(directory)
  const parentDirectory = path.dirname(directory)
  if (isSkip) return findNearestLayoutTsx(parentDirectory)
  const hasLayout = files.includes('layout.tsx')
  if (hasLayout) {
    return path
      .join(directory)
      .replace(path.join(__dirname, PATH), '')
      .replace(/\\/g, '/')
      .replace('.tsx', '')
  }
 
  if (directory.endsWith('views')) return ''
  return findNearestLayoutTsx(parentDirectory)
}
 
function mergeRoutesWithAddParentPath(inputRoutes) {
  const routes = JSON.parse(JSON.stringify(inputRoutes))
  let newRoutes = []
  routes.forEach((route) => {
    if (route.addParentPath) {
      const parent = findRouteByPath(routes, route.addParentPath)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(route)
      } else {
        console.log('找不到')
      }
    } else {
      newRoutes.push(route)
    }
    delete route.addParentPath
  })
  return newRoutes
}
function findRouteByPath(inputRoutes, path) {
  function findRoute(routes, path) {
    for (let route of routes) {
      if (route.path === path) {
        return route
      }
      if (route.children) {
        const found = findRoute(route.children, path)
        if (found) {
          return found
        }
      }
    }
    return null
  }
  return findRoute(inputRoutes, path)
}