# This SDK is work in progress and is not ready for use.

# Kin SDK for Node

The Kin SDK for Node is meant to be used as a back-end service. It can perform actions for your client apps (iOS, Android, etc.) 
and also operate as a server for you to build services on top of the Kin blockchain. 
The SDK can for example take care of communicating with the Kin Blockchain on behalf of the client to create accounts and whitelist transactions. 
It can also monitor blockchain transactions so that you can implement broader services. 
It's up to you how to integrate the SDK in your overall architecture and managing server up-time.

## Requirements.

Make sure you have Node >= 8

## Installation

```bash
npm install kin-node-sdk
```

Track the development of this SDK on [GitHub](https://github.com/kinecosystem/kin-sdk-node/tree/master).

### Usage with TypeScript

Kin SDK for node is written in TypeScript, thus typing are available out of the box and will be maintained.  
Of course, Kin SDK can be used from vanilla JS as well.

### Using Promises

Every method that performs network request returns a chainable promise instead of a callbacks.

## Overview

In this introduction we will look at a few basic operations on the Kin Blockchain and some features that are exclusive to the Kin SDK for Node.

You will find:

* Accessing the Kin blockchain
* Managing Kin accounts
* Executing transactions against Kin accounts
* Listen for Kin Payments (Node SDK can monitor all accounts)
* Channels (unique to the back-end SDKs)


### Accessing the Kin blockchain

The SDK has two main components, `KinClient` and `KinAccount`.  
**KinClient** - Is used to query the blockchain and perform actions that don't require authentication (e.g get an account balance)  
**KinAccount** - Is used to perform authenticated actions on the blockchain (e.g Send payment)

To initialize the Kin Client you will need to provide an environment (Test and Production environments are pre-configured)


```javascript
const KinClient = require('@kinecosystem/kin-sdk-node').KinClient;
const Environment = require('@kinecosystem/kin-sdk-node').Environment;

const client = new KinClient(Environment.Testnet);
```

Or you can configure a custom environment with your own parameters:  
```javascript
const Environment = require('@kinecosystem/kin-sdk-node').Environment;

 const environement = new Environment({
        name: 'my custom environment',
        url: 'network url',
        passphrase: 'network passphrase',
        friendbotUrl: 'friendbot url' //Optional param for testnet only
    });
```

Once you have a `KinClient`, you can use it to get a `KinAccount` object and its associated keypair. The Kin SDK for Node generates a keypair based on a secret `seed`. 
There is a unique relationship between seed and keypair; if you save a secret seed you can regenerate the associated keypair.

The `KinAccount` object can be initialized in several ways:

```javascript
// With a single seed:
const account = client.createKinAccount({
            seed: 'seed'
        });

// With channels
const account = client.createKinAccount({
            seed: 'seed',
            channelSecretKeys: ['channel_seed1', 'channel_seed2', ...]
        });

// Additionally, a unique app-id can be provided, this will be added to all your transactions
const account = client.createKinAccount({
            seed: 'seed',
            appId: 'unique_app_id',
            channelSecretKeys: ['channel_seed1', 'channel_seed2', ...]
        });
```
Read more about channels in the ["Channels" section](#Channels)

See [Going live with Kin]() learn more about what an appID is and how to get it.

### Managing Kin accounts
Most methods provided by the KinClient to query the blockchain about a specific account, can also be used from the `KinAccount` object to query the blockchain about itself.

#### Creating and retrieving a Kin account

The very first thing we need to do before you can send or receive Kin is creating an account on the blockchain. This is how you do it:

```javascript

// First, create a builder for the transaction
account.buildCreateAccount({
        address: 'address',
        startingBalance: 10,
        fee: 100,
        memoText: 'my first account' //a text memo can also be added; memos cannot exceed 21 characters
    })
// Then, submit the transaction to the blockchain
        .then(createAccountBuilder => {
            return account.submitTransaction(createAccountBuilder)
        }).then(transactionId => {
            //do something with the transaction Id, for instance save it for future reference
    });
```

#### Account Details
 Each account on the Kin blockchain has a public address. The address is identical to the public portion of the keypair created during account creation.

```javascript
const accountAddress = account.publicAddress;
```

#### Checking if an account exists on the blockchain
There is one thing you can do even without an account, it's checking if an account already existing on the blockchain.

```javascript
client.isAccountExisting('address')
        .then(exist => {
            if (exist){
                //do something
            }
        });
```

#### Account balance and data
Now that you have an account you can check its balance.

```javascript
client.getAccountBalance('address')
        .then(balance => {
            //do something with the balance
        });
```

There is of course a lot more about an account besides its balance. You can get that information with `getAccountData`.

```javascript
client.getAccountData('address')
        .then(accountData => console.log(accountData))
```

The output will look something like this:

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
Earlier we talked about the relationship between keypairs and secret seeds. Here are a few associated functions.

###### Creating a new random keypair
```javascript
const KeyPair = require('kin-sdk-node').KeyPair;

const newKeyPair = KeyPair.generate();
```

###### Creating a keypair from an existing seed
```javascript
const keyPair = KeyPair.fromSeed('seed');
```

###### Getting the public address from a seed
```javascript
const publicAddress = KeyPair.fromSeed('seed');
```

###### Generate a deterministic KeyPair
```javascript
// Given the same seed and salt, the same seed will always be generated
const hdKeyPair = KeyPair.generateHDSeed('seed', 'salt');
```

### Transactions
Transactions are executed on the Kin blockchain in a two-step process.

* **Build** the transaction, including calculation of the transaction hash. The hash is used as a transaction ID and is necessary to query the status of the transaction.
* **Send** the transaction to servers for execution on the blockchain.


#### Transferring Kin to another account
To transfer Kin to another account, you need the public address of the account to which you want to transfer Kin.

By default, your user will need to spend Fee to transfer Kin or process any other blockchain transaction. Fee for individual transactions are trivial 1 Kin = 10E5 Fee.

Some apps can be added to the Kin whitelist, a set of pre-approved apps whose users will not be charged Fee to execute transactions. If your app is in the whitelist then refer to transferring Kin to another account using whitelist service.

The snippet Transfer Kin will transfer 20 Kin to the recipient account "GDIRGGTBE3H4CUIHNIFZGUECGFQ5MBGIZTPWGUHPIEVOOHFHSCAGMEHO".

Step 1: Build the transaction
```javascript
 const builder = account.buildSendKin({
        address: destination,
        amount: 1000,
        fee: 100,
        memoText: 'tx in 3-steps'
    });
```

Step 2: Optional - Update the transaction with a channel
```javascript
 account.channelManager.acquireChannel(channel => {
        builder.setChannel(channel);
    });
```
Step 3: Send the transaction
```javascript
account.submitTransaction(builder);

// Or, with a channel:
account.channelManager.acquireChannel(channel => {
        builder.setChannel(channel);
        account.submitTransaction(builder);
    });
```

#### Transferring Kin to another account using whitelist service
The Kin Blockchain also allows for transactions to be executed with no fee. Apps and services must first be approved, to learn more see [Going live with Kin](). If your service has been added to the whitelist you will be able to whitelist transactions for your clients.

Clients will send an http request to your Node server containing their transaction, you can then whitelist it and return it to the client to send to the blockchain.

```javascript
const whitelistedTransaction = account.whitelistTransaction(clientTransaction);
```

Please note that if you are whitelisted, any payment sent from you (a server developed with the Node SDK) is already considered whitelisted, so there is no need for this step for the server transactions.

### Decode_transaction
When clients send you transactions for whitelisting they will be encoded. You can use `decodeTransaction` to read and then verify the contents.

```javascript
const decodedTransaction = client.decodeTransaction(encodedTransaction);
```

#### Getting the minimum acceptable fee from the blockchain
Transactions usually require a fee to be processed.
To know what is the minimum fee that the blockchain will accept, use:

```javascript
client.getMinimumFee()
        .then(minFee =>{
            //save minimum fee
        });
```

#### Getting Transaction Data
Often times you will want to review a transaction, `getTransactionData` is here to help you.

The function is pretty simple and expects a transaction id:

```javascript
client.getTransactionData('transactionId')
        .then(transactionData => {
            
        });
```

The returned object will be either:   
##### PaymentTransaction

In case of a simple payment transaction between 2 accounts.
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
##### CreateAccountTransaction
In case of a simple create account transaction.
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
##### RawTransaction
In any other cases, when transaction includes more than a single operation, or included more advanced operation types.
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
you will be able to use the friendbot method to call a service that will create an account for you, or fund the account if exist with kin.

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

SDKs designed for client apps such as iOS and Android can listen for an accounts associated with their local users, 
the Node SDK can monitor other users' accounts. This is currently unique to the backend SDKs.

It is possible to monitor multiple accounts using `createPaymentListener`, the function will continuously get data about **all** accounts on the blockchain, 
and will filter for the selected accounts.

```javascript
const paymentListener = client.createPaymentListener({
        onPayment: payment => {
            console.log(payment);
        },
        addresses: ['address1', 'address2']
    });
```

You can freely add or remove accounts to this monitor

```javascript
paymentListener.addAddress('address3');
paymentListener.removeAddress('address1');
```

### Stopping a monitor
When you are done monitoring, make sure to stop the monitor, to terminate the connection to the blockchain.

```javascript
paymentListener.close();
```

## Channels

The Kin Blockchain is based on the the Stellar blockchain. One of the most sensitive points in Stellar is [transaction sequence](https://www.stellar.org/developers/guides/concepts/transactions.html#sequence-number).
In order for a transaction to be submitted successfully, this number should be correct. However, if you have several SDK instances, each working with the same wallet account or channel accounts, sequence collisions will occur.

We highly recommend to keep only one KinAccount instance in your application, having unique channel accounts.
Depending on the nature of your application, here are our recommendations:

1. You have a simple (command line) script that sends transactions on demand or only once in a while. In this case, the SDK can be instantiated with only the wallet key, the channel accounts are not necessary.

2. You have a single application server that should handle a stream of concurrent transactions.
 In this case, you need to make sure that only a single instance of a `KinAccount` initialized with multiple channel accounts.

3. You have a number of load-balanced application servers. Here, each application server should a) have the setup outlined above, and b) have its own channel accounts. This way, you ensure you will not have any collisions in your transaction sequences.

### Creating Channels
The kin sdk allows you to create HD (highly deterministic) channels based on your seed and a passphrase to be used as a salt. 
As long as you use the same seed and passphrase, you will always get the same seeds.

```
const ChannelsManager = require('kin-sdk-node').ChannelsManager;

const channels = ChannelsManager.createChannels({
        environment: Environment.Testnet,
        masterSeed: 'master seed',
        salt: 'seed',
        amount: 'channels amount',
        startingBalance: 'starting balance for each channel'
    });
```

`channels` will be a list of seeds the sdk created for you, that can be used when initializing the KinAccount object.

If you just wish to get the list of the channels generated from your seed + passphrase combination without creating them

```
const channels = ChannelsManager.getHDChannele({
        masterSeed: 'master seed',
        salt: 'seed',
        amount: 'channels amount',
    });
```

## Error Handling

The Kin SDK for Node can produce errors for several reasons, such as IO (network) errors, invalid input, transaction errors.
Each Error object contains `type` field that can be checked for identifying the error.

An example of Kin SDK primary errors:
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
For full errors list see error declaration at `index.d.ts`.

## License
The code is currently released under [MIT license](LICENSE).
