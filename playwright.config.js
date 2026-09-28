import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'tests/browser', fullyParallel:false, workers:1, timeout:45000,
  use:{baseURL:'http://localhost:5173',channel:'chrome',headless:true,trace:'retain-on-failure'},
  reporter:'list',
  webServer:[
    {command:'node server/local.js',url:'http://127.0.0.1:8888/api/programs',reuseExistingServer:false,timeout:60000},
    {command:'node node_modules/vite/bin/vite.js --host localhost --port 5173 --strictPort',url:'http://localhost:5173',reuseExistingServer:false,timeout:60000},
  ],
});
