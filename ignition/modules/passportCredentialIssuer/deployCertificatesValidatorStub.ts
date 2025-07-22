import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  CertificatesLibModule,
  NitroAttestationValidatorModule,
} from "../attestationValidation/attestationLibraries";

export default buildModule("DeployCertificatesValidatorStub", (m) => {
  const { certificatesLib } = m.useModule(CertificatesLibModule);

  const certificatesValidatorStub = m.contract("CertificatesValidatorStub", [], {
    libraries: {
      CertificatesLib: certificatesLib,
    },
  });

  const { nitroAttestationValidator } = m.useModule(NitroAttestationValidatorModule);
  // Uncomment for testing purposes
  // m.call(nitroAttestationValidator, "setCertificatesValidator", [certificatesValidatorStub]);

  return { certificatesValidatorStub, nitroAttestationValidator, certificatesLib };
});
