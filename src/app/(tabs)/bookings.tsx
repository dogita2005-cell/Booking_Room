import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; 
import { useBookingStore } from '../../../store/useBookingStore';

export default function BookingsScreen() {
  const { bookings, cancelBooking } = useBookingStore();
  
  // State quản lý việc hiển thị Vé QR Code
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const handleCancelBooking = (ticket: any) => {
    Alert.alert(
      'Xác nhận hủy',
      `Hủy phòng ${ticket.name} ca ${ticket.timeSlot} ngày ${ticket.date}?`,
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Hủy phòng',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Lên Firebase gỡ ca học này khỏi danh sách đã đặt
              const roomRef = doc(db, 'rooms', ticket.roomId);
              
              await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (roomDoc.exists()) {
                  const data = roomDoc.data();
                  const currentBookedSlots = data.bookedSlots || {};
                  const slotsForDate = currentBookedSlots[ticket.date] || [];
                  
                  // Lọc bỏ ca học hiện tại, giữ lại các ca học khác của ngày hôm đó
                  const newSlotsForDate = slotsForDate.filter((slot: string) => slot !== ticket.timeSlot);
                  
                  transaction.set(roomRef, {
                    bookedSlots: {
                      [ticket.date]: newSlotsForDate
                    }
                  }, { merge: true });
                }
              });

              // 2. Xóa vé khỏi điện thoại
              cancelBooking(ticket.id);
              if (Platform.OS === 'web') {
                window.alert('Đã hủy vé và trả phòng về hệ thống.');
              } else {
                Alert.alert('Thành công', 'Đã hủy vé và trả phòng về hệ thống.');
              }
            } catch (error) {
              if (Platform.OS === 'web') {
                window.alert('Lỗi: Không thể kết nối với máy chủ.');
              } else {
                Alert.alert('Lỗi', 'Không thể kết nối với máy chủ.');
              }
            }
          }
        }
      ]
    );
  };

  const renderTicket = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.ticketCard}
      activeOpacity={0.7}
      onPress={() => setSelectedTicket(item)} // Bấm vào thẻ để hiện QR Code
    >
      <Image source={{ uri: item.image }} style={styles.roomImage} />
      <View style={styles.infoContainer}>
        <Text style={styles.roomName}>{item.name}</Text>
        <Text style={styles.roomDetail}>📅 {item.date}</Text>
        <Text style={styles.roomDetail}>⏰ {item.timeSlot}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={() => handleCancelBooking(item)} // Nút hủy riêng biệt
      >
        <Text style={styles.cancelText}>Hủy</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Phòng Của Tôi</Text>
          <Text style={styles.headerSubtitle}>Bấm vào vé để hiển thị mã QR Check-in</Text>
        </View>

        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bạn chưa có lịch đặt phòng nào.</Text>
            </View>
          }
        />
      </View>

      {/* MODAL HIỂN THỊ MÃ QR CHECK-IN */}
      <Modal visible={selectedTicket !== null} animationType="fade" transparent={true} onRequestClose={() => setSelectedTicket(null)}>
        {selectedTicket && (
          <View style={styles.modalOverlay}>
            <View style={styles.qrCard}>
              <Text style={styles.qrTitle}>VÉ CHECK-IN LỚP HỌC</Text>
              
              <View style={styles.qrInfoBox}>
                <Text style={styles.qrRoomName}>{selectedTicket.name}</Text>
                <Text style={styles.qrText}>Vị trí: {selectedTicket.location}</Text>
                <Text style={styles.qrText}>Ngày: {selectedTicket.date}</Text>
                <Text style={styles.qrText}>Ca học: {selectedTicket.timeSlot}</Text>
              </View>

              {/* Dùng API tạo mã QR động dựa trên ID của vé */}
              <View style={styles.qrImageWrapper}>
                <Image 
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=VKU_BOOKING_${selectedTicket.id}` }} 
                  style={styles.qrImage} 
                />
              </View>
              <Text style={styles.qrHint}>Đưa mã này cho quản lý tòa nhà để nhận phòng</Text>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTicket(null)}>
                <Text style={styles.closeBtnText}>Đóng vé</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 24, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#3B82F6', marginTop: 4, fontWeight: '500' },
  
  ticketCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 16, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3 },
  roomImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#F1F5F9' },
  infoContainer: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  roomName: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  roomDetail: { fontSize: 13, color: '#64748B', marginBottom: 2, fontWeight: '500' },
  
  cancelButton: { backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginLeft: 10, borderWidth: 1, borderColor: '#FECACA' },
  cancelText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  
  emptyContainer: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 16, fontWeight: '500' },

  // STYLE CHO QR MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  qrCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
  qrTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 20, letterSpacing: 1 },
  qrInfoBox: { width: '100%', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  qrRoomName: { fontSize: 22, fontWeight: '800', color: '#3B82F6', marginBottom: 8, textAlign: 'center' },
  qrText: { fontSize: 15, color: '#475569', marginBottom: 4, fontWeight: '500', textAlign: 'center' },
  qrImageWrapper: { padding: 10, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 2, borderColor: '#E2E8F0', marginBottom: 16 },
  qrImage: { width: 200, height: 200 },
  qrHint: { fontSize: 13, color: '#94A3B8', marginBottom: 24, fontStyle: 'italic' },
  closeBtn: { width: '100%', backgroundColor: '#0F172A', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});