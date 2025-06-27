import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, Animated, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Quote as QuoteIcon, Trash2, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useStorage } from '@/hooks/useStorage';
import { AddQuoteModal } from '@/components/AddQuoteModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullScreenQuoteCardProps {
  quote: any;
  index: number;
  currentIndex: number;
  onDelete: () => void;
}

const FullScreenQuoteCard: React.FC<FullScreenQuoteCardProps> = ({ quote, index, currentIndex, onDelete }) => {
  const scale = index === currentIndex ? 1 : 0.95;
  const opacity = index === currentIndex ? 1 : 0.7;
  const translateY = (index - currentIndex) * 20;
  
  return (
    <Animated.View 
      style={[
        styles.quoteCard,
        {
          transform: [
            { scale },
            { translateY }
          ],
          opacity,
          zIndex: currentIndex === index ? 100 : 100 - Math.abs(index - currentIndex),
        }
      ]}
    >
      <LinearGradient
        colors={[
          quote.gradientColors?.[0] || '#8B5CF6',
          quote.gradientColors?.[1] || '#EC4899',
          quote.gradientColors?.[2] || '#EF4444'
        ]}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <QuoteIcon size={40} color="#FFFFFF" style={styles.quoteIcon} />
          
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          
          {quote.author && (
            <Text style={styles.authorText}>— {quote.author}</Text>
          )}
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
          >
            <Trash2 size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function QuotesScreen() {
  const { quotes, saveQuotes, loaded } = useStorage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        Animated.spring(scale, {
          toValue: 0.95,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        const threshold = SCREEN_WIDTH * 0.3;
        const velocity = Math.abs(gestureState.vx);
        
        if (gestureState.dx > threshold || (gestureState.dx > 50 && velocity > 0.5)) {
          // Swipe right - previous quote
          swipeToPrevious();
        } else if (gestureState.dx < -threshold || (gestureState.dx < -50 && velocity > 0.5)) {
          // Swipe left - next quote
          swipeToNext();
        } else {
          // Return to center
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const swipeToNext = () => {
    if (currentIndex < quotes.length - 1) {
      Animated.timing(pan, {
        toValue: { x: -SCREEN_WIDTH, y: 0 },
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setCurrentIndex(currentIndex + 1);
        pan.setValue({ x: 0, y: 0 });
        scale.setValue(1);
      });
    } else {
      // Reset animation
      Animated.parallel([
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const swipeToPrevious = () => {
    if (currentIndex > 0) {
      Animated.timing(pan, {
        toValue: { x: SCREEN_WIDTH, y: 0 },
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setCurrentIndex(currentIndex - 1);
        pan.setValue({ x: 0, y: 0 });
        scale.setValue(1);
      });
    } else {
      // Reset animation
      Animated.parallel([
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const deleteQuote = (quoteId: string) => {
    Alert.alert(
      'Delete Quote',
      'Are you sure you want to delete this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedQuotes = quotes.filter(quote => quote.id !== quoteId);
            saveQuotes(updatedQuotes);
            
            // Adjust current index if needed
            if (currentIndex >= updatedQuotes.length && updatedQuotes.length > 0) {
              setCurrentIndex(updatedQuotes.length - 1);
            } else if (updatedQuotes.length === 0) {
              setCurrentIndex(0);
            }
          },
        },
      ]
    );
  };

  if (!loaded) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (quotes.length === 0) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>Quotes</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyState}>
            <QuoteIcon size={64} color="#6B7280" />
            <Text style={styles.emptyStateTitle}>No Quotes Added</Text>
            <Text style={styles.emptyStateText}>
              Add your favorite quotes to see them in full screen
            </Text>
          </View>
          
          <AddQuoteModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={(newQuote) => {
              saveQuotes([...quotes, newQuote]);
              setShowAddModal(false);
            }}
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with controls */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={swipeToPrevious}
            disabled={currentIndex === 0}
          >
            <ArrowLeft size={24} color={currentIndex === 0 ? "#6B7280" : "#FFFFFF"} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.indexText}>
              {currentIndex + 1} / {quotes.length}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Navigation arrows */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={swipeToNext}
          disabled={currentIndex === quotes.length - 1}
        >
          <ArrowRight size={24} color={currentIndex === quotes.length - 1 ? "#6B7280" : "#FFFFFF"} />
        </TouchableOpacity>

        {/* Quote cards stack */}
        <View style={styles.cardsContainer}>
          {quotes.map((quote, index) => {
            if (Math.abs(index - currentIndex) > 2) return null; // Only render nearby cards
            
            return (
              <Animated.View
                key={quote.id}
                style={[
                  styles.cardWrapper,
                  index === currentIndex && {
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { scale }
                    ]
                  }
                ]}
                {...(index === currentIndex ? panResponder.panHandlers : {})}
              >
                <FullScreenQuoteCard
                  quote={quote}
                  index={index}
                  currentIndex={currentIndex}
                  onDelete={() => deleteQuote(quote.id)}
                />
              </Animated.View>
            );
          })}
        </View>

        {/* Pagination dots */}
        <View style={styles.pagination}>
          {quotes.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot
              ]}
              onPress={() => setCurrentIndex(index)}
            />
          ))}
        </View>

        <AddQuoteModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={(newQuote) => {
            saveQuotes([...quotes, newQuote]);
            setShowAddModal(false);
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  indexText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  quoteCard: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  cardGradient: {
    flex: 1,
    padding: 30,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  quoteIcon: {
    marginBottom: 40,
    opacity: 0.8,
  },
  quoteText: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  authorText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
});