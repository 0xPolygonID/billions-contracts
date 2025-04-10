import { ethers } from "hardhat";
import { getChainId } from "./deployment";

const abiCoder = new ethers.AbiCoder();

export type CrossChainProof = {
  proofType: string;
  proof: string;
};

export type PassportDataSigned = {
  linkId: bigint;
  nullifier: bigint;
};

export function packZKProof(inputs: string[], a: string[], b: string[][], c: string[]): string {
  return abiCoder.encode(
    ["uint256[] inputs", "uint256[2]", "uint256[2][2]", "uint256[2]"],
    [inputs, a, b, c],
  );
}

export async function packSignedPassportData(
  passportDataSigned: PassportDataSigned,
  passportCredentialIssuer: any,
  signer: any,
): Promise<string> {
  const signature = await generateEIP712Signature(
    passportDataSigned.linkId,
    passportDataSigned.nullifier,
    passportCredentialIssuer,
    signer,
  );

  return abiCoder.encode(
    [
      "tuple(tuple(" +
        "uint256 linkId," +
        "uint256 nullifier) passportCredentialMsg," +
        "bytes signature," +
        ")[]",
    ],
    [[{ passportCredentialMsg: passportDataSigned, signature }]],
  );
}

async function generateEIP712Signature(
  linkId: bigint,
  nullifier: bigint,
  passportCredentialIssuer: any,
  signer: any,
): Promise<string> {
  const data = {
    linkId,
    nullifier,
  };
  const domain = {
    name: "PassportIssuerV1",
    version: "1.0.0",
    chainId: await getChainId(),
    verifyingContract: await passportCredentialIssuer.getAddress(),
  };

  const types = {
    PassportCredential: [
      {
        name: "linkId",
        type: "uint256",
      },
      {
        name: "nullifier",
        type: "uint256",
      },
    ],
  };
  const signature = await signer.signTypedData(domain, types, data);
  return signature;
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
