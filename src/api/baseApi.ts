import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api_instance = axios.create({
  baseURL: BASE_URL  
});

// We must add interceptor to avoid add manually headers to our requests so that the backend knows we
// are authenticated; it would be great if I knew how to do it :'v

export default api_instance;