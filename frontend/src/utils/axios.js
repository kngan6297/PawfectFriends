import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    // Log token status (masked)
    console.log("Axios request - Token present:", !!token);

    // Attach token to request if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug request data for notes endpoint
    if (config.url && config.url.includes("/notes")) {
      console.log("📝 Axios request debug:", {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
        dataType: typeof config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error("Axios request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("Token expired or invalid - redirecting to login");

      // Clear token and user data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login (using window.location for axios interceptors)
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
