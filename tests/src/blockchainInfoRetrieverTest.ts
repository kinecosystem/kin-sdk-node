import {Server} from "@kinecosystem/kin-sdk";
import * as nock from "nock";
import {ServerError} from "../../scripts/bin/errors";
import {BlockchainInfoRetriever} from "../../scripts/bin/blockchain/blockchainInfoRetriever";

const fakeUrl = "https://horizon-testnet.kininfrastructure.com";
let blockchainInfoRetriever: BlockchainInfoRetriever;

describe("BlockchainInfoRetriever.getMinimumFee", async () => {
	beforeAll(async () => {
		blockchainInfoRetriever = new BlockchainInfoRetriever(new Server(fakeUrl, {allowHttp: true}));
	});

	test("got response, return minimum fee in stroops", async () => {
		nock(fakeUrl)
			.get(() => true)
			.reply(200,
				{
					"_links": {
						"self": {
							"href": "https://horizon-testnet.kininfrastructure.com/ledgers?cursor=&limit=1&order=desc"
						},
						"next": {
							"href": "https://horizon-testnet.kininfrastructure.com/ledgers?cursor=5335483252998144&limit=1&order=desc"
						},
						"prev": {
							"href": "https://horizon-testnet.kininfrastructure.com/ledgers?cursor=5335483252998144&limit=1&order=asc"
						}
					},
					"_embedded": {
						"records": [
							{
								"_links": {
									"self": {
										"href": "https://horizon-testnet.kininfrastructure.com/ledgers/1242264"
									},
									"transactions": {
										"href": "https://horizon-testnet.kininfrastructure.com/ledgers/1242264/transactions{?cursor,limit,order}",
										"templated": true
									},
									"operations": {
										"href": "https://horizon-testnet.kininfrastructure.com/ledgers/1242264/operations{?cursor,limit,order}",
										"templated": true
									},
									"payments": {
										"href": "https://horizon-testnet.kininfrastructure.com/ledgers/1242264/payments{?cursor,limit,order}",
										"templated": true
									},
									"effects": {
										"href": "https://horizon-testnet.kininfrastructure.com/ledgers/1242264/effects{?cursor,limit,order}",
										"templated": true
									}
								},
								"id": "034af87fc829d819e46bf7bab94670ccccdb6e0ef25aa01352bd50fb03e41695",
								"paging_token": "5335483252998144",
								"hash": "034af87fc829d819e46bf7bab94670ccccdb6e0ef25aa01352bd50fb03e41695",
								"prev_hash": "4279c8b238590f9ef69809db44d35ed5762ea5de02864269053554409c45f626",
								"sequence": 1242264,
								"transaction_count": 0,
								"operation_count": 0,
								"closed_at": "2019-02-28T07:18:18Z",
								"total_coins": "10000000000000.00000",
								"fee_pool": "3.05300",
								"base_fee_in_stroops": 233,
								"base_reserve_in_stroops": 0,
								"max_tx_set_size": 500,
								"protocol_version": 9,
								"header_xdr": "AAAACUJ5yLI4WQ+e9pgJ20TTXtV2LqXeAoZCaQU1VECcRfYm2YZUMwQOyzcSowmLeiH14nb1Z9Ilu7/EbXo850NRB4UAAAAAXHeLOgAAAAAAAAAA3z9hmASpL9tAVxktxD3XSOp3itxSvEmM6AUkwBS4ERlHBXP/PtcK7+W3jHUG2/8ooNWmaLbQ9VNlz2Lxz/yCvQAS9JgN4Lazp2QAAAAAAAAABKiUAAAAAAAAAAAAAAAAAAAAZAAAAAAAAAH0RwVz/z7XCu/lt4x1Btv/KKDVpmi20PVTZc9i8c/8gr25VlA9yco4hOL3dEXXbfh2R3t02sMqMedSfokYzkRNntYTdVAjVCtPJwSRAxPe5R+ZCIKisWxR/lGjWod0k71txOkIewfrLIh44PcB7uDhZwCXu3GoPfVSR337vsGproMAAAAA"
							}
						]
					}
				}
			);

		expect(await blockchainInfoRetriever.getMinimumFee()).toEqual(233);
	});

	test("error 500, expect ServerError", async () => {
		nock(fakeUrl)
			.get(() => true)
			.reply(500,
				{
					"type": "https://stellar.org/horizon-errors/not_found",
					"title": "Internal server Error",
					"status": 500,
					"detail": "Internal server Error."
				});
		await expect(blockchainInfoRetriever.getMinimumFee()).rejects.toEqual(new ServerError(500));
	});

	test("timeout error, expect NetworkError", async () => {
		nock(fakeUrl)
			.get(() => true)
			.replyWithError({code: 'ETIMEDOUT'});

		await expect(blockchainInfoRetriever.getMinimumFee())
			.rejects.toHaveProperty('type', 'NetworkError');
	});

});
