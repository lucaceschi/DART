const fs = require('fs'); 
const stringify = require('csv-stringify');

/**
 * Init:
 * - load policies:
 *      EPapers.access ←− EOrg.members ∩ EOrg.students
 *      EOrg.students ←− EOrg.universities.students
 *      EOrg.universities ←− StateA.universities
 *      StateA.universities ←− UniA
 * 
 * Produce:
 * result = [<eligibles_0, gas_0>, <eligibles_1, gas_1> ... <eligibles_n, gas_n>]
 * Where:
 * - eligibles_i: number of students eligible for the access
 * - gas_i: gas used to perform a search on EPapers.access
 */
async function test() {

    const RT = artifacts.require("RT");
    const rt = await RT.deployed();
    let solCount;
    let res;
    let results = new Array();
    let pushResult = (eligibles, res) => {
        results.push({eligibles: eligibles, gas: res.receipt.gasUsed});
    };
    const accounts = await web3.eth.personal.getAccounts();

    if(accounts.length < 4)
        throw Error("There should be at least 4 accounts to perform this test");    

    // Define principals and roles
    const Principals = {
        "EPapers": accounts[0],
        "EOrg": accounts[1],
        "StateA": accounts[2],
        "UniA": accounts[3]
    }
    Object.freeze(Principals);

    const RoleNames = {
        "access": '0x10',
        "members": '0x11',
        "students": '0x12',
        "universities": '0x13'
    }
    Object.freeze(RoleNames);

    
    // Prepare policies
    await rt.newRole(RoleNames.access, {from: Principals.EPapers});
    await rt.newRole(RoleNames.members, {from: Principals.EOrg});
    await rt.newRole(RoleNames.students, {from: Principals.EOrg});
    await rt.newRole(RoleNames.universities, {from: Principals.EOrg});
    await rt.newRole(RoleNames.universities, {from: Principals.StateA});
    await rt.newRole(RoleNames.students, {from: Principals.UniA});


    // StateA.universities ←− UniA
    await rt.addSimpleMember(
        RoleNames.universities,
        Principals.UniA,
        100,
        {from: Principals.StateA}
    );

    // EOrg.universities ←− StateA.universities
    await rt.addSimpleInclusion(
        RoleNames.universities,
        Principals.StateA,
        RoleNames.universities,
        100,
        {from: Principals.EOrg}
    );

    // EOrg.students ←− EOrg.universities.students
    await rt.addLinkedInclusion(
        RoleNames.students,
        Principals.EOrg,
        RoleNames.universities,
        RoleNames.students,
        100,
        {from: Principals.EOrg}
    );

    // EPapers.access ←− EOrg.members ∩ EOrg.students
    await rt.addIntersectionInclusion(
        RoleNames.access,
        Principals.EOrg,
        RoleNames.members,
        Principals.EOrg,
        RoleNames.students,
        100,
        {from: Principals.EPapers}
    );

    

    // Run first search - no students eligible for access
    let proofIndex = 0;
    pushResult(0, await rt.search(Principals.EPapers, RoleNames.access, {from: Principals.EPapers}));
    solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.EPapers, RoleNames.access);
    if(solCount != 0)
        throw Error("Should have 0 members: found " + solCount);

    for(let n = 0; n < accounts.length; n++) {
        process.stdout.write("\t[" + (n+1) + " / " + accounts.length + "]\r");

        await rt.addSimpleMember(RoleNames.students, accounts[n], 100, {from: Principals.UniA});
        await rt.addSimpleMember(RoleNames.members, accounts[n], 100, {from: Principals.EOrg});
        res = await rt.search(Principals.EPapers, RoleNames.access, {from: accounts[n]});

        proofIndex++;
        solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.EPapers, RoleNames.access);
        if(solCount != (n+1))
            throw Error("Should have " + (n+1) + " members: found " + solCount);

        console.log("\t[" + (n+1) + " / " + accounts.length + "]\t Gas used: " + res.receipt.gasUsed);
        pushResult(n+1, res);
        
    }

    return results;
}


module.exports = function(callback) {
    console.log("⏳\tRunning gas test A ...")

    test()
    .then((results) => {

        console.log("✍️\tWriting results to GasTestA.csv ...");
        stringify(results, function(err, csv){
            
            fs.writeFile("GasTestA.csv", csv, function(err) {
                if(err) callback(err);
                console.log("✅\tAll done!");
                callback();
            }); 
            
        })
        
    })
    .catch(callback);
}