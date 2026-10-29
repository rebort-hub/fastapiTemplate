import { Exception404Page } from "@/pages/exception/404"

/** 路由未匹配时的兜底（`__root` notFoundComponent） */
const NotFound = () => <Exception404Page />

export default NotFound
