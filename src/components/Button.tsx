import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
}

function Button({ title, onPress, style, textStyle, disabled, variant = 'primary' }: ButtonProps): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };
  const pressOut = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 9 }).start();
  };

  return (
    <TouchableWithoutFeedback onPress={disabled ? undefined : onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          styles.button,
          variant === 'outline' && styles.outlineButton,
          variant === 'ghost' && styles.ghostButton,
          disabled && styles.disabledButton,
          style,
          { transform: [{ scale }] },
        ]}>
        <Text
          style={[
            styles.text,
            variant === 'outline' && styles.outlineText,
            variant === 'ghost' && styles.ghostText,
            textStyle,
          ]}>
          {title}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.ink,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButton: {
    opacity: 0.4,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.bodyBold,
    textAlign: 'center',
  },
  outlineText: {
    color: Colors.text,
  },
  ghostText: {
    color: Colors.textLight,
  },
});

export default Button;
