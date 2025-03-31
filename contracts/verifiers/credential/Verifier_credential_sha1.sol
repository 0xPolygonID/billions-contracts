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

contract Verifier_credential_sha1 {
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
        293082938503657167332130130829162219177249585405963744791623063669253157252;
    uint256 constant deltax2 =
        3831718694509279304396887202549459795630655154416966790573427873310422939323;
    uint256 constant deltay1 =
        1134033438997110221145449276784860915799225242577629350334138284370453573587;
    uint256 constant deltay2 =
        9523617563151356699728733634800490639049999674113964699257014358442949873062;

    uint256 constant IC0x =
        13443745538400999838481076889407026180491167127272216343303632482495385987487;
    uint256 constant IC0y =
        10341137924638087965179379463605832271434288124813440041721181929900810738379;

    uint256 constant IC1x =
        9805947774656850667597429301484827738195047190634830732541433835643059662322;
    uint256 constant IC1y =
        6060357024146854471434365970162602214249855021294839871575767687780419451949;

    uint256 constant IC2x =
        18053436724980779912618654216271326599079396669419389113681300450276540635564;
    uint256 constant IC2y =
        14419036676614260340346862522537339102158318960299727758989559994359638262426;

    uint256 constant IC3x =
        15917523745105417126958746350903433380116083608223234360139858323458738517643;
    uint256 constant IC3y =
        19191866948619673645057628131759868347298784267821068619186832475157731387407;

    uint256 constant IC4x =
        3813146621693844372551097812547012501134565201281484436072523807684535041182;
    uint256 constant IC4y =
        19003673397240966919476964033001415267903762724700425922365839533899200749917;

    uint256 constant IC5x =
        12358932746375330666729611259576953067712726071795805323809472658743528457182;
    uint256 constant IC5y =
        15906899802510356676350611353986466687925835416821772387904862544487356992808;

    uint256 constant IC6x =
        3133893191103286704039355514091393617738905396800334311790331158213986214718;
    uint256 constant IC6y =
        10496268896042981916279031678984509713070099309042170840854739945580613716617;

    uint256 constant IC7x =
        4661942403262798553748245287740148159073586150976662888975900379265743939914;
    uint256 constant IC7y =
        14436186785975957300430639283562671828911032257081180458415414131486056732347;

    uint256 constant IC8x =
        7835098914602350975719402226800450745768744621147233242330106012537216614196;
    uint256 constant IC8y =
        11029333615365868959710365397795175392958662608472966509715982199237153274970;

    uint256 constant IC9x =
        2982983671949847915802013181667489880064247225128017459686493345256009018487;
    uint256 constant IC9y =
        9830961735175912897938325627448363699490968371806958815470019413108528569601;

    uint256 constant IC10x =
        8305557993447350632911957817059390167236661047628981593949775789665728007157;
    uint256 constant IC10y =
        21105754636998369315353899881426542384537508021367375563089551323508099263808;

    uint256 constant IC11x =
        8257260311230929764897875846755740126156128389273030831639044371018816687540;
    uint256 constant IC11y =
        9669597666362074599402971223153562401654712504782122466861526870325465484040;

    uint256 constant IC12x =
        4141249476936349973584509734219416298753154662560713513459124539226540262401;
    uint256 constant IC12y =
        10341128903881116829546117056356334828762770772963730176727343583321574097924;

    uint256 constant IC13x =
        1323072807265742714623614146720983168277141675381623794358145308408745996720;
    uint256 constant IC13y =
        7707738733380885874774950661207561690479778161456029293906070515427872291715;

    uint256 constant IC14x =
        9195266388437138089533883382033228753453680128217626906188259914327925064950;
    uint256 constant IC14y =
        5601961747662537544671231145807467617539237155892691959940461667044356196392;

    uint256 constant IC15x =
        17400996419203330444864908374690678283178686112570626873887317305839158149513;
    uint256 constant IC15y =
        4647079453236941900701285087196959007032979378194973572334423216600499666;

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
