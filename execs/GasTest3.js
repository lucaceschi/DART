const fs = require('fs'); 
const stringify = require('csv-stringify');

/**
 * Init:
 * - create role Alice.myrole
 * - create role Bob.myrole
 * - add expression Alice.myrole ←− Bob.myrole.linkedrole
 * 
 * Produce:
 * results = [<delegations_0, gas_0> , <delegations_1, gas_1> ... <delegations_n, gas_n>]
 * Where:
 * - delegations_i: number of delegation created = number of principals in Bob.myrole with linkedrole defined
 * - gas_i: gas used to perform a search on Alice.myrole
 */
async function test() {

    const RT = artifacts.require("RT");
    const rt = await RT.deployed();
    let solCount;
    let res;
    let results = new Array();
    let pushResult = (delegations, res) => {
        results.push({delegations: delegations, gas: res.receipt.gasUsed});
    };
    const accounts = await web3.eth.personal.getAccounts();

    if(accounts.length < 2)
        throw Error("There should be at least 2 account to perform this test");    


    // Define principals and roles
    const Principals = {
        "Alice": accounts[0],
        "Bob": accounts[1]
    }
    Object.freeze(Principals);

    const RoleNames = {
        "myrole": '0x01',
        "linkedrole": '0x02'
    };
    Object.freeze(RoleNames);
    

    // Prepare policies
    await rt.newRole(RoleNames.myrole, {from: Principals.Alice});
    await rt.newRole(RoleNames.myrole, {from: Principals.Bob});
    await rt.addLinkedInclusion(RoleNames.myrole, Principals.Bob, RoleNames.myrole, RoleNames.linkedrole, 100, {from: Principals.Alice});


    // Run first search - no delegations
    let proofIndex = 0;
    pushResult(0, await rt.search(Principals.Alice, RoleNames.myrole, {from: Principals.Alice}));
    solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.Alice, RoleNames.myrole);
    if(solCount != 0)
        throw Error("Should have 0 members: found " + solCount);

    for(let n = 0; n < accounts.length; n++) {
        process.stdout.write("\t[" + (n+1) + " / " + accounts.length + "]\r");
        await rt.newRole(RoleNames.linkedrole, {from: accounts[n]});
        await rt.addSimpleMember(RoleNames.myrole, accounts[n], 100, {from: Principals.Bob});
        res = await rt.search(Principals.Alice, RoleNames.myrole, {from: accounts[n]})
        console.log("\t[" + (n+1) + " / " + accounts.length + "]\t Gas used: " + res.receipt.gasUsed);
        pushResult(n+1, res);
        proofIndex++;
        solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.Alice, RoleNames.myrole);
        if(solCount != 0)
            throw Error("Should have 0 members: found " + solCount);
    }

    return results;
}


module.exports = function(callback) {
    console.log("⏳\tRunning gas test 3 ...")

    test()
    .then((results) => {

        console.log("✍️\tWriting results to GasTest3.csv ...");
        stringify(results, function(err, csv){
            
            fs.writeFile("GasTest3.csv", csv, function(err) {
                if(err) callback(err);
                console.log("✅\tAll done!");
                callback();
            }); 
            
        })
        
    })
    .catch(callback);
}