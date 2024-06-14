import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Bytes, Address } from "@graphprotocol/graph-ts"
import {
  CalculationRequested,
  ChainLinkFunctionFailed,
  FundDistributed,
  Funded,
  GitHubPassRegistered,
  OwnershipTransferRequested,
  OwnershipTransferred,
  RequestFulfilled,
  RequestSent,
  ShareWithdrwan
} from "../generated/GitHubFundManager/GitHubFundManager"

export function createCalculationRequestedEvent(
  fundId: BigInt,
  ipfsHash: string
): CalculationRequested {
  let calculationRequestedEvent = changetype<CalculationRequested>(
    newMockEvent()
  )

  calculationRequestedEvent.parameters = new Array()

  calculationRequestedEvent.parameters.push(
    new ethereum.EventParam("fundId", ethereum.Value.fromUnsignedBigInt(fundId))
  )
  calculationRequestedEvent.parameters.push(
    new ethereum.EventParam("ipfsHash", ethereum.Value.fromString(ipfsHash))
  )

  return calculationRequestedEvent
}

export function createChainLinkFunctionFailedEvent(
  fundId: BigInt,
  error: Bytes
): ChainLinkFunctionFailed {
  let chainLinkFunctionFailedEvent = changetype<ChainLinkFunctionFailed>(
    newMockEvent()
  )

  chainLinkFunctionFailedEvent.parameters = new Array()

  chainLinkFunctionFailedEvent.parameters.push(
    new ethereum.EventParam("fundId", ethereum.Value.fromUnsignedBigInt(fundId))
  )
  chainLinkFunctionFailedEvent.parameters.push(
    new ethereum.EventParam("error", ethereum.Value.fromBytes(error))
  )

  return chainLinkFunctionFailedEvent
}

export function createFundDistributedEvent(
  fundId: BigInt,
  logins: Array<string>,
  shares: Array<BigInt>
): FundDistributed {
  let fundDistributedEvent = changetype<FundDistributed>(newMockEvent())

  fundDistributedEvent.parameters = new Array()

  fundDistributedEvent.parameters.push(
    new ethereum.EventParam("fundId", ethereum.Value.fromUnsignedBigInt(fundId))
  )
  fundDistributedEvent.parameters.push(
    new ethereum.EventParam("logins", ethereum.Value.fromStringArray(logins))
  )
  fundDistributedEvent.parameters.push(
    new ethereum.EventParam(
      "shares",
      ethereum.Value.fromUnsignedBigIntArray(shares)
    )
  )

  return fundDistributedEvent
}

export function createFundedEvent(
  fundId: BigInt,
  orgAndName: string,
  funder: Address,
  token: Address,
  amount: BigInt
): Funded {
  let fundedEvent = changetype<Funded>(newMockEvent())

  fundedEvent.parameters = new Array()

  fundedEvent.parameters.push(
    new ethereum.EventParam("fundId", ethereum.Value.fromUnsignedBigInt(fundId))
  )
  fundedEvent.parameters.push(
    new ethereum.EventParam("orgAndName", ethereum.Value.fromString(orgAndName))
  )
  fundedEvent.parameters.push(
    new ethereum.EventParam("funder", ethereum.Value.fromAddress(funder))
  )
  fundedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  fundedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return fundedEvent
}

export function createGitHubPassRegisteredEvent(
  login: string,
  addr: Address
): GitHubPassRegistered {
  let gitHubPassRegisteredEvent = changetype<GitHubPassRegistered>(
    newMockEvent()
  )

  gitHubPassRegisteredEvent.parameters = new Array()

  gitHubPassRegisteredEvent.parameters.push(
    new ethereum.EventParam("login", ethereum.Value.fromString(login))
  )
  gitHubPassRegisteredEvent.parameters.push(
    new ethereum.EventParam("addr", ethereum.Value.fromAddress(addr))
  )

  return gitHubPassRegisteredEvent
}

export function createOwnershipTransferRequestedEvent(
  from: Address,
  to: Address
): OwnershipTransferRequested {
  let ownershipTransferRequestedEvent = changetype<OwnershipTransferRequested>(
    newMockEvent()
  )

  ownershipTransferRequestedEvent.parameters = new Array()

  ownershipTransferRequestedEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  ownershipTransferRequestedEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )

  return ownershipTransferRequestedEvent
}

export function createOwnershipTransferredEvent(
  from: Address,
  to: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )

  return ownershipTransferredEvent
}

export function createRequestFulfilledEvent(id: Bytes): RequestFulfilled {
  let requestFulfilledEvent = changetype<RequestFulfilled>(newMockEvent())

  requestFulfilledEvent.parameters = new Array()

  requestFulfilledEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  )

  return requestFulfilledEvent
}

export function createRequestSentEvent(id: Bytes): RequestSent {
  let requestSentEvent = changetype<RequestSent>(newMockEvent())

  requestSentEvent.parameters = new Array()

  requestSentEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  )

  return requestSentEvent
}

export function createShareWithdrwanEvent(
  fundId: BigInt,
  token: Address,
  account: Address,
  share: BigInt
): ShareWithdrwan {
  let shareWithdrwanEvent = changetype<ShareWithdrwan>(newMockEvent())

  shareWithdrwanEvent.parameters = new Array()

  shareWithdrwanEvent.parameters.push(
    new ethereum.EventParam("fundId", ethereum.Value.fromUnsignedBigInt(fundId))
  )
  shareWithdrwanEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  shareWithdrwanEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  shareWithdrwanEvent.parameters.push(
    new ethereum.EventParam("share", ethereum.Value.fromUnsignedBigInt(share))
  )

  return shareWithdrwanEvent
}
