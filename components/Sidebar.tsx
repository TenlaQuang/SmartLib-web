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
  const [borrowExpanded, setBorrowExpanded] = useState(false);

  const menuItems = [
    { name: 'Tổng quan', icon: 'pie-chart-outline', route: '/' },
    { name: 'Xếp Sách & Vị Trí', icon: 'albums-outline', route: '/storage' },
    { name: 'Quản lý Sách', icon: 'library-outline', route: '/books' },
    { 
      name: 'Mượn / Trả', 
      icon: 'swap-horizontal-outline', 
      isDropdown: true,
      expandedState: borrowExpanded,
      setExpandedState: setBorrowExpanded,
      subItems: [
        { name: 'Thư viện Online', route: '/transactions' },
        { name: 'Duyệt mượn sách', route: '/borrow-approvals' },
        { name: 'Duyệt trả sách', route: '/return-approvals' }
      ]
    },
    { 
      name: 'Tài khoản & NFC', 
      icon: 'card-outline', 
      isDropdown: true,
      expandedState: usersExpanded,
      setExpandedState: setUsersExpanded,
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
      item.setExpandedState(!item.expandedState);
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
                  color={(isActive || isDropdownActive) ? '#FFFFFF' : '#FFF7DD'}
                />
                {isOpen && (
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.menuText, (isActive || isDropdownActive) && styles.activeText]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.isDropdown && (
                       <Ionicons name={item.expandedState ? 'chevron-up' : 'chevron-down'} size={18} color='#FFF' />
                    )}
                  </View>
                )}
              </TouchableOpacity>

              {item.isDropdown && item.expandedState && isOpen && (
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

    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#91C4C3',
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
  activeItem: { backgroundColor: '#B4DEBD', borderRightWidth: 4, borderRightColor: '#FFFFFF' },
  menuText: { fontSize: 15, color: '#FFFFFF', marginLeft: 15, fontWeight: '500' },
  activeText: { color: '#FFFFFF', fontWeight: '700' },
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
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  bullet: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginRight: 10
  },
  activeBullet: {
    backgroundColor: '#FFFFFF'
  },
  footer: { paddingBottom: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 10 }
});
