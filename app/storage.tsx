import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getBooks, getLocations, updateBook, createLocation, deleteLocation, BASE_URL } from "../services/api";

export default function StorageAndShelves() {
  const [books, setBooks] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States cho việc chọn sách để xếp kệ
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  // States cho việc tạo mới kệ sách hàng loạt
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);
  const [bulkLocation, setBulkLocation] = useState({ zone_name: "", shelf_prefix: "", num_shelves: "1", num_levels: "1" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksData, locationsData] = await Promise.all([
        getBooks(),
        getLocations()
      ]);
      setBooks(booksData);
      setLocations(locationsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lọc lấy các sách đang ở kệ chờ (location_id null hoặc không có thông tin location)
  const waitingBooks = books.filter(book => !book.location);

  const handleAssignBook = async () => {
    if (!selectedBook || !selectedLocationId) {
      alert("Vui lòng chọn kệ sách muốn phân bổ.");
      return;
    }
    try {
      await updateBook(selectedBook.book_id, { location_id: selectedLocationId });
      alert("Đã xếp sách lên kệ thành công!");
      setIsAssignModalOpen(false);
      setSelectedBook(null);
      setSelectedLocationId(null);
      fetchData(); // Refresh Data
    } catch (err) {
      alert("Lỗi khi xếp sách!");
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkLocation.zone_name || !bulkLocation.shelf_prefix) {
       alert("Vui lòng nhập Tên Khu Vực và Tiền Tố Kệ.");
       return;
    }
    const numShelves = parseInt(bulkLocation.num_shelves) || 1;
    const numLevels = parseInt(bulkLocation.num_levels) || 1;

    try {
      setLoading(true);
      const promises = [];
      for (let s = 1; s <= numShelves; s++) {
        for (let l = 1; l <= numLevels; l++) {
           promises.push(createLocation({
              zone_name: bulkLocation.zone_name,
              shelf_id: `${bulkLocation.shelf_prefix} ${s}`,
              level_number: l
           }));
        }
      }
      await Promise.all(promises);
      alert(`Đã tự động khởi tạo ${promises.length} vị trí kệ thành công!`);
      setIsBulkCreateModalOpen(false);
      setBulkLocation({ zone_name: "", shelf_prefix: "", num_shelves: "1", num_levels: "1" });
      fetchData();
    } catch (err) {
      alert("Lỗi khi tạo kệ sách hàng loạt!");
      setLoading(false);
    }
  };

  const handleDeleteLocation = (id: number) => {
    Alert.alert(
      "Xác nhận gỡ kệ sách",
      "Bạn có chắc muốn tháo dỡ kệ này không? Nếu có sách, chúng sẽ được tự động trả về Kệ Chờ.",
      [
        { text: "Bỏ qua", style: "cancel" },
        { 
          text: "Xóa Kệ", 
          style: "destructive",
          onPress: async () => {
             try {
               await deleteLocation(id);
               alert("Đã tháo dỡ kệ thành công.");
               fetchData();
             } catch (err) {
               alert("Lỗi khi kết nối để xóa kệ.");
             }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00A3AF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
              <Text style={styles.pageTitle}>Quản lý Vị Trí & Lên Kệ Sách</Text>
              <Text style={styles.subtitle}>Thiết lập kệ lưu trữ thực tế và xếp sách từ Kệ Chờ sang các kệ này.</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setIsBulkCreateModalOpen(true)}>
             <Ionicons name="add-circle-outline" size={20} color="#fff" style={{marginRight: 8}}/>
             <Text style={{color: '#fff', fontWeight: 'bold'}}>Khởi Tạo Hàng Loạt</Text>
          </TouchableOpacity>
      </View>

      {/* SÁCH CHỜ SẮP XẾP */}
      <View style={styles.waitingZone}>
        <Text style={styles.sectionTitle}>Sách Trạng Thái "KỆ CHỜ"</Text>
        <Text style={styles.sectionDesc}>Click vào sách bất kỳ để chọn vị trí thực tế cho nó.</Text>
        
        <View style={styles.booksGrid}>
          {waitingBooks.length === 0 && (
             <Text style={{ color: "#6B7280", fontStyle: "italic", padding: 10 }}>Hiện không có sách nào trên kệ chờ.</Text>
          )}
          {waitingBooks.map((book) => (
             <TouchableOpacity 
                key={book.book_id} 
                style={styles.bookCard}
                onPress={() => {
                   setSelectedBook(book);
                   setIsAssignModalOpen(true);
                }}
             >
                {book.image_url ? (
                   <Image 
                     source={{ uri: book.image_url.startsWith('http') ? book.image_url : BASE_URL + book.image_url }} 
                     style={styles.bookImage} resizeMode="cover" 
                   />
                ) : (
                   <View style={styles.bookImagePlaceholder}>
                      <Ionicons name="book-outline" size={30} color="#9CA3AF" />
                   </View>
                )}
                <View style={{ marginTop: 8 }}>
                   <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                   <Text style={styles.bookIsbn}>Mã: {book.isbn}</Text>
                   <View style={styles.badgeWaiting}>
                       <Text style={styles.badgeText}>Bấm để xếp đồ</Text>
                   </View>
                </View>
             </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* DANH SÁCH LƯU TRỮ KHÔNG GIAN (HIỂN THỊ CÁC KỆ HIỆN CÓ) */}
      <View style={[styles.waitingZone, { marginTop: 30 }]}>
         <Text style={styles.sectionTitle}>Các Khu Vực & Kệ Hiện Có</Text>
         <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 15}}>
           {locations.map((loc) => (
               <View key={loc.location_id} style={styles.locationTag}>
                   <Ionicons name="albums-outline" size={18} color="#00A3AF" />
                   <Text style={{marginLeft: 8, fontWeight: 'bold', color: '#1F2937'}}>
                      Khu {loc.zone_name}
                   </Text>
                   <Text style={{marginLeft: 8, color: '#4B5563'}}>| Kệ: {loc.shelf_id}</Text>
                   {loc.level_number && <Text style={{marginLeft: 8, color: '#6B7280'}}>- Tầng: {loc.level_number}</Text>}
                   
                   <TouchableOpacity 
                       style={{marginLeft: 15, padding: 4}} 
                       onPress={() => handleDeleteLocation(loc.location_id)}
                   >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                   </TouchableOpacity>
               </View>
           ))}
           {locations.length === 0 && <Text style={{color: '#6B7280'}}>Chưa có dữ liệu gốc về Kệ sách, vui lòng tạo mới để sử dụng chức năng lên kệ.</Text>}
         </View>
      </View>

      <View style={{ height: 100 }} />

      {/* MODAL 1: CHỌN VỊ TRÍ PHO SÁCH */}
      <Modal visible={isAssignModalOpen} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Phân Bổ Lên Kệ: Chọn Vị Trí</Text>
                <TouchableOpacity onPress={() => { setIsAssignModalOpen(false); setSelectedLocationId(null); }}>
                   <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
             </View>
             
             {selectedBook && (
                <View style={{backgroundColor: '#F3F4F6', padding: 15, borderRadius: 8, marginBottom: 20}}>
                   <Text style={{fontWeight: 'bold', color: '#1F2937'}}>{selectedBook.title}</Text>
                   <Text style={{color: '#4B5563', fontSize: 13}}>Mã: {selectedBook.isbn}</Text>
                </View>
             )}

             <Text style={{fontWeight: 'bold', marginBottom: 10, color: '#4B5563'}}>Chọn Kệ Thực Tế:</Text>
             <ScrollView style={{maxHeight: 200, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10}}>
                {locations.length === 0 && <Text style={{color: 'red'}}>Vui lòng tạo vị trí kệ trước khi sắp xếp sách.</Text>}
                {locations.map(loc => (
                   <TouchableOpacity 
                      key={loc.location_id}
                      style={[
                          styles.locationItem, 
                          selectedLocationId === loc.location_id && styles.locationItemActive
                      ]}
                      onPress={() => setSelectedLocationId(loc.location_id)}
                   >
                       <Text style={[selectedLocationId === loc.location_id ? {color: '#fff', fontWeight: 'bold'} : {color: '#374151'}]}>
                           Khu vực {loc.zone_name} - Kệ {loc.shelf_id} {loc.level_number ? `(Tầng ${loc.level_number})` : ''}
                       </Text>
                   </TouchableOpacity>
                ))}
             </ScrollView>

             <View style={styles.modalFooter}>
                 <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAssignModalOpen(false)}>
                    <Text style={{color: '#4B5563', fontWeight: 'bold'}}>Hủy Bỏ</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.saveBtn} onPress={handleAssignBook}>
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>Xác nhận Mới</Text>
                 </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: TẠO VỊ TRÍ KỆ MỚI HÀNG LOẠT */}
      <Modal visible={isBulkCreateModalOpen} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Phát Sinh Kệ Hàng Loạt</Text>
                <TouchableOpacity onPress={() => setIsBulkCreateModalOpen(false)}>
                   <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
             </View>

             <Text style={{color: '#6B7280', marginBottom: 20, fontSize: 13}}>
                 Hệ thống sẽ tự động cấu trúc khu vực. Ví dụ: nhập "Tiểu thuyết", "Tủ", 2 kệ trống, 3 tầng, hệ thống sẽ sinh ra 6 vị trí: Tủ 1 Tầng 1... Tủ 2 Tầng 3.
             </Text>

             <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên Khu Vực (vd: Thiếu nhi, Đời sống)*</Text>
                <TextInput style={styles.input} placeholder="Tên khu vực" value={bulkLocation.zone_name} onChangeText={(t) => setBulkLocation({...bulkLocation, zone_name: t})} />
             </View>
             
             <View style={{flexDirection: 'row', gap: 10}}>
                 <View style={[styles.inputGroup, {flex: 1}]}>
                    <Text style={styles.label}>Tiền Tố Kệ (vd: Kệ, Tủ)*</Text>
                    <TextInput style={styles.input} placeholder="Từ khoá mở đầu" value={bulkLocation.shelf_prefix} onChangeText={(t) => setBulkLocation({...bulkLocation, shelf_prefix: t})} />
                 </View>
                 <View style={[styles.inputGroup, {flex: 1}]}>
                    <Text style={styles.label}>Số lượng Tủ/Kệ</Text>
                    <TextInput style={styles.input} placeholder="vd: 10" keyboardType="numeric" value={bulkLocation.num_shelves} onChangeText={(t) => setBulkLocation({...bulkLocation, num_shelves: t})} />
                 </View>
                 <View style={[styles.inputGroup, {flex: 1}]}>
                    <Text style={styles.label}>Số Tầng mỗi Kệ</Text>
                    <TextInput style={styles.input} placeholder="vd: 5" keyboardType="numeric" value={bulkLocation.num_levels} onChangeText={(t) => setBulkLocation({...bulkLocation, num_levels: t})} />
                 </View>
             </View>

             <View style={styles.modalFooter}>
                 <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsBulkCreateModalOpen(false)}>
                    <Text style={{color: '#4B5563', fontWeight: 'bold'}}>Hủy Bỏ</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.saveBtn} onPress={handleBulkCreate}>
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>Chạy Lệnh Sinh Vị Trí</Text>
                 </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pageTitle: { fontSize: 26, fontWeight: "bold", color: "#1F2937", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#6B7280" },
  createBtn: {
      flexDirection: 'row',
      backgroundColor: '#00A3AF',
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 6,
      alignItems: 'center'
  },
  waitingZone: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  booksGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 20
  },
  bookCard: {
      width: 150,
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 10,
  },
  bookImage: {
      width: '100%',
      height: 160,
      borderRadius: 4,
      backgroundColor: '#E5E7EB',
  },
  bookImagePlaceholder: {
      width: '100%',
      height: 160,
      borderRadius: 4,
      backgroundColor: '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
  },
  bookTitle: { fontSize: 13, fontWeight: 'bold', color: '#1F2937' },
  bookIsbn: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  badgeWaiting: {
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      marginTop: 10,
      alignItems: 'center'
  },
  badgeText: { color: '#B45309', fontSize: 11, fontWeight: 'bold' },
  locationTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#E5E7EB'
  },
  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", alignItems: "center"
  },
  modalContent: {
    width: 600, maxWidth: "90%", backgroundColor: "#FFF", borderRadius: 12, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  modalFooter: { flexDirection: "row", justifyContent: "flex-end", marginTop: 25, gap: 10 },
  
  locationItem: {
      padding: 12,
      backgroundColor: '#F9FAFB',
      borderBottomWidth: 1,
      borderColor: '#E5E7EB'
  },
  locationItemActive: {
      backgroundColor: '#00A3AF',
      borderColor: '#007A83'
  },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, backgroundColor: "#F9FAFB", color: "#111827"
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: "#E5E7EB" },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: "#00A3AF" },
});
