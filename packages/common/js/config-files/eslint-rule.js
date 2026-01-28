/*
 * @Author: zhang·xiao
 * @Date: 2025-02-11 18:15:29
 * @LastEditors: zhang·xiao
 * @LastEditTime: 2025-02-17 10:29:52
 * @Description: 描述文件功能
 */
import eslintRecommended from '@eslint/js/src/configs/eslint-recommended.js'
export default {
  ...eslintRecommended.rules,
  'no-console': 'error',
  'no-debugger': 'error',
  'space-before-function-paren': 'off',
  'no-use-before-define': 'error',
}
