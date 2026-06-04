// app/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Slot, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView
} from "react-native";
import Sidebar from "../components/Sidebar";
import { BASE_URL } from "../services/api";

export default function RootLayout() {
  // State quản lý việc Sidebar đang mở hay thu gọn (Mặc định thu gọn)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Lấy thông báo cũ chưa duyệt khi mới vào web
    const fetchPendingNotifications = async () => {
      try {
        const res = await fetch(BASE_URL + "/api/admin/pending-notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (e) {
        console.error("Lỗi lấy thông báo admin:", e);
      }
    };
    fetchPendingNotifications();

    const wsUrl = BASE_URL.replace("http://", "ws://").replace("https://", "wss://") + "/ws/admin-notifications";
    let ws: WebSocket;
    
    const connectWs = () => {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type && data.message) {
            const newNotif = {
              id: Date.now().toString() + Math.random().toString(),
              message: data.message,
              type: data.type,
              read: false,
              time: new Date()
            };
            setNotifications(prev => [newNotif, ...prev]);
          }
        } catch (e) {}
      };
      
      ws.onclose = () => {
         setTimeout(connectWs, 3000); // Reconnect sau 3s
      };
    };
    
    connectWs();
    return () => { if (ws) ws.close(); };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif: any) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setShowDropdown(false);
    
    if (notif.type === "NEW_BORROW_REQUEST") {
      router.push("/borrow-approvals");
    } else if (notif.type === "NEW_RETURN_REQUEST") {
      router.push("/return-approvals");
    } else if (notif.type === "NEW_REGISTRATION_REQUEST") {
      router.push("/user-approvals");
    }
  };

  const formatTime = (dateInput: any) => {
    if (!dateInput) return "";
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (diff < 1) return "Vừa xong";
    if (diff < 60) return `${diff} phút trước`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours/24)} ngày trước`;
  };

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

        <Text style={[styles.headerTitle, { flex: 1 }]}>SmartLib System</Text>

        <View style={styles.rightHeaderControls}>
          {/* Chuông Thông Báo */}
          <View style={{ position: "relative", marginRight: 20, zIndex: 999 }}>
          <TouchableOpacity 
            style={styles.bellButton} 
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownMenu}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Thông báo</Text>
              </View>
              <ScrollView style={styles.dropdownList} bounces={false}>
                {notifications.length === 0 ? (
                  <Text style={styles.emptyText}>Bạn không có thông báo nào</Text>
                ) : (
                  notifications.map(notif => (
                    <TouchableOpacity 
                      key={notif.id} 
                      style={[styles.notifItem, !notif.read && styles.notifItemUnread]}
                      onPress={() => handleNotificationClick(notif)}
                    >
                      {!notif.read && <View style={styles.dot} />}
                      <View style={styles.notifContent}>
                        <Text style={[styles.notifMessage, !notif.read && styles.notifMessageUnread]}>
                          {notif.message}
                        </Text>
                        <Text style={styles.notifTime}>{formatTime(notif.time)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
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
  rightHeaderControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  userMenu: {
    flexDirection: "row",
    alignItems: "center",
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
  bellButton: {
    padding: 5,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 4,
    backgroundColor: "#EF4444", // Đỏ giống Youtube
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#80A1BA",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 2,
  },
  dropdownMenu: {
    position: "absolute",
    top: 45,
    right: -10,
    width: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  dropdownList: {
    maxHeight: 350,
  },
  emptyText: {
    padding: 20,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
  },
  notifItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  notifItemUnread: {
    backgroundColor: "#F9FAFB",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
    marginRight: 10,
  },
  notifContent: {
    flex: 1,
  },
  notifMessage: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  notifMessageUnread: {
    fontWeight: "600",
    color: "#111827",
  },
  notifTime: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
});
