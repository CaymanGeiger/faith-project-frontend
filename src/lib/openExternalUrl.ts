import { Alert, Linking } from 'react-native';

export async function openExternalUrl(
  url: string,
  unavailableMessage = 'This link is not available right now. Please try again later.',
) {
  try {
    const protocol = new URL(url).protocol;
    if (protocol !== 'https:' && protocol !== 'tel:') {
      throw new Error('Unsupported URL protocol');
    }

    // Android package visibility can make canOpenURL('tel:') return false even
    // when a device has a dialer. Phone numbers here are fixed support links.
    if (protocol === 'tel:') {
      await Linking.openURL(url);
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      throw new Error('Unsupported URL');
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open link', unavailableMessage);
  }
}
