import React from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SystemSettings() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Cài đặt hệ thống lõi</Text>

      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="cash-outline" size={24} color="#80A1BA" />
          <Text style={styles.cardTitle}>Quy định Phí phạt & Cọc</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Giá trị phạt trễ hạn mặc định (%) / ngày:</Text>
          <TextInput style={styles.input} value="2.0" editable={false} />
          <Text style={styles.helperText}>Giá trị tính trên giá bìa gốc của cuốn sách.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tỷ lệ phí mượn (%) / ngày:</Text>
          <TextInput style={styles.input} value="1.0" editable={false} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số ngày mượn tối đa cho Sinh viên:</Text>
          <TextInput style={styles.input} value="14" editable={false} />
        </View>

        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Lưu cấu hình</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="hardware-chip-outline" size={24} color="#80A1BA" />
          <Text style={styles.cardTitle}>Thông tin Đầu đọc Card RFID/NFC</Text>
        </View>
        <Text style={{ color: "#4B5563", marginBottom: 10 }}>
          Trạng thái kết nối Server Node MCU: <Text style={{ color: "green", fontWeight: "bold" }}>Đã kết nối</Text>
        </Text>
        <Text style={{ color: "#4B5563" }}>
          Cổng giao tiếp: COM3 / /dev/ttyUSB0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pageTitle: { fontSize: 26, fontWeight: "bold", color: "#1F2937", marginBottom: 24 },
  settingCard: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 10, color: "#111827" },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: "#4B5563", marginBottom: 8, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#1F2937",
    fontSize: 15,
  },
  helperText: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  saveBtn: {
    backgroundColor: "#80A1BA",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 15 }
});
