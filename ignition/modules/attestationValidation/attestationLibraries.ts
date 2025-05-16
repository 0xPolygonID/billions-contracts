import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export const CertificatesLibModule = buildModule("CertificatesLibModule", (m) => {
  const certificatesLib = m.contract("CertificatesLib");

  return { certificatesLib };
});

export const CertificatesValidatorModule = buildModule("CertificatesValidatorModule", (m) => {
  const { certificatesLib } = m.useModule(CertificatesLibModule);

  const certificatesValidator = m.contract("CertificatesValidator", [], {
    libraries: {
      CertificatesLib: certificatesLib,
    },
  });

  return { certificatesValidator };
});

export const NitroAttestationValidatorModule = buildModule(
  "NitroAttestationValidatorModule",
  (m) => {
    const owner = m.getAccount(0);
    const { certificatesLib } = m.useModule(CertificatesLibModule);
    const { certificatesValidator } = m.useModule(CertificatesValidatorModule);

    const nitroAttestationValidator = m.contract("NitroAttestationValidator", [], {
      libraries: {
        CertificatesLib: certificatesLib,
      },
    });

    m.call(nitroAttestationValidator, "initialize", [owner, certificatesValidator]);

    return { nitroAttestationValidator, certificatesValidator, certificatesLib };
  },
);