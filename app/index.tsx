// app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LibraryIndexPage() {
  return (
    <View style={styles.container}>
      {/* Thanh thông báo Option */}
      <View style={styles.selectOptionBar}>
        <Text style={styles.selectOptionText}>Select an Option</Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={styles.selectOptionText.color}
          style={styles.selectOptionArrow}
        />
      </View>

      {/* Văn bản chính lớn */}
      <View style={styles.centerText}>
        <Text style={styles.startByText}>
          Start by{" "}
          <Text style={styles.addCollectionText}>adding a collection.</Text>
        </Text>
      </View>

      {/* Các nút bộ lọc */}
      <View style={styles.filterBar}>
        {/* Nút Filters Teal */}
        <TouchableOpacity style={styles.filterButtonTeal}>
          <Ionicons name="funnel" size={16} color="#FFFFFF" />
          <Text style={styles.filterButtonTextTeal}>Filters</Text>
        </TouchableOpacity>

        {/* Các nút Title/Cover trắng */}
        <View style={styles.filterGroup}>
          <TouchableOpacity style={styles.filterButtonWhite}>
            <Ionicons
              name="list"
              size={16}
              color={styles.filterButtonTextWhite.color}
            />
            <Text style={styles.filterButtonTextWhite}>Title</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButtonWhite}>
            <Ionicons
              name="apps"
              size={16}
              color={styles.filterButtonTextWhite.color}
            />
            <Text style={styles.filterButtonTextWhite}>Cover</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectOptionBar: {
    backgroundColor: "#F2F4F7", // Màu xám nhạt nền Sidebar
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    marginBottom: 40,
  },
  selectOptionText: {
    fontSize: 16,
    color: "#374151", // Màu text chính
    fontWeight: "600",
  },
  selectOptionArrow: {
    marginLeft: 5,
  },
  centerText: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  startByText: {
    fontSize: 32,
    color: "#374151", // Màu text chính
    fontWeight: "bold",
    textAlign: "center",
  },
  addCollectionText: {
    color: "#00A3AF", // Màu xanh Teal chính
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  filterButtonTeal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A3AF", // Màu xanh Teal chính
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  filterButtonTextTeal: {
    color: "#FFFFFF", // Trắng nền
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  filterGroup: {
    flexDirection: "row",
    marginLeft: "auto", // Đẩy sang phải
  },
  filterButtonWhite: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // Trắng nền
    borderWidth: 1,
    borderColor: "#EAEAEC",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  filterButtonTextWhite: {
    color: "#374151", // Màu text chính
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
});
