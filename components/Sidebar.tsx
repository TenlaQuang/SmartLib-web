// components/Sidebar.tsx
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, LayoutAnimation, Platform, UIManager } from 'react-native';

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
                  color={(isActive || isDropdownActive) ? '#00A3AF' : '#6B7280'}
                />
                {isOpen && (
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.menuText, (isActive || isDropdownActive) && styles.activeText]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.isDropdown && (
                       <Ionicons name={usersExpanded ? 'chevron-up' : 'chevron-down'} size={18} color='#6B7280' />
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderRightColor: '#E5E7EB',
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
  activeItem: { backgroundColor: '#F0FDFA', borderRightWidth: 4, borderRightColor: '#00A3AF' },
  menuText: { fontSize: 15, color: '#4B5563', marginLeft: 15, fontWeight: '500' },
  activeText: { color: '#00A3AF', fontWeight: '700' },
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
    color: '#6B7280'
  },
  activeSubmenuText: {
    color: '#00A3AF',
    fontWeight: 'bold'
  },
  bullet: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB', marginRight: 10
  },
  activeBullet: {
    backgroundColor: '#00A3AF'
  },
  footer: { paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10 },
});
