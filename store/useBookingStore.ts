import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Cập nhật Interface Booking thêm roomId, date, timeSlot
export interface Booking {
  id: string;
  roomId: string;
  name: string;
  location: string;
  image: string;
  date: string;
  timeSlot: string;
  timestamp: number;
}

interface BookingStore {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  cancelBooking: (id: string) => void;
}

// 2. Khởi tạo Zustand Store có bọc Persist để lưu Offline
export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      bookings: [],
      
      // Thêm vé mới
      addBooking: (booking) => 
        set((state) => ({ bookings: [...state.bookings, booking] })),
      
      // Hủy vé
      cancelBooking: (id) => 
        set((state) => ({
          bookings: state.bookings.filter((b) => b.id !== id),
        })),
    }),
    {
      name: 'vku-booking-storage', // Tên key lưu trong điện thoại
      storage: createJSONStorage(() => AsyncStorage), 
    }
  )
);