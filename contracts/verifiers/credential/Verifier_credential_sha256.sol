// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Verifier_credential_sha256 {
    // Scalar field size
    uint256 constant r =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q =
        21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax =
        20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay =
        9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1 =
        4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2 =
        6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1 =
        21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2 =
        10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 =
        11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 =
        10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 =
        4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 =
        8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 =
        19913828171242011091069549356522743134068293824703478609176243408415242104225;
    uint256 constant deltax2 =
        10649563049986019647027128638413081180789655223582579578925955915426515986368;
    uint256 constant deltay1 =
        15147495844845656375727436437371510624527047571401949304025903862203758159282;
    uint256 constant deltay2 =
        19410662427879938393351510992011625136775525290348853010478358369692235930789;

    uint256 constant IC0x =
        3438284460859591314304054661416684914815203030732136224926388995744468661627;
    uint256 constant IC0y =
        7661520660659873973357983772422555682602486447413697911241979426410220039626;

    uint256 constant IC1x =
        13222145341915586426474759997815823629752542818330275243973879230943047590136;
    uint256 constant IC1y =
        8287726692702420562084022915866731802563951561309235004864186713936156270040;

    uint256 constant IC2x =
        4503523878307612490067857440622652966803444711023344628469746095243557329859;
    uint256 constant IC2y =
        8694858573610499778396399327046060560410012199375548914771793911531218411618;

    uint256 constant IC3x =
        13750483829135896158104586289375633444382135293345543273579630925643378303688;
    uint256 constant IC3y =
        17632273646749075193399893630093343096531311570361316394675509706417287852747;

    uint256 constant IC4x =
        896500391066485283696783083390072439816642982080141111244876818283185801258;
    uint256 constant IC4y =
        11445775993057841410145475323060392992503940446186368255735913996477823709884;

    uint256 constant IC5x =
        1192364589798702424503803446304442414766199837522643196332290730831337985034;
    uint256 constant IC5y =
        20394925285639757671755355951974466838491001495960361593840880279334008644831;

    uint256 constant IC6x =
        2378818287797872427302658443735506844566397646783402507250693547915591609376;
    uint256 constant IC6y =
        11533064401399571246526985843073289023597854355656322476324785925033730281953;

    uint256 constant IC7x =
        16408529562592612104492007850025038648015231623231490675624622369286859008778;
    uint256 constant IC7y =
        21027537963712373950145675382855308460184347425008960114014774331305365040195;

    uint256 constant IC8x =
        19084526835701781538859625156905224149639641284305184901296602769332588970448;
    uint256 constant IC8y =
        2013188632459121368415317705098822070479391388603129303825715932888337625375;

    uint256 constant IC9x =
        20627859650760413218887178792721543661231366960157059742553937733169222806996;
    uint256 constant IC9y =
        4323924997078858527841207441756597770832516842785315362970813803201572198035;

    uint256 constant IC10x =
        8186542111105857535705162247455585191534060057734585314285544894067940959133;
    uint256 constant IC10y =
        19798982624786365403242898405830943094987901156764656680081745569629645772348;

    uint256 constant IC11x =
        9214164750740175943842297699811193913007464008203930594434286772156777225603;
    uint256 constant IC11y =
        3091504229621104731046994499807886778533358602403849720238525037342025966380;

    uint256 constant IC12x =
        15601607519920773692924443443696911301176231745359448860179834884331655070390;
    uint256 constant IC12y =
        21733718646538766756867127720182371772501025639312364835064009746672244619497;

    uint256 constant IC13x =
        6490250786333515191839826248009048964105730792135958876754212739686018005549;
    uint256 constant IC13y =
        1443483615079910493973830886497605771717919594058213891778226362805728876103;

    uint256 constant IC14x =
        18785202141637048958577279396525637972957473514140897262678282205006530424940;
    uint256 constant IC14y =
        15783255848405324678118908960115841599946720108423219941674537631138920734143;

    uint256 constant IC15x =
        11434520413583781590539767707955968182139354675009615578055105709995258412560;
    uint256 constant IC15y =
        3685324489672870381377910116047453648039343220639010500711156534362731058683;

    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[15] calldata _pubSignals
    ) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x

                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))

                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))

                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))

                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))

                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))

                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))

                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))

                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))

                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))

                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))

                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))

                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))

                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))

                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))

                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))

                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)

                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F

            checkField(calldataload(add(_pubSignals, 0)))

            checkField(calldataload(add(_pubSignals, 32)))

            checkField(calldataload(add(_pubSignals, 64)))

            checkField(calldataload(add(_pubSignals, 96)))

            checkField(calldataload(add(_pubSignals, 128)))

            checkField(calldataload(add(_pubSignals, 160)))

            checkField(calldataload(add(_pubSignals, 192)))

            checkField(calldataload(add(_pubSignals, 224)))

            checkField(calldataload(add(_pubSignals, 256)))

            checkField(calldataload(add(_pubSignals, 288)))

            checkField(calldataload(add(_pubSignals, 320)))

            checkField(calldataload(add(_pubSignals, 352)))

            checkField(calldataload(add(_pubSignals, 384)))

            checkField(calldataload(add(_pubSignals, 416)))

            checkField(calldataload(add(_pubSignals, 448)))

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
            return(0, 0x20)
        }
    }
}
