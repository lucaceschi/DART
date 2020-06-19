const RT = artifacts.require("RT");

contract("RT", async accounts => {

	let proofIndex = 0;
	let totGas;
	let op = (res) => {totGas += res.receipt.gasUsed};


    /**
	 * TEST 1 - simple members, simple inclusions
	 * 
	 * Alice.a ←− Erin, 70
	 * Alice.a ←− Grace, 40
	 * Alice.a ←− Ivan, 88
	 * 
	 * Bob.b ←− Frank, 98
	 * Bob.b ←− Heidi, 100
	 * Bob.b ←− Ivan, 95
	 * 
	 * Charlie.c ←− Erin, 80
	 * Chalie.c ←− Heidi, 10
	 * Charlie.c ←− Frank, 80
	 * 
	 * David.d ←− Grace, 60
	 * 
	 * 
	 * Alice.a ←− Bob, 10
	 * Alice.a ←− Charlie, 70
	 * Alice.a ←− David, 60
	 * 
	 * Bob.b ←− David.d, 90
	 * 
	 * Charlie.c ←− Alice.a, 70
	 * 
	 * David.d ←− Charlie.c, 100
	 * 
	 */
	it("SHOULD PASS TEST 1", async() => {

		const rt = await RT.deployed();

		const Principals = {
			"Alice": accounts[0],
			"Bob": accounts[1],
			"Charlie": accounts[2],
			"David": accounts[3],
			"Erin": accounts[4],
			"Frank": accounts[5],
			"Grace": accounts[6],
			"Heidi": accounts[7],
			"Ivan": accounts[8]
		}
		Object.freeze(Principals);

		const RoleNames = {
			"a": '0x10',
			"b": '0x11',
			"c": '0x12',
			"d": '0x13'
		}
		Object.freeze(RoleNames);

		console.log(Principals);

		totGas = 0;

		console.log("----- Load policies -----");

		op(await rt.newRole(RoleNames.a, {from:Principals.Alice}));
		op(await rt.newRole(RoleNames.b, {from:Principals.Bob}));
		op(await rt.newRole(RoleNames.c, {from:Principals.Charlie}));
		op(await rt.newRole(RoleNames.d, {from:Principals.David}));

		op(await rt.addSimpleMember(RoleNames.a, Principals.Erin, 70, {from:Principals.Alice}));
		op(await rt.addSimpleMember(RoleNames.a, Principals.Grace, 40, {from:Principals.Alice}));
		op(await rt.addSimpleMember(RoleNames.a, Principals.Ivan, 88, {from:Principals.Alice}));

		op(await rt.addSimpleMember(RoleNames.b, Principals.Frank, 98, {from:Principals.Bob}));
		op(await rt.addSimpleMember(RoleNames.b, Principals.Heidi, 100, {from:Principals.Bob}));
		op(await rt.addSimpleMember(RoleNames.b, Principals.Ivan, 95, {from:Principals.Bob}));

		op(await rt.addSimpleMember(RoleNames.c, Principals.Erin, 80, {from:Principals.Charlie}));
		op(await rt.addSimpleMember(RoleNames.c, Principals.Heidi, 10, {from:Principals.Charlie}));
		op(await rt.addSimpleMember(RoleNames.c, Principals.Frank, 80, {from:Principals.Charlie}));

		op(await rt.addSimpleMember(RoleNames.d, Principals.Grace, 60, {from:Principals.David}));

		op(await rt.addSimpleInclusion(RoleNames.a, Principals.Bob, RoleNames.b, 20, {from:Principals.Alice}));
		op(await rt.addSimpleInclusion(RoleNames.a, Principals.Charlie, RoleNames.c, 80, {from:Principals.Alice}));
		op(await rt.addSimpleInclusion(RoleNames.a, Principals.David, RoleNames.d, 80, {from:Principals.Alice}));

		op(await rt.addSimpleInclusion(RoleNames.b, Principals.David, RoleNames.d, 90, {from:Principals.Bob}));

		op(await rt.addSimpleInclusion(RoleNames.c, Principals.Alice, RoleNames.a, 80, {from:Principals.Charlie}));

		op(await rt.addSimpleInclusion(RoleNames.d, Principals.Charlie, RoleNames.c, 100, {from:Principals.David}));

		console.log("Total gas used: " + totGas);
		totGas = 0;

		console.log("----- Search Alice.a -----");

        op(await rt.search(Principals.Alice, RoleNames.a));
        let solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.Alice, RoleNames.a);
        let currSol;
		for(let i = 0; i < solCount.toNumber(); i++) {
			currSol = await rt.getRoleSolution(proofIndex, Principals.Alice, RoleNames.a, i);
			console.log("Member #" + i + ": " + currSol[0] + "\t" + currSol[1].toNumber());
		}

		console.log("Total gas used: " + totGas);
		proofIndex++;

    });


	/*it("SHOULD PASS TEST 1", async() => {

		const rt = await RT.deployed();

		// Define principals and roles
		const Principals = {
			"EPub": accounts[0],
			"ACM": accounts[1],
			"EOrg": accounts[2],
			"ABU": accounts[3],
			"StateU": accounts[4],
			"RegistarB": accounts[5],
			"Bob": accounts[6],
			"Alice": accounts[7]
		}
		Object.freeze(Principals);

		const RoleNames = {
			"spdiscount": '0x10',
			"preferred": '0x11',
			"member": '0x12',
			"university": '0x13',
			"student": '0x14',
			"accredited": '0x15'
		}
		Object.freeze(RoleNames);

		totGas = 0;
		
		// Create roles
		op(await rt.newRole(RoleNames.member, {from: Principals.ACM}));
		op(await rt.newRole(RoleNames.student, {from: Principals.RegistarB}));
		op(await rt.newRole(RoleNames.student, {from: Principals.StateU}));
		op(await rt.newRole(RoleNames.accredited, {from: Principals.ABU}));
		op(await rt.newRole(RoleNames.university, {from: Principals.EOrg}));
		op(await rt.newRole(RoleNames.preferred, {from: Principals.EOrg}));
		op(await rt.newRole(RoleNames.spdiscount, {from: Principals.EPub}));


		// (8) ACM.member ←− Bob
		op(await rt.addSimpleMember(
			RoleNames.member,
			Principals.Bob,
			{from: Principals.ACM}
		));

		// (7) ACM.member ←− Alice
		op(await rt.addSimpleMember(
			RoleNames.member,
			Principals.Alice,
			{from: Principals.ACM}
		));

		// (6) RegistrarB.student ←− Alice
		op(await rt.addSimpleMember(
			RoleNames.student,
			Principals.Alice,
			{from: Principals.RegistarB}
		));

		// (5) StateU.student ←− RegistrarB.student
		op(await rt.addSimpleInclusion(
			RoleNames.student,
			Principals.RegistarB,
			RoleNames.student,
			{from: Principals.StateU}
		));

		// (4) ABU.accredited ←− StateU
		op(await rt.addSimpleMember(
			RoleNames.accredited,
			Principals.StateU,
			{from: Principals.ABU}
		));

		// (3) EOrg.university ←− ABU.accredited
		op(await rt.addSimpleInclusion(
			RoleNames.university,
			Principals.ABU,
			RoleNames.accredited,
			{from: Principals.EOrg}
		));

		// (2) EOrg.preferred ←− EOrg.university.student
		op(await rt.addLinkedInclusion(
			RoleNames.preferred,
			Principals.EOrg,
			RoleNames.university,
			RoleNames.student,
			{from: Principals.EOrg}
		));

		// (1) EPub.spdiscount ←− EOrg.preferred ∩ ACM.member
		op(await rt.addIntersectionInclusion(
			RoleNames.spdiscount,
			Principals.EOrg,
			RoleNames.preferred,
			Principals.ACM,
			RoleNames.member,
			{from: Principals.EPub}
		));

		console.log("Example 1 - Load policies, Total gas used: " + totGas);
		totGas = 0;

		// Discover members of EPub.spdiscount
		op(await rt.backwardSearch(Principals.EPub, RoleNames.spdiscount));
		const solCount = await rt.getProofSolutionCount(0);
		assert(solCount.toNumber() === 1, "EPub.spdiscount should contain 1 solution");
		const solMember = await rt.getProofSolution(0, 0);
		assert(solMember === Principals.Alice, "EPub.spdiscount should contain Alice as the only solution");

		console.log("Example 1 - Search EPub.spdiscount, Total gas used: " + totGas);
	});*/

    
    /**
	 * Test 2 - Example 5 with weights
	 * 
	 * Charles.accessMovies ←− Charles.friend ∩ Charles.filmClub, 100
	 * Charles.accessPictures ←− Charles.friend, 100
	 * Charles.friend ←− Charles.friend.friend, 70
	 * Charles.friend ←− Alice, 100
	 * Charles.friend ←− Bob, 90
	 * Charles.filmClub ←− Johan, 90
	 * Alice.friend ←− Jeffrey, 80
	 * Bob.friend ←− Johan, 60
	 * Johan.friend ←− Sandro, 70
	 * 
	 */
	it("SHOULD PASS TEST 2", async() => {

		const rt = await RT.deployed();

		// Define principals and roles
		const Principals = {
			"Charles": accounts[0],
			"Alice": accounts[1],
			"Bob": accounts[2],
			"Johan": accounts[3],
			"Jeffrey": accounts[4],
			"Sandro": accounts[5]
		}
		Object.freeze(Principals);

		const RoleNames = {
			"friend": '0x20',
			"filmClub": '0x21',
			"accessMovies": '0x22',
			"accessPictures": '0x23',
		}
		Object.freeze(RoleNames);

		console.log(Principals);

		totGas = 0;
		
		console.log("----- Load policies -----");

		// Create roles
		op(await rt.newRole(RoleNames.friend, {from: Principals.Bob}));
		op(await rt.newRole(RoleNames.friend, {from: Principals.Alice}));
		op(await rt.newRole(RoleNames.friend, {from: Principals.Charles}));
		op(await rt.newRole(RoleNames.friend, {from: Principals.Johan}));
		//await rt.newRole(RoleNames.friend, {from: Principals.Sandro});
		op(await rt.newRole(RoleNames.filmClub, {from: Principals.Charles}));
		op(await rt.newRole(RoleNames.accessMovies, {from: Principals.Charles}));
		op(await rt.newRole(RoleNames.accessPictures, {from: Principals.Charles}));

		// Johan.friend ←− Sandro, 70
		op(await rt.addSimpleMember(
			RoleNames.friend,
			Principals.Sandro,
			70,
			{from: Principals.Johan}
		));

		// Bob.friend ←− Johan, 60
		op(await rt.addSimpleMember(
			RoleNames.friend,
			Principals.Johan,
			60,
			{from: Principals.Bob}
		));

		// Alice.friend ←− Jeffrey, 80
		op(await rt.addSimpleMember(
			RoleNames.friend,
			Principals.Jeffrey,
			80,
			{from: Principals.Alice}
		));

		// Charles.filmClub ←− Johan, 90
		op(await rt.addSimpleMember(
			RoleNames.filmClub,
			Principals.Johan,
			90,
			{from: Principals.Charles}
		));

		// Charles.friend ←− Bob, 90
		op(await rt.addSimpleMember(
			RoleNames.friend,
			Principals.Bob,
			90,
			{from: Principals.Charles}
		));

		// Charles.friend ←− Alice, 100
		op(await rt.addSimpleMember(
			RoleNames.friend,
			Principals.Alice,
			100,
			{from: Principals.Charles}
		));

		// Charles.friend ←− Charles.friend.friend, 70
		op(await rt.addLinkedInclusion(
			RoleNames.friend,
			Principals.Charles,
			RoleNames.friend,
			RoleNames.friend,
			70,
			{from: Principals.Charles}
		));

		// Charles.accessPictures ←− Charles.friend, 100
		op(await rt.addSimpleInclusion(
			RoleNames.accessPictures,
			Principals.Charles,
			RoleNames.friend,
			100,
			{from: Principals.Charles}
		));

		// Charles.accessMovies ←− Charles.friend ∩ Charles.filmClub, 100
		op(await rt.addIntersectionInclusion(
			RoleNames.accessMovies,
			Principals.Charles,
			RoleNames.friend,
			Principals.Charles,
			RoleNames.filmClub,
			100,
			{from: Principals.Charles}
		));

		console.log("Total gas used: " + totGas);
		totGas = 0;

		console.log("----- Discover Charles.accessMovies -----");

		// Discover members of Charles.accessMovies
		op(await rt.search(Principals.Charles, RoleNames.accessMovies));
		let solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.Charles, RoleNames.accessMovies);
		let currSol;
		for(let i = 0; i < solCount; i++) {
			currSol = await rt.getRoleSolution(proofIndex, Principals.Charles, RoleNames.accessMovies, i);
			console.log("Member #" + i + ": " + currSol[0] + "\t" + currSol[1].toNumber());
		}

		console.log("Total gas used: " + totGas);
		proofIndex++;
		totGas = 0;

		console.log("----- Discover Charles.accessPictures -----");

		// Discover members of Charles.accessPictures
		op(await rt.search(Principals.Charles, RoleNames.accessPictures));
		solCount = await rt.getRoleSolutionsCount(proofIndex, Principals.Charles, RoleNames.accessPictures);
		for(let i = 0; i < solCount; i++) {
			currSol = await rt.getRoleSolution(proofIndex, Principals.Charles, RoleNames.accessPictures, i);
			console.log("Member #" + i + ": " + currSol[0] + "\t" + currSol[1].toNumber());
		}

		console.log("Total gas used: " + totGas);
		proofIndex++;

	});

});

