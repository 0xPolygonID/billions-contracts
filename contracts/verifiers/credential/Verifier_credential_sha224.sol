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

contract Verifier_credential_sha224 {
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
    uint256 constant deltax1 = 6878366657369927443677953729263985769194590762947777996651857219301298548094;
    uint256 constant deltax2 = 21264531581043209121693157272510589248265812477317967759637584936376333042123;
    uint256 constant deltay1 = 4748798252544763991388915528277889620375945059617929947823044980795743173873;
    uint256 constant deltay2 = 2369693457985155605019837892345962826971675266397835913733519637411175180418;

    
    uint256 constant IC0x = 17338888998800291546182423182456911319058099057382713105906791439383186716346;
    uint256 constant IC0y = 12062117494032234399203317629735457114160194493457286876255747578338080271949;
    
    uint256 constant IC1x = 12644343374791761498760369468898471630613778944928217976609057658649587415895;
    uint256 constant IC1y = 8102910905190104066408197954142972112599496256715953455207073444960507542488;
    
    uint256 constant IC2x = 5218032004709570863272416851629342045192718469627135774724176577670794713170;
    uint256 constant IC2y = 12738870435818329718643949690313007438714281373682961685623949762870215197030;
    
    uint256 constant IC3x = 11663826314068834806127321498624897169219951344205052919812408160084301934878;
    uint256 constant IC3y = 10954564250198605152578767653562158908978847790294453673234414031403522680785;
    
    uint256 constant IC4x = 2929699402992576627188660553168207835154519473836632145201262392412308411018;
    uint256 constant IC4y = 9558125303972482395176600244868102535828116219444775387212931135807383597370;
    
    uint256 constant IC5x = 11482150753637276253793138600466948696665467205609740310163385410258607961215;
    uint256 constant IC5y = 20101048092545666655314776155789500121908355595228194945556986804895755277108;
    
    uint256 constant IC6x = 6725586897126817800266577170179008714756991114940393184194870652726852764930;
    uint256 constant IC6y = 4290437693884984707828297611121990632233993741070968535723669868339880107203;
    
    uint256 constant IC7x = 16046406191772248677923841429568105368875669502441903791575575293910509206030;
    uint256 constant IC7y = 11395757770161765834835043311358357221270267457778138460602152998687722099251;
    
    uint256 constant IC8x = 19184152053298328539690517310866522402891785779753053849833851439961311556468;
    uint256 constant IC8y = 3012383301893747342227533180988457143502874526949836427191530611584706163083;
    
    uint256 constant IC9x = 14076101613121595609925689261634468157090801202417023949642502697491791180216;
    uint256 constant IC9y = 3955553239966351255179097478758770088296639215548782202162189426511678830835;
    
    uint256 constant IC10x = 13659382534622289655661981270114688454686262328291384601227009950582451488467;
    uint256 constant IC10y = 20891188105947182491486631716063911187374791765312491694990804183529586703326;
    
    uint256 constant IC11x = 13622487693273637798409223637153481781173379165405049316860021604887249264640;
    uint256 constant IC11y = 21453477535247454337890147693635236495199202662890797667708229237358971167916;
    
    uint256 constant IC12x = 11280067298660238033147829692329361326829023796354329996845914868219347286054;
    uint256 constant IC12y = 12798874125597912702413590197407267207191504182099353172641959169308656492976;
    
    uint256 constant IC13x = 11756207207561518772570926530896148867958795710721816331411788205690220456089;
    uint256 constant IC13y = 19784110400055903823783622446904264631235304222852942149976377684149263802808;
    
    uint256 constant IC14x = 19052390021007375960286814291584557392674938170752521669458463700498799950352;
    uint256 constant IC14y = 18198780593722542010151482860352346354985585259442149797449385868686397860515;
    
    uint256 constant IC15x = 812362898346853291432311681404362479611906561064398041144849334389705285566;
    uint256 constant IC15y = 6532630739514272304805251546310320241945137943237337542452781017015291072008;
    
 
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
