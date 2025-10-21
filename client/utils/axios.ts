import axios from 'axios';

// Default instance dengan timeout 35 detik (untuk operasi biasa)
export const instance = axios.create({
  baseURL: 'https://melodix.gerrygurusinga.xyz',
  timeout: 35000, // 35 seconds
});

// Instance khusus untuk operasi berat (upload audio, AudD API, dll) dengan timeout 2 menit
export const heavyInstance = axios.create({
  baseURL: 'https://melodix.gerrygurusinga.xyz',
  timeout: 120000, // 120 seconds (2 minutes)
});
