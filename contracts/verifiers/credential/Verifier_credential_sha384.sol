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
    uint256 constant deltax1 = 8278195568757487755289298536714373561337887295935227298845820795599965194323;
    uint256 constant deltax2 = 10808033974044860421188954873192221895944660376385357029467300522494573312187;
    uint256 constant deltay1 = 3128164000686845807818200054803705503262797876796454762510475340112409187394;
    uint256 constant deltay2 = 2304287133273841100394072329048962888864444611461903061139513121271760150028;

    
    uint256 constant IC0x = 6602218228382535392365047479641379415072323200702869565923743866586291756218;
    uint256 constant IC0y = 9502290617289830971692037972905942714529566783038267375703306660271545012663;
    
    uint256 constant IC1x = 13874236963544053442354788048430574815309406833396199919822812736205343167146;
    uint256 constant IC1y = 789168462930887196352117606128913008639931640284166730011772897741109729841;
    
    uint256 constant IC2x = 7217014406719104590560020262147073992570234438348611641155577806160077605487;
    uint256 constant IC2y = 8404617663495299763992818617441442752005892693652826169117264768826860665766;
    
    uint256 constant IC3x = 17930057398992786495088584672199283311960784521729452252537789146336764029483;
    uint256 constant IC3y = 19095444844039235904674303321557014008829249692486389494058056300944507435909;
    
    uint256 constant IC4x = 7325809636125277703941733732544240584100693320646268211944155323901431252042;
    uint256 constant IC4y = 5482903680407121059055880495402481638916141067248873806367650138858317348769;
    
    uint256 constant IC5x = 9210739750768959962528421485900329549198161441776641163233840955005015440865;
    uint256 constant IC5y = 602664123328388582386975554862796231964932013950084187815363219254954358376;
    
    uint256 constant IC6x = 18031875179529970670366741447021297182775756877019035379288130217710393883986;
    uint256 constant IC6y = 21265118605189554387782727797927733726368322370032360978824042814225959129105;
    
    uint256 constant IC7x = 2573135428928224880077018832155817135768324473496821380195678110174079744832;
    uint256 constant IC7y = 3002741747059661007591442292585611709573929703169425378714924786901524856594;
    
    uint256 constant IC8x = 8296146542207136823360972836254163738212626235597396219154621833931192226697;
    uint256 constant IC8y = 3881492946489573626806779697050216829750505390615747189286321775585220391896;
    
    uint256 constant IC9x = 4309595662705093643955500859770105534216233564333841537591853813649879797870;
    uint256 constant IC9y = 7449224947213991849764536586690794806970590160988710140121252081630090199432;
    
    uint256 constant IC10x = 20820696343325293717895363351451032270412419038219281079408860618294883364088;
    uint256 constant IC10y = 12938951345935550876729263296062169852068323572534237251590423006436328960017;
    
    uint256 constant IC11x = 2821541266557614027120859723730748991338763810917465172327519326643439361064;
    uint256 constant IC11y = 5390370092276525775516860500163103830079587763543749153563381544182962259068;
    
    uint256 constant IC12x = 1060443688171045441704785104852160703924698491613377529273099947123367289853;
    uint256 constant IC12y = 13595271183151319337450526644573818584084436346689464757120015465741707963260;
    
    uint256 constant IC13x = 553759915635179711727220174850999797784119836166757254531454082774462775060;
    uint256 constant IC13y = 7587144102568906968595032938878885239354815303977641691025845395053596212827;
    
    uint256 constant IC14x = 19351089111495298402185558663617800183809954437508292223832676815046095296810;
    uint256 constant IC14y = 6330721141889470026134591915288972627981583801495241731518840490259989028039;
    
    uint256 constant IC15x = 6277072611206232084034583660221192759696416006985449294069838800203195936362;
    uint256 constant IC15y = 17134117285503128509544523013243379739195759792882076337309191829215993932595;
    
 
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
