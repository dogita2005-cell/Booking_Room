import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Image, StyleSheet, Platform, StatusBar, ActivityIndicator, Alert, Pressable, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, doc, runTransaction } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; 
import { useBookingStore } from '../../../store/useBookingStore';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface Room {
  id: string;
  name?: string;
  location?: string;
  size?: string;
  image?: string;
  bookedSlots?: Record<string, string[]>;
}

const TIME_SLOTS = ["07:30 - 09:30", "09:30 - 11:30", "13:00 - 15:00", "15:00 - 17:00"];

const getNext7Days = () => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateString = d.toISOString().split('T')[0];
    const displayDay = i === 0 ? 'Hôm nay' : `Th ${d.getDay() === 0 ? 'CN' : d.getDay() + 1}`;
    const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
    days.push({ id: dateString, label: displayDay, date: displayDate });
  }
  return days;
};

const RoomCard = ({ item, onPressDetail }: { item: Room, onPressDetail: () => void }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPressDetail}
    >
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <Image source={{ uri: item.image }} style={styles.roomImage} />
        <View style={styles.infoContainer}>
          <Text style={styles.roomName}>{item.name}</Text>
          <Text style={styles.roomDetail}>📍 {item.location}</Text>
          <Text style={styles.roomDetail}>👥 {item.size}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: '#E0F2FE' }]}>
            <View style={[styles.statusDot, { backgroundColor: '#0284C7' }]} />
            <Text style={[styles.statusText, { color: '#0369A1' }]}>
              Xem lịch trống
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const BookingModal = ({ 
  selectedRoom, 
  onClose, 
  next7Days, 
  onBookingSuccess 
}: { 
  selectedRoom: Room | null, 
  onClose: () => void, 
  next7Days: any[],
  onBookingSuccess: (msg: string) => void
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(next7Days[0].id);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTimeSlot(null);
  }, [selectedDate]);

  if (!selectedRoom) return null;

  const isSlotBooked = (slot: string) => {
    if (!selectedRoom.bookedSlots) return false;
    return selectedRoom.bookedSlots[selectedDate]?.includes(slot) || false;
  };

  const processBooking = async () => {
    if (!selectedTimeSlot) return;

    try {
      const roomRef = doc(db, 'rooms', selectedRoom.id);
      
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw "Phòng không tồn tại.";
        
        const data = roomDoc.data();
        const currentBookedSlots = data.bookedSlots || {};
        const slotsForDate = currentBookedSlots[selectedDate] || [];

        if (slotsForDate.includes(selectedTimeSlot)) {
          throw "Khung giờ này vừa bị người khác nhanh tay đặt mất!";
        }

        transaction.set(roomRef, {
          bookedSlots: {
            [selectedDate]: [...slotsForDate, selectedTimeSlot]
          }
        }, { merge: true });
      });

      useBookingStore.getState().addBooking({
        id: `${selectedRoom.id}_${selectedDate}_${selectedTimeSlot}`,
        roomId: selectedRoom.id,
        name: selectedRoom.name || 'Phòng học',
        location: selectedRoom.location || '',
        image: selectedRoom.image || '',
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        timestamp: Date.now()
      });

      const successMsg = `Đã giữ chỗ ${selectedRoom.name} ca ${selectedTimeSlot} thành công!`;
      onBookingSuccess(successMsg);
      onClose();
    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : 'Lỗi kết nối.';
      Platform.OS === 'web' ? window.alert(errorMessage) : Alert.alert('Lỗi', errorMessage);
    }
  };

  return (
    <Modal visible={true} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedRoom.name}</Text>
            <Text style={styles.modalDetailText}>📍 {selectedRoom.location} | 👥 {selectedRoom.size}</Text>
          </View>

          <Text style={styles.sectionTitle}>Chọn ngày:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {next7Days.map((day) => (
              <TouchableOpacity 
                key={day.id} 
                style={[styles.dateCard, selectedDate === day.id && styles.dateCardActive]}
                onPress={() => setSelectedDate(day.id)}
              >
                <Text style={[styles.dateLabel, selectedDate === day.id && styles.dateTextActive]}>{day.label}</Text>
                <Text style={[styles.dateValue, selectedDate === day.id && styles.dateTextActive]}>{day.date}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Chọn ca học:</Text>
          <View style={styles.timeSlotGrid}>
            {TIME_SLOTS.map((slot) => {
              const isBooked = isSlotBooked(slot);
              const isSelected = selectedTimeSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  disabled={isBooked}
                  style={[
                    styles.slotCard,
                    isSelected && styles.slotCardActive,
                    isBooked && styles.slotCardBooked
                  ]}
                  onPress={() => setSelectedTimeSlot(slot)}
                >
                  <Text style={[
                    styles.slotText,
                    isSelected && styles.slotTextActive,
                    isBooked && styles.slotTextBooked
                  ]}>
                    {slot}
                  </Text>
                  {isBooked && <Text style={styles.slotBookedTag}>Đã đặt</Text>}
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.modalActionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bookBtn, !selectedTimeSlot && styles.bookBtnDisabled]} 
              disabled={!selectedTimeSlot}
              onPress={processBooking}
            >
              <Text style={styles.bookBtnText}>Xác nhận đặt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const [activeBuilding, setActiveBuilding] = useState('Tất cả');
  const [activeCapacity, setActiveCapacity] = useState('Tất cả');
  const buildings = ['Tất cả', 'Tòa A', 'Tòa B', 'Tòa C', 'Tòa V'];
  const capacities = ['Tất cả', 'Nhóm nhỏ (2-5)', 'Nhóm vừa (5-20)', 'Phòng lớn (20+)'];

  const next7Days = useMemo(() => getNext7Days(), []);

  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
      const roomsData = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      })) as Room[]; 
      setRooms(roomsData);
      setLoading(false);
      
      if (selectedRoom) {
        const updatedRoom = roomsData.find(r => r.id === selectedRoom.id);
        if (updatedRoom) setSelectedRoom(updatedRoom);
      }
    });
    return () => unsubscribe();
  }, [selectedRoom?.id]);

  const filteredRooms = rooms.filter(room => {
    const matchSearch = room.name ? room.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const matchBuilding = activeBuilding === 'Tất cả' || (room.location && room.location.includes(activeBuilding));
    let matchCapacity = true;
    if (activeCapacity !== 'Tất cả' && room.size) {
      const sizeNum = parseInt(room.size.replace(/[^0-9]/g, '')) || 0;
      if (activeCapacity === 'Nhóm nhỏ (2-5)') matchCapacity = sizeNum >= 2 && sizeNum <= 5;
      if (activeCapacity === 'Nhóm vừa (5-20)') matchCapacity = sizeNum > 5 && sizeNum <= 20;
      if (activeCapacity === 'Phòng lớn (20+)') matchCapacity = sizeNum > 20;
    }
    return matchSearch && matchBuilding && matchCapacity;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>VKU Campus</Text>
          <Text style={styles.headerTitle}>Tra Cứu Phòng Học</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên phòng (VD: A201)..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filtersWrapper}>
          <Text style={styles.filterLabel}>Khu vực:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {buildings.map((bld) => (
              <TouchableOpacity key={bld} style={[styles.chip, activeBuilding === bld && styles.chipActive]} onPress={() => setActiveBuilding(bld)}>
                <Text style={[styles.chipText, activeBuilding === bld && styles.chipTextActive]}>{bld}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Sức chứa:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {capacities.map((cap) => (
              <TouchableOpacity key={cap} style={[styles.chip, activeCapacity === cap && styles.chipActive]} onPress={() => setActiveCapacity(cap)}>
                <Text style={[styles.chipText, activeCapacity === cap && styles.chipTextActive]}>{cap}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredRooms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RoomCard item={item} onPressDetail={() => setSelectedRoom(item)} />}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không tìm thấy phòng nào phù hợp.</Text>
              </View>
            }
          />
        )}
      </View>

      <BookingModal 
        selectedRoom={selectedRoom}
        onClose={() => setSelectedRoom(null)}
        next7Days={next7Days}
        onBookingSuccess={(msg) => {
          Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thành công', msg);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 24, marginBottom: 20 },
  headerSubtitle: { fontSize: 14, fontWeight: '600', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  searchContainer: { marginBottom: 16 },
  searchInput: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, color: '#1E293B', elevation: 2 },
  filtersWrapper: { marginBottom: 16 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8, marginTop: 4 },
  chipsScroll: { flexDirection: 'row', marginBottom: 12 },
  chip: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 10 },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  cardContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 16, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3 },
  roomImage: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#F1F5F9' },
  infoContainer: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  roomName: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  roomDetail: { fontSize: 14, color: '#64748B', marginBottom: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 16, fontWeight: '500' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  closeIcon: { position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: '#F1F5F9', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  closeIconText: { fontSize: 16, fontWeight: 'bold', color: '#64748B' },
  modalHeader: { marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  modalDetailText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  
  dateScroll: { flexDirection: 'row', marginBottom: 24 },
  dateCard: { width: 70, height: 75, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dateCardActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  dateLabel: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  dateValue: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  dateTextActive: { color: '#FFFFFF' },

  timeSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  slotCard: { width: '47%', paddingVertical: 14, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  slotCardActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6', borderWidth: 2 },
  slotCardBooked: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', opacity: 0.6 },
  slotText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  slotTextActive: { color: '#2563EB' },
  slotTextBooked: { color: '#94A3B8', textDecorationLine: 'line-through' },
  slotBookedTag: { fontSize: 10, color: '#EF4444', fontWeight: '700', marginTop: 4 },

  modalActionRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontSize: 16, fontWeight: '700' },
  bookBtn: { flex: 2, paddingVertical: 16, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center' },
  bookBtnDisabled: { backgroundColor: '#CBD5E1' },
  bookBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});