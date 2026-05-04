import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getBooks, getLocations, BASE_URL } from "../services/api";

// Component Dropdown tự làm dùng được cho cả Web và Mobile
const CustomDropdown = ({ selectedValue, items, onValueChange, placeholder, style }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = items.find((i: any) => i.value === selectedValue)?.label || placeholder;

  return (
    <View style={[{ position: 'relative', zIndex: isOpen ? 1000 : 1 }, style]}>
      <TouchableOpacity 
        style={styles.dropdownBtn} 
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
         <Text style={styles.dropdownBtnText}>{selectedLabel}</Text>
         <Ionicons name="chevron-down" size={16} color="#6B7280" />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
             {items.map((item: any, index: number) => (
               <TouchableOpacity 
                  key={index} 
                  style={styles.dropdownItem} 
                  onPress={() => { onValueChange(item.value); setIsOpen(false); }}
               >
                 <Text style={styles.dropdownItemText}>{item.label}</Text>
               </TouchableOpacity>
             ))}
             {items.length === 0 && (
               <View style={styles.dropdownItem}>
                 <Text style={[styles.dropdownItemText, {color: '#9CA3AF'}]}>Trống</Text>
               </View>
             )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function TransactionsAndLocations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locsData = await getLocations();
        setLocations(locsData);

        // Thiết lập giá trị mặc định cho Khu Vực và Tủ nếu có dữ liệu
        if (locsData && locsData.length > 0) {
           const uniqueZones = Array.from(new Set(locsData.map((l:any) => l.zone_name).filter(Boolean)));
           if (uniqueZones.length > 0) {
              const initialZone = uniqueZones[0] as string;
              setSelectedZone(initialZone);
              
              const shelvesInZone = Array.from(new Set(locsData.filter((l: any) => l.zone_name === initialZone).map((l:any) => l.shelf_id).filter(Boolean)));
              if (shelvesInZone.length > 0) {
                 setSelectedShelf(shelvesInZone[0] as string);
              }
           }
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Khi Đổi Khu Vực -> Reset lại Tủ đầu tiên của khu vực đó
  useEffect(() => {
    if (selectedZone && locations.length > 0) {
       const shelvesInZone = Array.from(new Set(locations.filter((l: any) => l.zone_name === selectedZone).map((l:any) => l.shelf_id).filter(Boolean)));
       if (shelvesInZone.length > 0) {
           if (!shelvesInZone.includes(selectedShelf)) {
               setSelectedShelf(shelvesInZone[0] as string);
           }
       } else {
           setSelectedShelf(null);
       }
    }
  }, [selectedZone, locations]);

  // Derived Data for Dropdowns
  const zoneOptions = Array.from(new Set(locations.map(l => l.zone_name).filter(Boolean)))
                           .map(z => ({ label: z, value: z }));
                           
  const shelfOptions = selectedZone 
        ? Array.from(new Set(locations.filter(l => l.zone_name === selectedZone).map(l => l.shelf_id).filter(Boolean)))
               .map(s => ({ label: s, value: s }))
        : [];

  // Lọc ra danh sách Các Hàng (Levels) của Tủ đang chọn
  const activeLevels = locations
        .filter(l => l.zone_name === selectedZone && l.shelf_id === selectedShelf)
        .sort((a, b) => (a.level_number || 0) - (b.level_number || 0));

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#FFF7DD' }}>
        <ActivityIndicator size="large" color="#80A1BA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header filter */}
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        
        {/* Khu vực (Zone) - Ở giữa */}
        <View style={styles.centerHeader}>
           <Text style={styles.filterLabel}>Khu vực:</Text>
           <CustomDropdown 
              selectedValue={selectedZone}
              items={zoneOptions}
              onValueChange={setSelectedZone}
              placeholder="Chọn khu vực"
              style={{ width: 220 }}
           />
        </View>

        {/* Tủ (Shelf) - Ở góc phải */}
        <View style={styles.rightHeader}>
           <Text style={styles.filterLabel}>Tủ/Kệ:</Text>
           <CustomDropdown 
              selectedValue={selectedShelf}
              items={shelfOptions}
              onValueChange={setSelectedShelf}
              placeholder="Chọn tủ"
              style={{ width: 140 }}
           />
        </View>
      </View>

      <Text style={styles.subtitle}>Sách được hiển thị tự động lên các kệ gỗ theo số hàng tương ứng của Tủ đã tạo.</Text>

      {/* Main Board */}
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.libraryRoom}>
          {activeLevels.length === 0 ? (
             <Text style={{ textAlign: "center", color: "#9CA3AF", marginTop: 40, fontStyle: "italic" }}>
               Khu vực này hiện chưa được cấu hình Tủ kệ nào.
             </Text>
          ) : (
             activeLevels.map((level) => {
               return (
                 <View key={level.location_id} style={styles.shelfContainer}>
                   {/* Tên hàng */}
                   <View style={styles.shelfLabelPlate}>
                     <Text style={styles.shelfLabelText}>Hàng {level.level_number}</Text>
                   </View>

                   {/* Khung chứa các quyển sách trên tầng kệ này */}
                   <View style={styles.booksRow}>
                     {level.unique_books && level.unique_books.length > 0 ? (
                       level.unique_books.map((ub: any, idx: number) => (
                         <View key={idx} style={[styles.bookWrapper, { alignItems: 'center', width: 90 }]}>
                           {ub.image_url ? (
                             <Image 
                               source={{ uri: ub.image_url.startsWith('http') ? ub.image_url : BASE_URL + ub.image_url }} 
                               style={styles.bookCover} 
                               resizeMode="cover"
                             />
                           ) : (
                             <View style={styles.bookPlaceholder}>
                               <Text style={styles.bookSpineText} numberOfLines={2}>
                                 {ub.title}
                               </Text>
                             </View>
                           )}
                           <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, borderWidth: 1, borderColor: '#D97706' }}>
                             <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#B45309' }}>SL: {ub.total_copies}</Text>
                           </View>
                         </View>
                       ))
                     ) : (
                       <Text style={{ color: "#78350F", fontStyle: "italic", alignSelf: "flex-end", paddingBottom: 10 }}>Trống</Text>
                     )}
                   </View>

                   {/* Ván gỗ kệ sách 3D (Wooden Board) */}
                   <View style={styles.woodenBoard}>
                      <View style={styles.boardHighlight}></View>
                      <View style={styles.boardShadow}></View>
                   </View>
                 </View>
               );
             })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: 'transparent'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    zIndex: 10, // Quan trọng để Dropdown không bị che
  },
  centerHeader: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 20,
  },
  rightHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 15,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginRight: 10,
  },
  subtitle: { 
    fontSize: 14, 
    color: "#6B7280", 
    marginBottom: 24,
    textAlign: 'center'
  },
  // Khung Cabinet thư viện nền gỗ nhạt
  libraryRoom: {
    backgroundColor: "#F3D5A5", 
    padding: 20,
    borderRadius: 8,
    borderWidth: 10,
    borderColor: "#A36B36", 
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
    minHeight: 400,
    zIndex: 1,
  },
  // Mỗi một tầng kệ
  shelfContainer: {
    marginBottom: 60, 
    minHeight: 160,
    justifyContent: "flex-end",
  },
  shelfLabelPlate: {
    position: "absolute",
    top: -20,
    left: 20,
    backgroundColor: "#78350F", 
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#451A03",
    zIndex: 10, 
  },
  shelfLabelText: {
    color: "#FEF3C7",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  booksRow: {
    flexDirection: "row",
    alignItems: "flex-end", 
    paddingHorizontal: 20,
    flexWrap: "wrap",
    gap: 15,
    paddingBottom: 2, 
  },
  bookWrapper: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 5,
    elevation: 3, 
  },
  bookCover: {
    width: 90,
    height: 130, 
    borderTopRightRadius: 4,
    borderBottomRightRadius: 2,
    borderLeftWidth: 3, 
    borderLeftColor: "rgba(255,255,255,0.3)",
  },
  bookPlaceholder: {
    width: 30, 
    height: 130,
    backgroundColor: "#991B1B", 
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#7F1D1D",
    padding: 2,
  },
  bookSpineText: {
    color: "#FEF2F2",
    fontSize: 10,
    fontWeight: "bold",
    transform: [{ rotate: "90deg" }], 
    width: 120, 
    textAlign: "center",
  },
  // Ván gỗ
  woodenBoard: {
    height: 25,
    backgroundColor: "#C2894D", 
    borderRadius: 2,
    position: "relative",
  },
  boardHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)", 
  },
  boardShadow: {
    position: "absolute",
    bottom: -10, 
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "rgba(0,0,0,0.15)", 
  },

  // Style cho custom dropdown
  dropdownBtn: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    backgroundColor: '#FFF' 
  },
  dropdownBtnText: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  dropdownMenu: { 
    position: 'absolute', 
    top: 45, 
    left: 0, 
    right: 0, 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 5, 
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemText: { fontSize: 14, color: '#4B5563' }
});
