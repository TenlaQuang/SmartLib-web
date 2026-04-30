import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Image,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { getBooks, createBook, updateBook, deleteBook, uploadImage, getLocations, importBooksExcel, BASE_URL } from "../services/api";

export default function BookManagementPage() {
  const [books, setBooks] = useState<any[]>([]); // Grouped books
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTitleGroup, setEditingTitleGroup] = useState<string | null>(null);

  // Form State for Group
  const [title, setTitle] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  
  // Location Dropdown State
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [showLocationSelect, setShowLocationSelect] = useState(false);

  // Single book creation state
  const [isSingleAddMode, setIsSingleAddMode] = useState(false);
  const [isbn, setIsbn] = useState("");

  // Copies State (for editing individual status)
  const [editingCopies, setEditingCopies] = useState<any[]>([]);

  const fetchLocationsList = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      // Group data by title
      const groupedMap = new Map();
      data.forEach((book: any) => {
        if (!groupedMap.has(book.title)) {
          groupedMap.set(book.title, {
            title: book.title,
            image_url: book.image_url,
            market_price: book.market_price,
            location_id: book.location_id,
            location: book.location,
            copies: []
          });
        }
        groupedMap.get(book.title).copies.push(book);
      });
      const groupedData = Array.from(groupedMap.values());
      setBooks(groupedData);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateISBN = () => {
    const prefix = "978";
    const d1 = Math.floor(Math.random() * 10);
    const d2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const d3 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const partial = prefix + d1 + d2 + d3;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(partial[i]);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;
    setIsbn(`${prefix}-${d1}-${d2}-${d3}-${checkDigit}`);
  };

  useEffect(() => {
    fetchLocationsList();
    fetchData();
  }, []);

  const handleImportExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLoading(true);
        const { uri, name, mimeType } = result.assets[0];
        
        await importBooksExcel(uri, mimeType || "application/octet-stream", name);
        // Note: Alert does not always style perfectly on web, but works.
        Alert.alert("Thành công", "Đã chèn dữ liệu sách từ file Excel!");
        fetchData();
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error?.response?.data?.detail || "Không thể tải file lên");
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsSingleAddMode(true);
    setEditingTitleGroup(null);
    setIsbn("");
    setTitle("");
    setMarketPrice("");
    setImageUrl(null);
    setLocalImageUri(null);
    setSelectedLocationId(null);
    setEditingCopies([]);
    setModalVisible(true);
  };

  const openEditGroupModal = (group: any) => {
    setIsSingleAddMode(false);
    setEditingTitleGroup(group.title);
    setTitle(group.title);
    setMarketPrice(group.market_price ? group.market_price.toString() : "");
    setImageUrl(group.image_url || null);
    setLocalImageUri(null);
    setSelectedLocationId(group.location_id || null);
    
    // Sort copies to show 'available' first
    const sortedCopies = [...group.copies].sort((a,b) => a.status.localeCompare(b.status));
    setEditingCopies(sortedCopies);
    
    setModalVisible(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const handleToggleCopyStatus = async (bookId: number, currentStatus: string) => {
    const newStatus = currentStatus === "available" ? "rented" : "available";
    try {
      // Optimitic update in UI Modal
      setEditingCopies(prev => prev.map(c => c.book_id === bookId ? {...c, status: newStatus} : c));
      await updateBook(bookId, { status: newStatus });
      fetchData(); // refresh in background
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái cuốn vật lý này.");
      // Revert if error
      setEditingCopies(prev => prev.map(c => c.book_id === bookId ? {...c, status: currentStatus} : c));
    }
  };

  const handleSave = async () => {
    if (!title || !marketPrice || (isSingleAddMode && !isbn)) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    let finalImageUrl = imageUrl;
    if (localImageUri) {
      try {
        const ext = localImageUri.split('.').pop() || 'tmp';
        finalImageUrl = await uploadImage(localImageUri, "image/jpeg", `upload.${ext}`);
      } catch (error) {
        Alert.alert("Lỗi", "Không thể tải ảnh lên Server");
        return;
      }
    }

    try {
      if (isSingleAddMode) {
        const payload = {
          isbn,
          title,
          market_price: parseFloat(marketPrice),
          image_url: finalImageUrl,
          location_id: selectedLocationId,
        };
        await createBook(payload);
      } else {
        // Edit Mode: update ALL copies in this group with Title, Price, Location, Image
        // If there are many copies, Loop or Promise.all.
        // Doing Promise.all for all editingCopies
        const updatePromises = editingCopies.map(copy => {
            const payload = {
                title, 
                market_price: parseFloat(marketPrice),
                image_url: finalImageUrl,
                location_id: selectedLocationId
            };
            return updateBook(copy.book_id, payload);
        });
        await Promise.all(updatePromises);
      }
      setModalVisible(false);
      fetchData(); 
    } catch (error: any) {
      const errDetail = error?.response?.data?.detail;
      Alert.alert("Lỗi", errDetail ? errDetail : "Không thể lưu dữ liệu!");
    }
  };

  const handleDeleteGroup = async (group: any) => {
    if (confirm(`Bạn có chắc chắn muốn xóa TẤT CẢ bản sao (${group.copies.length} cuốn) của Tựa sách "${group.title}" không?`)) {
      try {
        const deletePromises = group.copies.map((c: any) => deleteBook(c.book_id));
        await Promise.all(deletePromises);
        fetchData();
      } catch (error) {
        Alert.alert("Lỗi", "Không thể xóa tựa sách!");
      }
    }
  };

  const handleDeleteCopy = async (bookId: number) => {
    if (confirm("Chắc chắn xóa cuốn sách vật lý này?")) {
      try {
        await deleteBook(bookId);
        setEditingCopies(prev => prev.filter(c => c.book_id !== bookId));
        fetchData();
      } catch (error) {
        Alert.alert("Lỗi", "Lỗi xóa!");
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const totalCopies = item.copies.length;
    const availableCopies = item.copies.filter((c: any) => c.status === "available").length;
    const rentedCopies = item.copies.filter((c: any) => c.status === "rented").length;
    const locationName = item.location ? `${item.location.zone_name} - ${item.location.shelf_id}` : 'Hàng Chờ (Kho)';

    return (
      <View style={styles.tableRow}>
        <View style={{ width: 50, height: 60, marginRight: 15, backgroundColor: "#E5E7EB", borderRadius: 4, overflow: 'hidden' }}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url.startsWith('http') ? item.image_url : BASE_URL + item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        <Text style={[styles.cell, { flex: 2 }]} numberOfLines={2}>{item.title}</Text>
        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={{fontWeight: 'bold'}}>Tổng: {totalCopies}</Text>
          <Text style={{fontSize: 12, color: 'green'}}>{availableCopies} Sẵn sàng</Text>
          <Text style={{fontSize: 12, color: 'orange'}}>{rentedCopies} Đang mượn</Text>
        </View>
        <Text style={[styles.cell, { flex: 1.5 }]}>{locationName}</Text>
        <Text style={[styles.cell, { flex: 1 }]}>{item.market_price} đ</Text>
        <View style={styles.actionCell}>
          <TouchableOpacity style={styles.actionButton} onPress={() => openEditGroupModal(item)}>
            <Ionicons name="pencil" size={18} color="#80A1BA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteGroup(item)}>
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLocationSelect = () => {
    const selectedObj = locations.find(l => l.location_id === selectedLocationId);
    const label = selectedObj ? `${selectedObj.zone_name} - ${selectedObj.shelf_id}` : 'Hàng Chờ (Trong kho)';
    
    return (
      <View style={{zIndex: 1000}}>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowLocationSelect(!showLocationSelect)}>
           <Text style={styles.dropdownBtnText}>{label}</Text>
           <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
        {showLocationSelect && (
          <View style={styles.dropdownMenu}>
             <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectedLocationId(null); setShowLocationSelect(false); }}>
                 <Text style={styles.dropdownItemText}>Hàng Chờ (Trong kho)</Text>
             </TouchableOpacity>
             {locations.map(loc => (
                 <TouchableOpacity key={loc.location_id} style={styles.dropdownItem} onPress={() => { setSelectedLocationId(loc.location_id); setShowLocationSelect(false); }}>
                     <Text style={styles.dropdownItemText}>{loc.zone_name} - {loc.shelf_id}</Text>
                 </TouchableOpacity>
             ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>Quản lý Tựa Sách</Text>
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity style={[styles.addButton, {backgroundColor: '#10B981', marginRight: 10}]} onPress={handleImportExcel}>
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Nhập Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Thêm 1 Sách</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { width: 65 }]}></Text>
          <Text style={[styles.headerCell, { flex: 2 }]}>Tựa sách</Text>
          <Text style={[styles.headerCell, { flex: 2 }]}>Thống kê số lượng</Text>
          <Text style={[styles.headerCell, { flex: 1.5 }]}>Vị trí Kệ</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>Giá (VNĐ)</Text>
          <Text style={[styles.headerCell, { width: 80, textAlign: "center" }]}>Thao tác</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#80A1BA" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={books}
            keyExtractor={(item) => item.title}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", padding: 20, color: "#6B7280" }}>
                Chưa có sách nào trong thư viện.
              </Text>
            }
          />
        )}
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isSingleAddMode ? "Thêm mới 1 Sách Vật Lý" : "Cập nhật Tựa Sách (Hàng loạt)"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {isSingleAddMode && (
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>ISBN (Mã sách):</Text>
                  <TouchableOpacity onPress={generateISBN}>
                    <Text style={styles.generateText}>Tạo mã tự động ⚡</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.input} value={isbn} onChangeText={setIsbn} placeholder="VD: 978..." />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tựa Tiêu Đề:</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nhập tựa sách" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Giá trị (VNĐ):</Text>
              <TextInput style={styles.input} value={marketPrice} onChangeText={setMarketPrice} placeholder="VD: 100000" keyboardType="numeric" />
            </View>

            <View style={[styles.formGroup, {zIndex: 10}]}>
              <Text style={styles.label}>Vị Trí Lưu Trữ:</Text>
              {renderLocationSelect()}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ảnh Bìa:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                   <Ionicons name="cloud-upload-outline" size={20} color="#80A1BA" />
                   <Text style={{ color: '#80A1BA', marginLeft: 8, fontWeight: 'bold' }}>Chọn Tệp</Text>
                </TouchableOpacity>
                {localImageUri ? <Image source={{ uri: localImageUri }} style={styles.previewImg} /> : imageUrl ? <Image source={{ uri: BASE_URL + imageUrl }} style={styles.previewImg} /> : <Text style={{ marginLeft: 10, color: '#6B7280', fontStyle: 'italic', fontSize: 12 }}>Chưa có ảnh</Text>}
              </View>
            </View>

            {!isSingleAddMode && (
               <View style={[styles.formGroup, {borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 10}]}>
                  <Text style={[styles.label, {marginBottom: 10}]}>Danh sách bản vật lý (Có thể nhấn trạng thái để đổi ngay):</Text>
                  <ScrollView style={{maxHeight: 180, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8}}>
                     {editingCopies.map((copy: any) => (
                        <View key={copy.book_id} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB'}}>
                           <Text style={{fontSize: 13, color: '#374151', flex: 1}}>{copy.isbn}</Text>
                           <TouchableOpacity onPress={() => handleToggleCopyStatus(copy.book_id, copy.status)} style={{paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: copy.status === 'available' ? '#D1FAE5' : '#FEF3C7', marginRight: 10}}>
                               <Text style={{fontSize: 12, color: copy.status === 'available' ? '#065F46' : '#92400E', fontWeight: 'bold'}}>
                                   {copy.status}
                               </Text>
                           </TouchableOpacity>
                           <TouchableOpacity onPress={() => handleDeleteCopy(copy.book_id)}>
                               <Ionicons name="trash-outline" size={16} color="#EF4444" />
                           </TouchableOpacity>
                        </View>
                     ))}
                     {editingCopies.length === 0 && <Text style={{fontSize: 12, color: '#9CA3AF'}}>Không có bản vật lý nào.</Text>}
                  </ScrollView>
               </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Đóng</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Lưu Nhóm Tựa Sách</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1F2937" },
  addButton: { backgroundColor: "#80A1BA", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addButtonText: { color: "#FFFFFF", marginLeft: 8, fontWeight: "bold", fontSize: 14 },
  tableContainer: { backgroundColor: "#FFFFFF", borderRadius: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, flex: 1, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#F3F4F6", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: "#E5E7EB" },
  headerCell: { fontWeight: "bold", color: "#4B5563", fontSize: 14 },
  tableRow: { flexDirection: "row", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: "#F3F4F6", alignItems: "center" },
  cell: { color: "#1F2937", fontSize: 14, paddingRight: 8 },
  actionCell: { flexDirection: "row", width: 80, justifyContent: "center" },
  actionButton: { padding: 6, marginHorizontal: 4, backgroundColor: "#F3F4F6", borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#FFF", borderRadius: 12, padding: 24, width: 450, maxWidth: "90%", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: "#4B5563", fontWeight: "500", marginBottom: 8 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  generateText: { fontSize: 12, color: "#80A1BA", fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#1F2937" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, borderRadius: 8 },
  cancelBtnText: { color: "#6B7280", fontWeight: "600" },
  saveBtn: { backgroundColor: "#80A1BA", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: "#FFFFFF", fontWeight: "600" },
  uploadBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDFA", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#80A1BA" },
  previewImg: { width: 45, height: 60, marginLeft: 15, borderRadius: 4, borderWidth: 1, borderColor: "#E5E7EB" },
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF' },
  dropdownBtnText: { fontSize: 15, color: '#1F2937' },
  dropdownMenu: { position: 'absolute', top: 45, left: 0, right: 0, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, maxHeight: 150, zIndex: 9999 },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemText: { fontSize: 14, color: '#4B5563' }
});
