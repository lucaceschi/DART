pragma solidity >=0.6.5 <0.7.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/dataStructures/WAddressSet.sol";

contract TestMemberSet {

	using WAddressSet for WAddressSet.Set;

    WAddressSet.Set set;

    address constant addrA = 0xa75Ed77F5681232fEA9C71b240Bdf171E426Ca05;
    address constant addrB = 0x01Ed94bc7EC3c580848299B2BE0999Bfd3A8f996;
    address constant addrC = 0xE72ff44EDbB4995fB9452BFD512a2c86fe0e7f78;

    uint8 constant weightA = 0;
    uint8 constant weightB = 60;
    uint8 constant weightC = 254;

    function testInsert1() public {
        bool b;

        // Inserting new or existing elements
        b = set.insert(addrA, weightA);
        Assert.equal(b, true, "Should successfully insert addrA");
        Assert.equal(set.size(), 1, "Should contain 1 address");
    }

    function testInsert2() public {
        bool b;

        b = set.insert(addrB, weightC);
        Assert.equal(b, true, "Should successfully insert addrB");
        Assert.equal(set.size(), 2, "Should contain 2 address");
    }

    function testInsert3() public {
        bool b;

        b = set.insert(addrA, weightB);
        Assert.equal(b, true, "Should insert addrA with heavier weight");
        Assert.equal(set.size(), 2, "Shouldn't size duplicate addresses");
    }

    function testInsert4() public {
        bool b;

        b = set.insert(addrB, weightA);
        Assert.equal(b, false, "Shouldn't add existing addresses with lighter weight");
        Assert.equal(set.size(), 2, "Shouldn't size duplicate addresses");
    }

    // Check for existence
    function testExistence() public {
        Assert.equal(set.exists(addrA), true, "addrA should exists");
        Assert.equal(set.exists(addrB), true, "addrB should exists");
        Assert.equal(set.exists(addrC), false, "addrC should not exists");
    }

    // Get elements
    function testGetter() public {
        address a;
        uint8 w;

        (a, w) = set.get(0);
        Assert.equal(a, addrA, "Should contain addrA at index 0");
        Assert.equal(uint(w), uint(weightB), "addrA should have a different weight");

        (a, w) = set.get(1);
        Assert.equal(a, addrB, "Should contain addrB at index 1");
        Assert.equal(uint(w), uint(weightC), "addrB should have a different weight");

    }

    // Remove elements
    function testRemoval1() public {
        bool b;
        address a;
        uint8 w;

        b = set.insert(addrC, weightA);
        Assert.equal(b, true, "Should successfully insert addrC");
        (a, ) = set.get(2);
        Assert.equal(a, addrC, "Should insert addrC at index 2");
        Assert.equal(set.size(), 3, "Should contain 3 address");

        set.remove(addrA);
        (a, w) = set.get(0);
        Assert.equal(a, addrC, "Should contain addrC at index 0 after removal of addrA");
        Assert.equal(uint(w), uint(weightA), "addrC's weight changed after addrA removal");
        Assert.equal(set.size(), 2, "Should contain 2 addresses after removal of addrA");
        Assert.equal(set.exists(addrA), false, "addrA shouldn't exists after removal");
    }

    function testRemoval2() public {
        bool b;
        uint8 w;
        address a;

        b = set.insert(addrA, weightB);
        Assert.equal(b, true, "Should successfully insert previously removed addrA");
        (a, ) = set.get(2);
        Assert.equal(a, addrA, "Should reinsert addrA at index 2");
        (, w) = set.get(2);
        Assert.equal(uint(w), uint(weightB), "Previously removed addrA should now have a different weight");

    }

    // Update weights
    function testUpdate() public {
        uint8 w;

        set.update(addrA, weightA);
        (, w) = set.get(2);
        Assert.equal(uint(w), uint(weightA), "addrA should have a different weight after update");
    }
}