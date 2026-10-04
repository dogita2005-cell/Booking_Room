import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Image, StyleSheet, TouchableOpacity, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 

interface Room {
  id: string;
  name?: string;
  location?: string;
  size?: string;
  status?: string;
  image?: string;
}

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
      const roomsData = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      })) as Room[]; 
      
      setRooms(roomsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Hàm xử lý khi người dùng bấm vào phòng
  const handleBookRoom = (room: Room) => {
    if (room.status === 'booked') {
      Alert.alert('Không thể đặt', 'Phòng này đã được người khác sử dụng.');
      return;
    }

    Alert.alert(
      'Xác nhận đặt phòng',
      `Bạn có chắc chắn muốn đặt ${room.name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              const roomRef = doc(db, 'rooms', room.id);
              await updateDoc(roomRef, {
                status: 'booked'
              });
              Alert.alert('Thành công', `Bạn đã đặt ${room.name} thành công!`);
            } catch (error) {
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi kết nối tới máy chủ.');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const filteredRooms = rooms.filter(room => {
    const roomName = room.name ? room.name.toLowerCase() : '';
    return roomName.includes(searchQuery.toLowerCase());
  });

  const renderRoomCard = ({ item }: { item: Room }) => (
    <TouchableOpacity 
      style={styles.cardContainer}
      activeOpacity={0.7}
      onPress={() => handleBookRoom(item)} // Gắn sự kiện click
    >
      <Image source={{ uri: item.image }} style={styles.roomImage} />
      <View style={styles.infoContainer}>
        <Text style={styles.roomName}>{item.name}</Text>
        <Text style={styles.roomDetail}>📍 {item.location}</Text>
        <Text style={styles.roomDetail}>👥 {item.size}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'available' ? '#4CAF50' : '#F44336' }]} />
          <Text style={[styles.statusText, { color: item.status === 'available' ? '#4CAF50' : '#F44336' }]}>
            {item.status === 'available' ? 'Đang trống (Bấm để đặt)' : 'Đã được đặt'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Hệ Thống Đặt Phòng</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tên phòng..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#1E293B" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredRooms}
            keyExtractor={(item) => item.id}
            renderItem={renderRoomCard}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<Text style={styles.emptyText}>Chưa có dữ liệu phòng học.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F4F6F8', 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 16 
  },
  headerTitle: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#1E293B', 
    marginVertical: 20,
  },
  searchInput: { 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16,
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    fontSize: 15,
    marginBottom: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2 
  },
  cardContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    marginBottom: 16, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3 
  },
  roomImage: { 
    width: 90, 
    height: 90, 
    borderRadius: 12, 
    backgroundColor: '#E2E8F0' 
  },
  infoContainer: { 
    flex: 1, 
    marginLeft: 16, 
    justifyContent: 'space-between' 
  },
  roomName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#0F172A' 
  },
  roomDetail: { 
    fontSize: 14, 
    color: '#64748B', 
    marginTop: 4 
  },
  statusContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8 
  },
  statusDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginRight: 6 
  },
  statusText: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#64748B', 
    marginTop: 30,
    fontSize: 15
  }
});