import { Alert, Linking } from 'react-native';

export async function openExternalUrl(
  url: string,
  unavailableMessage = 'This link is not available right now. Please try again later.',
) {
  try {
    const protocol = new URL(url).protocol;
    if (
      protocol !== 'https:' &&
      protocol !== 'tel:' &&
      protocol !== 'mailto:'
    ) {
      throw new Error('Unsupported URL protocol');
    }

    // Android package visibility can make canOpenURL return false for native
    // handlers even when a dialer or email app is available.
    if (protocol === 'tel:' || protocol === 'mailto:') {
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
