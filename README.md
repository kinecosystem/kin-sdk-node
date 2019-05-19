# This SDK is work in progress and is not ready for use.

# Kin SDK for Node

Kin SDK for Node is meant to be used as a back-end service. It can perform actions for your client apps (iOS, Android, etc.) 
and also operate as a server for you to build services on top of the Kin blockchain. 
For example, the SDK can communicate with the Kin Blockchain on behalf of the client to create accounts and whitelist transactions. 
It can also monitor blockchain transactions so that you can implement broader services. 
It is up to you how to integrate the SDK in your overall architecture and how to manage your server.

## Requirements.

Make sure you have Node v.8 or higher.

## Installation

```bash
npm install kin-node-sdk
```

Track the development of this SDK on [GitHub](https://github.com/kinecosystem/kin-sdk-node/tree/master).

### Usage with TypeScript

Kin SDK for Node is written in TypeScript, thus typings are available out of the box and will be maintained.  
Of course, Kin SDK can be used from Vanilla JS as well.

### Using Promises

Every method that performs network requests returns a chainable promise instead of a callback.

## Overview

In this introduction, we describe a few basic operations on the Kin Blockchain and some features that are exclusive to Kin SDK for Node:
* Accessing the Kin blockchain
* Managing Kin accounts
* Executing transactions against Kin accounts
* Listen for Kin Payments (Node SDK can monitor all accounts)
* Channels (unique to the back-end SDKs)


### Accessing the Kin Blockchain

The SDK has two main components, `KinClient` and `KinAccount`.  
**KinClient** - used to query the blockchain and perform actions that do not require authentication (e.g., get an account balance)  
**KinAccount** - used to perform authenticated actions on the blockchain (e.g., Send payment)

To initialize the Kin Client, you need to specify an environment (the Test and Production environments are pre-configured).


```javascript
const KinClient = require('@kinecosystem/kin-sdk-node').KinClient;
const Environment = require('@kinecosystem/kin-sdk-node').Environment;

const client = new KinClient(Environment.Testnet);
```

Alternatively, you can configure a custom environment with your own parameters:  
```javascript
const Environment = require('@kinecosystem/kin-sdk-node').Environment;

 const environement = new Environment({
        name: 'my custom environment',
        url: 'network url',
        passphrase: 'network passphrase',
        friendbotUrl: 'friendbot url' //Optional param for testnet only
    });
```

Once you have a `KinClient`, you can use it to get a `KinAccount` object and its associated keypair. Kin SDK for Node generates a keypair based on a secret `seed`. 
Each seed uniquely determines a keypair - if you save a secret seed, you can recreate the associated keypair.

The `KinAccount` object can be initialized in two ways:

* With a single seed:

```javascript 
const account = client.createKinAccount({
            seed: 'seed'
        });
```
* With channels

```javascript
const account = client.createKinAccount({
            seed: 'seed',
            channelSecretKeys: ['channel_seed1', 'channel_seed2', ...]
        });
```
A unique appID can be provided to be added to all your transactions:
```javascript
const account = client.createKinAccount({
            seed: 'seed',
            appId: 'unique_app_id',
            channelSecretKeys: ['channel_seed1', 'channel_seed2', ...]
        });
```
See more about channels in the ["Channels" section](#Channels)

See [Going live with Kin]() to learn more about what an appID is and how to get it.

### Managing Kin Accounts
Most methods provided by the KinClient to query the blockchain about a specific account can also be used from the `KinAccount` object to query the blockchain about itself.

#### Creating and Retrieving a Kin Account

Before you can send or receive Kin, you have to create an account on the blockchain. Do the following:
1. Create a builder for the transaction:
```javascript

account.buildCreateAccount({
        address: 'address',
        startingBalance: 10,
        fee: 100,
        memoText: 'my first account' //a text memo can also be added; memos cannot exceed 21 characters
    })
```    
2. Submit the transaction to the blockchain:
```javascript
        .then(createAccountBuilder => {
            return account.submitTransaction(createAccountBuilder)
        }).then(transactionId => {
                });
```
3. Save the transaction ID for future reference.

#### Account Address
Each account on the Kin blockchain has a public address. The address is identical to the public portion of the keypair created during account creation.

```javascript
const accountAddress = account.publicAddress;
```

#### Checking Whether an Account Exists on the Blockchain
This is the only action you can perform without an account.

```javascript
client.isAccountExisting('address')
        .then(exist => {
            if (exist){
                //do something
            }
        });
```

#### Account Balance and Data
Now that you have an account, you can check its balance.

```javascript
client.getAccountBalance('address')
        .then(balance => {
                    });
```
You may want to use the output of this function in your applicationS code.
You can get addtional information on the account with `getAccountData`.

```javascript
client.getAccountData('address')
        .then(accountData => console.log(accountData))
```

The output will look similar to this:

```javascript
{
    id: 'GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ',
    accountId: 'GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ',
    sequenceNumber: 9357771665313568,
    pagingToken: '',
    subentryCount: 1,
    thresholds: {highThreshold: 0, medThreshold: 0, lowThreshold: 0},
    signers:
           [{
               publicKey: 'GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ',
               weight: 1
           }],
    data: {},
    balances:
           [{
               assetType: 'native',
               balance: 2.96005,
               assetCode: undefined,
               assetIssuer: undefined,
               limit: undefined
           }],
    flags: {authRequired: false, authRevocable: false}
}
 ```

#### Keypairs
Several functions that involve seeds and keypairs are available.

###### Creating a New Random Keypair
```javascript
const KeyPair = require('kin-sdk-node').KeyPair;

const newKeyPair = KeyPair.generate();
```

###### Creating a Keypair from an Existing Seed
```javascript
const keyPair = KeyPair.fromSeed('seed');
```

###### Getting the Public Address from a Seed
```javascript
const publicAddress = KeyPair.fromSeed('seed');
```

###### Generate a Deterministic Keypair
Given the same seed and salt (addtional passphrase), the same seed will always be generated
```javascript
const hdKeyPair = KeyPair.generateHDSeed('seed', 'salt');
```

### Transactions
Transactions are performed on the Kin blockchain in a two-step process:

1. **Building** the transaction, including calculation of the transaction hash. The hash is used as a transaction ID and is necessary to query the status of the transaction.
2. **Sending** the transaction to servers for execution on the blockchain.


#### Transferring Kin to Another Account
To transfer Kin to another account, you need the account's public address.

By default, your user will need to pay a fee to transfer Kin or perform any other blockchain transaction. The fees for individual transactions are trivial - 0.01 Kin.

Some apps can be added to the Kin whitelist, a set of pre-approved apps whose users will not be charged any fee for performing transactions. If your app is on the whitelist, see section Transferring Kin to Another Account Using Whitelist Service.

The snippet Transfer Kin will transfer 20 Kin to the recipient account "GDIRGGTBE3H4CUIHNIFZGUECGFQ5MBGIZTPWGUHPIEVOOHFHSCAGMEHO".

Step 1: Build the transaction
```javascript
   account.buildCreateAccount({
        address: destination,
        startingBalance: 1000,
        fee: 100,
        memoText: 'tx memo'
    }).then(builder => {
        //use the builder
    });
```

Step 2 (optional): Create a builder with a channel   
To enable parallel processing of multiple transactions by the blockchain, you may want to use channels. To acquire a channel:

```javascript
account.channelsPool.acquireChannel(channel => {
        account.buildSendKin({
            address: destination,
            amount: 1000,
            fee: 100,
            memoText: 'tx memo',
            channel: channel
        })
            .then(builder => account.submitTransaction(builder));
    });
```
Note: A channel is a resource that has to be released after use. You should use channels only within the above function. In that case, the SDK will release the channel back to the channels pool, so it will be available for later use.

Step 3: Send the transaction
```javascript
account.buildSendKin({    
        address: destination,    
        amount: 1000,    
        fee: 100,    
        memoText: 'tx memo',    
        channel: channel    
    })    
        .then(builder => {    
            return account.submitTransaction(builder)    
        });    
```

Or, with a channel:

account.channelsPool.acquireChannel(channel => {
        account.buildSendKin({
            address: destination,
            amount: 1000,
            fee: 100,
            memoText: 'tx memo',
            channel: channel
        })
            .then(builder => {
                return account.submitTransaction(builder)
            });
    });
```

#### Transferring Kin to Another Account Using Whitelist Service
The Kin blockchain also allows for transactions to be performed with no fee. Apps and services have to be approved first (for details, see [Going live with Kin](). After your service has been added to the whitelist, you will be able to whitelist transactions for your clients. To have their transactions whitelisted, your clients will send HTTP requests containing their transactions to your Node server. You will then whitelist the transactions and return them to the clients to send to the blockchain. 

```javascript
const whitelistedTransaction = account.whitelistTransaction(clientTransaction);
```

Note that if you are whitelisted, any payment sent from a server developed with the Node SDK is already considered whitelisted, so the server transactions will not need the above step.

<!--
### Decoding Transactions
When clients send you transactions for whitelisting, they will be encoded. It is recommended to decode each transaction and verify its details before whitelisting it. Use `decodeTransaction` to do that:

```javascript
const decodedTransaction = client.decodeTransaction(encodedTransaction);
```
-->
#### Getting the Minimum Acceptable Fee from the Blockchain
Transactions usually require a fee {to whom?} to be processed. The fee depends on how fast the transaction will be processed by the blockchain. To find out what the minimum acceptable fee is, use:

```javascript
client.getMinimumFee()
        .then(minFee =>{
            //save minimum fee
        });
```

#### Getting Transaction Data
To review a transaction, use `getTransactionData` with the transaction's ID:

```javascript
client.getTransactionData('transactionId')
        .then(transactionData => {
            
        });
```
The returned object will be one of the following:   
* PaymentTransaction - in case of a simple payment transaction between two accounts.
```typescript
interface PaymentTransaction {
	fee: number;
	hash: string;
	sequence: number;
	source: string;
	signatures: xdr.DecoratedSignature[],
	amount: number;
	destination: string;
	memo?: string;
}
```
* CreateAccountTransaction - in case of a simple Create Account transaction.
```typescript
interface CreateAccountTransaction {
	fee: number;
	hash: string;
	sequence: number;
	source: string;
	signatures: xdr.DecoratedSignature[],
	destination: string;
	startingBalance: number;
	memo?: string;
}
```
* RawTransaction - when the transaction includes more than a single operation or more advanced operation types.
```typescript
interface RawTransaction {
	fee: number;
	hash: string;
	sequence: number;
	source: string;
	signatures: xdr.DecoratedSignature[],
	memo?: Memo;
	operations: Operation[];
}
```

### Friendbot
If a friendbot endpoint is provided when creating the environment (it is provided with the `Environment.Testnet`), 
you will be able to use the friendbot method to call a service that will create an account for you, or fund an existing account with Kin.

```javascript
client.friendbot({
        address: 'address',
        amount: 100
    })
        .then(transactionId => {
            //in case of success, the transaction id of the funding/creating transaction will be returned.  
        });
```


## Listening for Kin Payments
These methods can be used to listening for Kin payment that an account or multiple accounts are sending or receiving.

While SDKs designed for client apps such as iOS and Android can listen for an accounts associated with their local users, 
the Node SDK can monitor other users' accounts. This feature is currently unique to the backend SDKs.

It is possible to monitor multiple accounts using `createPaymentListener`. This function will continuously get data about **all** accounts on the blockchain, and you can specify which accounts you want to monitor.

```javascript
const paymentListener = client.createPaymentListener({
        onPayment: payment => {
            console.log(payment);
        },
        addresses: ['address1', 'address2']
    });
```

You can freely add accounts to this monitor or remove them:

```javascript
paymentListener.addAddress('address3');
paymentListener.removeAddress('address1');
```

### Stopping a Monitor
When you are done monitoring, stop the monitor to terminate the connection to the blockchain.

```javascript
paymentListener.close();
```

## Channels

The Kin Blockchain is based on the the Stellar blockchain. One of the most sensitive points in Stellar is [transaction sequence](https://www.stellar.org/developers/guides/concepts/transactions.html#sequence-number).
For a transaction to be submitted successfully, its sequence number should be correct. However, if you have several SDK instances, each working with the same wallet account or channel accounts, sequence collisions will occur.

We highly recommend to keep only one KinAccount instance in your application and to have unique channel accounts.
Depending on the nature of your application, here are our recommendations:

1. Have a simple (command line) script that sends transactions on demand or only once in a while. In this case, the SDK can be instantiated with only the wallet key, and channel accounts are not necessary.

2. Have a single application server that should handle a stream of concurrent transactions.
 In this case, you need to make sure that only a single instance of a `KinAccount` initialized with multiple channel accounts.

3. Have a number of load-balanced application servers. Each application server should have the setup outlined above and its own channel accounts. This way, you ensure that there are no collisions in your transaction sequences.

### Creating Channels
The Kin SDK allows you to create HD (highly deterministic) channels based on your seed and a passphrase to be used as a salt. 
As long as you use the same seed and passphrase, you will always get the same list of seeds.

`Channels.createChannels` will create those channels on the Kin blockchain using the base seed account.

```
const Channels = require('kin-sdk-node').Channels;

const channels = Channels.createChannels({
        environment: Environment.Testnet,
        baseSeed : 'base seed',
        salt: 'seed',
        channelsCount : 'channels count',
        startingBalance: 'starting balance for each channel'
    });
```

`channels` will be a list of `KeyPair` objects representing the seeds the SDK created for you. They can be used when initializing the `KinAccount` object.

If you just want to get the list of the channels generated from your seed + passphrase combination without actually creating them,
use this function to get a list of `KeyPair` objects.

```
const channels = Channels.generateSeeds({
        masterSeed: 'master seed',
        salt: 'seed',
        channelsCount : 'channels count'
    });
```

## Error Handling

The Kin SDK for Node can produce several types of errors, such as IO (network) errors, invalid input errors, and transaction errors.
Each Error object contains a `type` field that can be used for identifying the error.

Examples of Kin SDK primary errors:
```javascript
switch (err.type) {
  case 'NetworkError':
    // Network availability error. 
    break;
  case 'ServerError':
    // The blockchain returns an error.
    err.errorCode; //The returned error code from Horizon server.
    break;
  case 'AccountNotFoundError':
    // Some operation performed an account that wasn't created on the Kin blockchain.
    err.accountId; // the requested account Id that wasn't found.
    break;
  case 'TransactionFailedError':
    // An error occurred when trying to send a transaction.
    break;
  default:
    // Handle any other types of unexpected errors
    break;
}
```
For full error list, see error declaration at `index.d.ts`.

## License
The code is currently released under [MIT license](LICENSE).
