import axios from 'axios';
import { Platform } from 'react-native';

// Thay đổi URL này thành URL backend của bạn khi deploy (ví dụ: https://smartlib-be.onrender.com)
// Link Render của bạn (Bỏ đoạn ?fbclid... ở đuôi đi cho chuẩn)
export const BASE_URL = 'https://smartlib-be.onrender.com';
// export const BASE_URL = 'http://127.0.0.1:8000';
// export const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ví dụ hàm gọi API lấy danh sách sách từ backend
export const getBooks = async (page = 1, pageSize = 20, search = "", categoryId = "") => {
  try {
    let url = `/api/books?page=${page}&page_size=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (categoryId) url += `&category_id=${categoryId}`;

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi fetch sách:", error);
    throw error;
  }
};

export const createBook = async (bookData: any) => {
  try {
    const response = await api.post('/api/books', bookData);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo sách:", error);
    throw error;
  }
};

export const updateBook = async (bookId: number, bookData: any) => {
  try {
    const response = await api.put(`/api/books/${bookId}`, bookData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật sách ${bookId}:`, error);
    throw error;
  }
};

export const deleteBook = async (bookId: number) => {
  try {
    const response = await api.delete(`/api/books/${bookId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa sách ${bookId}:`, error);
    throw error;
  }
};

export const uploadImage = async (imageUri: string, mimeType: string, filename: string) => {
  try {
    const formData = new FormData();

    // Expo có cách xử lý FormData cho ảnh khác biệt giữa Web và Điện thoại
    if (Platform.OS === 'web') {
      // Đối với Web, ta phải fetch uri (thường là blob:http://...) để biến thành Blob object
      const res = await fetch(imageUri);
      const blob = await res.blob();
      formData.append('file', blob, filename);
    } else {
      // Đối với Native (Android/iOS)
      formData.append('file', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);
    }

    const response = await api.post('/api/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.image_url;
  } catch (error) {
    console.error("Lỗi khi upload ảnh:", error);
    throw error;
  }
};

export const getLocations = async () => {
  try {
    const response = await api.get(`/api/locations?t=${new Date().getTime()}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi fetch locations:", error);
    throw error;
  }
};

export const createLocation = async (locationData: any) => {
  try {
    const response = await api.post('/api/locations', locationData);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo location:", error);
    throw error;
  }
};

export const updateLocation = async (locationId: number, locationData: any) => {
  try {
    const response = await api.put(`/api/locations/${locationId}`, locationData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật vị trí ${locationId}:`, error);
    throw error;
  }
};

export const deleteLocation = async (locationId: number) => {
  try {
    const response = await api.delete(`/api/locations/${locationId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa vị trí ${locationId}:`, error);
    throw error;
  }
};

export const importBooksExcel = async (fileUri: string, mimeType: string, filename: string) => {
  try {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const res = await fetch(fileUri);
      const blob = await res.blob();
      formData.append('file', blob, filename);
    } else {
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: filename,
      } as any);
    }

    const response = await api.post('/api/books/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Lỗi khi import excel:", error?.response?.data || error);
    throw error;
  }
};

export default api;

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('L?i khi fetch dashboard stats:', error);
    throw error;
  }
};

export const checkServerStatus = async () => {
  try {
    const response = await api.get('/');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const getCategories = async () => {
  const resp = await fetch(`${BASE_URL}/api/categories`);
  if (!resp.ok) throw { response: { data: await resp.json() } };
  return resp.json();
};
