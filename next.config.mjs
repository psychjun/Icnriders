/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 타입 에러가 있어도 빌드를 강제로 완료시킵니다.
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 에러 체크를 건너뜁니다.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
