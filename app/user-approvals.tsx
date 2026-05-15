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

         {loading ? <ActivityIndicator size="large" color="#80A1BA" /> : (
            <ScrollView style={{ flex: 1 }}>
               {requests.map(req => (
                  <TouchableOpacity key={req.request_id} style={styles.reqCard} onPress={() => { setSelectedReq(req); setShowModal(true); }}>
                     <View style={[styles.reqAvatar, req.request_status === 'approved' ? {backgroundColor: '#10B981'} : req.request_status === 'rejected' ? {backgroundColor: '#EF4444'} : {}]}>
                        <Ionicons name={req.request_status === 'approved' ? "checkmark-circle" : req.request_status === 'rejected' ? "close-circle" : "document-text"} size={24} color="#FFFFFF" />
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={styles.reqName}>{req.full_name} ({req.user_code})</Text>
                        <Text style={styles.reqDetail}>Trạng thái TT: {req.payment_status}</Text>
                        <Text style={[styles.reqDetail, {fontWeight: 'bold', color: req.request_status === 'approved' ? '#10B981' : req.request_status === 'rejected' ? '#EF4444' : '#B45309'}]}>
                           Đơn: {req.request_status.toUpperCase()}
                        </Text>
                     </View>
                     <View style={styles.btnAction}><Text style={{color: '#FFFFFF', fontWeight: 'bold'}}>Xem Chi Tiết</Text></View>
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
                        
                        <View style={{ marginTop: 20, padding: 15, backgroundColor: selectedReq.request_status === 'pending' ? '#FEF3C7' : '#F3F4F6', borderRadius: 8 }}>
                           <Text style={{color: selectedReq.request_status === 'pending' ? '#B45309' : '#4B5563', fontWeight: 'bold'}}>
                              {selectedReq.request_status === 'pending' ? 'Sinh viên đăng ký Online chưa có thẻ NFC. Bấm Duyệt để gửi email kích hoạt tài khoản cho sinh viên.' : `Đơn này đã được xử lý (${selectedReq.request_status}).`}
                           </Text>
                        </View>
                     </View>
                  )}

                  {selectedReq?.request_status === 'pending' && (
                     <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444', flex: 1 }]} onPress={handleReject}>
                           <Text style={styles.btnText}>Từ Chối Đơn</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, { backgroundColor: '#80A1BA', flex: 2 }]} onPress={handleApprove}>
                           <Text style={styles.btnText}>Duyệt Đơn Đăng Ký</Text>
                        </TouchableOpacity>
                     </View>
                  )}
                  {selectedReq?.request_status !== 'pending' && (
                     <TouchableOpacity style={[styles.btn, { backgroundColor: '#6B7280' }]} onPress={() => setShowModal(false)}>
                        <Text style={styles.btnText}>Đóng</Text>
                     </TouchableOpacity>
                  )}
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
   reqCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#91C4C3' },
   reqAvatar: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#80A1BA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
   reqName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
   reqDetail: { fontSize: 13, color: '#6B7280', marginBottom: 5 },
   btnAction: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#91C4C3', borderRadius: 6 },
   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
   modalContent: { backgroundColor: "#FFF", width: 500, borderRadius: 12, padding: 24 },
   modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
   modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
   detailText: { fontSize: 15, color: '#374151', marginBottom: 5 },
   btn: { padding: 14, borderRadius: 8, alignItems: 'center' },
   btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});
