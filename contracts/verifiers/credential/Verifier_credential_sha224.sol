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
    uint256 constant deltax1 = 19528588522238494169429494731211965760521512578945486733270936676427215849277;
    uint256 constant deltax2 = 2085650274946125470162385391704473989452807784971325866052375422107501314108;
    uint256 constant deltay1 = 20478658279880987085268150611819361170996861747119550340357753604779071132925;
    uint256 constant deltay2 = 17169512714936275807554008731933001726255606731985994943029262844996945348011;

    
    uint256 constant IC0x = 8151649045330569422224340609623774607543169996158946523445857631936140164286;
    uint256 constant IC0y = 2100705195853367587779336821191175751884532252271469537347024777486670874387;
    
    uint256 constant IC1x = 9931789834091251103898133818615069609622782254015280802441765758146747898429;
    uint256 constant IC1y = 18549989253553233344371286819430056530613824778640187248926514787262469560520;
    
    uint256 constant IC2x = 7172460535257334709456855321078226202109874814310267196492072256319966761687;
    uint256 constant IC2y = 4188574055737102601481651540534752343087340000368680638411555520082498850752;
    
    uint256 constant IC3x = 14446307856316045504116829286612708739381453931365437136117288613848063240854;
    uint256 constant IC3y = 9553851333761113107332928980518791165036986098746895043404061103080580048722;
    
    uint256 constant IC4x = 21453423546433693740047362491235393302637566216438773654574003637862765602535;
    uint256 constant IC4y = 13720864662698374779613150132809757427740510060276292439748714914630539634504;
    
    uint256 constant IC5x = 13774803434400043911799204192561313110152613947998622414207444573701380643869;
    uint256 constant IC5y = 9205091163153371987640948818154514681330454821633590867479739565761719645551;
    
    uint256 constant IC6x = 11281942735046560671919404241894897184526207718996443514189751464584245046636;
    uint256 constant IC6y = 12185909929769776819982373328903201865355149710696379749430604410661972613736;
    
    uint256 constant IC7x = 9974564075220234383911070008520802430247885828715328805933287396912696550324;
    uint256 constant IC7y = 21561772157886194861703529773031236835687732631935089328208032934746994521970;
    
    uint256 constant IC8x = 3683838922583856309827151769213442211866411516583146017948490969176556508699;
    uint256 constant IC8y = 19294910049908976419523753977428453323917205999962824689500265871240924087686;
    
    uint256 constant IC9x = 6722601858317027223619529181805035713502295141745686795320755571515744199246;
    uint256 constant IC9y = 16677085523711122553980311623516814610894853712504228920293200320714145550334;
    
    uint256 constant IC10x = 6290538481788911052462144991381927447320606585970359120165977433669538537656;
    uint256 constant IC10y = 5199988112871710981295087037564622834360189711946494743651919789615776973695;
    
    uint256 constant IC11x = 17285066251768173860448347578400655947710622044721806219793100629314312758557;
    uint256 constant IC11y = 4109487483124058792599765103471475139985824940219467132504014512622894735134;
    
    uint256 constant IC12x = 1702232077756436337018320353256053124317243730291954278400391757586745378377;
    uint256 constant IC12y = 11389367439613430688805530658467712219068778043236833094671709970731354154267;
    
    uint256 constant IC13x = 1904287057205289717956900595180540687246484018388030545489524518884877677318;
    uint256 constant IC13y = 10255260153801580350747771142285347207912438878623639377167639056501004118235;
    
    uint256 constant IC14x = 1295607743256814433666611822318925359888845743908190082688936699889796227125;
    uint256 constant IC14y = 2418588718748216669591051595913768172421452785548025144947098363332889331875;
    
    uint256 constant IC15x = 18859062947794805568103565309982852970388757725721341870017878382479149058934;
    uint256 constant IC15y = 8836599331120496862009619018587439202682302375326768502068908011289303557861;
    
 
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
