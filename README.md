K99: 前后端均可用的 web 服务器
========

K99 是可同时用于前端和后端的服务器中间件，是服务端的抽象层，k99 自身不依赖任何 node API 或浏览器 API。

通过 k99/browser 可以模拟出一个与原生 fetch API 完全相同的接口

通过 k99/node 可以将 k99 用于 node 端的 http/https/http2 等模块，也可以用于 express 等第三方模块。
