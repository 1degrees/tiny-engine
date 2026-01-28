/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */
import { replaceUrl } from '@opentiny/tiny-engine-utils'
import { useEnv, getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { importMapConfig as importMapJSON } from '@opentiny/tiny-engine-common/js/importMap'
const importMap = {}
export const getImportMap = (scripts = {}) => {
  const imports = { ...importMapJSON.imports, ...importMapJSON.importScripts,...scripts}
  for(let key in imports) {
    imports[key] = replaceUrl(imports[key])
  }
  importMap.imports = { ...imports }
  return importMap
}