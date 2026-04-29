import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getLocations, createLocation, deleteLocation, BASE_URL } from "../services/api";

export default function StorageAndShelves() {
  const [titleGroups, setTitleGroups] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsResp, locsData] = await Promise.all([
        fetch(`${BASE_URL}/api/books/title-groups`).then(r => r.json()),
        getLocations()
      ]);
      setTitleGroups(Array.isArray(groupsResp) ? groupsResp : []);
      setLocations(Array.isArray(locsData) ? locsData : []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#00A3AF" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View>
          <Text style={styles.pageTitle}>Quản lý Vị Trí & Lên Kệ Sách</Text>
          <Text style={styles.subtitle}>Xếp kệ theo nhóm đầu sách — 1 lần cho tất cả bản sao cùng tựa đề.</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setIsBulkCreateModalOpen(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Khởi Tạo Hàng Loạt</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, activeFilter === "waiting" && styles.filterBtnActive]} onPress={() => setActiveFilter("waiting")}>
          <Ionicons name="time-outline" size={16} color={activeFilter === "waiting" ? "#fff" : "#6B7280"} />
          <Text style={[styles.filterText, activeFilter === "waiting" && styles.filterTextActive]}>
            Chờ xếp kệ ({titleGroups.filter(g => g.copies_waiting > 0).length} đầu sách)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, activeFilter === "all" && styles.filterBtnActive]} onPress={() => setActiveFilter("all")}>
          <Ionicons name="library-outline" size={16} color={activeFilter === "all" ? "#fff" : "#6B7280"} />
          <Text style={[styles.filterText, activeFilter === "all" && styles.filterTextActive]}>
            Tất cả ({titleGroups.length} đầu sách)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title Groups Grid */}
      <View style={styles.waitingZone}>
        <Text style={styles.sectionTitle}>
          {activeFilter === "waiting" ? "📦 Sách Chờ Xếp Kệ" : "📚 Toàn bộ Đầu Sách"}
        </Text>
        <Text style={styles.sectionDesc}>
          Mỗi thẻ dưới đây đại diện cho 1 đầu sách. Bấm vào để xếp TẤT CẢ bản sao lên cùng một kệ ngay lập tức.
        </Text>

        <View style={styles.booksGrid}>
          {displayGroups.length === 0 && (
            <Text style={{ color: "#6B7280", fontStyle: "italic", padding: 10 }}>
              {activeFilter === "waiting" ? "🎉 Tất cả sách đã được xếp lên kệ!" : "Chưa có sách nào trong hệ thống."}
            </Text>
          )}
          {displayGroups.map((group, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.bookCard, group.copies_waiting === 0 && styles.bookCardDone]}
              onPress={() => {
                if (group.copies_waiting > 0) {
                  setSelectedGroup(group);
                  setIsAssignModalOpen(true);
                }
              }}
            >
              {group.image_url ? (
                <Image source={{ uri: group.image_url.startsWith('http') ? group.image_url : BASE_URL + group.image_url }} style={styles.bookImage} resizeMode="cover" />
              ) : (
                <View style={styles.bookImagePlaceholder}>
                  <Ionicons name="book-outline" size={30} color="#9CA3AF" />
                </View>
              )}

              <View style={{ marginTop: 8 }}>
                <Text style={styles.bookTitle} numberOfLines={2}>{group.title}</Text>

                {/* Số lượng bản sao */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <View style={styles.badgeTotal}>
                    <Text style={styles.badgeTotalText}>Tổng: {group.total_copies} bản</Text>
                  </View>
                  {group.copies_waiting > 0 && (
                    <View style={styles.badgeWaiting}>
                      <Text style={styles.badgeWaitingText}>⏳ Chờ: {group.copies_waiting}</Text>
                    </View>
                  )}
                  {group.copies_on_shelf > 0 && (
                    <View style={styles.badgeDone}>
                      <Text style={styles.badgeDoneText}>✅ Kệ: {group.copies_on_shelf}</Text>
                    </View>
                  )}
                </View>

                {/* Vị trí đã xếp */}
                {group.location_summary && group.location_summary.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    {group.location_summary.map((ls: any, i: number) => (
                      <Text key={i} style={styles.locationSummaryText}>
                        📍 {ls.location}: {ls.count} bản
                      </Text>
                    ))}
                  </View>
                )}

                {group.copies_waiting > 0 && (
                  <View style={[styles.badgeWaiting, { marginTop: 8, alignItems: 'center' }]}>
                    <Text style={styles.badgeWaitingText}>Bấm để xếp {group.copies_waiting} bản ↑</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Danh sách kệ hiện có */}
      <View style={[styles.waitingZone, { marginTop: 30 }]}>
        <Text style={styles.sectionTitle}>Các Khu Vực & Kệ Hiện Có</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 15 }}>
          {locations.map((loc) => (
            <View key={loc.location_id} style={styles.locationTag}>
              <Ionicons name="albums-outline" size={18} color="#00A3AF" />
              <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#1F2937' }}>Khu {loc.zone_name}</Text>
              <Text style={{ marginLeft: 8, color: '#4B5563' }}>| Kệ: {loc.shelf_id}</Text>
              {loc.level_number && <Text style={{ marginLeft: 8, color: '#6B7280' }}>- Tầng: {loc.level_number}</Text>}
              <TouchableOpacity style={{ marginLeft: 15, padding: 4 }} onPress={() => handleDeleteLocation(loc.location_id)}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          {locations.length === 0 && <Text style={{ color: '#6B7280' }}>Chưa có dữ liệu gốc về Kệ sách, vui lòng tạo mới.</Text>}
        </View>
      </View>

      <View style={{ height: 100 }} />

      {/* MODAL 1: Xếp kệ theo nhóm */}
      <Modal visible={isAssignModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xếp Kệ Hàng Loạt</Text>
              <TouchableOpacity onPress={() => { setIsAssignModalOpen(false); setSelectedLocationId(null); }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedGroup && (
              <View style={{ backgroundColor: '#F0FDF4', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#86EFAC' }}>
                <Text style={{ fontWeight: 'bold', color: '#166534', fontSize: 16 }}>{selectedGroup.title}</Text>
                <Text style={{ color: '#166534', marginTop: 5 }}>
                  🎯 Sẽ xếp <Text style={{ fontWeight: 'bold' }}>{selectedGroup.copies_waiting} bản sao</Text> lên cùng 1 vị trí kệ bên dưới.
                </Text>
              </View>
            )}

            <Text style={{ fontWeight: 'bold', marginBottom: 10, color: '#4B5563' }}>Chọn Kệ Thực Tế:</Text>
            <ScrollView style={{ maxHeight: 220, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8 }} nestedScrollEnabled>
              {locations.length === 0 && <Text style={{ color: 'red', padding: 10 }}>Chưa có kệ nào. Vui lòng tạo kệ trước.</Text>}
              {locations.map(loc => (
                <TouchableOpacity
                  key={loc.location_id}
                  style={[styles.locationItem, selectedLocationId === loc.location_id && styles.locationItemActive]}
                  onPress={() => setSelectedLocationId(loc.location_id)}
                >
                  <Ionicons name="albums-outline" size={16} color={selectedLocationId === loc.location_id ? "#fff" : "#00A3AF"} />
                  <Text style={[{ marginLeft: 8 }, selectedLocationId === loc.location_id ? { color: '#fff', fontWeight: 'bold' } : { color: '#374151' }]}>
                    Khu {loc.zone_name} - Kệ {loc.shelf_id} {loc.level_number ? `(Tầng ${loc.level_number})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAssignModalOpen(false)}>
                <Text style={{ color: '#4B5563', fontWeight: 'bold' }}>Hủy Bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, submitting && { opacity: 0.6 }]} onPress={handleAssignGroup} disabled={submitting}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {submitting ? "Đang xếp..." : `Xếp ${selectedGroup?.copies_waiting || 0} Bản Lên Kệ`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Tạo kệ hàng loạt */}
      <Modal visible={isBulkCreateModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phát Sinh Kệ Hàng Loạt</Text>
              <TouchableOpacity onPress={() => setIsBulkCreateModalOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#6B7280', marginBottom: 20, fontSize: 13 }}>
              Ví dụ: nhập "Thiếu nhi", "Tủ", 2 kệ, 3 tầng → hệ thống sinh ra 6 vị trí: Tủ 1 Tầng 1 ... Tủ 2 Tầng 3.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên Khu Vực*</Text>
              <TextInput style={styles.input} placeholder="VD: Thiếu nhi, Đời sống" value={bulkLocation.zone_name} onChangeText={(t) => setBulkLocation({ ...bulkLocation, zone_name: t })} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Tiền Tố Kệ*</Text>
                <TextInput style={styles.input} placeholder="VD: Kệ, Tủ" value={bulkLocation.shelf_prefix} onChangeText={(t) => setBulkLocation({ ...bulkLocation, shelf_prefix: t })} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Số Tủ/Kệ</Text>
                <TextInput style={styles.input} placeholder="10" keyboardType="numeric" value={bulkLocation.num_shelves} onChangeText={(t) => setBulkLocation({ ...bulkLocation, num_shelves: t })} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Số Tầng mỗi Kệ</Text>
                <TextInput style={styles.input} placeholder="5" keyboardType="numeric" value={bulkLocation.num_levels} onChangeText={(t) => setBulkLocation({ ...bulkLocation, num_levels: t })} />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsBulkCreateModalOpen(false)}>
                <Text style={{ color: '#4B5563', fontWeight: 'bold' }}>Hủy Bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleBulkCreate}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Chạy Lệnh Sinh Vị Trí</Text>
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
  pageTitle: { fontSize: 26, fontWeight: "bold", color: "#1F2937", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#6B7280" },
  createBtn: { flexDirection: 'row', backgroundColor: '#00A3AF', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },

  filterRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterBtnActive: { backgroundColor: '#00A3AF', borderColor: '#00A3AF' },
  filterText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterTextActive: { color: '#fff' },

  waitingZone: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  booksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },

  bookCard: { width: 175, backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', padding: 10 },
  bookCardDone: { opacity: 0.65, borderColor: '#D1FAE5' },
  bookImage: { width: '100%', height: 160, borderRadius: 6, backgroundColor: '#E5E7EB' },
  bookImagePlaceholder: { width: '100%', height: 160, borderRadius: 6, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  bookTitle: { fontSize: 13, fontWeight: 'bold', color: '#1F2937' },

  badgeTotal: { backgroundColor: '#E0F2FE', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  badgeTotalText: { color: '#0369A1', fontSize: 11, fontWeight: '600' },
  badgeWaiting: { backgroundColor: '#FEF3C7', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  badgeWaitingText: { color: '#B45309', fontSize: 11, fontWeight: '600' },
  badgeDone: { backgroundColor: '#DEF7EC', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  badgeDoneText: { color: '#046C4E', fontSize: 11, fontWeight: '600' },
  locationSummaryText: { fontSize: 11, color: '#374151', marginTop: 2 },

  locationTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: 620, maxWidth: "90%", backgroundColor: "#FFF", borderRadius: 12, padding: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  modalFooter: { flexDirection: "row", justifyContent: "flex-end", marginTop: 25, gap: 10 },
  locationItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  locationItemActive: { backgroundColor: '#00A3AF', borderColor: '#007A83' },

  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: "#F9FAFB", color: "#111827" },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: "#E5E7EB" },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: "#00A3AF" },
});
