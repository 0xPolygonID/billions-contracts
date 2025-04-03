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
    uint256 constant deltax1 = 3025028667420898412929384078751619865975293661547477573565537720567407865237;
    uint256 constant deltax2 = 13216681552226816782212726490248698350311844003523630739666186828134569547059;
    uint256 constant deltay1 = 3598054897897562510242007725604571219111737323490883566995350965522788920858;
    uint256 constant deltay2 = 16881032225859700883991072144615393712774706389238602169579032069648270410712;

    
    uint256 constant IC0x = 1701259019876120470416057200892711973254815056440591066897048910727332212517;
    uint256 constant IC0y = 13422657604322007764216635505020780190036381682657713869948586337932615616632;
    
    uint256 constant IC1x = 14707549197986748515726603852727588546563828014252667130454642595578902638703;
    uint256 constant IC1y = 3754455578321367700529022741779825920027588124548861072976656476681637601572;
    
    uint256 constant IC2x = 6231347518650106674784878510295040810685472922651682909834702749929711468062;
    uint256 constant IC2y = 10652705471576497690849222741454634777969882991272102481815968356184365054785;
    
    uint256 constant IC3x = 20224346487038698628997165820535406580576661213435005813765626976934278815394;
    uint256 constant IC3y = 6477899942712919670094733032184926806186003664556937058403586213352430718265;
    
    uint256 constant IC4x = 14706822949963605451669715582416519596563881548345341236208230843645347138597;
    uint256 constant IC4y = 132664825476032807771567177209541455412995949982282542479847221113508584160;
    
    uint256 constant IC5x = 6606685926525870031551638499035494852392714539177671726018311370516389640725;
    uint256 constant IC5y = 13445084374277880284211037737893906625437808028968767562294109109127805366498;
    
    uint256 constant IC6x = 12154575910898434515659104123473165423431499457731716951593181889270452181885;
    uint256 constant IC6y = 17007410582622478990775411365310464690494089031203182644300092191470691893786;
    
    uint256 constant IC7x = 7988550460007569678678535526705842370291964944091675204172545351042531229224;
    uint256 constant IC7y = 4228581924633513336977122995979816424497953422470927313857883726379957159182;
    
    uint256 constant IC8x = 3250764611388398105144330191634150713957631578110773022500845213695190639294;
    uint256 constant IC8y = 20457695224492515172751817007948943721676589942294530566226375245055813986507;
    
    uint256 constant IC9x = 4289700068162227571115621630417365375801168761598294768662481382598370564437;
    uint256 constant IC9y = 8973845340427925977515764521305365602589866533012424050462919584154242899092;
    
    uint256 constant IC10x = 4463020231919287149393505992323486868215138851633588152833174696397467012175;
    uint256 constant IC10y = 5403484890046585492306907572161951173106956778404015148079096043617178472047;
    
    uint256 constant IC11x = 9702237324555978329593863800801026243858017822156714441435386012269108492023;
    uint256 constant IC11y = 15095736119242989144590346392680977848886739244784045994989258249907938801356;
    
    uint256 constant IC12x = 12507814299096078593396208263054200127067663309220682946887749099196641349525;
    uint256 constant IC12y = 17338103589619218168833783475495136575781171145253089525125257462443199598407;
    
    uint256 constant IC13x = 16661631832546038158702173703771506642111667321580528578464692080230803675849;
    uint256 constant IC13y = 19165393089259291427976317292483573289558963916476431284598857215450133614704;
    
    uint256 constant IC14x = 14300838863729862544573522995116480396171427592484723343070047078389189835837;
    uint256 constant IC14y = 11164733433120965281140678785999626781904547036633126160709414048906617524724;
    
    uint256 constant IC15x = 13909649252685771283483328624014004506701774021398182914951854632223085288558;
    uint256 constant IC15y = 20400983541381462329429173342733260578238881294368886684650645031118952823731;
    
 
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
