import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getLocations, createLocation, deleteLocation, BASE_URL } from "../services/api";
import * as DocumentPicker from 'expo-document-picker';

export default function StorageAndShelves() {
  const [titleGroups, setTitleGroups] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // States xếp kệ theo nhóm
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // States tạo kệ hàng loạt
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);
  const [bulkLocation, setBulkLocation] = useState({ zone_name: "", shelf_prefix: "", num_shelves: "1", num_levels: "1" });

  // Filter tab
  const [activeFilter, setActiveFilter] = useState<"waiting" | "all">("waiting");
  
  // Search & Category states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      // Build URL with search and category
      let url = `${BASE_URL}/api/books/title-groups?`;
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      if (selectedCategoryId) url += `category_id=${selectedCategoryId}&`;

      const groupsRes = await fetch(url);
      const groupsResp = await groupsRes.json();
      
      if (!groupsRes.ok) {
        setApiError(`API lỗi ${groupsRes.status}: ${groupsResp?.detail || 'Máy chủ đang khởi động lại, vui lòng thử lại sau 1 phút.'}`);
        setTitleGroups([]);
      } else {
        setTitleGroups(Array.isArray(groupsResp) ? groupsResp : []);
      }
      
      const locsData = await getLocations();
      setLocations(Array.isArray(locsData) ? locsData : []);

      // Fetch categories
      const catRes = await fetch(`${BASE_URL}/api/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      setApiError('Không thể kết nối đến máy chủ. Hãy kiểm tra kết nối mạng hoặc thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, selectedCategoryId]);

  const handleAssignGroup = async () => {
    if (!selectedGroup || !selectedLocationId) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn kệ muốn xếp sách.");
      return;
    }
    setSubmitting(true);
    try {
      const resp = await fetch(`${BASE_URL}/api/books/assign-by-title`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: selectedGroup.title, location_id: selectedLocationId })
      });
      const data = await resp.json();
      if (resp.ok) {
        Alert.alert("Thành công! ✅", data.message);
        setIsAssignModalOpen(false);
        setSelectedGroup(null);
        setSelectedLocationId(null);
        fetchData();
      } else {
        Alert.alert("Lỗi", data.detail || "Có lỗi xảy ra");
      }
    } catch (err) {
      Alert.alert("Lỗi kết nối", "Không thể kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkLocation.zone_name || !bulkLocation.shelf_prefix) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Tên Khu Vực và Tiền Tố Kệ.");
      return;
    }
    const numShelves = parseInt(bulkLocation.num_shelves) || 1;
    const numLevels = parseInt(bulkLocation.num_levels) || 1;
    try {
      setLoading(true);
      const promises = [];
      for (let s = 1; s <= numShelves; s++) {
        for (let l = 1; l <= numLevels; l++) {
          promises.push(createLocation({ zone_name: bulkLocation.zone_name, shelf_id: `${bulkLocation.shelf_prefix} ${s}`, level_number: l }));
        }
      }
      await Promise.all(promises);
      Alert.alert("Thành công", `Đã tạo ${promises.length} vị trí kệ!`);
      setIsBulkCreateModalOpen(false);
      setBulkLocation({ zone_name: "", shelf_prefix: "", num_shelves: "1", num_levels: "1" });
      fetchData();
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tạo kệ hàng loạt.");
      setLoading(false);
    }
  };

  const handleImportCSV = async () => {
    try {
      console.log("Đang mở cửa sổ chọn file...");
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Cho phép chọn tất cả các loại file để tránh bị trình duyệt chặn
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setLoading(true);

      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // Ưu tiên dùng đối tượng file gốc nếu có, nếu không mới fetch uri
        const fileToUpload = file.file || (await (await fetch(file.uri)).blob());
        formData.append('file', fileToUpload, file.name);
      } else {
        // Đối với Native (Android/iOS)
        // @ts-ignore
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'text/csv',
        });
      }

      const response = await axios.post(`${BASE_URL}/api/books/import-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        Alert.alert("Thành công! ✅", response.data.message);
        fetchData();
      } else {
        Alert.alert("Lỗi nhập file", "Không thể xử lý file này.");
      }
    } catch (error) {
      console.error("Lỗi Import:", error);
      Alert.alert("Lỗi kết nối", "Không thể gửi file lên máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = (id: number) => {
    Alert.alert("Xác nhận", "Kệ sách sẽ bị xóa. Sách trên kệ sẽ trở về Kệ Chờ.", [
      { text: "Bỏ qua", style: "cancel" },
      {
        text: "Xóa Kệ", style: "destructive",
        onPress: async () => {
          try { await deleteLocation(id); fetchData(); }
          catch { Alert.alert("Lỗi", "Không thể xóa kệ."); }
        }
      }
    ]);
  };

  const displayGroups = activeFilter === "waiting"
    ? titleGroups.filter(g => g.copies_waiting > 0)
    : titleGroups;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#FFF7DD' }}>
        <ActivityIndicator size="large" color="#80A1BA" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Đang tải dữ liệu từ máy chủ...</Text>
      </View>
    );
  }

  const renderVirtualMap = () => {
    // Nhóm locations theo Khu vực (Zone)
    const zones = Array.from(new Set(locations.map(l => l.zone_name))).sort();

    return (
      <View style={{ marginTop: 30 }}>
        <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>🗺️ Sơ đồ Kho sách ảo (Virtual Library Map)</Text>
        
        {zones.map(zone => (
          <View key={zone} style={styles.zoneContainer}>
            <View style={styles.zoneHeader}>
              <Ionicons name="map-outline" size={20} color="#fff" />
              <Text style={styles.zoneHeaderText}>{zone}</Text>
            </View>

            <View style={styles.zoneContent}>
              {/* Nhóm theo Kệ trong mỗi Khu */}
              {Array.from(new Set(locations.filter(l => l.zone_name === zone).map(l => l.shelf_id))).sort().map(shelfId => (
                <View key={shelfId} style={styles.shelfContainer}>
                  <Text style={styles.shelfLabel}>{shelfId}</Text>
                  
                  {/* Các tầng (Hàng) trong Kệ */}
                  {locations.filter(l => l.zone_name === zone && l.shelf_id === shelfId)
                    .sort((a, b) => b.level_number - a.level_number) // Tầng cao hiện ở trên
                    .map(loc => (
                      <View key={loc.location_id} style={styles.levelRow}>
                        <View style={styles.levelLabelContainer}>
                          <Text style={styles.levelLabel}>Hàng {loc.level_number}</Text>
                          <Text style={styles.capacityText}>{loc.book_count}/{loc.max_capacity}</Text>
                        </View>
                        
                        <View style={styles.shelfLineContainer}>
                          {/* Sách trên kệ */}
                          <View style={styles.booksOnLevel}>
                            {loc.unique_books && loc.unique_books.length > 0 ? (
                              loc.unique_books.map((ub: any, idx: number) => (
                                <View key={idx} style={styles.virtualBook}>
                                  <View style={styles.bookCoverMini}>
                                    {ub.image_url ? (
                                      <Image 
                                        source={{ uri: ub.image_url.startsWith('http') ? ub.image_url : BASE_URL + ub.image_url }} 
                                        style={styles.miniCoverImage} 
                                      />
                                    ) : (
                                      <Ionicons name="book" size={20} color="#9CA3AF" />
                                    )}
                                  </View>
                                  {/* Hiển thị số lượng có sẵn bên dưới */}
                                  <View style={styles.bookInfoBelow}>
                                    <Text style={styles.availableCountText}>SL: {ub.available_count}</Text>
                                    {ub.borrowed_count > 0 && (
                                      <Text style={styles.borrowedCountText}>(+{ub.borrowed_count} mượn)</Text>
                                    )}
                                  </View>
                                </View>
                              ))
                            ) : (
                              <Text style={styles.emptyLevelText}>Trống</Text>
                            )}
                          </View>
                          <View style={styles.shelfLine} />
                        </View>
                      </View>
                    ))}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#80A1BA" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Đang tải sơ đồ kho...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View>
          <Text style={styles.pageTitle}>Quản lý Kho & Sơ Đồ Kệ</Text>
          <Text style={styles.subtitle}>Thiết kế 5 Khu x 3 Kệ x 3 Tầng — Tối đa 50 cuốn/ngăn.</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity 
            style={[styles.createBtn, { backgroundColor: '#10B981' }]} 
            onPress={handleImportCSV}
          >
            <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Nhập File (CSV/Excel)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createBtn} onPress={fetchData}>
            <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Làm mới kho</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Category Bar */}
      <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
        <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E5E7EB' }}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, marginLeft: 10, fontSize: 14 }}
            placeholder="Tìm theo tên sách, tác giả hoặc ISBN..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E5E7EB' }}>
          <Ionicons name="filter-outline" size={20} color="#9CA3AF" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingLeft: 10 }}>
            <TouchableOpacity 
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: selectedCategoryId === null ? '#80A1BA' : 'transparent' }}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text style={{ color: selectedCategoryId === null ? '#fff' : '#4B5563', fontSize: 13, fontWeight: '600' }}>Tất cả</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat.category_id}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: selectedCategoryId === cat.category_id ? '#80A1BA' : 'transparent' }}
                onPress={() => setSelectedCategoryId(cat.category_id)}
              >
                <Text style={{ color: selectedCategoryId === cat.category_id ? '#fff' : '#4B5563', fontSize: 13, fontWeight: '600' }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Filter tabs (Giữ nguyên logic chờ xếp kệ) */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, activeFilter === "waiting" && styles.filterBtnActive]} onPress={() => setActiveFilter("waiting")}>
          <Ionicons name="time-outline" size={16} color={activeFilter === "waiting" ? "#fff" : "#6B7280"} />
          <Text style={[styles.filterText, activeFilter === "waiting" && styles.filterTextActive]}>
            Sách chờ xếp ({titleGroups.filter(g => g.copies_waiting > 0).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, activeFilter === "all" && styles.filterBtnActive]} onPress={() => setActiveFilter("all")}>
          <Ionicons name="grid-outline" size={16} color={activeFilter === "all" ? "#fff" : "#6B7280"} />
          <Text style={[styles.filterText, activeFilter === "all" && styles.filterTextActive]}>
            Xem Sơ Đồ Kho
          </Text>
        </TouchableOpacity>
      </View>

      {activeFilter === "waiting" ? (
        <View style={styles.waitingZone}>
          <Text style={styles.sectionTitle}>📦 Sách Chờ Lên Kệ</Text>
          <Text style={styles.sectionDesc}>Bấm vào sách để chọn vị trí xếp lên kệ.</Text>
          <View style={styles.booksGrid}>
            {displayGroups.length === 0 && <Text style={{ color: "#6B7280" }}>🎉 Đã xếp hết sách!</Text>}
            {displayGroups.map((group, idx) => (
              <TouchableOpacity key={idx} style={styles.bookCard} onPress={() => { setSelectedGroup(group); setIsAssignModalOpen(true); }}>
                {group.image_url ? (
                  <Image source={{ uri: group.image_url.startsWith('http') ? group.image_url : BASE_URL + group.image_url }} style={styles.bookImage} />
                ) : (
                  <View style={styles.bookImagePlaceholder}><Ionicons name="book-outline" size={30} color="#9CA3AF" /></View>
                )}
                <Text style={styles.bookTitle} numberOfLines={1}>{group.title}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>✍️ {group.author || 'Chưa cập nhật'}</Text>
                
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                  <View style={[styles.badgeTotal, { paddingHorizontal: 4 }]}>
                    <Text style={{ fontSize: 10, color: '#0369A1' }}>Tổng: {group.total_copies}</Text>
                  </View>
                  {group.available_count > 0 && (
                    <View style={[styles.badgeDone, { paddingHorizontal: 4 }]}>
                      <Text style={{ fontSize: 10, color: '#046C4E' }}>🟢 {group.available_count}</Text>
                    </View>
                  )}
                  {group.borrowed_count > 0 && (
                    <View style={[styles.badgeWaiting, { paddingHorizontal: 4 }]}>
                      <Text style={{ fontSize: 10, color: '#B45309' }}>🔴 {group.borrowed_count}</Text>
                    </View>
                  )}
                </View>

                {group.copies_waiting > 0 && (
                  <View style={[styles.badgeWaiting, { marginTop: 4 }]}>
                    <Text style={styles.badgeWaitingText}>Chờ xếp: {group.copies_waiting}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : renderVirtualMap()}

      <View style={{ height: 100 }} />

      {/* Modal Xếp kệ */}
      <Modal visible={isAssignModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn vị trí trên kệ</Text>
              <TouchableOpacity onPress={() => setIsAssignModalOpen(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <Text style={{ marginBottom: 15 }}>Sách: <Text style={{ fontWeight: 'bold' }}>{selectedGroup?.title}</Text> ({selectedGroup?.copies_waiting} cuốn)</Text>
            
            <ScrollView style={{ maxHeight: 400 }}>
              {locations.map(loc => {
                const isFull = loc.book_count >= loc.max_capacity;
                return (
                  <TouchableOpacity
                    key={loc.location_id}
                    disabled={isFull}
                    style={[styles.locationItem, selectedLocationId === loc.location_id && styles.locationItemActive, isFull && { opacity: 0.5 }]}
                    onPress={() => setSelectedLocationId(loc.location_id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[selectedLocationId === loc.location_id && { color: '#fff', fontWeight: 'bold' }]}>
                        {loc.zone_name} - {loc.shelf_id} - Tầng {loc.level_number}
                      </Text>
                      <Text style={[{ fontSize: 12, color: '#6B7280' }, selectedLocationId === loc.location_id && { color: '#fff' }]}>
                        Sức chứa: {loc.book_count}/{loc.max_capacity} cuốn {isFull && "(ĐÃ ĐẦY)"}
                      </Text>
                    </View>
                    {selectedLocationId === loc.location_id && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAssignGroup} disabled={submitting}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Xác Nhận Xếp Lên Kệ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  createBtn: { flexDirection: 'row', backgroundColor: '#80A1BA', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 10 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  filterBtnActive: { backgroundColor: '#80A1BA', borderColor: '#80A1BA' },
  filterText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  waitingZone: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  sectionDesc: { fontSize: 13, color: '#6B7280', marginBottom: 20, marginTop: 4 },
  booksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  bookCard: { width: 140, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  bookImage: { width: '100%', height: 160, borderRadius: 8 },
  bookImagePlaceholder: { width: '100%', height: 160, borderRadius: 8, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  bookTitle: { fontSize: 12, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
  badgeWaiting: { backgroundColor: '#FEF3C7', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
  badgeWaitingText: { color: '#B45309', fontSize: 10, fontWeight: 'bold' },

  // Virtual Map Styles
  zoneContainer: { marginBottom: 30, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  zoneHeader: { backgroundColor: '#80A1BA', padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  zoneHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  zoneContent: { padding: 20 },
  shelfContainer: { marginBottom: 25 },
  shelfLabel: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 15, backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  levelRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20 },
  levelLabelContainer: { width: 80, marginRight: 15, alignItems: 'flex-end' },
  levelLabel: { fontSize: 13, fontWeight: 'bold', color: '#6B7280' },
  capacityText: { fontSize: 10, color: '#9CA3AF' },
  shelfLineContainer: { flex: 1 },
  booksOnLevel: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, paddingBottom: 5, paddingLeft: 10 },
  virtualBook: { alignItems: 'center', width: 80, marginBottom: 5 },
  bookCoverMini: { width: 55, height: 80, backgroundColor: '#fff', borderRadius: 4, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  miniCoverImage: { width: '100%', height: '100%', borderRadius: 4 },
  bookInfoBelow: { marginTop: 8, alignItems: 'center' },
  availableCountText: { fontSize: 12, fontWeight: 'bold', color: '#111827' },
  borrowedCountText: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  shelfLine: { height: 6, backgroundColor: '#4B5563', borderRadius: 3, width: '100%', marginTop: 5 },
  emptyLevelText: { fontSize: 12, color: '#D1D5DB', fontStyle: 'italic', marginBottom: 10, paddingLeft: 10 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: 500, backgroundColor: "#FFF", borderRadius: 16, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  locationItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' },
  locationItemActive: { backgroundColor: '#80A1BA' },
  modalFooter: { marginTop: 20, alignItems: 'flex-end' },
  saveBtn: { backgroundColor: '#80A1BA', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
});
