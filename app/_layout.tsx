// app/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Slot } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Sidebar from "../components/Sidebar";

export default function RootLayout() {
  // State quản lý việc Sidebar đang mở hay thu gọn (Mặc định thu gọn)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header Teal trên cùng */}
      <View style={styles.header}>
        {/* Nút Hamburger Menu để Đóng/Mở Sidebar */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Ionicons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>SmartLib System</Text>

        {/* Thanh tìm kiếm */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
          <TextInput
            placeholder="Tìm mã sách, sinh viên..."
            style={styles.searchInput}
            placeholderTextColor="#E0E0E0"
          />
        </View>

        {/* Menu tài khoản thủ thư */}
        <View style={styles.userMenu}>
          <Text style={styles.userText}>Thủ thư Admin</Text>
          <Ionicons
            name="person-circle"
            size={32}
            color="#FFFFFF"
            style={{ marginLeft: 10 }}
          />
        </View>
      </View>

      {/* Bố cục chính dưới Header */}
      <View style={styles.mainLayout}>
        {/* Truyền state isSidebarOpen vào Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Nội dung trang hiển thị ở đây */}
        <View style={styles.mainContent}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    height: 60,
    backgroundColor: "#80A1BA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10, // Giúp header luôn nổi lên trên
  },
  menuButton: {
    marginRight: 20,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 30,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flex: 1,
    maxWidth: 400,
  },
  searchInput: {
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  userMenu: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  userText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  mainLayout: {
    flex: 1,
    flexDirection: "row",
  },
  mainContent: {
    flex: 1,
    padding: 30,
    backgroundColor: "#FFF7DD", // Màu nền mới
    overflowY: "auto",
  },
});
