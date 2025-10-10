import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onFinish: () => void;
}

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ onFinish }) => {
  // Create 5 animated values for the dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const dot4 = useRef(new Animated.Value(0)).current;
  const dot5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create wave animation for each dot with staggered delays
    const createWaveAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: -15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start all animations with staggered delays
    const animations = [
      createWaveAnimation(dot1, 0),
      createWaveAnimation(dot2, 100),
      createWaveAnimation(dot3, 200),
      createWaveAnimation(dot4, 300),
      createWaveAnimation(dot5, 400),
    ];

    animations.forEach(anim => anim.start());

    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(timer);
      animations.forEach(anim => anim.stop());
    };
  }, [onFinish, dot1, dot2, dot3, dot4, dot5]);

  return (
    <View style={styles.container}>
      {/* App Icon centered */}
      <View style={styles.iconContainer}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>

      {/* Animated dots at the bottom */}
      <View style={styles.dotsContainer}>
        <Animated.View
          style={[
            styles.dot,
            {
              transform: [{ translateY: dot1 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              transform: [{ translateY: dot2 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              transform: [{ translateY: dot3 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              transform: [{ translateY: dot4 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              transform: [{ translateY: dot5 }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  icon: {
    width: width * 0.6, // 60% of screen width
    height: width * 0.6, // Keep it square
    maxWidth: 400,
    maxHeight: 400,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 8,
  },
});

export default CustomSplashScreen;

