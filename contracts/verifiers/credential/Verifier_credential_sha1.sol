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
    uint256 constant deltax1 = 5272445414788457532294879643326237686519294941793051028493044121585712220870;
    uint256 constant deltax2 = 2229223808805920402734647755178589176382426729463171081319112996491304902503;
    uint256 constant deltay1 = 10620692375133509172704420872376318027191065068726085788098441382729763327140;
    uint256 constant deltay2 = 1640400077960630531868717707150095537086777698325811999139231596321032081449;

    
    uint256 constant IC0x = 21748216336585645490622916683383557015684971070430748901560605591757611738211;
    uint256 constant IC0y = 18090612463306002614417209552955295854787543756628363217299269763564470709410;
    
    uint256 constant IC1x = 4149800561542050870345932923962674986568511058603166692259226641553590484439;
    uint256 constant IC1y = 2577588503389574481868340020797581393649337703909298539756904891932210616183;
    
    uint256 constant IC2x = 2991382819350051964491906681137673683382613642834694477858005054750482631256;
    uint256 constant IC2y = 9173446389631678031606458177122317357239583870092842051899652527468934962120;
    
    uint256 constant IC3x = 12507165467447210256221697708806565120443115647186134744459309337508680378398;
    uint256 constant IC3y = 21696594520941732301290776073226167427753428438545695500722612965528561910642;
    
    uint256 constant IC4x = 4722607813925765113972579762506545812907363122102893782235762581886073179832;
    uint256 constant IC4y = 16255293562064145552200967858896772212619963758998151704811873705539708712683;
    
    uint256 constant IC5x = 3099755220965383630381692535585994455187529627580742283500084346506539108618;
    uint256 constant IC5y = 4990736988657415557367178870466385225977790765973707888065485582847468402217;
    
    uint256 constant IC6x = 15841663898028664410287429590322498375090387747008689747088779311700865591105;
    uint256 constant IC6y = 3331639106722785969310127521719017218124155897214602755530063664728317097837;
    
    uint256 constant IC7x = 2857462844458253204139326642060903240190814052484548776683142654764981663080;
    uint256 constant IC7y = 15858848741325264925437321435406648663284547017424089823840290698092413297334;
    
    uint256 constant IC8x = 19986240008895398645982010927215088542105890163061472173276902750401551327546;
    uint256 constant IC8y = 18046979278895239663650772862165108092992999627335363931729866039438561067328;
    
    uint256 constant IC9x = 7940497700570820099744880899623650109281917236993864405860983811956356607668;
    uint256 constant IC9y = 21879596967837853525416404916734094195313950607378256423851386360593909679150;
    
    uint256 constant IC10x = 1638657419583780119019912031615592800010540231507546073628735445466342402584;
    uint256 constant IC10y = 20552716368516563450204363697102298605940158904311516247814742238735905005778;
    
    uint256 constant IC11x = 7592156567485768175867645654521464999491141090502510571308251880038894756083;
    uint256 constant IC11y = 13155428333064066850051623878591970798942927421854392223057385030493854365447;
    
    uint256 constant IC12x = 18944627378292035069254592803711875565529861500864940470222381040417890930934;
    uint256 constant IC12y = 20962334251933146699589780599345443342706509778167343152436421315941018959548;
    
    uint256 constant IC13x = 5056531520618064117320405374226952859799247408368217173168691154416629790238;
    uint256 constant IC13y = 16199853386946541936285151379831872723005145953606630521237095934467768043180;
    
    uint256 constant IC14x = 12473006332668933846765807392126606440854197014693540838431056654057081846540;
    uint256 constant IC14y = 8653146474498961385042196137696852903999173872688875000462327394743213577094;
    
    uint256 constant IC15x = 5025779423628427951604130217214887902662518538814689738432248782329599673282;
    uint256 constant IC15y = 5032393878139543079757243247875120586983648888042189927748811772805723348511;
    
 
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
