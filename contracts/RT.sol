pragma solidity >=0.6.5 <0.7;

import "./dataStructures/Bytes32Set.sol";
import "./dataStructures/WBytes32Set.sol";
import "./dataStructures/WAddressSet.sol";

contract RT {

    using Bytes32Set for Bytes32Set.Set;
    using WBytes32Set for WBytes32Set.Set;
    using WAddressSet for WAddressSet.Set;

    address constant NULL_ADDRESS = address(0x0);
    bytes2 constant NULL_ROLENAME = 0x0000;

    uint constant MAX_WEIGHT = 100;
    uint8 constant MAX_WEIGHT_BYTE = 100;

    byte constant EXPR_NC = 0x00;
    byte constant EXPR_SI = 0x01;
    byte constant EXPR_LI = 0x02;
    byte constant EXPR_II = 0x03;

    struct Expression {
        byte exprType;

        address addrA;
        bytes2 roleA;
        address addrB;
        bytes2 roleB;

        WBytes32Set.Set inEdges;
    }

    function packExpr(address addrA, bytes2 roleA, address addrB, bytes2 roleB) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(addrA, roleA, addrB, roleB));
    }

    function packExpr(address addrA, bytes2 roleA, bytes2 roleB) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(addrA, roleA, NULL_ADDRESS, roleB));
    }

    function packExpr(address addrA, bytes2 roleA) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(addrA, roleA, NULL_ADDRESS, NULL_ROLENAME));
    }


    // ----------------------------------------------------- //


    mapping(bytes32 => Expression) exprs;
    mapping(bytes32 => WAddressSet.Set) members;

    modifier rolenameNotNull(bytes2 _rolename) {
        require(_rolename != 0x00, "invalid rolename");
        _;
    }

    function newRole(bytes2 _rolename) external rolenameNotNull(_rolename) {
        Expression storage expr = exprs[packExpr(msg.sender, _rolename)];
        require(expr.exprType == EXPR_NC, "local role already exists");

        expr.exprType = EXPR_SI;
        expr.addrA = msg.sender;
        expr.roleA = _rolename;
    }

    function addSimpleMember(bytes2 _localRolename, address _member, uint8 _weight)
            external returns(bool) {

        bytes32 exprId = packExpr(msg.sender, _localRolename);
        require(exprs[exprId].exprType == EXPR_SI, "local role does not exists");

        return members[exprId].insert(_member, _weight);
	}

    function removeSimpleMember(bytes2 _localRolename, address _member)
            external {

        bytes32 exprId = packExpr(msg.sender, _localRolename);
        require(exprs[exprId].exprType == EXPR_SI, "local role does not exists");

        members[exprId].remove(_member);
	}

    function addSimpleInclusion(bytes2 _localRolename, address _principal, bytes2 _rolename, uint8 _weight)
            external returns(bool) {

        bytes32 localRoleId = packExpr(msg.sender, _localRolename);
        Expression storage localRole = exprs[localRoleId];
        require(localRole.exprType == EXPR_SI, "local role does not exists");

        bytes32 remoteRoleId = packExpr(_principal, _rolename);
        Expression storage remoteRole = exprs[remoteRoleId];
        require(remoteRole.exprType == EXPR_SI, "remote role does not exists");

        return localRole.inEdges.insert(remoteRoleId, _weight);
	}

    function addLinkedInclusion(bytes2 _localRolename, address _principal, bytes2 _firstRolename, bytes2 _secondRolename, uint8 _weight)
            external returns(bool) {

        bytes32 localRoleId = packExpr(msg.sender, _localRolename);
        Expression storage localRole = exprs[localRoleId];
        require(localRole.exprType == EXPR_SI, "local role does not exists");

        require(exprs[packExpr(_principal, _firstRolename)].exprType == EXPR_SI, "remote role does not exists");

        bytes32 linkedExprId = packExpr(_principal, _firstRolename, _secondRolename);
        Expression storage linkedExpr = exprs[linkedExprId];
        if(linkedExpr.exprType == EXPR_NC) {
            linkedExpr.exprType = EXPR_LI;
            linkedExpr.addrA = _principal;
            linkedExpr.roleA = _firstRolename;
            linkedExpr.roleB = _secondRolename;
        }

        return localRole.inEdges.insert(linkedExprId, _weight);
    }

    function addIntersectionInclusion(bytes2 _localRolename, address _firstPrincipal, bytes2 _firstRolename,
			address _secondPrincipal, bytes2 _secondRolename, uint8 _weight) external
			returns (bool) {

        bytes32 localRoleId = packExpr(msg.sender, _localRolename);
        Expression storage localRole = exprs[localRoleId];
        require(localRole.exprType == EXPR_SI, "local role does not exists");

        require(exprs[packExpr(_firstPrincipal, _firstRolename)].exprType == EXPR_SI, "first remote role does not exists");

        require(exprs[packExpr(_secondPrincipal, _secondRolename)].exprType == EXPR_SI, "second remote role does not exists");


        if((_secondPrincipal > _firstPrincipal) || (_firstPrincipal >= _secondPrincipal && _secondRolename > _firstRolename))
            (_firstPrincipal, _firstRolename, _secondPrincipal, _secondRolename) = (_secondPrincipal, _secondRolename, _firstPrincipal, _firstRolename);

        bytes32 intersectionExprId = packExpr(_firstPrincipal, _firstRolename, _secondPrincipal, _secondRolename);
        Expression storage intersectionExpr = exprs[intersectionExprId];
        if(intersectionExpr.exprType == EXPR_NC) {
            intersectionExpr.exprType = EXPR_II;
            intersectionExpr.addrA = _firstPrincipal;
            intersectionExpr.roleA = _firstRolename;
            intersectionExpr.addrB = _secondPrincipal;
            intersectionExpr.roleB = _secondRolename;
        }

        return localRole.inEdges.insert(intersectionExprId, _weight);
    }



    // ----------------------------------------------------- //

    struct ProofNode {
        byte exprType;
        WAddressSet.Set solutions;
        WBytes32Set.Set outEdges;
    }

    struct WaitingIntersectionSolution {
		uint8 weight;
		bool exists;
		bool isSolution;
	}

    struct ProofGraph {
        mapping(bytes32 => ProofNode) nodeMap;
        bytes32[] nodeList;

        mapping(bytes32 => bytes32[]) linkingMonitors;
        mapping(bytes32 => mapping(address => WaitingIntersectionSolution)) waitingIntersectionSolutions;
    }

    ProofGraph[] proofGraphs;


    function addProofNode(ProofGraph storage _p, bytes32 _exprId, byte _exprType) internal returns(bool, ProofNode storage) {
        ProofNode storage proofNode = _p.nodeMap[_exprId];
        if(proofNode.exprType != EXPR_NC) return (false, proofNode);

        proofNode.exprType = _exprType;
        _p.nodeList.push(_exprId);
        return (true, proofNode);
    }

    function addProofEdge(ProofGraph storage _p, ProofNode storage _from, ProofNode storage _toNode, bytes32 _toId, uint8 _weight, bool _noTransfer) internal {
        bool isNew = _from.outEdges.insert(_toId, _weight);

        if(!_noTransfer && isNew) {
            // trasferisci le soluzioni
            uint8 w;
            address a;
            WAddressSet.Set storage solutions = _from.solutions;

            for(uint i = 0; i < solutions.size(); i++) {
                (a, w) = solutions.get(i);
                addSolution(_p, _toNode, _toId, a, mulWeight(w, _weight));
            }
        }
    }

    function search(address _principal, bytes2 _rolename) public returns(uint) {
        bytes32 currId = packExpr(_principal, _rolename);
        require(exprs[currId].exprType != EXPR_NC);

        ProofGraph storage p = proofGraphs.push();
        Expression storage currExpr = exprs[currId];
        (, ProofNode storage currNode) = addProofNode(p, currId, EXPR_SI);
        uint queueIndex;

        WAddressSet.Set storage wAddressSet;
        ProofNode storage node;

        uint i;
        bool isNew;
        address addr;
        uint8 weight;
        bytes32 exprId;

        while(true) {

            if(currExpr.exprType == EXPR_SI) {
                // currExpr: addrA.roleA

                // Aggiungi i membri semplici alle soluzioni di curr
                wAddressSet = members[currId];
                for(i = 0; i < wAddressSet.size(); i++) {
                    (addr, weight) = wAddressSet.get(i);
                    addSolution(p, currNode, currId, addr, weight);
                }

                // Aggiungi al proof graph tutti i nodi che si collegano a curr
                for(i = 0; i < currExpr.inEdges.size(); i++) {
                    (exprId, weight) = currExpr.inEdges.get(i);
                    (isNew, node) = addProofNode(p, exprId, exprs[exprId].exprType);
                    addProofEdge(p, node, currNode, currId, weight, isNew);
                }
            }
            else if(currExpr.exprType == EXPR_LI) {
                // currExpr: addrA.roleA.roleB

                exprId = packExpr(currExpr.addrA, currExpr.roleA);
                p.linkingMonitors[exprId].push(currId);
                (isNew, node) = addProofNode(p, exprId, EXPR_SI);
                if(!isNew) {
                    // Il nodo addrA.roleA a cui si riferisce la linking inclusion esiste già:
                    // esamina le sue soluzioni
                    wAddressSet = node.solutions;
                    for(i = 0; i < wAddressSet.size(); i++) {
                        (addr, weight) = wAddressSet.get(i);
                        processLinkingSolution(p, currNode, currId, addr, currExpr.roleB, weight);
                    }
                }
            }
            else if(currExpr.exprType == EXPR_II) {
                // currExpr: addrA.roleA ∩ addrB.roleB

                exprId = packExpr(currExpr.addrA, currExpr.roleA);
                (isNew, node) = addProofNode(p, exprId, EXPR_SI);
                addProofEdge(p, node, currNode, currId, MAX_WEIGHT_BYTE, isNew);

                exprId = packExpr(currExpr.addrB, currExpr.roleB);
                (isNew, node) = addProofNode(p, exprId, EXPR_SI);
                addProofEdge(p, node, currNode, currId, MAX_WEIGHT_BYTE, isNew);
            }

            queueIndex++;
            if(queueIndex >= p.nodeList.length) break;
            currId = p.nodeList[queueIndex];
            currExpr = exprs[currId];
            currNode = p.nodeMap[currId];
        }

        return proofGraphs.length - 1;
    }


    function mulWeight(uint8 a, uint8 b) internal pure returns(uint8) {
		return uint8((uint(a) * uint(b)) / MAX_WEIGHT);
	}

    function processLinkingSolution(ProofGraph storage _p, ProofNode storage _linkingNode, bytes32 _linkingId, address _addrB, bytes2 _roleB, uint8 _weight) internal {

        bytes32 exprId = packExpr(_addrB, _roleB);

        if(exprs[exprId].exprType != EXPR_NC) {
            // _addrB.roleB è una espressione definita, procedi alla creazione dell'arco di link
            (bool isNew, ProofNode storage node) = addProofNode(_p, exprId, EXPR_SI);
            addProofEdge(_p, node, _linkingNode, _linkingId, _weight, isNew);
        }
    }

    function addSolution(ProofGraph storage _p, ProofNode storage _toNode, bytes32 _toId, address _solution, uint8 _weight) internal {
        bool isNew;
        uint8 weight = _weight;

        if(_toNode.exprType == EXPR_II) {
            WaitingIntersectionSolution storage waitingSolution = _p.waitingIntersectionSolutions[_toId][_solution];

			if(waitingSolution.exists) {

				if(!waitingSolution.isSolution && waitingSolution.weight > weight) {
					weight = waitingSolution.weight;
					waitingSolution.isSolution = true;
				}

                isNew = _toNode.solutions.insert(_solution, weight);
			}
			else {
				waitingSolution.exists = true;
				waitingSolution.weight = weight;
			}
        }
        else {
            isNew = _toNode.solutions.insert(_solution, weight);
        }

        if(isNew) {
            bytes32[] storage bytes32Array;
            WBytes32Set.Set storage connectedNodes = _toNode.outEdges;
            bytes32 exprId;
            uint8 w;
            uint i;

            // La soluzione è nuova per il nodo in questione: propagala ai nodi connessi
            for(i = 0; i < connectedNodes.size(); i++) {
                (exprId, w) = connectedNodes.get(i);
                addSolution(_p, _p.nodeMap[exprId], exprId, _solution, mulWeight(_weight, w));
            }

            if(_toNode.exprType == EXPR_SI) {
                // Il nodo in questione è una simple inclusion: potrebbe possedere un linking monitor
                bytes32Array = _p.linkingMonitors[_toId];
                for(i = 0; i < bytes32Array.length; i++) {
                    // Per ciascun linking monitor:
                    exprId = bytes32Array[i];
                    processLinkingSolution(_p, _p.nodeMap[exprId], exprId, _solution, exprs[exprId].roleB, _weight);
                }
            }
        }
    }

    // ----------------------------------------------------- //

    function getRoleSolutionsCount(uint _proofIndex, address _principal, bytes2 _rolename) public view returns(uint) {
        return proofGraphs[_proofIndex].nodeMap[packExpr(_principal, _rolename)].solutions.size();
    }

    function getRoleSolution(uint _proofIndex, address _principal, bytes2 _rolename, uint _solutionIndex) public view returns(address, uint8) {
        return proofGraphs[_proofIndex].nodeMap[packExpr(_principal, _rolename)].solutions.get(_solutionIndex);
    }

}