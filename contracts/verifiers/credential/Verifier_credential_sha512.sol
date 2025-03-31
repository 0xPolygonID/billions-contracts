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

contract Verifier_credential_sha512 {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 9261473778837327438938876855364918794476772439286427348363437980785439252654;
    uint256 constant deltax2 = 16247456676245713895786515047169085795354310937635306950111133739410282982421;
    uint256 constant deltay1 = 6176222277862062636449312770132467033282891089303804943407213082472327483036;
    uint256 constant deltay2 = 21738021117922812992881659346008019434127503315067593504743529707708274070483;

    
    uint256 constant IC0x = 18135068048741900200155048668546697881819691842176698184913071357873448082052;
    uint256 constant IC0y = 4056029259069578922747625631931728585687521643270075573603958407042564229308;
    
    uint256 constant IC1x = 19007891171091148018434974385996886190112267718869510148055533441645851996204;
    uint256 constant IC1y = 842295484137110190042895357138797093187987648390015311170166423523841731045;
    
    uint256 constant IC2x = 16411934082414127031909263519905576155447291966220548501526991232748987699404;
    uint256 constant IC2y = 12786001383865135858284278807019914307685551710494856714506873892511367589454;
    
    uint256 constant IC3x = 17952286450406379840991427013606874498597646778551291582064950029193733270870;
    uint256 constant IC3y = 17248616811493922579337128214969789993092750317367711951219036018647553771721;
    
    uint256 constant IC4x = 1441902771576092508198171950516099774057167643128321712374867614734808028551;
    uint256 constant IC4y = 18850512144843663906546874228079593141577806665086480827372849179824308571075;
    
    uint256 constant IC5x = 13144466824988893004749114397276958650868662842100866811501622692802110885067;
    uint256 constant IC5y = 16118562585043894224707557556339398528677148678877759025691128935800122185800;
    
    uint256 constant IC6x = 11232738291641575259593816774383025193382547940392713010367851163413955371611;
    uint256 constant IC6y = 12847349527641557833867593508698299509239502665570907814561597384941175307808;
    
    uint256 constant IC7x = 20442329836652469072010490734912619373093648222615711337788577526459117214675;
    uint256 constant IC7y = 2489815610578264129277344874739289673802255561594092588874913438545988856040;
    
    uint256 constant IC8x = 17112252068201911573699273651700120196924549318935469114775585175754176726790;
    uint256 constant IC8y = 16716981594172366555361600565144626200041541044898920022017851152092364257510;
    
    uint256 constant IC9x = 15489790182280437149982170556098050328110838151899162639474125500764573289867;
    uint256 constant IC9y = 9919823657021197227868637372774863840812504111575877171336485920196726341043;
    
    uint256 constant IC10x = 8623513398950756212626678191222547851732773211251261417260392194116457781729;
    uint256 constant IC10y = 10001898912285568849883596778459734691157431244667581795104982856990501802796;
    
    uint256 constant IC11x = 1512366479179716905227887339334361754418341337520926895525313396970052085059;
    uint256 constant IC11y = 20050043067067681273775351734451258007453223205963933652209172815368385561082;
    
    uint256 constant IC12x = 9093504876651527651101359370570093401360445470014976271651125930409977381447;
    uint256 constant IC12y = 5923213134025958582589762092677753989512436495081635169422687287667407256456;
    
    uint256 constant IC13x = 15138339652019778996250839701410890545249081589949827419181100961456961449550;
    uint256 constant IC13y = 17673009647728128570551728528936657670194061115092646278144252617870992865493;
    
    uint256 constant IC14x = 13789171566097550153126503761955252206511284499519009121089479407082366870927;
    uint256 constant IC14y = 10616541372823494492372009105157443151266904630936534053675572568285966872654;
    
    uint256 constant IC15x = 2621368020191109397714039172921504412720224070965577182709322955097176461306;
    uint256 constant IC15y = 3349907087018789016503511308073372740338120929634265871685640066477229521955;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[15] calldata _pubSignals) public view returns (bool) {
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
