export type Address = string;
export type TransactionId = string;

export type WhitelistPayload =
	{
		envelope: string,
		// backward compatibility, network_id is the correct one and aligns with python sdk
		networkId: string
	} |
	{
		envelope: string,
		network_id: string
	};
