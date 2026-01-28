import { shallowReactive } from 'vue'
import { parseData } from '../data-function/index'
export function useMethods(
	scope: any = {},
	context: any = {}
) {
	const methods = shallowReactive<Record<string, Function>>({})
	const setMethods = (methodsObj: Record<string, any>) => {
		for (const key in methodsObj) {
			const method = methodsObj[key]
			const methodFun = parseData(method, scope, context)
			methods[key] = methodFun
		}
	}
	const delMethods = (key: string) => {
		delete methods[key]
	}
	const getMethods = () => methods
	return {
		methods,
		setMethods,
		delMethods,
		getMethods
	}
}