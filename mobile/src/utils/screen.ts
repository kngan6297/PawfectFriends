import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const screenWidth = width;
export const screenHeight = height;

export const isSmallScreen = width < 375;
export const isMediumScreen = width >= 375 && width < 414;
export const isLargeScreen = width >= 414;

export const isTablet = width >= 768;
