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
    uint256 constant deltax1 = 1858477392556077882387340806738927388466094082965725096848602873625670980350;
    uint256 constant deltax2 = 4056130342312343763812707128501542287911596282398668991761833447648857726354;
    uint256 constant deltay1 = 5875023849333780143843637118051695867504290765052498041707817050084585400422;
    uint256 constant deltay2 = 8237247569965687542980550463683784233215608857019228140513817075609132700682;

    
    uint256 constant IC0x = 7548731971510628892736095223619999955076014824953326938284148842602697037292;
    uint256 constant IC0y = 6408987835189865448773682025581209437495522589768810234957619035795318898665;
    
    uint256 constant IC1x = 4524416103302082915731889227778427689364957800737653361342257895867664258204;
    uint256 constant IC1y = 12414910380084810855268717380789096701595613549838570744880329295708470837528;
    
    uint256 constant IC2x = 5904294051433980646442238596303788940829925739531399400251744824910993122070;
    uint256 constant IC2y = 19714318308081989532508896316312453679604549550592204141067877816371873642245;
    
    uint256 constant IC3x = 8998171865353002370405954228994653371254686093161148482161554292696460849740;
    uint256 constant IC3y = 6058070195822752373500405715948824910012927402048746007285147235568621489722;
    
    uint256 constant IC4x = 7696203801059452268522320502669113556309660873960361190293184148529970372746;
    uint256 constant IC4y = 19446330971831589727621209003794054047914707389343602319428614505973562129426;
    
    uint256 constant IC5x = 10166635226923769161455795439611309196396483140909114143736187612998109493571;
    uint256 constant IC5y = 15457868614557758579041549598440150186388578579664957798311445235807194302167;
    
    uint256 constant IC6x = 757896828647068170797176340523812427909770647249227570816560202480751770783;
    uint256 constant IC6y = 4082934919665310683627578013054338381653810407357814354717080254395407469584;
    
    uint256 constant IC7x = 7855031136114746740708024320784777038244054306419508761584370862787294938545;
    uint256 constant IC7y = 18171656612590534217845650045134790910602904044070253093914223955837260877407;
    
    uint256 constant IC8x = 9504200814458010804002960467072725863542592217638915467508482047751876400544;
    uint256 constant IC8y = 3379518165927576852848307180412910516340464685311479327083831215934184156661;
    
    uint256 constant IC9x = 9514596023496969692318296652287377222994822443923081755290565504832159188447;
    uint256 constant IC9y = 20597009655192646157756758900120903131621469105939162121915818633995620075773;
    
    uint256 constant IC10x = 5507705505795152117866818028124161727309153850104829151145511001344783758080;
    uint256 constant IC10y = 2150923133805405030969987780380523956716591945037806913413800437459021828546;
    
    uint256 constant IC11x = 4935444149878454269852745631276424729955931515739827799464566637329725165217;
    uint256 constant IC11y = 167778875147931268489209054684367593340747689766575866446949676706729440477;
    
    uint256 constant IC12x = 13399314928256443858804117058831151231511227035286895682098769561664060604672;
    uint256 constant IC12y = 3332503990873477193994325881235838211306028274043808859453328448804608104383;
    
    uint256 constant IC13x = 10556815404686327861412166702907866964356588801830502105269329714015972500998;
    uint256 constant IC13y = 18414752462665945031816630917200944245035607887752836592654399761237724291645;
    
    uint256 constant IC14x = 10669015951890684531278635182640788287128599715290190886263093458885628532566;
    uint256 constant IC14y = 9549983959230324994068092118684514635878578208089992314601508958765033598568;
    
    uint256 constant IC15x = 1998373923939862930119845359790660497838154384920732546518737537257319777997;
    uint256 constant IC15y = 12442657401654993633812032079593991751633493724936035425123959303008656047571;
    
 
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
