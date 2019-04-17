import {IAccountDataRetriever} from "../../scripts/src/blockchain/accountDataRetriever";
import {Friendbot} from "../../scripts/src/friendbot";
import * as nock from "nock";
import {FriendbotError, InvalidAddressError, NetworkError} from "../../scripts/src/errors";

const fakeUrl = "http://horizon.com";
const publicAddress = "GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ";
const mockedAccountDataRetriever: IAccountDataRetriever = {
	fetchAccountData: jest.fn(),
	fetchKinBalance: jest.fn(),
	isAccountExisting: jest.fn()
};

describe("Friendbot.createOrFund", async () => {

	let isAccountExistingFn: any;
	let friendBot: Friendbot;

	beforeAll(async () => {
		isAccountExistingFn = mockedAccountDataRetriever.isAccountExisting;
		friendBot = new Friendbot(fakeUrl, mockedAccountDataRetriever);
	});

	test("too long address, expect InvalidAddressError", async () => {
		await expect(friendBot.createOrFund(publicAddress + "A", 30))
			.rejects.toEqual(new InvalidAddressError());
	});

	test("invalid address, expect InvalidAddressError", async () => {
		await expect(friendBot.createOrFund("GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOB", 30))
			.rejects.toEqual(new InvalidAddressError());
	});

	test('account not exist, should create', async () => {
		nock(fakeUrl)
			.get(url => url.includes(publicAddress) && !url.includes("fund"))
			.reply(200,
				{
					"_links": {
						"transaction": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/8da527ef4e20d29c88e9a839c444f0e0b8d2563e0ef9367a4fb3e6287eab3a26"
						}
					},
					"hash": "8da527ef4e20d29c88e9a839c444f0e0b8d2563e0ef9367a4fb3e6287eab3a26",
					"ledger": 1232566,
					"envelope_xdr": "AAAAAM4g8qJrSoZlGw1OsGi1BIggx1m53AuQIS1ofptYAP9dAAAAZAAAAAAAAAacAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAgEVTxDx6yiZnxWiOskXpavJQnJJDscBfdrWb0h7yB2gAAAAAADPhQAAAAAAAAAABWAD/XQAAAEARIcKgWbVTX3TdfNqAVuQClRnUTQIUch4zDYFLxNpQNT8SU3ojjFAZ6KBkujaNxZS+EcJGiyHXtYza9TeZJbIB",
					"result_xdr": "AAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAASzrYAAAAAAAAAAIBFU8Q8esomZ8VojrJF6WryUJySQ7HAX3a1m9Ie8gdoAAAAAAAz4UAAEs62AAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwASzrYAAAAAAAAAAM4g8qJrSoZlGw1OsGi1BIggx1m53AuQIS1ofptYAP9dDeCj/KuOz2cAAAAAAAAGnAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQASzrYAAAAAAAAAAM4g8qJrSoZlGw1OsGi1BIggx1m53AuQIS1ofptYAP9dDeCj/Kta7icAAAAAAAAGnAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
				}
			);

		isAccountExistingFn.mockResolvedValue(false);
		expect(await friendBot.createOrFund(publicAddress, 30)).toEqual("8da527ef4e20d29c88e9a839c444f0e0b8d2563e0ef9367a4fb3e6287eab3a26");
	});

	test('account exist, should fund', async () => {
		nock(fakeUrl)
			.get(url => url.includes(publicAddress) && url.includes("fund"))
			.reply(200,
				{
					"_links": {
						"transaction": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/8da527ef4e20d29c88e9a839c444f0e0b8d2563e0ef9367a4fb3e6287eab3a26"
						}
					},
					"hash": "8da527ef4e20d29c88e9a839c444f0e0b8d2563e0ef9367a4fb3e6287eab3a26",
					"ledger": 1232566,
					"envelope_xdr": "AAAAAM4g8qJrSoZlGw1OsGi1BIggx1m53AuQIS1ofptYAP9dAAAAZAAAAAAAAAacAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAgEVTxDx6yiZnxWiOskXpavJQnJJDscBfdrWb0h7yB2gAAAAAADPhQAAAAAAAAAABWAD/XQAAAEARIcKgWbVTX3TdfNqAVuQClRnUTQIUch4zDYFLxNpQNT8SU3ojjFAZ6KBkujaNxZS+EcJGiyHXtYza9TeZJbIB",
					"result_xdr": "AAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAASzrYAAAAAAAAAAIBFU8Q8esomZ8VojrJF6WryUJySQ7HAX3a1m9Ie8gdoAAAAAAAz4UAAEs62AAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwASzrYAAAAAAAAAAM4g8qJrSoZlGw1OsGi1BIggx1m53AuQIS1ofptYAP9dDeCj/KuOz2cAAAAAAAAGnAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQASzrYAAAAAAAAAAM4g8qJrSoZlGw1OsGi1BIggx1m53AuQIS1ofptYAP9dDeCj/Kta7icAAAAAAAAGnAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
				}
			);

		isAccountExistingFn.mockResolvedValue(true);
		expect(await friendBot.createOrFund(publicAddress, 30)).toEqual("8da527ef4e20d29c88e9a839c444f0e0b8d2563e0ef9367a4fb3e6287eab3a26");
	});

	test('account exist, server error', async () => {
		const errorResponseData = {
			"type": "https://stellar.org/horizon-errors/bad_request",
			"title": "Bad Request",
			"status": 400,
			"detail": "The request you sent was invalid in some way",
			"extras": {
				"invalid_field": "addr",
				"reason": "base32 decode failed: illegal base32 data at input byte 56"
			}
		};
		nock(fakeUrl)
			.get(url => url.includes(publicAddress))
			.reply(400,
				errorResponseData);

		isAccountExistingFn.mockResolvedValue(true);
		await expect(friendBot.createOrFund(publicAddress, 30))
			.rejects.toEqual(new FriendbotError(400, errorResponseData, "Bad Request"));
	});

	test("timeout error, expect NetworkError", async () => {
		nock(fakeUrl)
			.get(url => url.includes(publicAddress))
			.replyWithError({code: 'ETIMEDOUT'});

		isAccountExistingFn.mockResolvedValue(false);
		await expect(friendBot.createOrFund(publicAddress, 30))
			.rejects.toEqual(new NetworkError());
	});


});
