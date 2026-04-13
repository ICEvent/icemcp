import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";

// Defunds backend canister ID on IC mainnet
export const DEFUNDS_CANISTER_ID = "ixuio-siaaa-aaaam-qacxq-cai";

// Candid IDL factory for the Defunds backend canister
export const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const Currency = IDL.Variant({
    ICP: IDL.Null,
    ckUSDC: IDL.Null,
    ckBTC: IDL.Null,
    ckETH: IDL.Null,
  });

  const Status = IDL.Variant({
    submitted: IDL.Null,
    review: IDL.Null,
    voting: IDL.Null,
    approved: IDL.Null,
    rejected: IDL.Null,
    released: IDL.Null,
    cancelled: IDL.Null,
    expired: IDL.Null,
  });

  const VoteType = IDL.Variant({
    approve: IDL.Null,
    reject: IDL.Null,
  });

  const Vote = IDL.Record({
    voterId: IDL.Principal,
    grantId: IDL.Int,
    voteType: VoteType,
    votePower: IDL.Nat64,
    timestamp: IDL.Int,
  });

  const VotingStatus = IDL.Record({
    totalVotePower: IDL.Nat64,
    approvalVotePower: IDL.Nat64,
    rejectVotePower: IDL.Nat64,
    votes: IDL.Vec(Vote),
    startTime: IDL.Int,
    endTime: IDL.Int,
  });

  const Comment = IDL.Record({
    authorId: IDL.Principal,
    content: IDL.Text,
    timestamp: IDL.Int,
  });

  const Grant = IDL.Record({
    grantId: IDL.Int,
    submitime: IDL.Int,
    title: IDL.Text,
    description: IDL.Text,
    recipient: IDL.Text,
    applicant: IDL.Principal,
    amount: IDL.Nat64,
    currency: Currency,
    grantStatus: Status,
    category: IDL.Text,
    proofs: IDL.Vec(IDL.Text),
    votingStatus: IDL.Opt(VotingStatus),
    comments: IDL.Vec(Comment),
  });

  const Donation = IDL.Record({
    donorId: IDL.Principal,
    amount: IDL.Nat64,
    currency: Currency,
    blockIndex: IDL.Nat64,
    timestamp: IDL.Int,
    isConfirmed: IDL.Bool,
  });

  const PowerChange = IDL.Record({
    amount: IDL.Nat64,
    timestamp: IDL.Int,
    source: Donation,
  });

  const VotingPower = IDL.Record({
    userId: IDL.Principal,
    totalPower: IDL.Nat64,
    powerHistory: IDL.Vec(PowerChange),
  });

  const Member = IDL.Record({
    name: IDL.Text,
    principal: IDL.Principal,
    votingPower: IDL.Nat,
  });

  const GroupFund = IDL.Record({
    id: IDL.Nat,
    name: IDL.Text,
    description: IDL.Text,
    creator: IDL.Principal,
    isPublic: IDL.Bool,
    members: IDL.Vec(Member),
    balance: IDL.Nat,
    proposals: IDL.Vec(IDL.Nat),
    createdAt: IDL.Int,
    account: IDL.Vec(IDL.Nat8),
  });

  const GroupProposal = IDL.Record({
    id: IDL.Nat,
    groupId: IDL.Nat,
    title: IDL.Text,
    description: IDL.Text,
    recipient: IDL.Principal,
    amount: IDL.Nat,
    yesVotes: IDL.Vec(IDL.Principal),
    noVotes: IDL.Vec(IDL.Principal),
    status: IDL.Variant({
      active: IDL.Null,
      accepted: IDL.Null,
      rejected: IDL.Null,
      executed: IDL.Null,
    }),
    createdAt: IDL.Int,
  });

  const AIStrategy = IDL.Variant({
    conservative: IDL.Null,
    balanced: IDL.Null,
    aggressive: IDL.Null,
    custom: IDL.Null,
  });

  const AIAgentConfig = IDL.Record({
    strategy: AIStrategy,
    riskTolerance: IDL.Nat,
    maxAllocationPct: IDL.Nat,
    autoApproveThreshold: IDL.Nat,
    enabled: IDL.Bool,
  });

  const AIProposalEvaluation = IDL.Record({
    proposalId: IDL.Nat,
    score: IDL.Nat,
    recommendation: IDL.Variant({
      approve: IDL.Null,
      reject: IDL.Null,
      review: IDL.Null,
    }),
    reasoning: IDL.Text,
    evaluatedAt: IDL.Int,
  });

  const AIAgentFund = IDL.Record({
    groupFund: GroupFund,
    agentConfig: AIAgentConfig,
    evaluations: IDL.Vec(AIProposalEvaluation),
    lastRunAt: IDL.Opt(IDL.Int),
  });

  return IDL.Service({
    getVotingPolicy: IDL.Func(
      [],
      [IDL.Nat, IDL.Nat, IDL.Nat],
      ["query"]
    ),
    getExchangeRates: IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64))],
      ["query"]
    ),
    getTotalDonations: IDL.Func([], [IDL.Nat64], ["query"]),
    getTotalVotingPower: IDL.Func([], [IDL.Nat64], ["query"]),
    getGrants: IDL.Func(
      [IDL.Vec(Status), IDL.Nat],
      [IDL.Vec(Grant)],
      ["query"]
    ),
    getGrant: IDL.Func([IDL.Nat], [IDL.Opt(Grant)], ["query"]),
    getAllGrants: IDL.Func([], [IDL.Vec(Grant)], ["query"]),
    getVotingPower: IDL.Func(
      [IDL.Principal],
      [IDL.Opt(VotingPower)],
      ["query"]
    ),
    getDonorCredit: IDL.Func([IDL.Text], [IDL.Opt(IDL.Nat)], ["query"]),
    getGrantVotingStatus: IDL.Func(
      [IDL.Nat],
      [IDL.Opt(VotingStatus)],
      ["query"]
    ),
    getGrantComments: IDL.Func(
      [IDL.Nat],
      [IDL.Vec(Comment)],
      ["query"]
    ),
    getGroup: IDL.Func([IDL.Nat], [IDL.Opt(GroupFund)], ["query"]),
    getAllGroups: IDL.Func([], [IDL.Vec(GroupFund)], ["query"]),
    getPublicGroups: IDL.Func([], [IDL.Vec(GroupFund)], ["query"]),
    getProposal: IDL.Func(
      [IDL.Nat],
      [IDL.Opt(GroupProposal)],
      ["query"]
    ),
    getGroupProposals: IDL.Func(
      [IDL.Nat],
      [IDL.Vec(GroupProposal)],
      ["query"]
    ),
    getAllProposals: IDL.Func([], [IDL.Vec(GroupProposal)], ["query"]),
    getAIAgentFund: IDL.Func(
      [IDL.Nat],
      [IDL.Opt(AIAgentFund)],
      ["query"]
    ),
    getAllAIAgentFunds: IDL.Func([], [IDL.Vec(AIAgentFund)], ["query"]),
    getPublicAIAgentFunds: IDL.Func([], [IDL.Vec(AIAgentFund)], ["query"]),
  });
};

export function createDefundsActor() {
  const agent = new HttpAgent({ host: "https://ic0.app" });
  return Actor.createActor(idlFactory, {
    agent,
    canisterId: DEFUNDS_CANISTER_ID,
  });
}
