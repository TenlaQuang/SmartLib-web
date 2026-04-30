import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BASE_URL } from "../services/api";

export default function UsersManagement() {
   const [users, setUsers] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   
   // Modal cho cấp NFC
   const [showModal, setShowModal] = useState(false);
   const [selectedUser, setSelectedUser] = useState<any>(null);
   const [nfcSerial, setNfcSerial] = useState("");

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

   const openAssignModal = (user: any) => {
      setSelectedUser(user);
      setNfcSerial("");
      setShowModal(true);
   };

   const submitAssignNFC = async () => {
      if (!nfcSerial.trim()) {
         Alert.alert("Lỗi", "Vui lòng quét hoặc nhập mã thẻ NFC");
         return;
      }
      try {
         const resp = await fetch(`${BASE_URL}/api/users/${selectedUser.user_id}/assign-nfc`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nfc_serial: nfcSerial.trim() })
         });
         if (resp.ok) {
            Alert.alert("Thành công", "Đã gán thẻ NFC vào tài khoản!");
            setShowModal(false);
            fetchUsers();
         } else {
            const data = await resp.json();
            Alert.alert("Lỗi", data.detail);
         }
      } catch (e) {
         Alert.alert("Lỗi", "Không thể kết nối");
      }
   };

   const usersWithNFC = users.filter(u => u.status === 'active');
   const usersWithoutNFC = users.filter(u => u.status === 'pending_nfc');

   return (
      <View style={styles.container}>
         <View style={styles.header}>
            <Text style={styles.headerTitle}>Quản lý Sinh Viên</Text>
         </View>

         {loading ? <ActivityIndicator size="large" color="#80A1BA" style={{ marginTop: 20 }} /> : (
            <ScrollView style={{ flex: 1 }}>
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Đã liên kết NFC (Đang hoạt động)</Text>
                  {usersWithNFC.map(user => (
                     <View key={user.user_id} style={styles.userCard}>
                        <View style={styles.userInfo}>
                           <View style={styles.avatar}><Text style={styles.avatarText}>{user.full_name[0]}</Text></View>
                           <View>
                              <Text style={styles.userName}>{user.full_name}</Text>
                              <Text style={styles.userCode}>{user.user_code} - {user.email}</Text>
                           </View>
                        </View>
                        <View style={styles.nfcBadge}>
                           <Ionicons name="card" size={16} color="#046C4E" />
                           <Text style={{color: '#046C4E', fontSize: 12, marginLeft: 5}}>{user.nfc_tag_id}</Text>
                        </View>
                     </View>
                  ))}
                  {usersWithNFC.length === 0 && <Text style={{color: '#9CA3AF'}}>Chưa có người dùng nào</Text>}
               </View>

               <View style={[styles.section, { borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 20 }]}>
                  <Text style={styles.sectionTitle}>Chờ nhận thẻ (pending_nfc)</Text>
                  <Text style={{color: '#6B7280', fontSize: 13, marginBottom: 15}}>Những sinh viên này đã được duyệt nhưng chưa có thẻ NFC. Hãy nhắc nhở họ đến thư viện nhận thẻ.</Text>
                  
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
                           <TouchableOpacity style={styles.btnAssign} onPress={() => openAssignModal(user)}>
                              <Ionicons name="scan-outline" size={16} color="#FFFFFF" />
                              <Text style={{color: '#FFFFFF', marginLeft: 5, fontSize: 12, fontWeight: 'bold'}}>Cấp Thẻ</Text>
                           </TouchableOpacity>
                        </View>
                     </View>
                  ))}
                  {usersWithoutNFC.length === 0 && <Text style={{color: '#9CA3AF'}}>Không có ai chờ nhận thẻ.</Text>}
               </View>
            </ScrollView>
         )}

         {/* Modal Assign NFC */}
         <Modal visible={showModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
               <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Gán thẻ NFC tại chỗ</Text>
                     <TouchableOpacity onPress={() => setShowModal(false)}>
                        <Ionicons name="close" size={24} color="#6B7280" />
                     </TouchableOpacity>
                  </View>
                  <Text style={{ marginBottom: 15, color: '#4B5563' }}>Sinh viên: {selectedUser?.full_name}</Text>
                  <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Quét thẻ trắng để lấy mã:</Text>
                  <TextInput
                     style={styles.textInput}
                     placeholder="Đưa thẻ vào máy quét..."
                     value={nfcSerial}
                     onChangeText={setNfcSerial}
                     autoFocus
                  />
                  <TouchableOpacity style={styles.btnApproveAction} onPress={submitAssignNFC}>
                     <Text style={{ color: '#FFF', fontWeight: 'bold', textAlign: 'center' }}>Xác Nhận Cấp Thẻ</Text>
                  </TouchableOpacity>
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
   modalContent: { backgroundColor: "#FFF", width: 500, borderRadius: 12, padding: 24 },
   modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
   modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
   textInput: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: "#F9FAFB", marginBottom: 20 },
   btnApproveAction: { backgroundColor: "#80A1BA", padding: 14, borderRadius: 8 }
});
