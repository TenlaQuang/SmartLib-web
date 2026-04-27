import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BASE_URL } from "../services/api";

type TabObj = 'users' | 'nfc' | 'approvals';

export default function UsersAndNFC() {
   const [activeTab, setActiveTab] = useState<TabObj>('approvals');



   // States cho NFC Inventory
   const [nfcInventory, setNfcInventory] = useState<any[]>([]);
   const [availableNfcTags, setAvailableNfcTags] = useState<any[]>([]);
   const [newInventorySerial, setNewInventorySerial] = useState("");
   const [newInventoryLabel, setNewInventoryLabel] = useState("");
   const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

   // States cho Quản lý User
   const [usersList, setUsersList] = useState<any[]>([]);
   const [reissueModalVisible, setReissueModalVisible] = useState(false);
   const [reissueUser, setReissueUser] = useState<any>(null);
   const [newNfcSerial, setNewNfcSerial] = useState("");
   // States cho Phê duyệt
   const [requests, setRequests] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [selectedReq, setSelectedReq] = useState<any>(null);
   const [showModal, setShowModal] = useState(false);

   // States cho các Action trong Modal
   const [actionMode, setActionMode] = useState<'none' | 'approve' | 'reject'>('none');
   const [nfcSerial, setNfcSerial] = useState("");
   const [rejectReason, setRejectReason] = useState("");



   const fetchNfcInventory = async () => {
      setLoading(true);
      try {
         const resp = await fetch(`${BASE_URL}/api/nfc-inventory`);
         if (resp.ok) setNfcInventory(await resp.json());
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   const fetchAvailableTags = async () => {
      try {
         const resp = await fetch(`${BASE_URL}/api/nfc-inventory/available`);
         if (resp.ok) setAvailableNfcTags(await resp.json());
      } catch (e) {
         console.error(e);
      }
   };

   const handleAddNfcToInventory = async () => {
      if (!newInventorySerial.trim() || !newInventoryLabel.trim()) {
         Alert.alert("Lỗi", "Vui lòng nhập Mã Serial và Tên nhãn cho thẻ.");
         return;
      }
      try {
         const resp = await fetch(`${BASE_URL}/api/nfc-inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nfc_serial: newInventorySerial.trim(), label: newInventoryLabel.trim() })
         });
         const data = await resp.json();
         if (resp.ok) {
            Alert.alert("Thành công", "Đã nạp thẻ vào kho tàng!");
            setNewInventorySerial("");
            setNewInventoryLabel("");
            fetchNfcInventory();
         } else {
            Alert.alert("Thất bại", data.detail || "Có lỗi xảy ra");
         }
      } catch (e) {
         Alert.alert("Lỗi", "Không thể gửi kết nối");
      }
   };

   const fetchUsers = async () => {
      setLoading(true);
      try {
         const resp = await fetch(`${BASE_URL}/api/users`);
         if (resp.ok) {
            setUsersList(await resp.json());
         }
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   const handleReissueNfc = async () => {
      if (!selectedTagId) {
         Alert.alert("Lỗi", "Vui lòng chọn 1 thẻ rảnh.");
         return;
      }
      try {
         const resp = await fetch(`${BASE_URL}/api/users/${reissueUser.user_id}/reissue-nfc`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag_id: selectedTagId })
         });
         const data = await resp.json();
         if (resp.ok) {
            Alert.alert("Thành công", "Đã cấp lại NFC mới!");
            setReissueModalVisible(false);
            fetchUsers();
         } else {
            Alert.alert("Thất bại", data.detail || "Có lỗi xảy ra");
         }
      } catch (e) {
         Alert.alert("Lỗi", "Không thể gửi kết nối");
      }
   };

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
         fetchAvailableTags();
      } else if (activeTab === 'users') {
         fetchUsers();
         fetchAvailableTags(); // for reissue
      } else if (activeTab === 'nfc') {
         fetchNfcInventory();
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
      if (!selectedTagId) {
         Alert.alert("Lỗi", "Vui lòng chọn 1 thẻ rảnh!");
         return;
      }

      try {
         const resp = await fetch(`${BASE_URL}/api/registration-requests/${selectedReq.request_id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag_id: selectedTagId })
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
            <View style={{ flex: 1 }}>
               <Text style={styles.sectionTitle}>Danh sách Sinh viên / Cấp lại thẻ</Text>
               {loading ? (
                  <ActivityIndicator size="large" color="#00A3AF" style={{ marginTop: 20 }} />
               ) : usersList.length === 0 ? (
                  <View style={styles.centerBox}>
                     <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                     <Text style={{ color: '#6B7280', marginTop: 10 }}>Chưa có người dùng nào thành viên.</Text>
                  </View>
               ) : (
                  <ScrollView style={{ flex: 1 }}>
                     {usersList.map(u => (
                        <View key={u.user_id} style={styles.reqCard}>
                           <View style={styles.reqAvatar}>
                              <Ionicons name="person" size={24} color="#00A3AF" />
                           </View>
                           <View style={{ flex: 1 }}>
                              <Text style={styles.reqName}>{u.full_name} <Text style={styles.reqCode}>- {u.user_code}</Text></Text>
                              <Text style={styles.reqEmail}>Email: {u.email || "N/A"}</Text>
                              <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>NFC: {u.nfc_tag_id}</Text>
                           </View>
                           <TouchableOpacity
                              style={[styles.btnOutline, { borderColor: '#00A3AF', borderWidth: 1, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, marginRight: 0 }]}
                              onPress={() => {
                                 setReissueUser(u);
                                 setNewNfcSerial("");
                                 setReissueModalVisible(true);
                              }}
                           >
                              <Text style={{ color: '#00A3AF', fontWeight: 'bold', fontSize: 13 }}>Cấp lại Thẻ</Text>
                           </TouchableOpacity>
                        </View>
                     ))}
                  </ScrollView>
               )}

               {/* Reissue Modal */}
               <Modal visible={reissueModalVisible} transparent animationType="fade">
                  <View style={styles.modalOverlay}>
                     <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                           <Text style={styles.modalTitle}>Cấp Lại Thẻ NFC</Text>
                           <TouchableOpacity onPress={() => setReissueModalVisible(false)}>
                              <Ionicons name="close" size={26} color="#6B7280" />
                           </TouchableOpacity>
                        </View>
                        <View style={{ padding: 24 }}>
                           {reissueUser && (
                              <Text style={{ fontSize: 15, color: '#374151', marginBottom: 15 }}>
                                 Thao tác này sẽ VÔ HIỆU HOÁ thẻ NFC hiện tại của SV <Text style={{ fontWeight: 'bold' }}>{reissueUser.full_name}</Text> ({reissueUser.user_code}) và gán mã thẻ mới.
                              </Text>
                           )}
                           <Text style={styles.inputTitle}>Chọn thẻ dự phòng (từ trong Kho):</Text>
                           <View style={{maxHeight: 150, marginBottom: 15}}>
                              <ScrollView nestedScrollEnabled>
                                 {availableNfcTags.map(t => (
                                    <TouchableOpacity 
                                       key={t.tag_id} 
                                       style={{padding: 10, backgroundColor: selectedTagId === t.tag_id ? '#DBEAFE' : '#FFF', borderWidth: 1, borderColor: selectedTagId === t.tag_id ? '#3B82F6' : '#E5E7EB', borderRadius: 6, marginBottom: 5}}
                                       onPress={() => setSelectedTagId(t.tag_id)}
                                    >
                                       <Text style={{fontWeight: 'bold', color: selectedTagId === t.tag_id ? '#1D4ED8' : '#374151'}}>{t.label}</Text>
                                       <Text style={{fontSize: 12, color: '#6B7280'}}>UID: {t.nfc_serial}</Text>
                                    </TouchableOpacity>
                                 ))}
                                 {availableNfcTags.length === 0 && <Text style={{color: '#EF4444'}}>Kho đã hết thẻ. Vui lòng qua Tab Cấp NFC nạp thêm!</Text>}
                              </ScrollView>
                           </View>
                           <View style={styles.actionRow}>
                              <TouchableOpacity style={styles.btnOutline} onPress={() => setReissueModalVisible(false)}><Text style={styles.btnOutlineText}>Huỷ bỏ</Text></TouchableOpacity>
                              <TouchableOpacity style={styles.btnApproveAction} onPress={handleReissueNfc}><Text style={styles.btnText}>Lưu Thay Đổi</Text></TouchableOpacity>
                           </View>
                        </View>
                     </View>
                  </View>
               </Modal>
            </View>
         );
      }
      if (activeTab === 'nfc') {
         return (
            <View style={{ flex: 1, flexDirection: 'row' }}>
               {/* List Tags */}
               <View style={{ flex: 2, paddingRight: 20 }}>
                  <Text style={styles.sectionTitle}>Kho Thẻ Vật Lý (Trống/Đã cấp)</Text>
                  {loading ? <ActivityIndicator size="large" color="#00A3AF" /> : (
                     <ScrollView>
                        {nfcInventory.map(tag => (
                           <View key={tag.tag_id} style={styles.reqCard}>
                              <View style={[styles.reqAvatar, { backgroundColor: tag.status === 'available' ? '#DEF7EC' : '#FDE8E8' }]}>
                                 <Ionicons name="card" size={20} color={tag.status === 'available' ? '#046C4E' : '#9B1C1C'} />
                              </View>
                              <View style={{ flex: 1 }}>
                                 <Text style={styles.reqName}>{tag.label}</Text>
                                 <Text style={styles.reqCode}>{tag.nfc_serial}</Text>
                              </View>
                              <View style={[styles.reqStatusBox, { backgroundColor: tag.status === 'available' ? '#DEF7EC' : '#FDE8E8' }]}>
                                 <Text style={[styles.reqStatus, { color: tag.status === 'available' ? '#046C4E' : '#9B1C1C' }]}>
                                    {tag.status === 'available' ? "Khả dụng" : "Đã giao"}
                                 </Text>
                              </View>
                           </View>
                        ))}
                     </ScrollView>
                  )}
               </View>

               {/* Add Tag Form */}
               <View style={{ flex: 1, backgroundColor: '#F9FAFB', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 15 }}>Thêm Nhãn NFC Vào Kho</Text>
                  
                  <Text style={{ fontSize: 14, color: '#374151', marginBottom: 5 }}>Tên định danh (Ví dụ: Thẻ số 1):</Text>
                  <TextInput style={styles.textInput} placeholder="VD: Thẻ xanh số 04..." value={newInventoryLabel} onChangeText={setNewInventoryLabel} />
                  
                  <Text style={{ fontSize: 14, color: '#374151', marginBottom: 5 }}>Mã UID Quét được:</Text>
                  <TextInput style={styles.textInput} placeholder="Dán mã thẻ trống từ điện thoại..." value={newInventorySerial} onChangeText={setNewInventorySerial} />
                  
                  <TouchableOpacity style={styles.btnApproveAction} onPress={handleAddNfcToInventory}>
                     <Text style={[styles.btnText, { textAlign: 'center' }]}>Lưu Vào Kho</Text>
                  </TouchableOpacity>

                  <View style={{ marginTop: 20, padding: 10, backgroundColor: '#EFF6FF', borderRadius: 8 }}>
                     <Text style={{ color: '#1E3A8A', fontSize: 13 }}><Ionicons name="information-circle" /> Thẻ đã nạp sẽ hiển thị trong danh sách chọn lúc Duyệt Đơn.</Text>
                  </View>
               </View>
            </View>
         );
      }
      if (activeTab === 'approvals') {
         return (
            <View style={{ flex: 1 }}>
               <Text style={styles.sectionTitle}>Danh sách đơn chờ duyệt</Text>
               {loading ? (
                  <ActivityIndicator size="large" color="#00A3AF" style={{ marginTop: 20 }} />
               ) : requests.length === 0 ? (
                  <View style={styles.centerBox}>
                     <Ionicons name="documents-outline" size={48} color="#D1D5DB" />
                     <Text style={{ color: '#6B7280', marginTop: 10 }}>Không có đơn đăng ký nào chờ duyệt.</Text>
                  </View>
               ) : (
                  <ScrollView style={{ flex: 1 }}>
                     {requests.map(req => (
                        <TouchableOpacity key={req.request_id} style={styles.reqCard} onPress={() => openReqDetails(req)}>
                           <View style={styles.reqAvatar}>
                              <Ionicons name="person" size={24} color="#00A3AF" />
                           </View>
                           <View style={{ flex: 1 }}>
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
         <ScrollView style={{ padding: 24, maxHeight: '85%' }}>
            <Text style={styles.modalSubTitle}>Thông tin cá nhân</Text>
            <View style={{ backgroundColor: '#F9FAFB', padding: 15, borderRadius: 8, marginBottom: 20 }}>
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
               <Image source={{ uri: selectedReq.invoice_image_url.startsWith('http') ? selectedReq.invoice_image_url : BASE_URL + selectedReq.invoice_image_url }} style={styles.invoiceImg} resizeMode="contain" />
            ) : (
               <View style={styles.noImgBox}>
                  <Text style={{ color: '#9CA3AF' }}>Mất hình ảnh hoặc Sinh viên không tải lên</Text>
               </View>
            )}

            {/* Action Blocks */}
            {actionMode === 'none' && (
               <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => setActionMode('reject')}>
                     <Ionicons name="close-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                     <Text style={styles.btnText}>Không Duyệt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => setActionMode('approve')}>
                     <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                     <Text style={styles.btnText}>Tiến hành Duyệt</Text>
                  </TouchableOpacity>
               </View>
            )}

            {actionMode === 'approve' && (
               <View style={styles.inputBlock}>
                  <Text style={styles.inputTitle}>Chọn thẻ dự phòng (từ trong Kho):</Text>
                           <View style={{maxHeight: 150, marginBottom: 15}}>
                              <ScrollView nestedScrollEnabled>
                                 {availableNfcTags.map(t => (
                                    <TouchableOpacity 
                                       key={t.tag_id} 
                                       style={{padding: 10, backgroundColor: selectedTagId === t.tag_id ? '#DBEAFE' : '#FFF', borderWidth: 1, borderColor: selectedTagId === t.tag_id ? '#3B82F6' : '#E5E7EB', borderRadius: 6, marginBottom: 5}}
                                       onPress={() => setSelectedTagId(t.tag_id)}
                                    >
                                       <Text style={{fontWeight: 'bold', color: selectedTagId === t.tag_id ? '#1D4ED8' : '#374151'}}>{t.label}</Text>
                                       <Text style={{fontSize: 12, color: '#6B7280'}}>UID: {t.nfc_serial}</Text>
                                    </TouchableOpacity>
                                 ))}
                                 {availableNfcTags.length === 0 && <Text style={{color: '#EF4444'}}>Kho đã hết thẻ. Vui lòng qua Tab Cấp NFC nạp thêm!</Text>}
                              </ScrollView>
                           </View>
                  <View style={styles.actionRow}>
                     <TouchableOpacity style={styles.btnOutline} onPress={() => setActionMode('none')}><Text style={styles.btnOutlineText}>Huỷ</Text></TouchableOpacity>
                     <TouchableOpacity style={styles.btnApproveAction} onPress={handleApprove}><Text style={styles.btnText}>Duyệt & Lưu Thẻ</Text></TouchableOpacity>
                  </View>
               </View>
            )}

            {actionMode === 'reject' && (
               <View style={styles.inputBlock}>
                  <Text style={styles.inputTitle}>Lý do từ chối (Gửi Email cho sinh viên)</Text>
                  <TextInput style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]} multiline placeholder="Ghi chú về việc thiếu phí, hình ảnh mờ..." value={rejectReason} onChangeText={setRejectReason} autoFocus />
                  <View style={styles.actionRow}>
                     <TouchableOpacity style={styles.btnOutline} onPress={() => setActionMode('none')}><Text style={styles.btnOutlineText}>Huỷ</Text></TouchableOpacity>
                     <TouchableOpacity style={styles.btnRejectAction} onPress={handleReject}><Text style={styles.btnText}>Từ chối & Gửi Mail</Text></TouchableOpacity>
                  </View>
               </View>
            )}
            <View style={{ height: 30 }} />
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
