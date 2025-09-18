import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { contractsInfo } from "../../../helpers/constants";

const versionNitroAttestationValidator = "V".concat(
  contractsInfo.NITRO_ATTESTATION_VALIDATOR.version.replaceAll(".", "_").replaceAll("-", "_"),
);

const NitroAttestationValidatorModule = buildModule(
  "NitroAttestationValidatorModule".concat(versionNitroAttestationValidator),
  (m) => {
    const owner = m.getAccount(0);
    const certificatesLib = m.contract("CertificatesLib");
    const certificatesValidator = m.contract("CertificatesValidator", [], {
      libraries: {
        CertificatesLib: certificatesLib,
      },
    });

    m.call(certificatesValidator, "initialize", [owner]);

    const nitroAttestationValidator = m.contract("NitroAttestationValidator", [], {
      libraries: {
        CertificatesLib: certificatesLib,
      },
    });

    m.call(nitroAttestationValidator, "initialize", [owner, certificatesValidator]);

    return { nitroAttestationValidator, certificatesValidator, certificatesLib };
  },
);

export default buildModule("DeployNitroAttestationValidator", (m) => {
  const { nitroAttestationValidator, certificatesValidator, certificatesLib } = m.useModule(
    NitroAttestationValidatorModule,
  );

  return { nitroAttestationValidator, certificatesValidator, certificatesLib };
});
