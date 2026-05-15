import React, { useState, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { getDashboardStats } from "../services/api";

export default function DashboardOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        try {
          const data = await getDashboardStats();
          setStats(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }, [])
  );

  if (loading || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#80A1BA" />
      </View>
    );
  }

  const { kpis, storage, charts } = stats;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.pageTitle}>Dashboard Thống Kê</Text>

      {/* Top Level KPIs */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Ionicons name="people" size={24} color="#80A1BA" />
            <Text style={styles.kpiTitle}>Người Dùng</Text>
          </View>
          <Text style={styles.kpiValue}>{kpis.total_users}</Text>
          <Text style={styles.kpiSubtitle}>{kpis.active_users} Đang hoạt động</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Ionicons name="wallet" size={24} color="#91C4C3" />
            <Text style={styles.kpiTitle}>Tổng Thu Nhập Tháng</Text>
          </View>
          <Text style={styles.kpiValue}>{kpis.monthly_income.toLocaleString()} đ</Text>
          <Text style={styles.kpiSubtitle}>Tiền cọc & Phạt trễ hạn</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Ionicons name="book" size={24} color="#B4DEBD" />
            <Text style={styles.kpiTitle}>Sách Đang Mượn</Text>
          </View>
          <Text style={styles.kpiValue}>{kpis.borrowed_books}</Text>
          <Text style={styles.kpiSubtitle}>/ {kpis.total_books} tổng sách</Text>
        </View>
      </View>

      <View style={styles.mainGrid}>
        {/* Cột trái: Tình trạng Kho Kệ */}
        <View style={styles.leftColumn}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Tình trạng Lưu Trữ Kho</Text>
            
            <View style={styles.storageOverviewRow}>
              <View style={styles.storageMetric}>
                <Text style={styles.storageValue}>{storage.total_used}</Text>
                <Text style={styles.storageLabel}>Đã dùng</Text>
              </View>
              <View style={styles.storageMetric}>
                <Text style={[styles.storageValue, { color: '#00f2fe' }]}>{storage.total_empty}</Text>
                <Text style={styles.storageLabel}>Trống</Text>
              </View>
              <View style={styles.storageMetric}>
                <Text style={styles.storageValue}>{storage.total_capacity}</Text>
                <Text style={styles.storageLabel}>Sức chứa</Text>
              </View>
            </View>

            {/* Thanh Progress */}
            <View style={styles.progressBarBg}>
               <View style={[styles.progressBarFill, { width: `${(storage.total_used / (storage.total_capacity || 1)) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{((storage.total_used / (storage.total_capacity || 1)) * 100).toFixed(1)}% Công suất</Text>

            <Text style={[styles.panelTitle, { marginTop: 20, fontSize: 14, color: '#A0AEC0' }]}>Danh sách kệ còn chỗ trống</Text>
            <ScrollView style={styles.emptyShelvesList} nestedScrollEnabled={true}>
              {storage.empty_shelves.map((shelf: any, idx: number) => (
                <View key={idx} style={styles.shelfRow}>
                  <View>
                    <Text style={styles.shelfZoneText}>{shelf.zone_name}</Text>
                    <Text style={styles.shelfDetailText}>Tủ {shelf.shelf_id} - Hàng {shelf.level_number}</Text>
                  </View>
                  <View style={styles.emptyBadge}>
                    <Text style={styles.emptyBadgeText}>{shelf.empty_slots} ô trống</Text>
                  </View>
                </View>
              ))}
              {storage.empty_shelves.length === 0 && (
                <Text style={{ color: '#4facfe', textAlign: 'center', marginTop: 20 }}>Tất cả các kệ đã đầy!</Text>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Cột phải: 2 Biểu đồ */}
        <View style={styles.rightColumn}>
          
          <View style={[styles.panel, { flex: 1, marginBottom: 20 }]}>
            <Text style={styles.panelTitle}>Lưu Lượng Mượn Sách 7 Ngày Qua</Text>
            <View style={styles.barChartContainer}>
              {charts.weekly_borrows.map((day: any, idx: number) => {
                // max value to scale chart
                const max = Math.max(...charts.weekly_borrows.map((d: any) => d.borrows));
                const heightPercent = max === 0 ? 0 : (day.borrows / max) * 100;
                
                return (
                  <View key={idx} style={styles.barColumn}>
                    <View style={styles.barLabelTop}>
                      <Text style={styles.barLabelText}>{day.borrows}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
                    </View>
                    <Text style={styles.barDateText}>{day.date.split('-').slice(1).join('/')}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View style={[styles.panel, { flex: 1 }]}>
            <Text style={styles.panelTitle}>Tỷ lệ trạng thái sách</Text>
            <View style={styles.pieContainer}>
               <View style={styles.pieItem}>
                 <View style={[styles.pieCircle, { borderColor: '#80A1BA', borderLeftColor: 'transparent', borderTopColor: 'transparent', transform: [{rotate: '45deg'}] }]} />
                 <Text style={styles.piePercentage}>{((kpis.borrowed_books / (kpis.total_books || 1)) * 100).toFixed(0)}%</Text>
                 <Text style={styles.pieLabel}>Đang Mượn</Text>
               </View>

               <View style={styles.pieItem}>
                 <View style={[styles.pieCircle, { borderColor: '#B4DEBD', borderRightColor: 'transparent', borderBottomColor: 'transparent', transform: [{rotate: '-45deg'}] }]} />
                 <Text style={styles.piePercentage}>{(((kpis.total_books - kpis.borrowed_books) / (kpis.total_books || 1)) * 100).toFixed(0)}%</Text>
                 <Text style={styles.pieLabel}>Khả Dụng</Text>
               </View>
            </View>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7DD" }, // Cream background
  scrollContent: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF7DD" },
  pageTitle: { fontSize: 26, fontWeight: "bold", color: "#1e293b", marginBottom: 20, letterSpacing: 0.5 },
  
  kpiRow: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', justifyContent: 'space-between', marginBottom: 20 },
  kpiCard: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 20, 
    marginHorizontal: Platform.OS === 'web' ? 10 : 0,
    marginBottom: Platform.OS === 'web' ? 0 : 15,
    shadowColor: "#80A1BA", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  kpiTitle: { color: '#64748b', fontSize: 14, fontWeight: '600', marginLeft: 10, textTransform: 'uppercase' },
  kpiValue: { color: '#1e293b', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  kpiSubtitle: { color: '#94a3b8', fontSize: 12 },

  mainGrid: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', flex: 1 },
  leftColumn: { flex: 1, marginRight: Platform.OS === 'web' ? 20 : 0, marginBottom: Platform.OS === 'web' ? 0 : 20 },
  rightColumn: { flex: 1.5 },
  
  panel: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: "#80A1BA", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: '#E5E7EB', flex: 1 },
  panelTitle: { color: '#1e293b', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  
  storageOverviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  storageMetric: { alignItems: 'center' },
  storageValue: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  storageLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#91C4C3', borderRadius: 4 },
  progressText: { textAlign: 'right', color: '#64748b', fontSize: 12, marginTop: 8 },
  
  emptyShelvesList: { marginTop: 15, maxHeight: 300 },
  shelfRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 10 },
  shelfZoneText: { color: '#334155', fontWeight: 'bold', fontSize: 14 },
  shelfDetailText: { color: '#64748b', fontSize: 12, marginTop: 2 },
  emptyBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#BAE6FD' },
  emptyBadgeText: { color: '#0284C7', fontSize: 12, fontWeight: 'bold' },

  barChartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 200, marginTop: 20 },
  barColumn: { alignItems: 'center', flex: 1 },
  barLabelTop: { marginBottom: 8 },
  barLabelText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  barTrack: { width: 30, height: 140, backgroundColor: '#F1F5F9', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#80A1BA', borderRadius: 6 },
  barDateText: { color: '#64748b', fontSize: 11, marginTop: 10 },

  pieContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', flex: 1 },
  pieItem: { alignItems: 'center', position: 'relative' },
  pieCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 15 },
  piePercentage: { position: 'absolute', top: 45, color: '#1e293b', fontSize: 20, fontWeight: 'bold' },
  pieLabel: { color: '#64748b', fontSize: 14, marginTop: 15, fontWeight: '500' }
});
