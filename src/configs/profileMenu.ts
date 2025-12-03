

export const PROFILE_MENU = [
  {
    id: 'personal',
    label: 'Personal Details',
    icon: 'user',
    screen: 'PersonalDetailScreen',
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
    screen: 'SavedAddresses',
  },
  {
    id: 'payments',
    label: 'Payment History',
    icon: 'credit-card',
    screen: 'PaymentHistory',
  },
];

export const SUPPORT_MENU = [
  {
    id: 'support',
    label: 'Support / Help',
    icon: 'headphones',
    screen: 'HelpCenterPage',
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
