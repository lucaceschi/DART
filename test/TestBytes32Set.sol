pragma solidity >=0.6.5 <0.7.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/dataStructures/Bytes32Set.sol";

contract TestBytes32Set {

	using Bytes32Set for Bytes32Set.Set;

    Bytes32Set.Set set;

    bytes32 immutable dataA = keccak256(abi.encodePacked(now));
    bytes32 immutable dataB = keccak256(abi.encodePacked(now + 1));
    bytes32 immutable dataC = keccak256(abi.encodePacked(now + 2));

    function testInsert1() public {
        bool b;

        // Inserting new or existing elements
        b = set.insert(dataA);
        Assert.equal(b, true, "Should successfully insert dataA");
        Assert.equal(set.size(), 1, "Should contain 1 data entry");
    }

    function testInsert2() public {
        bool b;

        b = set.insert(dataB);
        Assert.equal(b, true, "Should successfully insert dataB");
        Assert.equal(set.size(), 2, "Should contain 2 data entries");
    }

    function testInsert3() public {
        bool b;

        b = set.insert(dataA);
        Assert.equal(b, false, "Shouldn't add existing data");
        Assert.equal(set.size(), 2, "Shouldn't size duplicate data");
    }

    // Check for existence
    function testExistence() public {
        Assert.equal(set.exists(dataA), true, "dataA should exists");
        Assert.equal(set.exists(dataB), true, "dataB should exists");
        Assert.equal(set.exists(dataC), false, "dataC should not exists");
    }

    // Get elements
    function testGetter() public {
        Assert.equal(set.get(0), dataA, "Should contain dataA at index 0");
        Assert.equal(set.get(1), dataB, "Should contain dataB at index 1");
    }

    // Remove elements
    function testRemoval1() public {
        bool b;

        b = set.insert(dataC);
        Assert.equal(b, true, "Should successfully insert dataC");
        Assert.equal(set.size(), 3, "Should contain 3 data entries");

        set.remove(dataA);
        Assert.equal(set.get(0), dataC, "Should contain dataC at index 0 after removal of dataA");
        Assert.equal(set.size(), 2, "Should contain 2 data after removal of dataA");
        Assert.equal(set.exists(dataA), false, "dataA shouldn't exists after removal");
    }

    function testRemoval2() public {
        bool b;

        b = set.insert(dataA);
        Assert.equal(b, true, "Should successfully insert previously removed dataA");
        Assert.equal(set.get(2), dataA, "Should reinsert dataA at index 2");
    }
}