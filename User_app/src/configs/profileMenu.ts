

export const PROFILE_MENU = [
  {
    id: 'personal',
    label: 'Personal Details',
    icon: 'user',
    screen: 'PersonalDetailsPage',
  },
  {
    id: 'bookings',
    label: 'My Bookings',
    icon: 'calendar',
    screen: 'MyBookings',
  },
  {
    id: 'addresses',
    label: 'Saved Addresses',
    icon: 'map-pin',
    screen: 'SavedAddressesScreen',
  },
  // {
  //   id: 'payments',
  //   label: 'Payment History',
  //   icon: 'credit-card',
  //   screen: 'PaymentHistoryPage',
  // },
  {
    id: 'invite',
    label: 'Invite & Earn 🎁',
    icon: 'gift',
    screen: 'InviteReferralScreen',
  },
];

export const SUPPORT_MENU = [
  {
    id: 'support',
    label: 'Support / Help',
    icon: 'headphones',
    screen: 'HelpCenterPage',
  },
  {
    id: 'about',
    label: 'About Gigi',
    icon: 'info',
    screen: 'AboutPage',
  },
  {
    id: 'terms',
    label: 'Terms & Conditions',
    icon: 'file-text',
    screen: 'TermsAndConditionsPage',
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    icon: 'shield',
    screen: '',
    url: 'https://www.gigiman.in/privacy-policy',
  },
];

export const LOGOUT_MENU = [
  {
    id: 'logout',
    label: 'Log Out',
    icon: 'log-out',
    isDestructive: true,
  },
];
