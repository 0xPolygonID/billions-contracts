#!/bin/bash

echo "Running test.sh"
cast call 0xc2d79E4dFBef8978ED4c489E135a40b175b11d23 "u512ModexpU256(bytes,bytes,bytes)(bytes,bytes)" \
0x76bdc2875417d0a61f24a109c78d05e6b1e55bfce0a8aa88d5d277628828f2578a5afd5e86154664f97c3f28fbd0eea33293cfd1564c314607e0d05293318e00 \
0xeff90f5427240c266574f37f0c6d62dc5daad092af28f322da83ceaf6cc8a2290000000000000000000000000000000000000000000000000000000000000040 \
0x31541618aecf034c94bb3095acd72572e333b97ec72148f832519c8b2329122f8f06d994e84f5e617428d77b39b1706d1c43338d7addcdcccc5cd740cfd1fecf \
--rpc-url https://ethereum-sepolia-rpc.publicnode.com

cast call 0xc2d79E4dFBef8978ED4c489E135a40b175b11d23 "callBigModExp(bytes32,bytes32,bytes32)(bytes32)" \
0x76bdc2875417d0a61f24a109c78d05e6b1e55bfc0a8aa88d5d277628828f26cc \
0x541618aecf034c94bb3095acd72572e333b97ec72148f832519c8b2329122f8f \
0x22f8f06d994e84f5e617428d77b39b1706d1c43338d7addcdcccc5cd7406d994 \
--rpc-url https://ethereum-sepolia-rpc.publicnode.com

cast call 0xc2d79E4dFBef8978ED4c489E135a40b175b11d23 "modExp(bytes,bytes,bytes)(bytes)" \
0x03 \
0x02 \
0x05 \
--rpc-url https://ethereum-sepolia-rpc.publicnode.com

echo "Finished test.sh"