import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardOverview() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Tổng quan Hệ thống</Text>

      {/* Cards Thống kê */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="book" size={32} color="#00A3AF" />
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Tổng Sách</Text>
            <Text style={styles.statValue}>1,245</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="wallet" size={32} color="#10B981" />
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Doanh Thu Kì</Text>
            <Text style={styles.statValue}>4.5M VNĐ</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="people" size={32} color="#F59E0B" />
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Sinh Viên Mượn</Text>
            <Text style={styles.statValue}>320</Text>
          </View>
        </View>
      </View>

      {/* Biểu đồ giả lập */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Lưu lượng mượn sách tuần qua</Text>
        <View style={styles.mockChart}>
          {/* Cột giả lập */}
          <View style={styles.barGroup}>
             <View style={[styles.bar, { height: '30%' }]}></View>
             <Text style={styles.barLabel}>T2</Text>
          </View>
          <View style={styles.barGroup}>
             <View style={[styles.bar, { height: '60%' }]}></View>
             <Text style={styles.barLabel}>T3</Text>
          </View>
          <View style={styles.barGroup}>
             <View style={[styles.bar, { height: '40%' }]}></View>
             <Text style={styles.barLabel}>T4</Text>
          </View>
          <View style={styles.barGroup}>
             <View style={[styles.bar, { height: '80%' }]}></View>
             <Text style={styles.barLabel}>T5</Text>
          </View>
          <View style={styles.barGroup}>
             <View style={[styles.bar, { height: '50%' }]}></View>
             <Text style={styles.barLabel}>T6</Text>
          </View>
          <View style={styles.barGroup}>
             <View style={[styles.bar, { height: '90%' }]}></View>
             <Text style={styles.barLabel}>T7</Text>
          </View>
          <View style={styles.barGroup}>
             <View style={[styles.bar, { height: '20%' }]}></View>
             <Text style={styles.barLabel}>CN</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    flexWrap: "wrap",
    gap: 20,
  },
  statCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    flex: 1,
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
  },
  statInfo: {
    marginLeft: 20,
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  chartContainer: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    height: 350,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 20,
  },
  mockChart: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    paddingBottom: 10,
  },
  barGroup: {
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    width: 40,
  },
  bar: {
    backgroundColor: "#00A3AF",
    width: "100%",
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 12,
  }
});
