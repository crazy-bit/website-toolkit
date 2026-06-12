/**
 * 全局类型定义集中在此文件。
 * 业务类型请在这里声明并导出，供全项目复用。
 */

export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

// 示例：
// export interface User {
//   id: string
//   name: string
// }
