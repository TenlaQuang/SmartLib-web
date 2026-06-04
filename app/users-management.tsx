import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BASE_URL } from "../services/api";

export default function UsersManagement() {
   const [users, setUsers] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   
   // Modals
   const [showEditModal, setShowEditModal] = useState(false);
   const [selectedUser, setSelectedUser] = useState<any>(null);
   
   // Form chỉnh sửa
   const [editForm, setEditForm] = useState({
      full_name: "",
      email: "",
      phone_number: "",
      address: "",
      status: ""
   });

   const fetchUsers = async () => {
      setLoading(true);
      try {
         const resp = await fetch(`${BASE_URL}/api/users`);
         if (resp.ok) {
            setUsers(await resp.json());
         }
      } catch (error) {
         console.error("Fetch users error:", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchUsers();
   }, []);

   const handleRemindNFC = async (userId: number) => {
      try {
         const resp = await fetch(`${BASE_URL}/api/users/${userId}/remind-nfc`, { method: "POST" });
         if (resp.ok) {
            Alert.alert("Thành công", "Đã gửi email nhắc nhở nhận thẻ!");
         } else {
            const data = await resp.json();
            Alert.alert("Lỗi", data.detail || "Không thể gửi email");
         }
      } catch (e) {
         Alert.alert("Lỗi", "Không thể kết nối đến máy chủ");
      }
   };

   const handleLockNFC = (user: any) => {
      Alert.alert(
         "Xác nhận khóa thẻ",
         `Bạn có chắc chắn muốn khóa thẻ NFC của ${user.full_name}? Sinh viên sẽ nhận được email thông báo và không thể dùng thẻ này nữa.`,
         [
            { text: "Hủy", style: "cancel" },
            { 
               text: "Khóa Thẻ", 
               style: "destructive",
               onPress: async () => {
                  try {
                     const resp = await fetch(`${BASE_URL}/api/users/${user.user_id}/lock-nfc`, { method: "POST" });
                     if (resp.ok) {
                        Alert.alert("Thành công", "Đã khóa thẻ thành công!");
                        fetchUsers();
                     } else {
                        const data = await resp.json();
                        Alert.alert("Lỗi", data.detail);
                     }
                  } catch (e) {
                     Alert.alert("Lỗi", "Không thể kết nối");
                  }
               }
            }
         ]
      );
   };

   const handleDeleteUser = (user: any) => {
      Alert.alert(
         "Xóa người dùng",
         `Bạn có chắc muốn xóa sinh viên ${user.full_name} khỏi hệ thống? Hành động này không thể hoàn tác.`,
         [
            { text: "Hủy", style: "cancel" },
            { 
               text: "Xóa", 
               style: "destructive",
               onPress: async () => {
                  try {
                     const resp = await fetch(`${BASE_URL}/api/users/${user.user_id}`, { method: "DELETE" });
                     if (resp.ok) {
                        Alert.alert("Thành công", "Đề xóa sinh viên thành công!");
                        fetchUsers();
                     } else {
                        const data = await resp.json();
                        Alert.alert("Lỗi", data.detail);
                     }
                  } catch (e) {
                     Alert.alert("Lỗi", "Không thể kết nối");
                  }
               }
            }
         ]
      );
   };

   const openEditModal = (user: any) => {
      setSelectedUser(user);
      setEditForm({
         full_name: user.full_name,
         email: user.email,
         phone_number: user.phone_number || "",
         address: user.address || "",
         status: user.status
      });
      setShowEditModal(true);
   };

   const submitUpdateUser = async () => {
      try {
         const resp = await fetch(`${BASE_URL}/api/users/${selectedUser.user_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm)
         });
         if (resp.ok) {
            Alert.alert("Thành công", "Đã cập nhật thông tin thành công!");
            setShowEditModal(false);
            fetchUsers();
         } else {
            const data = await resp.json();
            Alert.alert("Lỗi", data.detail);
         }
      } catch (e) {
         Alert.alert("Lỗi", "Không thể kết nối");
      }
   };

   const filteredUsers = (list: any[]) =>
      list.filter(u =>
         u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.user_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );

   const usersWithNFC = filteredUsers(users.filter(u => u.status === 'active'));
   const usersWithoutNFC = filteredUsers(users.filter(u => u.status === 'pending_nfc'));
   const usersLocked = filteredUsers(users.filter(u => u.status === 'locked'));

   return (
      <View style={styles.container}>
         <View style={styles.header}>
            <Text style={styles.headerTitle}>Quản lý Sinh Viên</Text>
         </View>

         {/* Thanh tìm kiếm */}
         <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={20} color="#80A1BA" style={{ marginRight: 10 }} />
            <TextInput
               style={styles.searchInput}
               placeholder="Tìm kiếm theo tên, mã SV, email..."
               placeholderTextColor="#9CA3AF"
               value={searchQuery}
               onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
               <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
               </TouchableOpacity>
            )}
         </View>

         {loading ? <ActivityIndicator size="large" color="#80A1BA" style={{ marginTop: 20 }} /> : (
            <ScrollView style={{ flex: 1 }}>
               {/* Section: Active Users */}
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Đang hoạt động (Thẻ Active)</Text>
                  {usersWithNFC.map(user => (
                     <View key={user.user_id} style={styles.userCard}>
                        <View style={styles.userInfo}>
                           <View style={styles.avatar}><Text style={styles.avatarText}>{user.full_name[0]}</Text></View>
                           <View>
                              <Text style={styles.userName}>{user.full_name}</Text>
                              <Text style={styles.userCode}>{user.user_code} - {user.email}</Text>
                           </View>
                        </View>
                        <View style={{flexDirection: 'row', gap: 10}}>
                           <View style={styles.nfcBadge}>
                              <Ionicons name="card" size={16} color="#046C4E" />
                              <Text style={{color: '#046C4E', fontSize: 12, marginLeft: 5}}>{user.nfc_tag_id}</Text>
                           </View>
                           <TouchableOpacity onPress={() => openEditModal(user)} style={styles.actionBtn}>
                              <Ionicons name="create-outline" size={20} color="#80A1BA" />
                           </TouchableOpacity>
                           <TouchableOpacity onPress={() => handleLockNFC(user)} style={styles.actionBtn}>
                              <Ionicons name="lock-closed-outline" size={20} color="#EF4444" />
                           </TouchableOpacity>
                           <TouchableOpacity onPress={() => handleDeleteUser(user)} style={styles.actionBtn}>
                              <Ionicons name="trash-outline" size={20} color="#EF4444" />
                           </TouchableOpacity>
                        </View>
                     </View>
                  ))}
                  {usersWithNFC.length === 0 && <Text style={{color: '#9CA3AF'}}>Chưa có người dùng nào</Text>}
               </View>

               {/* Section: Pending Users */}
               <View style={[styles.section, { borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 20 }]}>
                  <Text style={styles.sectionTitle}>Chờ nhận thẻ (pending_nfc)</Text>
                  {usersWithoutNFC.map(user => (
                     <View key={user.user_id} style={[styles.userCard, { backgroundColor: '#FEF2F2' }]}>
                        <View style={styles.userInfo}>
                           <View style={[styles.avatar, { backgroundColor: '#FCA5A5' }]}><Text style={styles.avatarText}>{user.full_name[0]}</Text></View>
                           <View>
                              <Text style={styles.userName}>{user.full_name}</Text>
                              <Text style={styles.userCode}>{user.user_code} - {user.email}</Text>
                           </View>
                        </View>
                        <View style={{flexDirection: 'row', gap: 10}}>
                           <TouchableOpacity style={styles.btnRemind} onPress={() => handleRemindNFC(user.user_id)}>
                              <Ionicons name="notifications-outline" size={16} color="#B45309" />
                              <Text style={{color: '#B45309', marginLeft: 5, fontSize: 12, fontWeight: 'bold'}}>Nhắc nhở</Text>
                           </TouchableOpacity>
                           <TouchableOpacity onPress={() => handleDeleteUser(user)} style={styles.actionBtn}>
                              <Ionicons name="trash-outline" size={20} color="#EF4444" />
                           </TouchableOpacity>
                        </View>
                     </View>
                  ))}
                  {usersWithoutNFC.length === 0 && <Text style={{color: '#9CA3AF'}}>Không có ai chờ nhận thẻ.</Text>}
               </View>

               {/* Section: Locked Cards */}
               <View style={[styles.section, { borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 20 }]}>
                  <Text style={[styles.sectionTitle, { color: '#B91C1C' }]}>Thẻ đã bị khóa (locked)</Text>
                  {usersLocked.map(user => (
                     <View key={user.user_id} style={[styles.userCard, { backgroundColor: '#F9FAFB' }]}>
                        <View style={styles.userInfo}>
                           <View style={[styles.avatar, { backgroundColor: '#6B7280' }]}><Text style={styles.avatarText}>{user.full_name[0]}</Text></View>
                           <View>
                              <Text style={styles.userName}>{user.full_name}</Text>
                              <Text style={styles.userCode}>{user.user_code} - Thẻ: {user.nfc_tag_id}</Text>
                           </View>
                        </View>
                        <View style={{flexDirection: 'row', gap: 10}}>
                           <TouchableOpacity style={[styles.btnRemind, {backgroundColor: '#E5E7EB'}]} onPress={() => openEditModal(user)}>
                              <Ionicons name="refresh-outline" size={16} color="#4B5563" />
                              <Text style={{color: '#4B5563', marginLeft: 5, fontSize: 12, fontWeight: 'bold'}}>Mở khóa / Sửa</Text>
                           </TouchableOpacity>
                           <TouchableOpacity onPress={() => handleDeleteUser(user)} style={styles.actionBtn}>
                              <Ionicons name="trash-outline" size={20} color="#EF4444" />
                           </TouchableOpacity>
                        </View>
                     </View>
                  ))}
                  {usersLocked.length === 0 && <Text style={{color: '#9CA3AF'}}>Chưa có thẻ nào bị khóa.</Text>}
               </View>
            </ScrollView>
         )}

         {/* Modal Edit User */}
         <Modal visible={showEditModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
               <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Chỉnh sửa thông tin sinh viên</Text>
                     <TouchableOpacity onPress={() => setShowEditModal(false)}>
                        <Ionicons name="close" size={24} color="#6B7280" />
                     </TouchableOpacity>
                  </View>
                  <ScrollView>
                     <Text style={styles.label}>Họ và tên</Text>
                     <TextInput style={styles.textInput} value={editForm.full_name} onChangeText={(v) => setEditForm({...editForm, full_name: v})} />
                     
                     <Text style={styles.label}>Email</Text>
                     <TextInput style={styles.textInput} value={editForm.email} onChangeText={(v) => setEditForm({...editForm, email: v})} />
                     
                     <Text style={styles.label}>Số điện thoại</Text>
                     <TextInput style={styles.textInput} value={editForm.phone_number} onChangeText={(v) => setEditForm({...editForm, phone_number: v})} />
                     
                     <Text style={styles.label}>Trạng thái</Text>
                     <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
                        {['active', 'pending_nfc', 'locked'].map(s => (
                           <TouchableOpacity 
                              key={s} 
                              onPress={() => setEditForm({...editForm, status: s})}
                              style={[styles.statusOption, editForm.status === s && styles.statusOptionActive]}
                           >
                              <Text style={{color: editForm.status === s ? '#FFF' : '#374151', fontSize: 12}}>{s}</Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <TouchableOpacity style={styles.btnApproveAction} onPress={submitUpdateUser}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold', textAlign: 'center' }}>Lưu Thay Đổi</Text>
                     </TouchableOpacity>
                  </ScrollView>
               </View>
            </View>
         </Modal>
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: "transparent", padding: 20 },
   header: { marginBottom: 20 },
   headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
   section: { marginBottom: 20 },
   sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#374151", marginBottom: 15 },
   userCard: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: '#FFFFFF', padding: 15, borderRadius: 8, marginBottom: 10,
      borderWidth: 1, borderColor: '#E5E7EB'
   },
   userInfo: { flexDirection: 'row', alignItems: 'center' },
   avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#80A1BA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
   avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
   userName: { fontSize: 16, fontWeight: '600', color: '#111827' },
   userCode: { fontSize: 13, color: '#6B7280' },
   nfcBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DEF7EC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
   btnRemind: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
   btnAssign: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#80A1BA', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
   modalContent: { backgroundColor: "#FFF", width: 500, borderRadius: 12, padding: 24, maxHeight: '80%' },
   modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
   modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
   textInput: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: "#F9FAFB", marginBottom: 15 },
   btnApproveAction: { backgroundColor: "#80A1BA", padding: 14, borderRadius: 8 },
   label: { fontSize: 14, fontWeight: 'bold', color: '#4B5563', marginBottom: 5 },
   statusOption: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
   statusOptionActive: { backgroundColor: '#80A1BA', borderColor: '#80A1BA' },
   actionBtn: { padding: 5, borderRadius: 6, backgroundColor: '#F3F4F6' },
   searchBarWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
   },
   searchInput: {
      flex: 1,
      fontSize: 15,
      color: '#374151',
   }
});
