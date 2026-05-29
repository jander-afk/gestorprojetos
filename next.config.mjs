/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Sem "standalone": a mesma imagem roda o web (next start) e o worker
  // (tsx), então node_modules e o código-fonte precisam continuar na imagem.
};

export default nextConfig;
