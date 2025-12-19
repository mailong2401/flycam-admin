// Admin constants
export const ADMIN_ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  BLOG: '/blog',
} as const;

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  BLOGS: '/api/blogs',
  // ... other endpoints
} as const;

// Validation constants
export const BLOG_VALIDATION = {
  TITLE_MIN: 3,
  TITLE_MAX: 200,
  CONTENT_MIN: 10,
} as const;