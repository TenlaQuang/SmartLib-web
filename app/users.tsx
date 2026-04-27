import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../services/api";

type TabObj = 'users' | 'nfc' | 'approvals';

export default function UsersAndNFC() {
  const [activeTab, setActiveTab] = useState<TabObj>('approvals');
  
  // States cho Phê duyệt
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // States cho các Action trong Modal
  const [actionMode, setActionMode] = useState<'none' | 'approve' | 'reject'>('none');
  const [nfcSerial, setNfcSerial] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/registration-requests`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'approvals') {
       fetchRequests();
    }
  }, [activeTab]);

  const openReqDetails = (req: any) => {
    setSelectedReq(req);
    setActionMode('none');
    setNfcSerial("");
    setRejectReason("");
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!nfcSerial.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập hoặc quét Serial Number cho thẻ NFC!");
      return;
    }
    
    try {
      const resp = await fetch(`${BASE_URL}/api/registration-requests/${selectedReq.request_id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nfc_serial: nfcSerial.trim() })
      });
      const data = await resp.json();
      if (resp.ok) {
        Alert.alert("Thành công", data.message || "Đã duyệt và gán thẻ thành công!");
        setShowModal(false);
        fetchRequests();
      } else {
        Alert.alert("Thất bại", data.detail || "Có lỗi xảy ra");
      }
    } catch (error) {
      Alert.alert("Lỗi kết nối", "Không thể gửi yêu cầu");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do từ chối để gửi cho sinh viên!");
      return;
    }

    try {
      const resp = await fetch(`${BASE_URL}/api/registration-requests/${selectedReq.request_id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() })
      });
      const data = await resp.json();
      if (resp.ok) {
        Alert.alert("Thành công", "Đã từ chối đơn đăng ký và hệ thống đang gửi email!");
        setShowModal(false);
        fetchRequests();
      } else {
        Alert.alert("Thất bại", data.detail || "Có lỗi xảy ra");
      }
    } catch (error) {
      Alert.alert("Lỗi kết nối", "Không thể gửi yêu cầu");
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'users') {
      return (
         <View style={styles.centerBox}>
            <Text style={{fontSize: 16, color: '#6B7280'}}>Giao diện Quản lý Sinh Viên (Đang xây dựng...)</Text>
         </View>
      );
    }
    if (activeTab === 'nfc') {
      return (
         <View style={styles.centerBox}>
            <Text style={{fontSize: 16, color: '#6B7280'}}>Giao diện Cấp NFC trên phôi có sẵn (Đang xây dựng...)</Text>
         </View>
      );
    }
    if (activeTab === 'approvals') {
      return (
        <View style={{flex: 1}}>
          <Text style={styles.sectionTitle}>Danh sách đơn chờ duyệt</Text>
          {loading ? (
             <ActivityIndicator size="large" color="#00A3AF" style={{marginTop: 20}} />
          ) : requests.length === 0 ? (
             <View style={styles.centerBox}>
                <Ionicons name="documents-outline" size={48} color="#D1D5DB" />
                <Text style={{color: '#6B7280', marginTop: 10}}>Không có đơn đăng ký nào chờ duyệt.</Text>
             </View>
          ) : (
             <ScrollView style={{flex: 1}}>
                {requests.map(req => (
                   <TouchableOpacity key={req.request_id} style={styles.reqCard} onPress={() => openReqDetails(req)}>
                      <View style={styles.reqAvatar}>
                         <Ionicons name="person" size={24} color="#00A3AF" />
                      </View>
                      <View style={{flex: 1}}>
                         <Text style={styles.reqName}>{req.full_name} <Text style={styles.reqCode}>- {req.user_code}</Text></Text>
                         <Text style={styles.reqEmail}>{req.email || "Không có Email"}</Text>
                      </View>
                      <View style={styles.reqStatusBox}>
                         <Text style={styles.reqStatus}>Chờ Duyệt</Text>
                      </View>
                   </TouchableOpacity>
                ))}
             </ScrollView>
          )}
        </View>
      );
    }
  };

  const renderModalContent = () => {
    if (!selectedReq) return null;
    return (
       <ScrollView style={{padding: 24, maxHeight: '85%'}}>
           <Text style={styles.modalSubTitle}>Thông tin cá nhân</Text>
           <View style={{backgroundColor: '#F9FAFB', padding: 15, borderRadius: 8, marginBottom: 20}}>
              <Text style={styles.infoLine}><Text style={styles.infoBold}>Họ & Tên:</Text> {selectedReq.full_name}</Text>
              <Text style={styles.infoLine}><Text style={styles.infoBold}>Mã SV/CCCD:</Text> {selectedReq.user_code}</Text>
              <Text style={styles.infoLine}><Text style={styles.infoBold}>Email:</Text> {selectedReq.email}</Text>
              <Text style={styles.infoLine}><Text style={styles.infoBold}>SĐT:</Text> {selectedReq.phone_number}</Text>
              <Text style={styles.infoLine}><Text style={styles.infoBold}>Giới tính:</Text> {selectedReq.gender}</Text>
              <Text style={styles.infoLine}><Text style={styles.infoBold}>Năm sinh:</Text> {selectedReq.birth_year}</Text>
              <Text style={styles.infoLine}><Text style={styles.infoBold}>Địa chỉ:</Text> {selectedReq.address}</Text>
           </View>

           <Text style={styles.modalSubTitle}>Chứng từ / Hoá đơn thanh toán</Text>
           {selectedReq.invoice_image_url ? (
              <Image source={{uri: selectedReq.invoice_image_url.startsWith('http') ? selectedReq.invoice_image_url : BASE_URL + selectedReq.invoice_image_url}} style={styles.invoiceImg} resizeMode="contain" />
           ) : (
              <View style={styles.noImgBox}>
                 <Text style={{color: '#9CA3AF'}}>Mất hình ảnh hoặc Sinh viên không tải lên</Text>
              </View>
           )}

           {/* Action Blocks */}
           {actionMode === 'none' && (
              <View style={styles.actionRow}>
                 <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => setActionMode('reject')}>
                    <Ionicons name="close-circle-outline" size={20} color="#FFF" style={{marginRight: 6}} />
                    <Text style={styles.btnText}>Không Duyệt</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => setActionMode('approve')}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{marginRight: 6}} />
                    <Text style={styles.btnText}>Tiến hành Duyệt</Text>
                 </TouchableOpacity>
              </View>
           )}

           {actionMode === 'approve' && (
              <View style={styles.inputBlock}>
                 <Text style={styles.inputTitle}>Gán Mã Thẻ NFC (Serial Number)</Text>
                 <Text style={{fontSize: 12, color: '#6B7280', marginBottom: 10}}>Hãy đặt con trỏ chuột vào ô dưới và quét mã thẻ vật lý của thẻ NFC, hoặc nhập tay thủ công.</Text>
                 <TextInput style={styles.textInput} placeholder="Bắt đầu quét..." value={nfcSerial} onChangeText={setNfcSerial} autoFocus />
                 <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.btnOutline} onPress={() => setActionMode('none')}><Text style={styles.btnOutlineText}>Huỷ</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.btnApproveAction} onPress={handleApprove}><Text style={styles.btnText}>Duyệt & Lưu Thẻ</Text></TouchableOpacity>
                 </View>
              </View>
           )}

           {actionMode === 'reject' && (
              <View style={styles.inputBlock}>
                 <Text style={styles.inputTitle}>Lý do từ chối (Gửi Email cho sinh viên)</Text>
                 <TextInput style={[styles.textInput, {height: 80, textAlignVertical: 'top'}]} multiline placeholder="Ghi chú về việc thiếu phí, hình ảnh mờ..." value={rejectReason} onChangeText={setRejectReason} autoFocus />
                 <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.btnOutline} onPress={() => setActionMode('none')}><Text style={styles.btnOutlineText}>Huỷ</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.btnRejectAction} onPress={handleReject}><Text style={styles.btnText}>Từ chối & Gửi Mail</Text></TouchableOpacity>
                 </View>
              </View>
           )}
           <View style={{height: 30}} />
       </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Quản Lý Tài Khoản & NFC Thư Viện</Text>
      
      {/* Tabs */}
      <View style={styles.tabBar}>
         <TouchableOpacity style={[styles.tab, activeTab === 'users' && styles.activeTab]} onPress={() => setActiveTab('users')}>
            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Quản lý Người dùng</Text>
         </TouchableOpacity>
         <TouchableOpacity style={[styles.tab, activeTab === 'nfc' && styles.activeTab]} onPress={() => setActiveTab('nfc')}>
            <Text style={[styles.tabText, activeTab === 'nfc' && styles.activeTabText]}>Cấp NFC</Text>
         </TouchableOpacity>
         <TouchableOpacity style={[styles.tab, activeTab === 'approvals' && styles.activeTab]} onPress={() => setActiveTab('approvals')}>
            <Text style={[styles.tabText, activeTab === 'approvals' && styles.activeTabText]}>Duyệt đơn đăng ký</Text>
         </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentArea}>
         {renderTabContent()}
      </View>

      {/* Detail Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={styles.modalContainer}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết Đơn Khởi Tạo</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                     <Ionicons name="close" size={26} color="#6B7280" />
                  </TouchableOpacity>
               </View>
               {renderModalContent()}
           </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pageTitle: { fontSize: 26, fontWeight: "bold", color: "#1F2937", marginBottom: 20 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 20 },
  tab: { paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#00A3AF' },
  tabText: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
  activeTabText: { color: '#00A3AF', fontWeight: '700' },
  contentArea: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 15 },
  reqCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  reqAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  reqName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  reqCode: { color: '#6B7280', fontWeight: 'normal', fontSize: 14 },
  reqEmail: { color: '#6B7280', fontSize: 13, marginTop: 4 },
  reqStatusBox: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  reqStatus: { color: '#D97706', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxWidth: 600, backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  modalSubTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 10 },
  infoLine: { fontSize: 14, color: '#4B5563', marginBottom: 6 },
  infoBold: { fontWeight: '600', color: '#111827' },
  invoiceImg: { width: '100%', height: 300, backgroundColor: '#F3F4F6', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  noImgBox: { width: '100%', height: 150, backgroundColor: '#F3F4F6', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, marginLeft: 15 },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  btnReject: { backgroundColor: '#EF4444' },
  btnApprove: { backgroundColor: '#10B981' },
  inputBlock: { backgroundColor: '#EFF6FF', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE', marginTop: 10 },
  inputTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 8 },
  textInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, padding: 12, fontSize: 15, marginBottom: 15 },
  btnOutline: { paddingHorizontal: 20, paddingVertical: 10, alignSelf: 'center', marginRight: 15 },
  btnOutlineText: { color: '#6B7280', fontWeight: '600' },
  btnApproveAction: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  btnRejectAction: { backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }
});
