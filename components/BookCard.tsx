import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { BASE_URL } from '../services/api';

interface BookCardProps {
  book: any;
  onPress?: (book: any) => void;
}

export default function BookCard({ book, onPress }: BookCardProps) {
  const [imageError, setImageError] = useState(false);

  // Xử lý đường dẫn ảnh (thêm BASE_URL nếu là đường dẫn tương đối)
  const getImageUrl = () => {
    if (!book.image_url) return null;
    if (book.image_url.startsWith('http')) return book.image_url;
    return `${BASE_URL}${book.image_url}`;
  };

  const imageUrl = getImageUrl();

  // Định dạng VNĐ
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(book.market_price || 0);

  // Hiển thị vị trí kệ
  const locationString = book.location 
    ? `${book.location.zone_name} - ${book.location.shelf_id} (Tầng ${book.location.level_number})`
    : 'Chưa xếp kệ';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(book)} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {!imageError && imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image} 
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText} numberOfLines={3}>
              {book.title}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author || 'Chưa rõ tác giả'}</Text>
        
        {book.category && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{book.category.name}</Text>
          </View>
        )}

        <Text style={styles.location} numberOfLines={1}>📍 {locationString}</Text>
        <Text style={styles.price}>{formattedPrice}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    margin: 8,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  infoContainer: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
  },
  location: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
  }
});
