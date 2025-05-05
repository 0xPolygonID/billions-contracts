import * as crypto from "crypto";
import * as cbor from "cbor";
import * as cose from "cose-js";
import axios from "axios";
import AdmZip = require("adm-zip");
import { X509Certificate } from "crypto";
import { Buffer } from "buffer";
import { bytesToHex } from "@0xpolygonid/js-sdk";

async function getNitroRootCertificate(): Promise<Buffer> {
  const rootCertUrl = "https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip";
  const response = await axios.get(rootCertUrl, { responseType: "arraybuffer" });
  const zipData = response.data as Buffer;

  const expectedHash = "8cf60e2b2efca96c6a9e71e851d00c1b6991cc09eadbe64a6a1d1b1eb9faff7c";
  const hash = crypto.createHash("sha256").update(zipData).digest("hex");
  if (hash !== expectedHash) {
    throw new Error("Hash of downloaded root certificate does not match expected hash.");
  }

  const zip = new AdmZip(zipData);

  const certEntry = zip.getEntry("root.pem");
  if (!certEntry) {
    throw new Error("root.pem not found in the downloaded zip file.");
  }
  return certEntry.getData();
}

class EC2NitroAttestationPayload {
  private static PCR_DESCRIPTION: Map<number, string> = new Map<number, string>([
    [0, "enclave image file"],
    [1, "Linux kernel and bootstrap"],
    [2, "application"],
    [3, "IAM role assigned to the parent instance"],
    [4, "instance ID of the parent instance"],
    [8, "Enclave image file signing certificate"],
  ]);

  private rawBytes: Buffer = Buffer.alloc(0);
  private moduleId: string = "";
  private digest: string = "";
  private timestamp: number = 0;
  private pcrs: Map<number, Buffer> = new Map();
  private certificate: Buffer = Buffer.alloc(0);
  private cabundle: Buffer[] = [];

  private protectedHeader?: Buffer;
  private unprotectedHeader?: Buffer;
  private rawPayload?: Buffer;
  private signature?: Buffer;

  publicKey?: Buffer;
  private userData?: Buffer;
  private nonce?: Buffer;

  private x509Certificate!: X509Certificate;
  private x509Cabundle: X509Certificate[] = [];

  constructor(rawBytes: Buffer) {
    const isCoseFormat = rawBytes[0] !== 0xd2;
    if (isCoseFormat) {
      this.rawBytes = Buffer.concat([Buffer.from([0xd2]), rawBytes]);
    } else {
      this.rawBytes = rawBytes;
    }

    const decoded = cbor.decode(this.rawBytes);
    if (decoded instanceof cbor.Tagged) {
      const { tag, value } = decoded;

      if (tag === 18) {
        const cosePayload = this.decodeCose(value);
        this.parseAttestation(cosePayload);
      } else {
        throw new Error(`Unsupported CBOR tag: ${tag}`);
      }
    } else {
      this.parseAttestation(decoded as Record<string, any>);
    }
  }

  private decodeCose(coseMessage: Buffer[]): Record<string, any> {
    if (!Array.isArray(coseMessage) || coseMessage.length < 3) {
      throw new Error("Invalid COSE structure");
    }
    [this.protectedHeader, this.unprotectedHeader, this.rawPayload, this.signature] = coseMessage;
    const decodedPayload = cbor.decode(this.rawPayload);

    if (typeof decodedPayload !== "object" || !decodedPayload) {
      throw new Error("Invalid COSE payload");
    }

    return decodedPayload as Record<string, any>;
  }

  private parseAttestation(payload: Record<string, any>) {
    this.moduleId = payload["module_id"];
    this.digest = payload["digest"];
    this.timestamp = payload["timestamp"];
    this.pcrs = payload["pcrs"];
    this.certificate = payload["certificate"];
    this.cabundle = payload["cabundle"];
    this.publicKey = payload["public_key"];
    this.userData = payload["user_data"];
    this.nonce = payload["nonce"];

    if (!this.moduleId) {
      throw new Error("module_id must be a non-empty string");
    }
    if (this.digest !== "SHA384") {
      throw new Error("digest type must be 'SHA384'");
    }
    if (!this.timestamp) {
      throw new Error("timestamp must be a valid integer");
    }
    if (!this.pcrs) {
      throw new Error("pcrs must be an object");
    }
    if (this.pcrs.size < 1 || this.pcrs.size > 32) {
      throw new Error("pcrs must have at least 1 entry and no more than 32 entries");
    }

    for (const [key, value] of this.pcrs) {
      if (key < 0 || key > 31) {
        throw new Error(`pcrs must have at least 1 entry and no more than 32 entries`);
      }
      if (!Buffer.isBuffer(value)) {
        throw new Error(`pcr map value for key ${key} must be a buffer`);
      }
      if (value.length != 32 && value.length != 48 && value.length != 64) {
        throw new Error(`pcr map key ${key} contents are not 32, 48, or 64 bytes long`);
      }
    }

    if (!Array.isArray(this.cabundle)) {
      throw new Error("cabundle must be a list");
    }
    if (this.cabundle.length < 1) {
      throw new Error("cabundle must contain at least 1 element");
    }
    for (const ca of this.cabundle) {
      if (!Buffer.isBuffer(ca)) {
        throw new Error("cabundle contains non-byte string values");
      }
      if (ca.length < 1 || ca.length > 1024) {
        throw new Error("cabundle entry must be between 1 and 1024 bytes");
      }
    }

    if (this.publicKey) {
      if (!Buffer.isBuffer(this.publicKey)) {
        throw new Error("public_key must be a bytestring");
      }
      if (this.publicKey.length < 1 || this.publicKey.length > 1024) {
        throw new Error("public_key must be between 1 and 1024 bytes");
      }
    }

    if (this.userData) {
      if (!Buffer.isBuffer(this.userData)) {
        throw new Error("user_data must be a bytestring");
      }
      if (this.userData.length < 1 || this.userData.length > 512) {
        throw new Error("user_data must be between 1 and 512 bytes");
      }
    }

    if (this.nonce) {
      if (!Buffer.isBuffer(this.nonce)) {
        throw new Error("nonce must be a bytestring");
      }
      if (this.nonce.length < 1 || this.nonce.length > 512) {
        throw new Error("nonce must be between 1 and 512 bytes");
      }
    }

    this._init_x509();
  }

  private _init_x509() {
    this.x509Cabundle = this.cabundle.map((_) => new X509Certificate(_)).reverse();
    this.x509Certificate = new X509Certificate(this.certificate);
  }

  public cose_key(): { x: Buffer; y: Buffer } {
    const pubKey = this.x509Certificate.publicKey;
    const pubKeyDetails = pubKey.export({ type: "spki", format: "pem" });
    const ecKey = crypto.createPublicKey({
      key: pubKeyDetails,
      format: "pem",
      type: "spki",
    });

    const rawKey = ecKey.export({ format: "jwk" }) as crypto.JsonWebKey;
    const x = rawKey.x;
    const y = rawKey.y;

    if (!x || !y) {
      throw new Error("Can not retrieve x and y coordinates from public key.");
    }

    return {
      x: Buffer.from(x, "base64"),
      y: Buffer.from(y, "base64"),
    };
  }

  private async _chain_validate(
    rootCert: Buffer,
    checkExpiration: boolean = true,
  ): Promise<boolean> {
    try {
      const chain = [this.x509Certificate, ...this.x509Cabundle, new X509Certificate(rootCert)];
      // console.log("Number of certificates", chain.length);
      const now = new Date();

      for (let i = 0; i < chain.length - 1; i++) {
        const subjectCert = chain[i];
        const issuerCert = chain[i + 1];
        // console.log("Issuer Certificate", subjectCert.issuer);
        //console.log("Subject Certificate", subjectCert.raw.toStr1ing("base64"));
        //console.log("Issuer Certificate", issuerCert.raw.toString("base64"));

        const pubKeyDetails = issuerCert.publicKey.export({ type: "spki", format: "pem" });
        const ecKey = crypto.createPublicKey({
          key: pubKeyDetails,
          format: "pem",
          type: "spki",
        });

        const rawKey = ecKey.export({ format: "jwk" }) as crypto.JsonWebKey;
        const x = rawKey.x;
        const y = rawKey.y;
        /* console.log(
          "Issuer Public Key",
          `0x${Buffer.from(x!, "base64").toString("hex")}${Buffer.from(y!, "base64").toString("hex")}`,
        ); */

        const subjectCertValidFrom = new Date(subjectCert.validFrom);
        const subjectCertValidTo = new Date(subjectCert.validTo);

        if (checkExpiration) {
          if (subjectCertValidFrom > now || subjectCertValidTo < now) {
            throw new Error(
              `Certificate validation failed: ${subjectCert.subject} is expired or not yet valid. Valid from ${subjectCertValidFrom}, valid to ${subjectCertValidTo}`,
            );
          }
        }

        if (!subjectCert.verify(issuerCert.publicKey)) {
          throw new Error(
            `Certificate validation failed: ${subjectCert.subject} is not signed by ${issuerCert.subject}`,
          );
        }
      }

      return true;
    } catch (err) {
      console.error("[!] Certificate did not validate:", err);
      return false;
    }
  }

  public getChainOfCertificates(rootCert: Buffer): X509Certificate[] {
    const chain = [this.x509Certificate, ...this.x509Cabundle, new X509Certificate(rootCert)];
    return chain;
  }

  public async validate(rootCert: Buffer, checkExpiration: boolean = true): Promise<boolean> {
    const res = await this._chain_validate(rootCert, checkExpiration);
    if (!res) {
      return false;
    }

    try {
      const verifier = {
        key: this.cose_key(),
      };

      const buf = await cose.sign.verify(this.rawBytes, verifier);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  public async validateInstanceIdhash(): Promise<boolean> {
    const enclaveIdIdx = this.moduleId.lastIndexOf("-");
    const ec2InstanceId = this.moduleId.substring(0, enclaveIdIdx);

    const hashObj = crypto.createHash(this.digest);
    hashObj.update(Buffer.alloc(48, 0));
    hashObj.update(Buffer.from(ec2InstanceId, "utf8"));

    const calculatedHash = hashObj.digest("hex");

    const pcrHashBuffer = this.pcrs.get(4);
    if (!pcrHashBuffer) {
      console.error("PCR 4 is undefined");
      return false;
    }
    return calculatedHash === pcrHashBuffer.toString("hex");
  }

  public toString(): string {
    const parts: string[] = [];
    parts.push(`Nitro Attestation Document for ${this.moduleId}:`);
    parts.push(`- Digest type: ${this.digest}`);
    parts.push(`- Timestamp: ${new Date(this.timestamp).toISOString()}`);
    parts.push("- PCR values:");

    for (const [key, value] of this.pcrs) {
      const pcrNum = Number(key);
      parts.push(
        `  - PCR[${pcrNum}] = ${value.toString("hex")} ` +
          `# ${EC2NitroAttestationPayload.PCR_DESCRIPTION.get(pcrNum) || "<UNUSED>"}`,
      );
    }

    parts.push(`- Certificate issuer: ${this.x509Certificate.issuer.replace(/\n/g, "/")}`);
    parts.push(`- Certificate subject: ${this.x509Certificate.subject.replace(/\n/g, "/")}`);

    parts.push(`Optional fields:`);
    parts.push(`- Public key: ${this.publicKey}`);
    parts.push(`- User data: ${this.userData}`);
    parts.push(`- Nonce: ${this.nonce}`);
    return parts.join("\n");
  }

  public getRawFieldsAttestationBytes(): {
    protectedHeader: string;
    unprotectedHeader: string;
    rawPayload: string;
    signature: string;
  } {
    return {
      protectedHeader: this.protectedHeader ? this.protectedHeader.toString("hex") : "",
      unprotectedHeader:
        this.unprotectedHeader && Object.keys(this.unprotectedHeader).length != 0
          ? this.unprotectedHeader.toString("hex")
          : "",
      rawPayload: this.rawPayload ? this.rawPayload.toString("hex") : "",
      signature: this.signature ? this.signature.toString("hex") : "",
    };
  }
}

export function getPublicKeyCompressed(attestation: string): string {
  let attestationObj = JSON.parse(attestation);
  let attestationBuffer = Buffer.from(attestationObj.attestation, "base64");

  const payload = new EC2NitroAttestationPayload(attestationBuffer);
  const publicKey = payload.cose_key();

  return `0x${bytesToHex(publicKey.x).concat(bytesToHex(publicKey.y))}`;
}

export function getAttestationRawBytes(attestation: string): {
  protectedHeader: string;
  unprotectedHeader: string;
  rawPayload: string;
  signature: string;
} {
  let attestationObj = JSON.parse(attestation);
  let attestationBuffer = Buffer.from(attestationObj.attestation, "base64");

  const payload = new EC2NitroAttestationPayload(attestationBuffer);
  return payload.getRawFieldsAttestationBytes();
}

export async function getChainOfCertificatesRawBytes(attestation: string): Promise<string[]>{
  let attestationObj = JSON.parse(attestation);
  let attestationBuffer = Buffer.from(attestationObj.attestation, "base64");

  const payload = new EC2NitroAttestationPayload(attestationBuffer);
  const rootCert = await getNitroRootCertificate();

  return payload.getChainOfCertificates(rootCert).map((cert) => cert.raw.toString("hex"));
}

export async function validateAttestation(
  attestation: string,
  checkExpiration: boolean = true,
): Promise<string> {
  try {
    let attestationObj = JSON.parse(attestation);
    let attestationBuffer = Buffer.from(attestationObj.attestation, "base64");

    const payload = new EC2NitroAttestationPayload(attestationBuffer);
    const rootCert = await getNitroRootCertificate();
    const isValid = await payload.validate(rootCert, checkExpiration);

    if (!isValid) {
      throw new Error("Attestation validation failed.");
    }

    const hashMatches = await payload.validateInstanceIdhash();
    if (!hashMatches) {
      throw new Error("Hashes DO NOT match for EC2 instance ID.");
    }

    // payload.publicKey is optional according to specification 

    //if (payload.publicKey) {
      return payload.publicKey ? payload.publicKey.toString("utf-8"): "";
    //} else {
      //throw new Error("[-] Public key does not exist.");
    //}
  } catch (error) {
    console.error(`${error}`);
    return "";
  }
}
