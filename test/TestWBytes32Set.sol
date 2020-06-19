pragma solidity >=0.6.5 <0.7.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/dataStructures/WBytes32Set.sol";

contract TestWBytes32Set {

	using WBytes32Set for WBytes32Set.Set;

    WBytes32Set.Set set;

    bytes32 immutable dataA = keccak256(abi.encodePacked(now));
    bytes32 immutable dataB = keccak256(abi.encodePacked(now + 1));
    bytes32 immutable dataC = keccak256(abi.encodePacked(now + 2));

    uint8 constant weightA = 0;
    uint8 constant weightB = 60;
    uint8 constant weightC = 254;

    function testInsert1() public {
        bool b;

        // Inserting new or existing elements
        b = set.insert(dataA, weightA);
        Assert.equal(b, true, "Should successfully insert dataA");
        Assert.equal(set.size(), 1, "Should contain 1 data entry");
    }

    function testInsert2() public {
        bool b;

        b = set.insert(dataB, weightC);
        Assert.equal(b, true, "Should successfully insert dataB");
        Assert.equal(set.size(), 2, "Should contain 2 data entries");
    }

    function testInsert3() public {
        bool b;

        b = set.insert(dataA, weightB);
        Assert.equal(b, true, "Should insert dataA with heavier weight");
        Assert.equal(set.size(), 2, "Shouldn't size duplicate data");
    }

    function testInsert4() public {
        bool b;

        b = set.insert(dataB, weightA);
        Assert.equal(b, false, "Shouldn't add existing data with lighter weight");
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
        bytes32 a;
        uint8 w;

        (a, w) = set.get(0);
        Assert.equal(a, dataA, "Should contain dataA at index 0");
        Assert.equal(uint(w), uint(weightB), "dataA should have a different weight");

        (a, w) = set.get(1);
        Assert.equal(a, dataB, "Should contain dataB at index 1");
        Assert.equal(uint(w), uint(weightC), "dataB should have a different weight");

    }

    // Remove elements
    function testRemoval1() public {
        bool b;
        bytes32 a;
        uint8 w;

        b = set.insert(dataC, weightA);
        Assert.equal(b, true, "Should successfully insert dataC");
        Assert.equal(set.size(), 3, "Should contain 3 data entries");

        set.remove(dataA);
        (a, w) = set.get(0);
        Assert.equal(a, dataC, "Should contain dataC at index 0 after removal of dataA");
        Assert.equal(uint(w), uint(weightA), "dataC's weight changed after dataA removal");
        Assert.equal(set.size(), 2, "Should contain 2 data after removal of dataA");
        Assert.equal(set.exists(dataA), false, "dataA shouldn't exists after removal");
    }

    function testRemoval2() public {
        bool b;
        uint8 w;
        bytes32 a;

        b = set.insert(dataA, weightB);
        Assert.equal(b, true, "Should successfully insert previously removed dataA");
        (a, w) = set.get(2);
        Assert.equal(a, dataA, "Should reinsert dataA at index 2");
        Assert.equal(uint(w), uint(weightB), "Previously removed dataA should now have a different weight");
    }

    // Update weights
    function testUpdate() public {
        uint8 w;

        set.update(dataA, weightA);
        (, w) = set.get(2);
        Assert.equal(uint(w), uint(weightA), "dataA should have a different weight after update");
    }
}