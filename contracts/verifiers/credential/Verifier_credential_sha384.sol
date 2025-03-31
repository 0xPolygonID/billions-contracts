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

contract Verifier_credential_sha384 {
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
    uint256 constant deltax1 = 14618011843331079569422368714150541568230879513158928238455464635708420668210;
    uint256 constant deltax2 = 4021062571167455743580957069928566266886607112074125154114306057183578331815;
    uint256 constant deltay1 = 12058344615284918834915996468059776179646914497558555159752689368517028259718;
    uint256 constant deltay2 = 9487680638791864530161109626264855204365846214761575662855634096642480666449;

    
    uint256 constant IC0x = 19644496363719427984950458938823782301792887629669358746700661912203317941732;
    uint256 constant IC0y = 5738827745350043774066039847442705885413338810622873104447226519987215042624;
    
    uint256 constant IC1x = 8502754509849929567620943468690866775118363685276194038761916588924909026128;
    uint256 constant IC1y = 7100239901034704329845130054339133329483490816072853001853667694930750888049;
    
    uint256 constant IC2x = 13330669863769134538146916150320627021946520431355251338862938458885743723439;
    uint256 constant IC2y = 17334088060068466628658793163485364017723504212923416409508218737763760462663;
    
    uint256 constant IC3x = 3766899628075495828163449337117962751052191589454318611039224495107268181395;
    uint256 constant IC3y = 1143953562667563199020942586081059067488064971966954245952779318433602464923;
    
    uint256 constant IC4x = 2500842093483181870170294980061714466224641969437924093754956902984044475272;
    uint256 constant IC4y = 4552857001291298798457726686877119266932024529712268592489663117041702068052;
    
    uint256 constant IC5x = 8098859213492451250904916441882836240308380074391662355865820222134524479699;
    uint256 constant IC5y = 408725165128111682440137576773169392655805415492864759944019848682516949996;
    
    uint256 constant IC6x = 9268254001388357252006144661570628939275615120105741004006902173733950942391;
    uint256 constant IC6y = 12130497018385510356039165223583110068137049125995427828734170083721928992311;
    
    uint256 constant IC7x = 13020464673586511315992172748164478024617072164984691972266744664265222305583;
    uint256 constant IC7y = 6369426255994082159016133920285208960770037938854008935922497906377472021918;
    
    uint256 constant IC8x = 18639648708072040962694096117444200917995709483641125144870787029040052768979;
    uint256 constant IC8y = 10118511583972773207928352150984536194430047503863595186045066833279511696008;
    
    uint256 constant IC9x = 2842628979737062764255361190004115447420297485531944814940532089336386285451;
    uint256 constant IC9y = 10752186004867389664019023338017842374996140956399586760535004471622344852081;
    
    uint256 constant IC10x = 17225988930850772676752700020982583710546846961337615028312059032217482927625;
    uint256 constant IC10y = 2795402503085532447847478248213949822293743902418920373670876624001071113606;
    
    uint256 constant IC11x = 4039705031585283821319117645438125267671409633682046674616747969353747705588;
    uint256 constant IC11y = 10826845142531005082395501061348256598860911100524526905114428122988975146779;
    
    uint256 constant IC12x = 8438610319615461997540135556647190128392239274869594633910418152956236440121;
    uint256 constant IC12y = 1764136521397481500297696121346682046555156530704469146815174538316029446674;
    
    uint256 constant IC13x = 19186031503338939412867027182439013454938946770355008466411154107675685778647;
    uint256 constant IC13y = 10685465939783727532118464838354202535289236298136839360811262543328463954839;
    
    uint256 constant IC14x = 14572782475516163878068974452878459563500232473269336069729953310350775044091;
    uint256 constant IC14y = 7043980681735680042961348551027933315066167894939575650944330245146005586541;
    
    uint256 constant IC15x = 7816322075515640035911055045051904868851404474795347157440293755252882222528;
    uint256 constant IC15y = 18123475375909642679257064710248431130579535134962041394180753138758964612411;
    
 
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
