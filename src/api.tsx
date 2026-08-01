import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://rolad-backend-api.vercel.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})
