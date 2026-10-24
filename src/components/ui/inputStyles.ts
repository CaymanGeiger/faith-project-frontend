import { StyleSheet } from 'react-native';
import { componentStyles } from '../../lib/theme/componentStyles';

// Keep the existing shared import stable for the composer and other native inputs.
export const inputStyles = StyleSheet.create(componentStyles.input.native);
