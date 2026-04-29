import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { BASE_URL } from "../services/api";

export default function UserApprovals() {
   const [requests, setRequests] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [selectedReq, setSelectedReq] = useState<any>(null);
   const [showModal, setShowModal] = useState(false);

   const fetchRequests = async () => {
      setLoading(true);
      try {
         const resp = await fetch(`${BASE_URL}/api/registration-requests`);
         if (resp.ok) setRequests(await resp.json());
      } catch (error) {
         console.error("Fetch errors:", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchRequests();
   }, []);

   const handleApprove = async () => {
      try {
         const resp = await fetch(`${BASE_URL}/api/registration-requests/${selectedReq.request_id}/approve`, {
            method: "POST"
         });
         if (resp.ok) {
            Alert.alert("Thành công", "Đã duyệt đơn đăng ký!");
            setShowModal(false);
            fetchRequests();
         } else {
            const data = await resp.json();
            Alert.alert("Lỗi", data.detail);
         }
      } catch (error) {
         Alert.alert("Lỗi", "Không thể gửi duyệt");
      }
   };

   const handleReject = async () => {
      try {
         const resp = await fetch(`${BASE_URL}/api/registration-requests/${selectedReq.request_id}/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "Thông tin không hợp lệ" })
         });
         if (resp.ok) {
            Alert.alert("Đã từ chối đơn");
            setShowModal(false);
            fetchRequests();
         }
      } catch (error) {
         Alert.alert("Lỗi", "Không thể gửi kết nối");
      }
   };

   return (
      <View style={styles.container}>
         <View style={styles.header}>
            <Text style={styles.headerTitle}>Duyệt Đơn Đăng Ký</Text>
         </View>

         {loading ? <ActivityIndicator size="large" color="#00A3AF" /> : (
            <ScrollView style={{ flex: 1 }}>
               {requests.map(req => (
                  <TouchableOpacity key={req.request_id} style={styles.reqCard} onPress={() => { setSelectedReq(req); setShowModal(true); }}>
                     <View style={styles.reqAvatar}><Ionicons name="document-text" size={24} color="#00A3AF" /></View>
                     <View style={{ flex: 1 }}>
                        <Text style={styles.reqName}>{req.full_name} ({req.user_code})</Text>
                        <Text style={styles.reqDetail}>Trạng thái TT: {req.payment_status}</Text>
                        {req.nfc_serial ? (
                           <Text style={{color: '#046C4E', fontSize: 12, fontWeight: 'bold'}}><Ionicons name="checkmark-circle"/> Đã cung cấp NFC: {req.nfc_serial}</Text>
                        ) : (
                           <Text style={{color: '#B45309', fontSize: 12}}><Ionicons name="alert-circle"/> Không kèm thẻ NFC (Sẽ nhận sau)</Text>
                        )}
                     </View>
                     <View style={styles.btnAction}><Text style={{color: '#00A3AF', fontWeight: 'bold'}}>Xem xét</Text></View>
                  </TouchableOpacity>
               ))}
               {requests.length === 0 && <Text style={{color: '#6B7280', marginTop: 20}}>Không có đơn đăng ký nào chờ duyệt.</Text>}
            </ScrollView>
         )}

         {/* Modal Duyệt Đơn */}
         <Modal visible={showModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
               <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Chi tiết đăng ký</Text>
                     <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
                  </View>
                  
                  {selectedReq && (
                     <View style={{ marginBottom: 20 }}>
                        <Text style={styles.detailText}>Họ tên: {selectedReq.full_name}</Text>
                        <Text style={styles.detailText}>Mã SV: {selectedReq.user_code}</Text>
                        <Text style={styles.detailText}>SĐT: {selectedReq.phone_number}</Text>
                        <Text style={styles.detailText}>Email: {selectedReq.email}</Text>
                        <Text style={styles.detailText}>Thanh toán: {selectedReq.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</Text>
                        
                        {selectedReq.invoice_image_url && (
                           <View style={{ marginTop: 15, alignItems: 'center' }}>
                              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>Ảnh hóa đơn:</Text>
                              <Image 
                                 source={{ uri: selectedReq.invoice_image_url }} 
                                 style={{ width: '100%', height: 200, borderRadius: 8, resizeMode: 'contain', backgroundColor: '#F3F4F6' }} 
                              />
                           </View>
                        )}
                        
                        <View style={{ marginTop: 20, padding: 15, backgroundColor: selectedReq.nfc_serial ? '#DEF7EC' : '#FEF3C7', borderRadius: 8 }}>
                           {selectedReq.nfc_serial ? (
                              <Text style={{color: '#046C4E', fontWeight: 'bold'}}>Sinh viên này đã quét sẵn thẻ NFC ({selectedReq.nfc_serial}) tại quầy. Bấm Duyệt để kích hoạt ngay.</Text>
                           ) : (
                              <Text style={{color: '#B45309', fontWeight: 'bold'}}>Sinh viên đăng ký Online chưa có thẻ NFC. Bấm Duyệt để cho phép vào danh sách chờ nhận thẻ.</Text>
                           )}
                        </View>
                     </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                     <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444', flex: 1 }]} onPress={handleReject}>
                        <Text style={styles.btnText}>Từ Chối Đơn</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={[styles.btn, { backgroundColor: '#00A3AF', flex: 2 }]} onPress={handleApprove}>
                        <Text style={styles.btnText}>Duyệt {selectedReq?.nfc_serial ? 'Kích Hoạt Luôn' : 'Cho Phép Lấy Thẻ'}</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            </View>
         </Modal>
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: "#F9FAFB", padding: 20 },
   header: { marginBottom: 20 },
   headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
   reqCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
   reqAvatar: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
   reqName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
   reqDetail: { fontSize: 13, color: '#6B7280', marginBottom: 5 },
   btnAction: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#E0F2FE', borderRadius: 6 },
   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
   modalContent: { backgroundColor: "#FFF", width: 500, borderRadius: 12, padding: 24 },
   modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
   modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
   detailText: { fontSize: 15, color: '#374151', marginBottom: 5 },
   btn: { padding: 14, borderRadius: 8, alignItems: 'center' },
   btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});
