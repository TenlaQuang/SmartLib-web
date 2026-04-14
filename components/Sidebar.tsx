// components/Sidebar.tsx
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Khai báo kiểu dữ liệu cho Props
interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Danh sách Menu CHUẨN theo Use Case của dự án
  const menuItems = [
    { name: "Tổng quan", icon: "pie-chart-outline", route: "/" },
    { name: "Quản lý Sách", icon: "library-outline", route: "/books" },
    {
      name: "Mượn / Trả",
      icon: "swap-horizontal-outline",
      route: "/transactions",
    },
    { name: "Tài khoản & NFC", icon: "card-outline", route: "/users" },
    { name: "Cài đặt hệ thống", icon: "settings-outline", route: "/settings" },
  ];

  return (
    <View style={[styles.sidebar, { width: isOpen ? 240 : 70 }]}>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          const isActive = pathname === item.route;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                isActive && styles.activeItem,
                !isOpen && styles.menuItemCollapsed, // Canh giữa nếu đang thu gọn
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={isActive ? "#00A3AF" : "#6B7280"}
              />

              {/* Chỉ hiển thị Text khi Sidebar đang mở */}
              {isOpen && (
                <Text style={[styles.menuText, isActive && styles.activeText]}>
                  {item.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Nút Đăng xuất ở cuối Sidebar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.menuItem, !isOpen && styles.menuItemCollapsed]}
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          {isOpen && (
            <Text style={[styles.menuText, { color: "#EF4444" }]}>
              Đăng xuất
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    flex: 1,
    transitionDuration: "0.3s", // Hiệu ứng thu phóng mượt mà trên Web
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  menuItemCollapsed: {
    justifyContent: "center", // Canh giữa icon khi thu gọn
    paddingHorizontal: 0,
  },
  activeItem: {
    backgroundColor: "#F0FDFA", // Màu nền xanh nhạt khi active
    borderRightWidth: 4,
    borderRightColor: "#00A3AF",
  },
  menuText: {
    fontSize: 15,
    color: "#4B5563",
    marginLeft: 15,
    fontWeight: "500",
  },
  activeText: {
    color: "#00A3AF",
    fontWeight: "700",
  },
  footer: {
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
  },
});
