import { accountExists, sourceKeys } from '../stellar/operations';

// test command line node -r ts-node/register ./src/testing/verify-stellar-test-account.ts
export async function checkOrCreateTestAccount() {
  const exists = await accountExists(sourceKeys.publicKey());
  // create, fund account, open trustlines
  if (!exists) {
    // https://laboratory.stellar.org/#account-creator?network=test
    console.log('test account not active, create and fund a new test account');
    return;
  }
  console.log('account exists and has funds: ', sourceKeys.publicKey());
}

checkOrCreateTestAccount();
