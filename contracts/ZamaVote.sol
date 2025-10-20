// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ZamaVote is SepoliaConfig {
    struct Proposal {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 deadline;
        euint32 encryptedYesVotes;
        euint32 encryptedNoVotes;
        uint256 createdAt;
        bool isActive;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        string title,
        uint256 deadline
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter
    );

    modifier onlyProposalCreator(uint256 _proposalId) {
        require(
            proposals[_proposalId].creator == msg.sender,
            "Only proposal creator can perform this action"
        );
        _;
    }

    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Proposal does not exist");
        _;
    }

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _duration
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_duration > 0, "Duration must be greater than 0");

        proposalCount++;
        uint256 proposalId = proposalCount;

        euint32 zeroVotes = FHE.asEuint32(0);

        proposals[proposalId] = Proposal({
            id: proposalId,
            creator: msg.sender,
            title: _title,
            description: _description,
            deadline: block.timestamp + _duration,
            encryptedYesVotes: zeroVotes,
            encryptedNoVotes: zeroVotes,
            createdAt: block.timestamp,
            isActive: true
        });

        FHE.allowThis(zeroVotes);
        FHE.allow(zeroVotes, msg.sender);

        emit ProposalCreated(proposalId, msg.sender, _title, block.timestamp + _duration);

        return proposalId;
    }

    function castVote(
        uint256 _proposalId,
        externalEuint32 _encryptedVote,
        bytes calldata _inputProof
    ) external proposalExists(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];

        require(block.timestamp < proposal.deadline, "Voting period has ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted on this proposal");

        euint32 vote = FHE.fromExternal(_encryptedVote, _inputProof);

        proposal.encryptedYesVotes = FHE.add(proposal.encryptedYesVotes, vote);
        
        euint32 one = FHE.asEuint32(1);
        euint32 noVote = FHE.sub(one, vote);
        proposal.encryptedNoVotes = FHE.add(proposal.encryptedNoVotes, noVote);

        FHE.allowThis(proposal.encryptedYesVotes);
        FHE.allowThis(proposal.encryptedNoVotes);
        FHE.allow(proposal.encryptedYesVotes, proposal.creator);
        FHE.allow(proposal.encryptedNoVotes, proposal.creator);

        hasVoted[_proposalId][msg.sender] = true;

        emit VoteCast(_proposalId, msg.sender);
    }

    function getProposal(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (
            uint256 id,
            address creator,
            string memory title,
            string memory description,
            uint256 deadline,
            uint256 createdAt,
            bool isActive
        )
    {
        Proposal storage proposal = proposals[_proposalId];
        
        bool active = block.timestamp < proposal.deadline;

        return (
            proposal.id,
            proposal.creator,
            proposal.title,
            proposal.description,
            proposal.deadline,
            proposal.createdAt,
            active
        );
    }

    function getAllProposals() external view returns (uint256[] memory) {
        uint256[] memory proposalIds = new uint256[](proposalCount);
        for (uint256 i = 0; i < proposalCount; i++) {
            proposalIds[i] = i + 1;
        }
        return proposalIds;
    }

    function checkIfVoted(uint256 _proposalId, address _voter)
        external
        view
        proposalExists(_proposalId)
        returns (bool)
    {
        return hasVoted[_proposalId][_voter];
    }

    function getEncryptedVotes(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        onlyProposalCreator(_proposalId)
        returns (euint32, euint32)
    {
        Proposal storage proposal = proposals[_proposalId];
        return (proposal.encryptedYesVotes, proposal.encryptedNoVotes);
    }
}
