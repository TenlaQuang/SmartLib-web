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
  ScrollView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { getBooks, createBook, updateBook, deleteBook, uploadImage, getLocations, getCategories, importBooksExcel, BASE_URL } from "../services/api";
import BookCard from "../components/BookCard";

export default function BookManagementPage() {
  const [books, setBooks] = useState<any[]>([]); // Sách hiện tại
  const [totalBooks, setTotalBooks] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 20;

  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isSingleAddMode, setIsSingleAddMode] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);

  // Form State
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  
  // Location Dropdown State
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [status, setStatus] = useState("available"); // Trạng thái sách

  const fetchInitialData = async () => {
    try {
      const [locData, catData] = await Promise.all([getLocations(), getCategories()]);
      setLocations(locData);
      setCategories(catData);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchData = async (currentPage = page, currentSearch = searchQuery) => {
    setLoading(true);
    try {
      const result = await getBooks(currentPage, pageSize, currentSearch);
      if (result && result.data) {
        setBooks(result.data);
        setTotalBooks(result.total);
      } else {
        setBooks(Array.isArray(result) ? result : []);
      }
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
    fetchInitialData();
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
    setEditingBookId(null);
    setIsbn("");
    setTitle("");
    setMarketPrice("");
    setDescription("");
    setAuthor("");
    setPages("");
    setCategoryId(null);
    setImageUrl(null);
    setLocalImageUri(null);
    setSelectedLocationId(null);
    setStatus("available");
    setModalVisible(true);
  };

  const openEditBookModal = (book: any) => {
    setIsSingleAddMode(false);
    setEditingBookId(book.book_id);
    setIsbn(book.isbn || "");
    setTitle(book.title);
    setMarketPrice(book.market_price ? book.market_price.toString() : "");
    setDescription(book.description || "");
    setAuthor(book.author || "");
    setPages(book.pages ? book.pages.toString() : "");
    setCategoryId(book.category_id || null);
    setImageUrl(book.image_url || null);
    setLocalImageUri(null);
    setSelectedLocationId(book.location_id || null);
    setStatus(book.status || "available");
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
      const payload = {
        isbn,
        title,
        author,
        category_id: categoryId,
        pages: pages ? parseInt(pages) : null,
        market_price: parseFloat(marketPrice),
        description,
        image_url: finalImageUrl,
        location_id: selectedLocationId,
        status: status
      };

      if (isSingleAddMode) {
        await createBook(payload);
      } else if (editingBookId) {
        await updateBook(editingBookId, payload);
      }

      setModalVisible(false);
      fetchData(); 
    } catch (error: any) {
      const errDetail = error?.response?.data?.detail;
      Alert.alert("Lỗi", errDetail ? errDetail : "Không thể lưu dữ liệu!");
    }
  };

  const handleDeleteBook = async () => {
    if (!editingBookId) return;
    if (confirm("Chắc chắn xóa cuốn sách này khỏi hệ thống?")) {
      try {
        await deleteBook(editingBookId);
        setModalVisible(false);
        fetchData();
      } catch (error) {
        Alert.alert("Lỗi", "Không thể xóa tựa sách!");
      }
    }
  };

  // renderItem cũ đã bị xoá để chuyển sang dùng BookCard dạng lưới

  const renderCategorySelect = () => {
    const selectedObj = categories.find(c => c.category_id === categoryId);
    const label = selectedObj ? selectedObj.name : 'Chọn Thể Loại';
    
    return (
      <View style={{zIndex: 1000}}>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowCategorySelect(!showCategorySelect)}>
           <Text style={styles.dropdownBtnText}>{label}</Text>
           <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
        {showCategorySelect && (
          <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true}>
             {categories.map(cat => (
                 <TouchableOpacity key={cat.category_id} style={styles.dropdownItem} onPress={() => { setCategoryId(cat.category_id); setShowCategorySelect(false); }}>
                     <Text style={styles.dropdownItemText}>{cat.name}</Text>
                 </TouchableOpacity>
             ))}
          </ScrollView>
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

      {/* Thanh Tìm Kiếm */}
      <View style={{ flexDirection: 'row', marginBottom: 15 }}>
         <TextInput 
           style={[styles.input, { flex: 1, backgroundColor: '#FFF' }]} 
           placeholder="Tìm kiếm sách theo tên hoặc mã ISBN..."
           value={searchQuery}
           onChangeText={setSearchQuery}
           onSubmitEditing={() => { setPage(1); fetchData(1, searchQuery); }}
         />
         <TouchableOpacity 
           style={[styles.addButton, { marginLeft: 10 }]} 
           onPress={() => { setPage(1); fetchData(1, searchQuery); }}
         >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Tìm</Text>
         </TouchableOpacity>
      </View>

      <View style={[styles.tableContainer, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 }]}>
        {loading ? (
          <ActivityIndicator size="large" color="#80A1BA" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={books}
            keyExtractor={(item) => item.book_id.toString()}
            numColumns={Platform.OS === 'web' ? 4 : 2}
            key={Platform.OS === 'web' ? 'grid-4' : 'grid-2'}
            renderItem={({ item }) => (
              <View style={{ flex: 1, margin: 5, maxWidth: Platform.OS === 'web' ? '25%' : '50%' }}>
                <BookCard book={item} onPress={() => openEditBookModal(item)} />
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", padding: 20, color: "#6B7280" }}>
                Chưa có sách nào trong thư viện.
              </Text>
            }
          />
        )}
      </View>

      {/* Phân Trang (Pagination) */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 }}>
          <TouchableOpacity disabled={page === 1} onPress={() => { setPage(p => p - 1); fetchData(page - 1); }} style={{ padding: 10, opacity: page === 1 ? 0.5 : 1 }}>
             <Ionicons name="chevron-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text style={{ marginHorizontal: 20, fontSize: 16, fontWeight: 'bold' }}>Trang {page} / {Math.ceil(totalBooks / pageSize) || 1}</Text>
          <TouchableOpacity disabled={page >= Math.ceil(totalBooks / pageSize)} onPress={() => { setPage(p => p + 1); fetchData(page + 1); }} style={{ padding: 10, opacity: page >= Math.ceil(totalBooks / pageSize) ? 0.5 : 1 }}>
             <Ionicons name="chevron-forward" size={24} color="#4B5563" />
          </TouchableOpacity>
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

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>ISBN (Mã sách):</Text>
                <TouchableOpacity onPress={generateISBN}>
                  <Text style={styles.generateText}>Tạo mã tự động ⚡</Text>
                </TouchableOpacity>
              </View>
              <TextInput style={styles.input} value={isbn} onChangeText={setIsbn} placeholder="VD: 978..." />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tựa Tiêu Đề:</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nhập tựa sách" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tác giả:</Text>
              <TextInput style={styles.input} value={author} onChangeText={setAuthor} placeholder="VD: Nam Cao" />
            </View>

            <View style={[styles.formGroup, {zIndex: 10}]}>
              <Text style={styles.label}>Thể loại Sách:</Text>
              {renderCategorySelect()}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Giá trị (VNĐ) <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput style={styles.input} value={marketPrice} onChangeText={setMarketPrice} placeholder="VD: 100000" keyboardType="numeric" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Số trang:</Text>
                <TextInput style={styles.input} value={pages} onChangeText={setPages} placeholder="VD: 300" keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mô tả nội dung sách:</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Nhập tóm tắt..." multiline />
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
              <View style={styles.formGroup}>
                <Text style={styles.label}>Trạng thái (Khả dụng / Đang mượn):</Text>
                <View style={{ flexDirection: 'row', marginTop: 5 }}>
                  <TouchableOpacity 
                    style={[styles.statusBtn, status === "available" && styles.statusBtnActive]}
                    onPress={() => setStatus("available")}
                  >
                    <Text style={{ color: status === "available" ? '#FFF' : '#374151', fontWeight: 'bold' }}>Sẵn sàng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.statusBtn, status === "rented" && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}
                    onPress={() => setStatus("rented")}
                  >
                    <Text style={{ color: status === "rented" ? '#FFF' : '#374151', fontWeight: 'bold' }}>Đang mượn</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={[styles.modalActions, { justifyContent: !isSingleAddMode ? 'space-between' : 'flex-end' }]}>
              {!isSingleAddMode && (
                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: '#FEE2E2' }]} onPress={handleDeleteBook}>
                  <Text style={[styles.cancelBtnText, { color: '#EF4444' }]}>Xoá sách này</Text>
                </TouchableOpacity>
              )}
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Đóng</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Lưu Lại</Text></TouchableOpacity>
              </View>
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
  dropdownItemText: { fontSize: 14, color: '#4B5563' },
  statusBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', marginRight: 10 },
  statusBtnActive: { backgroundColor: '#10B981', borderColor: '#10B981' }
});
