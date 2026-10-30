import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { apiMiddleware, prewarm } from './server/api.mjs'

const port = Number(process.env.PORT) || 3000
const host = process.env.HOST || '127.0.0.1' // 기본은 내 컴퓨터에서만 접속 가능 (키의 호출 한도를 보호)

// /api/* 요청을 이 서버가 직접 처리한다. 인증키는 서버(이 프로세스)의 환경변수에서만 읽고 브라우저로 내려가지 않는다.
// 개발 서버(npm run dev)와 미리보기 서버(npm start) 모두에 같은 방식으로 붙인다.
function jejuApi() {
  const attach = (server) => {
    server.middlewares.use(apiMiddleware)
    server.httpServer?.once('listening', prewarm)
  }
  return { name: 'jeju-culture-api', configureServer: attach, configurePreviewServer: attach }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jejuApi()],
  server: {
    host,
    port,
    strictPort: true, // 포트가 이미 쓰이면 다른 포트로 넘어가지 않고 멈춰서 알려 준다
    // 개발 서버가 폴더의 파일을 그대로 내보내지 않도록 키 파일·저장된 응답·서버 코드를 막는다
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.cache/**', '**/server/**'] },
  },
  preview: { host, port, strictPort: true },
})
