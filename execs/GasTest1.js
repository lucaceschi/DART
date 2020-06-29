const fs = require('fs'); 
const stringify = require('csv-stringify');

/**
 * Init:
 * - create role Alice.myrole
 * 
 * Produce:
 * results = [<members_0, gas_0>, <members_1, gas_1> ... <members_n, gas_n>]
 * Where
 * - members_i: number of members in role Alice.myrole
 * - gas_i: gas used to perform a search on Alice.myrole
 */
async function test() {

    const RT = artifacts.require("RT");
    const rt = await RT.deployed();
    let solCount;
    let res;
    let results = new Array();
    let pushResult = (members, res) => {
        results.push({members: members, gas: res.receipt.gasUsed});
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


    // Run first search - zero members
    let proofIndex = 0;
    pushResult(0, await rt.search(Principals.Alice, RoleNames.myrole, {from: accounts[0]}));
    solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.Alice, RoleNames.myrole);
    if(solCount != 0)
        throw Error("Should have 0 members: found " + solCount);

    for(let n = 0; n < accounts.length; n++) {
        process.stdout.write("\t[" + (n+1) + " / " + accounts.length + "]\r");
        await rt.addSimpleMember(RoleNames.myrole, accounts[n], 100, {from: Principals.Alice});
        res = await rt.search(Principals.Alice, RoleNames.myrole, {from: accounts[n]})
        console.log("\t[" + (n+1) + " / " + accounts.length + "]\t Gas used: " + res.receipt.gasUsed);
        pushResult(n+1, res);
        proofIndex++;
        solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.Alice, RoleNames.myrole);
        if(solCount != (n+1))
            throw Error("Should have " + (n+1) + " members: found " + solCount);
    }

    return results;
}


module.exports = function(callback) {
    console.log("⏳\tRunning gas test 1 ...")

    test()
    .then((results) => {

        console.log("✍️\tWriting results to GasTest1.csv ...");
        stringify(results, function(err, csv){
            
            fs.writeFile("GasTest1.csv", csv, function(err) {
                if(err) callback(err);
                console.log("✅\tAll done!");
                callback();
            }); 
            
        })
        
    })
    .catch(callback);
}