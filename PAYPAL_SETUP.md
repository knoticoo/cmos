# PayPal Donation Setup

To enable PayPal donations in the footer, follow these steps:

## 1. Create PayPal Developer Account

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Sign in with your PayPal account or create one
3. Navigate to "My Apps & Credentials"

## 2. Create a New App

1. Click "Create App"
2. Choose "Default Application" or "Custom Application"
3. Select "Sandbox" for testing or "Live" for production
4. Note down your **Client ID**

## 3. Update the Footer Component

1. Open `client/src/components/layout/Footer.js`
2. Find this line:
   ```javascript
   script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=USD';
   ```
3. Replace `YOUR_PAYPAL_CLIENT_ID` with your actual PayPal Client ID

## 4. Test the Integration

1. Start the application
2. Click "Buy me a coffee" in the footer
3. Test the PayPal integration with sandbox credentials

## 5. Production Setup

For production:
1. Create a Live app in PayPal Developer Console
2. Use the Live Client ID
3. Update the PayPal script URL to use the Live Client ID

## Environment Variables (Optional)

You can also use environment variables:

1. Create a `.env` file in the client directory:
   ```
   REACT_APP_PAYPAL_CLIENT_ID=your_client_id_here
   ```

2. Update Footer.js to use the environment variable:
   ```javascript
   script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.REACT_APP_PAYPAL_CLIENT_ID}&currency=USD`;
   ```

## Features

- Multiple donation amounts ($3, $5, $10, $20)
- Custom amount input
- PayPal secure payment processing
- Mobile-responsive design
- Modal popup interface

## Troubleshooting

- Make sure your PayPal app is approved and active
- Check browser console for any JavaScript errors
- Verify the Client ID is correct
- Test with PayPal sandbox first before going live
