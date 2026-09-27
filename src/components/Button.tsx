import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Gradients } from '../constants/Colors';
import { Fonts } from '../constants/Typography';
import AppIcon, { AppIconName } from './AppIcon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  loading?: boolean;
  icon?: AppIconName;
  variant?: 'primary' | 'dark' | 'outline' | 'ghost';
  size?: 'md' | 'sm';
}

function Button({
  title,
  onPress,
  style,
  textStyle,
  disabled,
  loading,
  icon,
  variant = 'primary',
  size = 'md',
}: ButtonProps): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const inactive = disabled || loading;

  const pressIn = () => {
    if (inactive) return;
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };
  const pressOut = () => {
    if (inactive) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 9 }).start();
  };

  // Forward-pointing icons read as "go" and belong after the label.
  const trailing = icon === 'arrowRight';
  const onLight = variant === 'outline' || variant === 'ghost';
  const contentColor = onLight ? (variant === 'ghost' ? Colors.textLight : Colors.text) : Colors.white;
  const pad = size === 'sm' ? styles.padSm : styles.padMd;

  const content = (
    <View style={[styles.content, pad]}>
      {loading ? (
        <ActivityIndicator color={contentColor} size="small" />
      ) : (
        <>
          {icon && !trailing ? <AppIcon name={icon} size={size === 'sm' ? 16 : 18} color={contentColor} /> : null}
          <Text
            style={[
              styles.text,
              size === 'sm' && styles.textSm,
              { color: contentColor },
              icon ? (trailing ? styles.textBeforeIcon : styles.textWithIcon) : null,
              textStyle,
            ]}>
            {title}
          </Text>
          {icon && trailing ? <AppIcon name={icon} size={size === 'sm' ? 16 : 18} color={contentColor} /> : null}
        </>
      )}
    </View>
  );

  return (
    <TouchableWithoutFeedback
      onPress={inactive ? undefined : onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}>
      <Animated.View
        style={[
          styles.button,
          variant === 'primary' && styles.primaryShadow,
          variant === 'dark' && styles.dark,
          variant === 'outline' && styles.outline,
          variant === 'ghost' && styles.ghost,
          disabled && styles.disabled,
          style,
          { transform: [{ scale }] },
        ]}>
        {variant === 'primary' ? (
          <LinearGradient colors={[...Gradients.brand]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.gradient}>
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: { borderRadius: 16 },
  primaryShadow: {
    shadowColor: '#3F5BEF',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    backgroundColor: Colors.accent,
  },
  dark: { backgroundColor: Colors.ink },
  outline: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padMd: { paddingVertical: 15, paddingHorizontal: 24 },
  padSm: { paddingVertical: 9, paddingHorizontal: 16 },
  text: {
    fontSize: 16,
    fontFamily: Fonts.bodyBold,
    textAlign: 'center',
  },
  textSm: { fontSize: 13.5 },
  textWithIcon: { marginLeft: 8 },
  textBeforeIcon: { marginRight: 8 },
});

export default Button;
