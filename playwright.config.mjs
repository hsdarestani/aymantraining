import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',workers:1,retries:0,timeout:45000,use:{baseURL:'http://127.0.0.1:3000',browserName:'chromium',trace:'retain-on-failure'},reporter:[['list'],['html',{open:'never'}]]});
