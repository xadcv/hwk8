import { ethers } from "ethers";
import { Ballot__factory } from "../typechain-types";
import * as dotenv from "dotenv";
dotenv.config();

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

function convertStringArrayToBytes32(array: string[]) {
    const bytes32Array = [];
    for (let index = 0; index < array.length; index++) {
        bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
    }
    return bytes32Array;
}


async function main() {
    const options = {
        alchemy: process.env.ALCHEMY_API_KEY,
        infura: process.env.INFURA_API_KEY

    }
    const provider = ethers.getDefaultProvider("goerli", options);

    console.log("Deploying Ballot");
    console.log("Proposals:");
    PROPOSALS.forEach((element, index) => {
        console.log(`Proposal N ${index + 1},: ${element}`);
    });

    const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC ?? "");

    console.log(`Using address ${wallet.address}`);
    const signer = wallet.connect(provider);
    const balanceBN = await signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));
    console.log(`Wallet balance ${balance}`);
    if (balance < 0.01) {
        console.log("Not enough ether");
    };
    const ballotFactory = new Ballot__factory(signer);
    const ballotContract = await ballotFactory.deploy(convertStringArrayToBytes32(PROPOSALS));

    await ballotContract.deployed();

    console.log(`Ballot contract was deployed to ${ballotContract.address}`);

    for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        const name = ethers.utils.parseBytes32String(proposal.name);
        console.log({ index, name, proposal });
    }

    const chairperson = await ballotContract.chairperson();
    console.log({ chairperson });
    console.log({ accounts0: accounts[0].address, accounts1: accounts[1].address });

    let voterStructForAccount1 = await ballotContract.voters(accounts[1].address);
    console.log({ voterStructForAccount1 });

    console.log("Giving Right to Vote");
    const giveRightToVoteTx = await ballotContract.giveRightToVote(accounts[1].address);
    const giveRightToVoteTxReceipt = await giveRightToVoteTx.wait();

    console.log({ giveRightToVoteTx });
    console.log({ giveRightToVoteTxReceipt });

    voterStructForAccount1 = await ballotContract.voters(accounts[1].address);
    console.log({ voterStructForAccount1 });

    console.log("Voting");

    const castVoteTx = await ballotContract.connect(accounts[1]).vote(0);
    const castVoteTxReceipt = await castVoteTx.wait()

    console.log({ castVoteTxReceipt })

    const proposal0 = await ballotContract.proposals(0);
    const name = ethers.utils.parseBytes32String(proposal0.name);
    console.log({ index: 0, name, proposal0 });

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
