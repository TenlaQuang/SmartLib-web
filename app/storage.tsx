import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getLocations, createLocation, deleteLocation, BASE_URL } from "../services/api";
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

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
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      let url = `${BASE_URL}/api/books/title-groups?`;
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      if (selectedCategoryId) url += `category_id=${selectedCategoryId}&`;

      const groupsRes = await fetch(url);
      const groupsResp = await groupsRes.json();
      
      if (!groupsRes.ok) {
        setApiError(`API lỗi ${groupsRes.status}: ${groupsResp?.detail || 'Máy chủ đang khởi động lại...'}`);
        setTitleGroups([]);
      } else {
        setTitleGroups(Array.isArray(groupsResp) ? groupsResp : []);
      }
      
      const locsData = await getLocations();
      setLocations(Array.isArray(locsData) ? locsData : []);

      const catRes = await fetch(`${BASE_URL}/api/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      setApiError('Không thể kết nối đến máy chủ.');
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
        Alert.alert("Thành công", data.message);
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

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (result.canceled) return;

      const file = result.assets[0];
      const formData = new FormData();
      
      // Xử lý đúng chuẩn cho Expo Web
      if (Platform.OS === 'web') {
        const res = await fetch(file.uri);
        const blob = await res.blob();
        formData.append('file', blob, file.name);
      } else {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'text/csv'
        } as any);
      }

      setLoading(true);
      // Sử dụng fetch gốc để trình duyệt tự tạo Header Boundary (tránh lỗi 422 của Axios)
      const res = await fetch(`${BASE_URL}/api/books/import-csv`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error("Tải file thất bại (422/500)");
      }
      
      const data = await res.json();
      Alert.alert("Thành công", data.message);
      fetchData();
    } catch (error: any) {
      Alert.alert("Lỗi Import", error.response?.data?.detail || "Không thể import file.");
    } finally {
      setLoading(false);
    }
  };

  const renderVirtualMap = () => {
    const zones = Array.from(new Set(locations.map(l => l.zone_name))).sort();
    if (!selectedZone && zones.length > 0) setSelectedZone(zones[0]);

    return (
      <View style={{ marginTop: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
          {zones.map(zone => (
            <TouchableOpacity 
              key={zone}
              style={[styles.zoneTab, selectedZone === zone && styles.zoneTabActive]}
              onPress={() => setSelectedZone(zone)}
            >
              <Text style={[styles.zoneTabText, selectedZone === zone && styles.zoneTabTextActive]}>{zone}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {locations.filter(l => l.zone_name === selectedZone)
          .reduce((acc: any[], loc) => {
            const shelf = acc.find(s => s.shelf_id === loc.shelf_id);
            if (shelf) shelf.levels.push(loc);
            else acc.push({ shelf_id: loc.shelf_id, levels: [loc] });
            return acc;
          }, [])
          .sort((a, b) => a.shelf_id.localeCompare(b.shelf_id))
          .map(shelf => (
            <View key={shelf.shelf_id} style={styles.shelfContainer}>
              <View style={styles.shelfHeader}>
                <Ionicons name="layers-outline" size={18} color="#80A1BA" />
                <Text style={styles.shelfTitle}>{shelf.shelf_id}</Text>
              </View>
              
              {shelf.levels.sort((a: any, b: any) => b.level_number - a.level_number).map((loc: any) => (
                <View key={loc.location_id} style={styles.levelRow}>
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelLabel}>Tầng {loc.level_number}</Text>
                    <Text style={styles.levelCount}>{loc.book_count} cuốn</Text>
                  </View>
                  
                  <View style={styles.shelfPlank}>
                    <View style={styles.booksOnShelf}>
                      {loc.unique_books && loc.unique_books.length > 0 ? (
                        loc.unique_books.map((ub: any, idx: number) => (
                          <View key={idx} style={styles.bookItem}>
                            <View style={styles.bookCover}>
                              {ub.image_url ? (
                                <Image source={{ uri: ub.image_url.startsWith('http') ? ub.image_url : BASE_URL + ub.image_url }} style={styles.coverImg} />
                              ) : (
                                <Ionicons name="book" size={20} color="#9CA3AF" />
                              )}
                            </View>
                            <Text style={styles.bookQty}>SL: {ub.total_copies}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.emptyShelf}>Trống</Text>
                      )}
                    </View>
                    <View style={styles.shelfWood} />
                  </View>
                </View>
              ))}
            </View>
          ))}
      </View>
    );
  };

  if (loading && titleGroups.length === 0) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#80A1BA" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  const displayGroups = activeFilter === "waiting" ? titleGroups.filter(g => g.copies_waiting > 0) : titleGroups;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Sơ đồ Kho sách</Text>
          <Text style={styles.subtitle}>Quản lý vị trí và số lượng thực tế trên kệ.</Text>
        </View>
        <TouchableOpacity style={styles.importBtn} onPress={handleImportCSV}>
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.importBtnText}>Nhập File</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeFilter === "waiting" && styles.tabActive]} onPress={() => setActiveFilter("waiting")}>
          <Text style={[styles.tabText, activeFilter === "waiting" && styles.tabTextActive]}>Chờ xếp kệ ({titleGroups.filter(g => g.copies_waiting > 0).length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeFilter === "all" && styles.tabActive]} onPress={() => setActiveFilter("all")}>
          <Text style={[styles.tabText, activeFilter === "all" && styles.tabTextActive]}>Sơ đồ kệ sách</Text>
        </TouchableOpacity>
      </View>

      {activeFilter === "waiting" ? (
        <View style={styles.grid}>
          {displayGroups.map((group, idx) => (
            <TouchableOpacity key={idx} style={styles.card} onPress={() => { setSelectedGroup(group); setIsAssignModalOpen(true); }}>
              <Image source={{ uri: group.image_url }} style={styles.cardImg} />
              <Text style={styles.cardTitle} numberOfLines={1}>{group.title}</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>Chờ: {group.copies_waiting}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : renderVirtualMap()}

      <Modal visible={isAssignModalOpen} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalMain}>
            <Text style={styles.modalTitle}>Xếp kệ: {selectedGroup?.title}</Text>
            <ScrollView style={{ maxHeight: 300, marginVertical: 15 }}>
              {locations.map(loc => (
                <TouchableOpacity key={loc.location_id} style={[styles.locPick, selectedLocationId === loc.location_id && styles.locPickActive]} onPress={() => setSelectedLocationId(loc.location_id)}>
                  <Text style={selectedLocationId === loc.location_id && {color: '#fff'}}>{loc.zone_name} - {loc.shelf_id} - Tầng {loc.level_number} ({loc.book_count}/{loc.max_capacity})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAssignModalOpen(false)}><Text>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAssignGroup}><Text style={{color:'#fff'}}>Xác nhận</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 15 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280' },
  importBtn: { flexDirection: 'row', backgroundColor: '#80A1BA', padding: 10, borderRadius: 8, alignItems: 'center', gap: 8 },
  importBtnText: { color: '#fff', fontWeight: 'bold' },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  tab: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#E5E7EB' },
  tabActive: { backgroundColor: '#80A1BA' },
  tabText: { fontSize: 13, color: '#4B5563' },
  tabTextActive: { color: '#fff', fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '31%', backgroundColor: '#fff', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardImg: { width: '100%', height: 120, borderRadius: 6 },
  cardTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 5 },
  cardBadge: { backgroundColor: '#FEF3C7', padding: 2, borderRadius: 4, marginTop: 4 },
  cardBadgeText: { color: '#B45309', fontSize: 10, textAlign: 'center' },
  zoneTab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, marginRight: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  zoneTabActive: { backgroundColor: '#80A1BA', borderColor: '#80A1BA' },
  zoneTabText: { color: '#4B5563', fontWeight: 'bold' },
  zoneTabTextActive: { color: '#fff' },
  shelfContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
  shelfHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  shelfTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  levelRow: { flexDirection: 'row', marginBottom: 20 },
  levelInfo: { width: 70, justifyContent: 'center' },
  levelLabel: { fontSize: 12, fontWeight: 'bold', color: '#4B5563' },
  levelCount: { fontSize: 10, color: '#9CA3AF' },
  shelfPlank: { flex: 1 },
  booksOnShelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 5 },
  bookItem: { alignItems: 'center', width: 50 },
  bookCover: { width: 45, height: 65, backgroundColor: '#fff', borderRadius: 3, elevation: 3, shadowOpacity: 0.1, borderWidth: 0.5, borderColor: '#E5E7EB' },
  coverImg: { width: '100%', height: '100%', borderRadius: 3 },
  bookQty: { fontSize: 9, fontWeight: 'bold', marginTop: 3, color: '#111827' },
  shelfWood: { height: 4, backgroundColor: '#4B5563', borderRadius: 2 },
  emptyShelf: { fontSize: 11, color: '#D1D5DB', fontStyle: 'italic' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalMain: { width: '90%', backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  locPick: { padding: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  locPickActive: { backgroundColor: '#80A1BA' },
  cancelBtn: { padding: 10 },
  confirmBtn: { backgroundColor: '#80A1BA', padding: 10, borderRadius: 8 }
});
