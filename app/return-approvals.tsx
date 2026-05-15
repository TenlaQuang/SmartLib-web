import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../services/api';
import { useFocusEffect } from 'expo-router';

export default function ReturnApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchRequests = async () => {
    try {
      const resp = await fetch(`${BASE_URL}/api/return-requests`);
      if (resp.ok) {
        const data = await resp.json();
        setRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [])
  );

  useEffect(() => {
    // Kết nối WebSocket để nhận Notification
    const wsUrl = BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/admin-notifications';
    let ws: WebSocket;

    const connectWebSocket = () => {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => setWsConnected(true);
      
      ws.onmessage = (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === 'NEW_RETURN_REQUEST') {
            // Có đơn mượn mới -> Refresh lại danh sách
            fetchRequests();
            Alert.alert("Ting Ting! 🔔", "Có 1 sinh viên vừa gửi Yêu Cầu Mượn Sách mới kìa!");
          }
        } catch (err) {
          console.error(err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Tự động thử kết nối lại sau 5s
        setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleUpdateStatus = async (requestId: int, newStatus: string) => {
    const statusText = newStatus === 'approved' ? 'Duyệt' : 'Từ chối';
    if (confirm(`Bạn có chắc chắn muốn ${statusText} yêu cầu này?`)) {
      try {
        const resp = await fetch(`${BASE_URL}/api/return-requests/${requestId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (resp.ok) {
          Alert.alert("Thành công", `Đã ${statusText} đơn mượn sách.`);
          fetchRequests();
        } else {
          Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
        }
      } catch (e) {
        Alert.alert("Lỗi", "Lỗi kết nối server.");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'Chờ duyệt', color: '#F59E0B', bg: '#FEF3C7' };
      case 'approved': return { text: 'Đã duyệt', color: '#10B981', bg: '#D1FAE5' };
      case 'rejected': return { text: 'Từ chối', color: '#EF4444', bg: '#FEE2E2' };
      default: return { text: status, color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#80A1BA" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Duyệt Yêu Cầu Mượn Sách</Text>
          <Text style={styles.subtitle}>Quản lý và xét duyệt các đơn mượn sách từ sinh viên.</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.dot, { backgroundColor: wsConnected ? '#10B981' : '#EF4444' }]} />
          <Text style={{color: '#6B7280', fontSize: 13}}>
             {wsConnected ? 'Đã kết nối Realtime' : 'Đang mất kết nối'}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chưa có yêu cầu mượn sách nào.</Text>
          </View>
        ) : (
          requests.map(req => {
            const badge = getStatusBadge(req.status);
            return (
              <View key={req.request_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Người yêu cầu: {req.user_name}</Text>
                    <Text style={styles.cardDate}>
                      Thời gian: {new Date(req.created_at).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                  </View>
                </View>

                <View style={styles.detailsContainer}>
                  <Text style={styles.sectionTitle}>Sách muốn mượn ({req.details.length} cuốn):</Text>
                  {req.details.map((book: any) => (
                    <View key={book.detail_id} style={styles.bookRow}>
                      <Ionicons name="book-outline" size={16} color="#80A1BA" />
                      <Text style={styles.bookText}><Text style={{fontWeight: 'bold'}}>{book.isbn}</Text> - {book.title}</Text>
                    </View>
                  ))}
                </View>

                {req.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleUpdateStatus(req.request_id, 'rejected')}>
                      <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                      <Text style={[styles.btnText, { color: '#EF4444' }]}>Từ chối</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleUpdateStatus(req.request_id, 'approved')}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                      <Text style={[styles.btnText, { color: '#10B981' }]}>Duyệt Đơn</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyText: { marginTop: 10, fontSize: 16, color: '#9CA3AF' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  cardDate: { fontSize: 13, color: '#6B7280' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  detailsContainer: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 10 },
  bookRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bookText: { fontSize: 14, color: '#374151', marginLeft: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  rejectBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  approveBtn: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  btnText: { fontWeight: '600', marginLeft: 6 }
});
