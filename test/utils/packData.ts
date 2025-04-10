import { ethers } from "hardhat";

const abiCoder = new ethers.AbiCoder();

export type CrossChainProof = {
  proofType: string;
  proof: string;
};

export type PassportDataStruct = {
  publicKey: string;
  passportHash: string;
  linkIdSignature: bigint;
};

export function packZKProof(inputs: string[], a: string[], b: string[][], c: string[]): string {
  return abiCoder.encode(
    ["uint256[] inputs", "uint256[2]", "uint256[2][2]", "uint256[2]"],
    [inputs, a, b, c],
  );
}

export async function packSignedPassportData(
  passportData: PassportDataStruct,
  passportCredentialIssuer: any,
  signer: any,
): Promise<string> {
  const message = ethers.solidityPackedKeccak256(
    ["string", "address", "bytes32", "bytes32", "uint256"],
    [
      await passportCredentialIssuer.REGISTRATION_PREFIX(),
      await passportCredentialIssuer.getAddress(),
      passportData.passportHash,
      passportData.publicKey,
      passportData.linkIdSignature,
    ],
  );

  const signature = await signer.provider.send("eth_sign", [signer.address, message]);

  return abiCoder.encode(
    [
      "tuple(" +
        "bytes32 publicKey," +
        "bytes32 passportHash," +
        "uint256 linkIdSignature," +
        "bytes signature," +
        ")[]",
    ],
    [[{ ...passportData, signature }]],
  );
}

export function packCrossChainProofs(proofs: CrossChainProof[]): string {
  return abiCoder.encode(["tuple(" + "string proofType," + "bytes proof" + ")[]"], [proofs]);
}

export function prepareProof(proof: any) {
  const { pi_a, pi_b, pi_c } = proof;
  const [[p1, p2], [p3, p4]] = pi_b;
  const preparedProof = {
    pi_a: pi_a.slice(0, 2),
    pi_b: [
      [p2, p1],
      [p4, p3],
    ],
    pi_c: pi_c.slice(0, 2),
  };

  return { ...preparedProof };
}
