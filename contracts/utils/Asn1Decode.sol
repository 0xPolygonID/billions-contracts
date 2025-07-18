// SPDX-License-Identifier: GPL-3.0
// Forked from https://github.com/JonahGroendal/asn1-decode/blob/master/contracts/Asn1Decode.sol
/*
    MIT License

    Copyright (c) 2019 Jonah Groendal

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

pragma solidity ^0.8.27;

import "./BytesUtils.sol";

library NodePtr {
    // Unpack first byte index
    function ixs(uint self) internal pure returns (uint) {
        return uint80(self);
    }
    // Unpack first content byte index
    function ixf(uint self) internal pure returns (uint) {
        return uint80(self >> 80);
    }
    // Unpack last content byte index
    function ixl(uint self) internal pure returns (uint) {
        return uint80(self >> 160);
    }
    // Pack 3 uint80s into a uint256
    function getPtr(uint _ixs, uint _ixf, uint _ixl) internal pure returns (uint) {
        _ixs |= _ixf << 80;
        _ixs |= _ixl << 160;
        return _ixs;
    }
}

library Asn1Decode {
    using NodePtr for uint;
    using BytesUtils for bytes;

    /*
     * @dev Get the root node. First step in traversing an ASN1 structure
     * @param der The DER-encoded ASN1 structure
     * @return A pointer to the outermost node
     */
    function root(bytes memory der) internal pure returns (uint) {
        return readNodeLength(der, 0);
    }

    /*
     * @dev Get the root node of an ASN1 structure that's within a bit string value
     * @param der The DER-encoded ASN1 structure
     * @return A pointer to the outermost node
     */
    function rootOfBitStringAt(bytes memory der, uint ptr) internal pure returns (uint) {
        require(der[ptr.ixs()] == 0x03, "Not type BIT STRING");
        return readNodeLength(der, ptr.ixf() + 1);
    }

    /*
     * @dev Get the root node of an ASN1 structure that's within an octet string value
     * @param der The DER-encoded ASN1 structure
     * @return A pointer to the outermost node
     */
    function rootOfOctetStringAt(bytes memory der, uint ptr) internal pure returns (uint) {
        require(der[ptr.ixs()] == 0x04, "Not type OCTET STRING");
        return readNodeLength(der, ptr.ixf());
    }

    /*
     * @dev Get the next sibling node
     * @param der The DER-encoded ASN1 structure
     * @param ptr Points to the indices of the current node
     * @return A pointer to the next sibling node
     */
    function nextSiblingOf(bytes memory der, uint ptr) internal pure returns (uint) {
        return readNodeLength(der, ptr.ixl() + 1);
    }

    /*
     * @dev Get the first child node of the current node
     * @param der The DER-encoded ASN1 structure
     * @param ptr Points to the indices of the current node
     * @return A pointer to the first child node
     */
    function firstChildOf(bytes memory der, uint ptr) internal pure returns (uint) {
        require(der[ptr.ixs()] & 0x20 == 0x20, "Not a constructed type");
        return readNodeLength(der, ptr.ixf());
    }

    /*
     * @dev Use for looping through children of a node (either i or j).
     * @param i Pointer to an ASN1 node
     * @param j Pointer to another ASN1 node of the same ASN1 structure
     * @return True iff j is child of i or i is child of j.
     */
    function isChildOf(uint i, uint j) internal pure returns (bool) {
        return (((i.ixf() <= j.ixs()) && (j.ixl() <= i.ixl())) ||
            ((j.ixf() <= i.ixs()) && (i.ixl() <= j.ixl())));
    }

    /*
     * @dev Extract value of node from DER-encoded structure
     * @param der The der-encoded ASN1 structure
     * @param ptr Points to the indices of the current node
     * @return Value bytes of node
     */
    function bytesAt(bytes memory der, uint ptr) internal pure returns (bytes memory) {
        return der.substring(ptr.ixf(), ptr.ixl() + 1 - ptr.ixf());
    }

    /*
     * @dev Extract entire node from DER-encoded structure
     * @param der The DER-encoded ASN1 structure
     * @param ptr Points to the indices of the current node
     * @return All bytes of node
     */
    function allBytesAt(bytes memory der, uint ptr) internal pure returns (bytes memory) {
        return der.substring(ptr.ixs(), ptr.ixl() + 1 - ptr.ixs());
    }

    /*
     * @dev Extract value of node from DER-encoded structure
     * @param der The DER-encoded ASN1 structure
     * @param ptr Points to the indices of the current node
     * @return Value bytes of node as bytes32
     */
    function bytes32At(bytes memory der, uint ptr) internal pure returns (bytes32) {
        return der.readBytesN(ptr.ixf(), ptr.ixl() + 1 - ptr.ixf());
    }

    /*
     * @dev Extract value of node from DER-encoded structure
     * @param der The der-encoded ASN1 structure
     * @param ptr Points to the indices of the current node
     * @return Uint value of node
     */
    function uintAt(bytes memory der, uint ptr) internal pure returns (uint) {
        require(der[ptr.ixs()] == 0x02, "Not type INTEGER");
        require(der[ptr.ixf()] & 0x80 == 0, "Not positive");
        uint len = ptr.ixl() + 1 - ptr.ixf();
        return uint(der.readBytesN(ptr.ixf(), len) >> ((32 - len) * 8));
    }

    /*
     * @dev Extract value of a positive integer node from DER-encoded structure
     * @param der The DER-encoded ASN1 structure
     * @param ptr Points to the indices of the current node
     * @return Value bytes of a positive integer node
     */
    function uintBytesAt(bytes memory der, uint ptr) internal pure returns (bytes memory) {
        require(der[ptr.ixs()] == 0x02, "Not type INTEGER");
        require(der[ptr.ixf()] & 0x80 == 0, "Not positive");
        uint valueLength = ptr.ixl() + 1 - ptr.ixf();
        if (der[ptr.ixf()] == 0) return der.substring(ptr.ixf() + 1, valueLength - 1);
        else return der.substring(ptr.ixf(), valueLength);
    }

    function keccakOfBytesAt(bytes memory der, uint ptr) internal pure returns (bytes32) {
        return der.keccak(ptr.ixf(), ptr.ixl() + 1 - ptr.ixf());
    }

    function keccakOfAllBytesAt(bytes memory der, uint ptr) internal pure returns (bytes32) {
        return der.keccak(ptr.ixs(), ptr.ixl() + 1 - ptr.ixs());
    }

    /*
     * @dev Extract value of bitstring node from DER-encoded structure
     * @param der The DER-encoded ASN1 structure
     * @param ptr Points to the indices of the current node
     * @return Value of bitstring converted to bytes
     */
    function bitstringAt(bytes memory der, uint ptr) internal pure returns (bytes memory) {
        require(der[ptr.ixs()] == 0x03, "Not type BIT STRING");
        // Only 00 padded bitstr can be converted to bytestr!
        require(der[ptr.ixf()] == 0x00);
        uint valueLength = ptr.ixl() + 1 - ptr.ixf();
        return der.substring(ptr.ixf() + 1, valueLength - 1);
    }

    function readNodeLength(bytes memory der, uint ix) private pure returns (uint) {
        uint length;
        uint80 ixFirstContentByte;
        uint80 ixLastContentByte;
        if ((der[ix + 1] & 0x80) == 0) {
            length = uint8(der[ix + 1]);
            ixFirstContentByte = uint80(ix + 2);
            ixLastContentByte = uint80(ixFirstContentByte + length - 1);
        } else {
            uint8 lengthbytesLength = uint8(der[ix + 1] & 0x7F);
            if (lengthbytesLength == 1) length = der.readUint8(ix + 2);
            else if (lengthbytesLength == 2) length = der.readUint16(ix + 2);
            else
                length = uint(
                    der.readBytesN(ix + 2, lengthbytesLength) >> ((32 - lengthbytesLength) * 8)
                );
            ixFirstContentByte = uint80(ix + 2 + lengthbytesLength);
            ixLastContentByte = uint80(ixFirstContentByte + length - 1);
        }
        return NodePtr.getPtr(ix, ixFirstContentByte, ixLastContentByte);
    }
}
