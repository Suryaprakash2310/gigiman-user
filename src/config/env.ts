// export const API_BASE_URL =
//   process.env.NODE_ENV === 'development'
//     ? 'http://10.225.68.29:5000/api' // 👈 Replace with your system IP
//     : 'https://your-deployed-domain.com/api';
// // 10.175.221.153 //172.17.10.165

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://gigiman1.onrender.com/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://gigiman1.onrender.com';
export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN!;

// TODO: Replace with your actual Mapbox public token