import { lightTheme } from '@rainbow-me/rainbowkit';

export const hoodReliefTheme = {
  ...lightTheme({
    accentColor: '#C4E538',
    accentColorForeground: '#1C1C14',
    borderRadius: 'medium',
    fontStack: 'system',
    overlayBlur: 'small',
  }),
  colors: {
    ...lightTheme().colors,
    modalBackground: '#F7F4E9',
    modalBorder: 'rgba(28,28,20,0.07)',
    profileForeground: '#F7F4E9',
    connectButtonBackground: '#C4E538',
    connectButtonText: '#1C1C14',
    generalBorder: 'rgba(28,28,20,0.12)',
    menuItemBackground: '#EFEAD6',
  },
};
