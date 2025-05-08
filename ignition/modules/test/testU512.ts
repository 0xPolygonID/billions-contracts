import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TestU512Module = buildModule("TestU512Module", (m) => {
  const testU512 = m.contract("TestU512");

  return { testU512 };
});

export default TestU512Module;
