const fs = require('fs'); 
const stringify = require('csv-stringify');

/**
 * Init:
 * - create role Alice.myrole
 * - add expression Alice.myrole ←− Alice
 * 
 * Produce:
 * results = [<delegations_0, gas_0>, <delegations_1, gas_1> ... <delegations_n, gas_n>]
 * Where
 * - delegations_i: number of delegations (simple inclusion) from accounts[i].myrole to Alice.myrole
 * - gas_i: gas used to perform a search on accounts[i].myrole
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

    if(accounts.length < 1)
        throw Error("There should be at least 1 account to perform this test");    


    // Define principals and roles
    const Principals = {"Alice": accounts[0]}
    Object.freeze(Principals);

    const RoleNames = {"myrole": '0x01'}
    Object.freeze(RoleNames);
    

    // Prepare policies
    await rt.newRole(RoleNames.myrole, {from: Principals.Alice});
    await rt.addSimpleMember(RoleNames.myrole, Principals.Alice, 100, {from: Principals.Alice});


    // Run first search - no delegations
    let proofIndex = 0;
    pushResult(0, await rt.search(Principals.Alice, RoleNames.myrole, {from: Principals.Alice}));
    solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.Alice, RoleNames.myrole);
    if(solCount != 1)
        throw Error("Should have 1 member: found " + solCount);

    for(let n = 1; n < accounts.length; n++) {
        process.stdout.write("\t[" + n + " / " + accounts.length + "]\r");
        await rt.newRole(RoleNames.myrole, {from: accounts[n]});
        await rt.addSimpleInclusion(RoleNames.myrole, accounts[n-1], RoleNames.myrole, 100, {from: accounts[n]});
        res = await rt.search(accounts[n], RoleNames.myrole, {from: accounts[n]})
        console.log("\t[" + n + " / " + accounts.length + "]\t Gas used: " + res.receipt.gasUsed);
        pushResult(n, res);
        proofIndex++;
        solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.Alice, RoleNames.myrole);
        if(solCount != 1)
            throw Error("Should have 1 member: found " + solCount);
    }

    return results;
}


module.exports = function(callback) {
    console.log("⏳\tRunning gas test 2 ...")

    test()
    .then((results) => {

        console.log("✍️\tWriting results to GasTest2.csv ...");
        stringify(results, function(err, csv){
            
            fs.writeFile("GasTest2.csv", csv, function(err) {
                if(err) callback(err);
                console.log("✅\tAll done!");
                callback();
            }); 
            
        })
        
    })
    .catch(callback);
}