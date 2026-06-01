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
        <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
          <View style={styles.kpiHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="people" size={26} color="#FFFFFF" />
            </View>
            <Text style={[styles.kpiTitle, { color: '#E0E7FF' }]}>Độc Giả</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#FFFFFF' }]}>{kpis.total_users}</Text>
          <Text style={[styles.kpiSubtitle, { color: '#C7D2FE' }]}>{kpis.active_users} Đang hoạt động</Text>
        </View>

        <View style={[styles.kpiCard, styles.kpiCardSuccess]}>
          <View style={styles.kpiHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="wallet" size={26} color="#FFFFFF" />
            </View>
            <Text style={[styles.kpiTitle, { color: '#D1FAE5' }]}>Thu Nhập Tháng</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#FFFFFF' }]}>{kpis.monthly_income.toLocaleString()} đ</Text>
          <Text style={[styles.kpiSubtitle, { color: '#A7F3D0' }]}>Phí đăng ký & Trễ hạn</Text>
        </View>

        <View style={[styles.kpiCard, styles.kpiCardWarning]}>
          <View style={styles.kpiHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="book" size={26} color="#FFFFFF" />
            </View>
            <Text style={[styles.kpiTitle, { color: '#FEF3C7' }]}>Đang Mượn</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#FFFFFF' }]}>{kpis.borrowed_books}</Text>
          <Text style={[styles.kpiSubtitle, { color: '#FDE68A' }]}>/ {kpis.total_books} tổng số sách</Text>
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
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Lưu Lượng Mượn Sách (7 Ngày)</Text>
              <Ionicons name="bar-chart" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.barChartContainer}>
              {charts.weekly_borrows.map((day: any, idx: number) => {
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
  container: { flex: 1, backgroundColor: "#F1F5F9" }, 
  scrollContent: { padding: 30 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F5F9" },
  pageTitle: { fontSize: 28, fontWeight: "900", color: "#1E293B", marginBottom: 25, letterSpacing: -0.5 },
  
  kpiRow: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', justifyContent: 'space-between', gap: 20, marginBottom: 25 },
  kpiCard: { 
    flex: 1, 
    borderRadius: 24, 
    padding: 24, 
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 15, elevation: 5,
    overflow: 'hidden'
  },
  kpiCardPrimary: { backgroundColor: '#6366F1' },
  kpiCardSuccess: { backgroundColor: '#10B981' },
  kpiCardWarning: { backgroundColor: '#F59E0B' },
  
  iconWrapper: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  kpiTitle: { fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 36, fontWeight: '900', marginBottom: 5 },
  kpiSubtitle: { fontSize: 13, fontWeight: '500' },

  mainGrid: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 20, flex: 1 },
  leftColumn: { flex: 1 },
  rightColumn: { flex: 1.5, gap: 20 },
  
  panel: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 25, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 20, elevation: 3, flex: 1 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  panelTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  
  storageOverviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  storageMetric: { alignItems: 'center', flex: 1, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 16, marginHorizontal: 5 },
  storageValue: { fontSize: 28, fontWeight: '900', color: '#334155' },
  storageLabel: { fontSize: 13, color: '#64748B', marginTop: 5, fontWeight: '600' },
  
  progressBarBg: { height: 12, backgroundColor: '#F1F5F9', borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 10 },
  progressText: { textAlign: 'right', color: '#64748b', fontSize: 13, marginTop: 10, fontWeight: '700' },
  
  emptyShelvesList: { marginTop: 20, maxHeight: 300 },
  shelfRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  shelfZoneText: { color: '#0F172A', fontWeight: '800', fontSize: 15 },
  shelfDetailText: { color: '#64748b', fontSize: 13, marginTop: 4, fontWeight: '500' },
  emptyBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  emptyBadgeText: { color: '#1D4ED8', fontSize: 13, fontWeight: '800' },

  barChartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 220, marginTop: 10, paddingHorizontal: 10 },
  barColumn: { alignItems: 'center', flex: 1 },
  barLabelTop: { marginBottom: 10, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  barLabelText: { color: '#475569', fontSize: 12, fontWeight: '800' },
  barTrack: { width: 32, height: 140, backgroundColor: '#F8FAFC', borderRadius: 16, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#8B5CF6', borderRadius: 16 },
  barDateText: { color: '#64748b', fontSize: 12, marginTop: 12, fontWeight: '600' },

  pieContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', flex: 1, paddingVertical: 20 },
  pieItem: { alignItems: 'center', position: 'relative' },
  pieCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 18 },
  piePercentage: { position: 'absolute', top: 52, color: '#0F172A', fontSize: 24, fontWeight: '900' },
  pieLabel: { color: '#475569', fontSize: 15, marginTop: 20, fontWeight: '700' }
});
