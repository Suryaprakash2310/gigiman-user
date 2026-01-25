export const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://10.91.192.153:5000/api' // 👈 Replace with your system IP
    : 'https://your-deployed-domain.com/api';
// 10.175.221.153 //172.17.10.165