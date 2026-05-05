// components/Sidebar.tsx
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, LayoutAnimation, Platform, UIManager } from 'react-native';
import { checkServerStatus } from '../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [usersExpanded, setUsersExpanded] = useState(false);

  const menuItems = [
    { name: 'Tổng quan', icon: 'pie-chart-outline', route: '/' },
    { name: 'Xếp Sách & Vị Trí', icon: 'albums-outline', route: '/storage' },
    { name: 'Quản lý Sách', icon: 'library-outline', route: '/books' },
    { name: 'Mượn / Trả', icon: 'swap-horizontal-outline', route: '/transactions' },
    { 
      name: 'Tài khoản & NFC', 
      icon: 'card-outline', 
      isDropdown: true,
      subItems: [
        { name: 'Quản lý Sinh Viên', route: '/users-management' },
        { name: 'Duyệt Đăng ký', route: '/user-approvals' }
      ]
    },
    { name: 'Cài đặt hệ thống', icon: 'settings-outline', route: '/settings' },
  ];

  const [isServerOnline, setIsServerOnline] = useState(false);
  const [pingMs, setPingMs] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      const start = Date.now();
      const online = await checkServerStatus();
      setPingMs(Date.now() - start);
      setIsServerOnline(online);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMenuPress = (item: any) => {
    if (item.isDropdown) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setUsersExpanded(!usersExpanded);
    } else {
      router.push(item.route);
    }
  };

  return (
    <View style={[styles.sidebar, { width: isOpen ? 240 : 0, borderRightWidth: isOpen ? 1 : 0 }]}>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          const isActive = !item.isDropdown && pathname === item.route;
          const isDropdownActive = item.isDropdown && item.subItems?.some(sub => pathname === sub.route);

          return (
            <View key={index}>
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  (isActive || (!item.isDropdown && isDropdownActive)) && styles.activeItem,
                  !isOpen && styles.menuItemCollapsed,
                ]}
                onPress={() => handleMenuPress(item)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={(isActive || isDropdownActive) ? '#00f2fe' : '#94a3b8'}
                />
                {isOpen && (
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.menuText, (isActive || isDropdownActive) && styles.activeText]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.isDropdown && (
                       <Ionicons name={usersExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={(isActive || isDropdownActive) ? '#00f2fe' : '#94a3b8'} />
                    )}
                  </View>
                )}
              </TouchableOpacity>

              {item.isDropdown && usersExpanded && isOpen && (
                <View style={styles.submenuContainer}>
                  {item.subItems?.map((sub, sidx) => {
                    const isSubActive = pathname === sub.route;
                    return (
                      <TouchableOpacity
                        key={sidx}
                        style={[styles.submenuItem, isSubActive && styles.activeSubmenuItem]}
                        onPress={() => router.push(sub.route as any)}
                      >
                         <View style={[styles.bullet, isSubActive && styles.activeBullet]} />
                         <Text style={[styles.submenuText, isSubActive && styles.activeSubmenuText]}>{sub.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Render Server Status Widget */}
      {isOpen && (
        <View style={styles.serverStatusContainer}>
          <View style={styles.gaugeWrapper}>
            {/* Simple CSS-based circular gauge using borders */}
            <View style={[styles.gaugeHalfCircle, { borderColor: isServerOnline ? '#10B981' : '#EF4444' }]} />
            <View style={styles.gaugeInner}>
              <Text style={styles.gaugeValue}>{isServerOnline ? `${pingMs}ms` : 'OFF'}</Text>
              <Text style={styles.gaugeLabel}>RENDER</Text>
            </View>
          </View>
          <Text style={styles.serverStatusText}>
            {isServerOnline ? 'Hệ thống đang hoạt động tốt' : 'Mất kết nối máy chủ'}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.menuItem, !isOpen && styles.menuItemCollapsed]}>
          <Ionicons name='log-out-outline' size={24} color='#EF4444' />
          {isOpen && <Text style={[styles.menuText, { color: '#EF4444' }]} numberOfLines={1}>Đăng xuất</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#0f172a', // Dark theme to match dashboard
    paddingVertical: 20,
    borderRightColor: '#1e293b',
    overflow: 'hidden',
    transitionDuration: '0.3s',
  },
  menuContainer: { flex: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  menuItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  activeItem: { backgroundColor: '#1e293b', borderRightWidth: 4, borderRightColor: '#00f2fe' },
  menuText: { fontSize: 15, color: '#94a3b8', marginLeft: 15, fontWeight: '500' },
  activeText: { color: '#00f2fe', fontWeight: '700' },
  submenuContainer: {
    paddingLeft: 45,
    paddingVertical: 5,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    marginLeft: 30,
    marginBottom: 10
  },
  submenuItem: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  activeSubmenuItem: {
  },
  submenuText: {
    fontSize: 14,
    color: '#E0E7FF'
  },
  activeSubmenuText: {
    color: '#00f2fe',
    fontWeight: 'bold'
  },
  bullet: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#64748b', marginRight: 10
  },
  activeBullet: {
    backgroundColor: '#00f2fe'
  },
  footer: { paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10 },
  serverStatusContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  gaugeWrapper: {
    width: 100,
    height: 60,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10
  },
  gaugeHalfCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
    top: 0
  },
  gaugeInner: {
    alignItems: 'center',
    marginBottom: 5
  },
  gaugeValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gaugeLabel: {
    color: '#E0E7FF',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600'
  },
  serverStatusText: {
    color: '#E0E7FF',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic'
  }
});
