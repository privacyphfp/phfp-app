// Shown to a student once they pick Bank Transfer or Credit Card/Paypal at
// enroll time, so they know where to actually send the money before
// uploading their proof of payment.
export const BANK_ACCOUNTS = [
  {
    bank: 'Metropolitan Bank and Trust Company (METROBANK)',
    branch: 'Ortigas San Miguel Avenue, Pasig City Branch',
    accountName: 'Pranic Healing Foundation of the Philippines',
    accountNumber: '545-3-545-107-008',
    swiftCode: 'MBTCPHMM',
  },
  {
    bank: 'Union Bank Acropolis',
    branch: 'E. Rodriguez Jr. Ave, Bagumbayan, Quezon City',
    accountName: 'Pranic Healing Foundation of the Philippines',
    accountNumber: '000-5300-12194',
    swiftCode: 'UBPHMM',
    contactNumber: '+63 917 852 7434',
  },
];

export const PAYPAL_URL = 'https://www.paypal.com/ncp/payment/TKALJGR3A8JK2';
