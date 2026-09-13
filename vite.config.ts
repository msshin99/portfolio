import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // 라이브러리별로 별도 청크를 두면, 이 중 하나만 바뀌어도(또는 아직
        // 안 쓰는 페이지라도) 나머지 벤더 코드까지 매번 같이 다시 받을
        // 필요가 없어진다 — 특히 Three.js 관련 스택(react-three-fiber/
        // drei/postprocessing/three)이 히어로 3D 로고에만 쓰이는데도 전부
        // 하나의 거대한 번들에 같이 있던 것을 분리한다. 실제 코드/화면은
        // 전혀 바뀌지 않고, 브라우저가 캐시하고 병렬로 받아오는 단위만
        // 더 잘게 쪼개진다.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/three|@react-three/.test(id)) return "vendor-three";
          if (id.includes("gsap")) return "vendor-gsap";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("swiper")) return "vendor-swiper";
          if (id.includes("@supabase")) return "vendor-supabase";
          return "vendor";
        },
      },
    },
  },
});
