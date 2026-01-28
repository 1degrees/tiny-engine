import { ref } from 'vue'
// 拖拽数值定义
export interface IDragData {
  x?: number,
  y?: number,
  top?: number,
  left?: number,
  bottom?:number,
  right?: number,
  width?: number,
  height?: number,
}
export interface IOffset {
  left?: number,
  top?: number,
  right?: number,
  bottom?: number,
}

// 吸附距离
let diff = 10

// 拖拽元素坐标集合
// 左右
const selfX = ref<number[]>([])
// 上下
const selfY = ref<number[]>([])
// 拖拽元素边界
const selfBound = ref<IDragData>({})

// 拖动元素外的位置集合
// 左右
const othersX = ref<number[]>([])
// 上下
const othersY = ref<number[]>([])

// 辅助线初始数据
const lineState = ref<IOffset>({top: 0, left: 0, right: 0, bottom: 0})

// 吸附初始数据
const absState = ref<IOffset>({})

// 辅助线新建函数
function createLine() {
  const findLines = (selfs: number[], others: number[]) => {
    return others.filter((other) => selfs.some((self) => Math.abs(self - other) <= diff))
  }
  // 纵向辅助线
  const xLines = findLines(selfX.value, othersX.value)
  const yLines = findLines(selfY.value, othersY.value)
  return {
    left: xLines.length ? Math.min(...xLines) : undefined,
    top: yLines.length ? Math.min(...yLines) : undefined,
    right: xLines.length ? Math.max(...xLines) : undefined,
    bottom: yLines.length ? Math.max(...yLines) : undefined,
  }
}

// 吸附函数
function adsorb(left?: number, top?: number) {
  const offset = { left: undefined,  top: undefined } as IOffset
  const { width = 0, height = 0 } = selfBound.value
  if (left) {
    const [l, c, r] = selfX.value
    if (Math.abs(l - left) <= diff) {
      offset.left = left;
    } else if (Math.abs(c - left) <= diff) {
      offset.left = left - width / 2;
    } else if (Math.abs(r - left) <= diff) {
      offset.left = left - width;
    }
  }

  if (top) {
    const [t, c, b] = selfY.value
    if (Math.abs(t - top) <= diff) {
      offset.top = top;
    } else if (Math.abs(c - top) <= diff) {
      offset.top = top - height / 2;
    } else if (Math.abs(b - top) <= diff) {
      offset.top = top - height;
    }
  }
  return offset
}

// 获取所有兄弟元素
function getAllSiblings(el: Element): Element[] {
  const parent = el.parentNode;
  let siblings = [] as Element[]
  if (parent) {
    siblings = Array.from(parent.children).filter(child => child !== el);
  }
  return siblings;
}


// 辅助元素坐标集合设置函数
function setOthers(el: Element) {
  const otherX = [] as number[]
  const otherY = [] as number[]
  const els = getAllSiblings(el)
  els.forEach((el) => {
    const { left, top, width, height } = el.getBoundingClientRect()
    otherX.push(left);
    otherX.push(left + width / 2);
    otherX.push(left + width);
    otherY.push(top);
    otherY.push(top + (height / 2));
    otherY.push(top + height);
  });
  othersX.value = Array.from(new Set(otherX));
  othersY.value = Array.from(new Set(otherY));
}

// 自身坐标集合设置函数
function setSelf(el: Element) {
  const bounds = el.getBoundingClientRect()
  const { left = 0, top = 0, width = 0, height = 0 } = bounds
  selfX.value = [left, left + (width / 2), left + width]
  selfY.value = [top, top + (height / 2), top + height]
  selfBound.value = { left, top, width, height }
}

function genGuideLineAndAdsorb(el: Element) {
  setSelf(el)
  setOthers(el)
  const line = createLine()
  const adsVal = adsorb(line.left, line.top)
  lineState.value = line
  absState.value = adsVal
  return { line, adsVal }
}

function clearGuideLineAndAdsorb() {
  selfX.value = []
  selfY.value = []
  othersX.value = []
  othersY.value = []
  selfBound.value = {}
  lineState.value = {}
  absState.value = {}
}

// 获取辅助线坐标， 和吸附值
export function useGuideLine(d = 10) {
  diff = d
  return {
    genGuideLineAndAdsorb,
    clearGuideLineAndAdsorb,
    line: lineState, 
    adsVal: absState
  }
}


