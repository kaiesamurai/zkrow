import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts"
import { CalculationRequested } from "../generated/schema"
import { CalculationRequested as CalculationRequestedEvent } from "../generated/GitHubFundManager/GitHubFundManager"
import { handleCalculationRequested } from "../src/git-hub-fund-manager"
import { createCalculationRequestedEvent } from "./git-hub-fund-manager-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let fundId = BigInt.fromI32(234)
    let ipfsHash = "Example string value"
    let newCalculationRequestedEvent = createCalculationRequestedEvent(
      fundId,
      ipfsHash
    )
    handleCalculationRequested(newCalculationRequestedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("CalculationRequested created and stored", () => {
    assert.entityCount("CalculationRequested", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CalculationRequested",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "fundId",
      "234"
    )
    assert.fieldEquals(
      "CalculationRequested",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "ipfsHash",
      "Example string value"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
