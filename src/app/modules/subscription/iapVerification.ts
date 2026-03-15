// // app/modules/subscription/iap-verification.ts
// import fetch from "node-fetch";
// import { google } from "googleapis";

// interface IVerifyResult {
//   transactionId: string;
//   originalTransactionId: string;
//   startDate: Date;
//   endDate: Date;
// }

// /**
//  * Verify Apple receipt
//  * @param receiptData base64 receipt string
//  * @param productId apple product id (e.g., com.mulli.plus.weekly)
//  */
// export const verifyAppleReceipt = async (receiptData: string, productId: string): Promise<IVerifyResult> => {
//   const appleUrl = "https://buy.itunes.apple.com/verifyReceipt"; // production
//   const appleSandboxUrl = "https://sandbox.itunes.apple.com/verifyReceipt"; // sandbox

//   const body = {
//     "receipt-data": receiptData,
//     "password": process.env.APPLE_SHARED_SECRET, // your Apple shared secret
//   };

//   const response = await fetch(appleUrl, {
//     method: "POST",
//     body: JSON.stringify(body),
//     headers: { "Content-Type": "application/json" },
//   });

//   const data = await response.json();

//   // If sandbox response, retry sandbox
//   if (data.status === 21007) {
//     const sandboxResp = await fetch(appleSandboxUrl, {
//       method: "POST",
//       body: JSON.stringify(body),
//       headers: { "Content-Type": "application/json" },
//     });
//     const sandboxData = await sandboxResp.json();
//     return parseAppleReceipt(sandboxData, productId);
//   }

//   if (data.status !== 0) {
//     throw new Error(`Apple receipt verification failed: ${data.status}`);
//   }

//   return parseAppleReceipt(data, productId);
// };

// /**
//  * Parse Apple receipt JSON and extract subscription info
//  */
// const parseAppleReceipt = (data: any, productId: string): IVerifyResult => {
//   const inApp = data.receipt.in_app || data.latest_receipt_info;
//   if (!inApp || !inApp.length) throw new Error("No in-app purchase info found");

//   // Find relevant product
//   const purchase = inApp.reverse().find((p: any) => p.product_id === productId);
//   if (!purchase) throw new Error(`Product ${productId} not found in receipt`);

//   return {
//     transactionId: purchase.transaction_id,
//     originalTransactionId: purchase.original_transaction_id,
//     startDate: new Date(purchase.purchase_date_ms),
//     endDate: new Date(purchase.expires_date_ms),
//   };
// };

// /**
//  * Verify Google Play purchase
//  * @param packageName app package (e.g., com.mulli.app)
//  * @param productId product id (e.g., muli_plus_monthly)
//  * @param purchaseToken purchase token from app
//  */
// export const verifyGoogleReceipt = async (
//   packageName: string,
//   productId: string,
//   purchaseToken: string
// ): Promise<IVerifyResult> => {
//   const auth = new google.auth.GoogleAuth({
//     keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!, // path to JSON
//     scopes: ["https://www.googleapis.com/auth/androidpublisher"],
//   });

//   const client = await auth.getClient();
//   const androidPublisher = google.androidpublisher({ version: "v3", auth: client });

//   const res = await androidPublisher.purchases.subscriptions.get({
//     packageName,
//     subscriptionId: productId,
//     token: purchaseToken,
//   });

//   if (!res.data || !res.data.startTimeMillis || !res.data.expiryTimeMillis) {
//     throw new Error("Invalid Google Play subscription");
//   }

//   return {
//     transactionId: res.data.orderId!,
//     originalTransactionId: res.data.orderId!,
//     startDate: new Date(Number(res.data.startTimeMillis)),
//     endDate: new Date(Number(res.data.expiryTimeMillis)),
//   };
// };