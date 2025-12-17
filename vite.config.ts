import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Use the provided SiliconFlow key as the primary key
  const SILICON_KEY = "sk-mkduhzolnutgyagkhuvivocucmzrjgczzkmjwfgziwvgygtw";

  return {
    plugins: [react()],
    define: {
      // Correctly polyfill process.env.API_KEY with the working key
      'process.env.API_KEY': JSON.stringify(SILICON_KEY),
    },
  };
});